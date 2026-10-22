import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { stripeClient } from '../../utils/stripeVerify'
import { resolveMembershipCode } from '../../utils/teamMembership'

/**
 * GET /api/portal/membership-code?code=DUCKS2627&plan=individual
 * Checks a team or promo code as it's typed on the membership page and returns
 * the team rate terms the member must accept before checkout.
 */
export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const query = getQuery(event)
  if (!String(query.code || '').trim()) return { valid: false }
  const { stripe } = stripeClient()
  const result = await resolveMembershipCode(serverSupabaseServiceRole(event), stripe, query.code, String(query.plan || ''))
  if (!result.valid) return result
  return { valid: true, code: result.code, team: result.team?.name || null, discount: result.discount, terms: result.terms, requiresAgreement: result.requiresAgreement }
})
