import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, email, full_name, phone, emergency_contact, role, membership_type, membership_status, membership_start, membership_expires, waiver_signed, waiver_signed_at, stripe_customer_id, stripe_subscription_id, dependents, team_standard_hours, team_buyout_hours')
    .eq('id', user.id)
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch profile.' })
  }

  return data
})
