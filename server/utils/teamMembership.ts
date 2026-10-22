import type Stripe from 'stripe'
import { facilityDateParts } from './booking'
import { MEMBERSHIP_PLANS, regularRateText } from './membershipPlans'
import { membershipDiscountCode, retrieveMembershipSubscription, syncMembershipProfile } from './stripeMembership'

/**
 * Team membership codes (e.g. DUCKS2627). Each code is a Stripe promotion code that
 * carries the discount; the team row says which plans it covers, whether turf
 * benefits are included, and the last day of the team's contract. Checkout tags
 * the subscription with the team (profiles.membership_team_id), so team rules
 * follow the member even if the team later switches to a new season code. The
 * team rate applies while their Stripe subscription has a discount
 * (profiles.membership_discount_code); once Stripe drops it they are a regular
 * member again.
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

/** Team rate settings for every team, by id and by upper-cased membership code. */
export async function loadTeamRates(supabase: any) {
  const { data, error } = await supabase.from('teams').select(TEAM_CODE_COLUMNS)
  if (error) throw error
  const teams: TeamMembershipCode[] = data || []
  return {
    byId: new Map(teams.map(team => [team.id, team])),
    byCode: new Map(teams.filter(team => team.membership_code).map(team => [normalizeCode(team.membership_code), team])),
  }
}
export type TeamRates = Awaited<ReturnType<typeof loadTeamRates>>

/** Teams that have a membership code, keyed by the upper-cased code. */
export async function teamsByMembershipCode(supabase: any) {
  return (await loadTeamRates(supabase)).byCode
}

type MemberRate = { membership_discount_code?: any; membership_team_id?: any }

/** The team whose rate a member is on: their linked team, or the team owning their code. */
export function memberTeam(rates: TeamRates, profile: MemberRate) {
  if (!profile?.membership_discount_code) return undefined
  return rates.byId.get(profile.membership_team_id) ?? rates.byCode.get(normalizeCode(profile.membership_discount_code))
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
 * The team rate terms a member must see and accept before checkout, for the
 * plan they chose: benefits left out, when the rate ends and what is charged
 * after, automatic renewal, and who the rate is for. Shown on our membership
 * page, printed on Stripe's checkout page, and saved on the Stripe subscription.
 */
export function teamCodeTerms(team: TeamMembershipCode, discountText: string | null, planId: string) {
  const interval = MEMBERSHIP_PLANS[planId]?.interval
  const annual = interval === 'year'
  const terms = [`${team.name} team rate${discountText ? ` (${discountText})` : ''} for ${PLAN_NAMES[team.membership_code_plan] || PLAN_NAMES.any}.`]
  if (team.membership_includes_turf === false) {
    terms.push('Cage access only: the weekly turf session and Walk-On Access to unreserved turf are not included, and turf rentals are charged at the regular non-member price.')
  }
  if (team.membership_discount_ends_on) {
    terms.push(`The team rate ends after ${longDate(team.membership_discount_ends_on)} unless ${team.name} renews its agreement with The Training Yard. Your membership then stays active and your card on file is charged automatically at the regular ${regularRateText(planId)}${annual ? ' at your next annual renewal' : ''}, with all standard benefits, until you cancel.`)
    if (annual) terms.push('An annual payment made at the team rate covers its full year.')
  }
  terms.push(`Your membership renews automatically each ${interval || 'billing period'} and your card on file is charged until you cancel. Cancel anytime from the billing portal; cancellation takes effect at the end of the current billing period.`)
  terms.push(`The team rate is only for ${team.name} players. The Training Yard may remove it from anyone not on the ${team.name} roster; the membership then continues at the regular rate unless you cancel.`)
  terms.push('Team rates follow the team agreement and are not covered by the membership price lock.')
  return terms
}

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
    terms: team ? teamCodeTerms(team, discount, planId) : [],
    // Every team rate has terms to accept (at least who it's for); plain promo codes don't
    requiresAgreement: Boolean(team),
  }
}

/** Whether a member's turf benefits apply (false while on a cage-only team rate). */
export function memberIncludesTurf(rates: TeamRates, profile: MemberRate) {
  return memberTeam(rates, profile)?.membership_includes_turf !== false
}

export async function membershipIncludesTurf(supabase: any, profile: MemberRate | null) {
  if (!profile?.membership_discount_code) return true
  return memberIncludesTurf(await loadTeamRates(supabase), profile)
}

/**
 * After a team's contract end date, removes that team's discount from its
 * members' Stripe subscriptions so the next bill is the regular rate (and turf
 * benefits return). Runs from the hourly cleanup job; extending the team's end
 * date before it passes keeps the discount going.
 */
export async function endExpiredTeamDiscounts(supabase: any, stripe: Stripe, now: Date = new Date()) {
  const rates = await loadTeamRates(supabase)
  const result = { ended: 0, errors: [] as string[] }
  if (![...rates.byId.values()].some(team => !teamCodeActive(team, now))) return result

  const { data: profiles, error } = await supabase.from('profiles')
    .select('id,stripe_subscription_id,membership_discount_code,membership_team_id')
    .not('membership_discount_code', 'is', null)
  if (error) throw error
  const contractOver = (profile: any) => { const team = memberTeam(rates, profile); return Boolean(team && !teamCodeActive(team, now)) }
  for (const profile of (profiles || []).filter((p: any) => p.stripe_subscription_id && contractOver(p))) {
    try {
      let subscription = await retrieveMembershipSubscription(stripe, profile.stripe_subscription_id)
      // Only a live subscription that still has a discount (the team code, or a coupon staff applied for the team).
      if (['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status) && membershipDiscountCode(subscription)) {
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

/**
 * Adds a member who joined with a team code to that team's roster (Admin >
 * Teams > Roster & waivers), unless the same player is already on it. The
 * account holder is recorded as guardian when the membership is for someone else.
 */
export async function addMemberToTeamRoster(supabase: any, subscription: Stripe.Subscription) {
  const meta = subscription.metadata || {}
  const teamId = meta.team_id
  const fullName = String(meta.member_name || '').trim()
  if (!teamId || !fullName) return null
  const dob = /^\d{4}-\d{2}-\d{2}$/.test(meta.member_dob || '') ? meta.member_dob : null

  const { data: roster, error } = await supabase.from('team_participants').select('id,full_name,date_of_birth,status').eq('team_id', teamId)
  if (error) throw error
  const same = (roster || []).find((p: any) => p.full_name.trim().toLowerCase() === fullName.toLowerCase()
    && (!dob || !p.date_of_birth || p.date_of_birth === dob))
  if (same) {
    if (same.status !== 'active') await supabase.from('team_participants').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', same.id)
    return same.id
  }

  const { data: account } = await supabase.from('profiles').select('full_name,email').eq('id', meta.supabase_user_id).maybeSingle()
  const relationship = meta.member_relationship && meta.member_relationship !== 'self' ? meta.member_relationship : null
  const { data: added, error: insertError } = await supabase.from('team_participants').insert({
    team_id: teamId,
    full_name: fullName,
    date_of_birth: dob,
    guardian_name: relationship ? account?.full_name || null : null,
    guardian_email: account?.email ? String(account.email).toLowerCase() : null,
    guardian_relationship: relationship,
  }).select('id').single()
  if (insertError) throw insertError
  return added.id
}
