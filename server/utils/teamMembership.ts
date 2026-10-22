import type Stripe from 'stripe'
import { facilityDateParts } from './booking'
import { membershipDiscountCode, retrieveMembershipSubscription, syncMembershipProfile } from './stripeMembership'

/**
 * Team membership codes (e.g. DUCKS2627). Each code is a Stripe promotion code that
 * carries the discount; the team row says which plans it covers, whether turf
 * benefits are included, and the last day of the team's contract. A member's
 * code comes from their Stripe subscription (profiles.membership_discount_code),
 * so once Stripe drops the discount they are a regular member again.
 */

export const normalizeCode = (code: any) => String(code || '').trim().toUpperCase()

export type TeamMembershipCode = {
  id: string
  name: string
  membership_code: string
  membership_code_plan: 'any' | 'individual' | 'family'
  membership_includes_turf: boolean
  membership_discount_ends_on: string | null
}

const TEAM_CODE_COLUMNS = 'id,name,membership_code,membership_code_plan,membership_includes_turf,membership_discount_ends_on'

/** Teams that have a membership code, keyed by the upper-cased code. */
export async function teamsByMembershipCode(supabase: any) {
  const { data, error } = await supabase.from('teams').select(TEAM_CODE_COLUMNS)
  if (error) throw error
  return new Map<string, TeamMembershipCode>((data || [])
    .filter((team: any) => team.membership_code)
    .map((team: any) => [normalizeCode(team.membership_code), team]))
}

/** True while the team's contract runs (through its end date, Central time). */
export function teamCodeActive(team: TeamMembershipCode, now: Date = new Date()) {
  return !team.membership_discount_ends_on || facilityDateParts(now).date <= team.membership_discount_ends_on
}

/** Plan ids from the membership checkout: individual, individual_annual, family, family_annual. */
export function teamCodeAllowsPlan(team: TeamMembershipCode, planId: string) {
  return team.membership_code_plan === 'any' || planId.startsWith(team.membership_code_plan)
}

const PLAN_NAMES = { individual: 'Individual memberships', family: 'Family memberships', any: 'Individual and Family memberships' }
const longDate = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })

/** "50% off" / "$20 off" from a promotion code's coupon (expanded), or null. */
export function promotionDiscountText(promotionCode: any): string | null {
  const coupon = promotionCode?.promotion?.coupon ?? promotionCode?.coupon
  if (!coupon || typeof coupon === 'string') return null
  if (coupon.percent_off) return `${coupon.percent_off}% off`
  if (coupon.amount_off) return `$${(coupon.amount_off / 100).toFixed(2).replace(/\.00$/, '')} off`
  return null
}

/**
 * The team rate terms a member must see and accept before checkout: which
 * benefits are left out and when the rate ends. Shown on our membership page,
 * printed on Stripe's checkout page, and saved on the Stripe subscription.
 */
export function teamCodeTerms(team: TeamMembershipCode, discountText: string | null) {
  const terms = [`${team.name} team rate${discountText ? ` (${discountText})` : ''} for ${PLAN_NAMES[team.membership_code_plan] || PLAN_NAMES.any}.`]
  if (team.membership_includes_turf === false) {
    terms.push('Cage access only: the weekly turf session and Walk-On Access to unreserved turf are not included, and turf rentals are charged at the regular non-member price.')
  }
  if (team.membership_discount_ends_on) {
    terms.push(`The team rate ends after ${longDate(team.membership_discount_ends_on)} unless ${team.name} renews its agreement with The Training Yard. After that, your membership continues at the regular rate with all standard benefits unless you cancel.`)
  }
  terms.push('Team rates follow the team agreement and are not covered by the membership price lock. You can cancel anytime from the billing portal.')
  return terms
}

/** Members must accept the terms when the team rate leaves out benefits or has an end date. */
export const teamCodeNeedsAgreement = (team: TeamMembershipCode) =>
  team.membership_includes_turf === false || Boolean(team.membership_discount_ends_on)

/**
 * Checks a code typed on the membership page for the chosen plan: a team code
 * must be within its contract and allowed on the plan, and every code must be
 * an active Stripe promotion code (which carries the actual discount).
 */
export async function resolveMembershipCode(supabase: any, stripe: Stripe, rawCode: any, planId: string) {
  const code = normalizeCode(rawCode)
  const team = (await teamsByMembershipCode(supabase)).get(code)
  if (team && !teamCodeActive(team)) return { valid: false as const, message: `The ${code} team code is no longer active.` }
  if (team && !teamCodeAllowsPlan(team, planId)) {
    return { valid: false as const, message: `The ${code} team code only applies to ${team.membership_code_plan === 'individual' ? 'Individual' : 'Family'} memberships.` }
  }
  const { data } = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.promotion.coupon'] })
  const promotionCode = data[0]
  if (!promotionCode) return { valid: false as const, message: `"${code}" isn't a valid team or promo code.` }
  const discount = promotionDiscountText(promotionCode)
  return {
    valid: true as const,
    code,
    team: team || null,
    promotionCodeId: promotionCode.id,
    discount,
    terms: team ? teamCodeTerms(team, discount) : [],
    requiresAgreement: team ? teamCodeNeedsAgreement(team) : false,
  }
}

/** Whether a member's turf benefits apply, given the discount code on their membership. */
export function codeIncludesTurf(teams: Map<string, TeamMembershipCode>, discountCode: any) {
  const team = discountCode ? teams.get(normalizeCode(discountCode)) : undefined
  return team ? team.membership_includes_turf !== false : true
}

export async function membershipIncludesTurf(supabase: any, discountCode: any) {
  if (!discountCode) return true
  return codeIncludesTurf(await teamsByMembershipCode(supabase), discountCode)
}

/**
 * After a team's contract end date, removes that team's discount from its
 * members' Stripe subscriptions so the next bill is the regular rate (and turf
 * benefits return). Runs from the hourly cleanup job; extending the team's end
 * date before it passes keeps the discount going.
 */
export async function endExpiredTeamDiscounts(supabase: any, stripe: Stripe, now: Date = new Date()) {
  const expired = new Set([...(await teamsByMembershipCode(supabase)).entries()]
    .filter(([, team]) => !teamCodeActive(team, now))
    .map(([code]) => code))
  const result = { ended: 0, errors: [] as string[] }
  if (!expired.size) return result

  const { data: profiles, error } = await supabase.from('profiles')
    .select('id,stripe_subscription_id,membership_discount_code')
    .not('membership_discount_code', 'is', null)
  if (error) throw error
  for (const profile of (profiles || []).filter((p: any) => p.stripe_subscription_id && expired.has(normalizeCode(p.membership_discount_code)))) {
    try {
      let subscription = await retrieveMembershipSubscription(stripe, profile.stripe_subscription_id)
      // Only a live subscription still carrying the team's code (staff may have changed it).
      if (['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status) && expired.has(normalizeCode(membershipDiscountCode(subscription)))) {
        await stripe.subscriptions.deleteDiscount(subscription.id)
        subscription = await retrieveMembershipSubscription(stripe, subscription.id)
        result.ended++
      }
      await syncMembershipProfile(supabase, subscription)
    } catch (err: any) {
      result.errors.push(`${profile.id}: ${err?.message || err}`)
    }
  }
  return result
}
