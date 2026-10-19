import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'
import { stripeClient, verifyStripePayments } from '../../../utils/stripeVerify'

/** Admin-only: pull every charge from Stripe and record it against its user/team. */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const { stripe, isTestMode } = stripeClient()
  const result = await verifyStripePayments(supabase as any, stripe)
  await recordAdminAction(supabase, admin.id, 'payments.stripe_verified', 'payment', null, {
    mode: isTestMode ? 'test' : 'live',
    charges_recorded: result.charges_recorded,
    inserted: result.inserted,
    updated: result.updated,
    unmatched: result.unmatched.length,
    amount_mismatches: result.amount_mismatches.length,
    marked_paid_without_stripe_charge: result.marked_paid_without_stripe_charge.length,
  })
  setHeader(event, 'Cache-Control', 'no-store')
  return { mode: isTestMode ? 'test' : 'live', ...result }
})
