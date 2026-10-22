import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { stripeClient } from '../../utils/stripeVerify'
import { normalizeCode, resolveMembershipCode, teamsByMembershipCode } from '../../utils/teamMembership'

/**
 * GET /api/portal/membership-code?code=DUCKS2627&plan=individual
 * Checks a team or promo code as it's typed on the membership page and returns
 * the team rate terms the member must accept before checkout. Without a plan
 * (the "Have a team code?" button), it picks the plan the code is for and
 * returns it so the page can open that plan's signup form.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  if (!String(query.code || '').trim()) return { valid: false }
  const supabase = serverSupabaseServiceRole(event)
  let plan = String(query.plan || '')
  if (!plan) {
    const team = (await teamsByMembershipCode(supabase)).get(normalizeCode(query.code))
    plan = team?.membership_code_plan === 'family' ? 'family' : 'individual'
  }
  const { stripe } = stripeClient()
  const result = await resolveMembershipCode(supabase, stripe, query.code, plan)
  if (!result.valid) return result
  return { valid: true, code: result.code, plan, team: result.team?.name || null, discount: result.discount, terms: result.terms, requiresAgreement: result.requiresAgreement }
})
