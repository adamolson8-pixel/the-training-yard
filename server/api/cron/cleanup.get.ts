import { serverSupabaseServiceRole } from '#supabase/server'
import { stripeClient } from '../../utils/stripeVerify'
import { endExpiredTeamDiscounts } from '../../utils/teamMembership'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET
  if (!cronSecret || getHeader(event, 'authorization') !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await (supabase as any).from('bookings').update({
    status: 'expired', payment_status: 'failed', updated_at: new Date().toISOString(),
  }).eq('status', 'pending').lt('hold_expires_at', new Date().toISOString()).select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to release expired holds.' })

  // Team membership discounts end the day after the team's contract end date.
  let teamDiscounts: { ended: number; errors: string[] }
  try {
    teamDiscounts = await endExpiredTeamDiscounts(supabase, stripeClient().stripe)
  } catch (err: any) {
    teamDiscounts = { ended: 0, errors: [String(err?.statusMessage || err?.message || err)] }
  }
  if (teamDiscounts.errors.length) console.error('[cron cleanup] Team discount errors:', teamDiscounts.errors)
  return { released: data?.length || 0, team_discounts_ended: teamDiscounts.ended, team_discount_errors: teamDiscounts.errors.length }
})
