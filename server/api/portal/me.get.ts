import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

  // Try with all fields first, fall back to core fields if team_hours columns don't exist
  const result = await (supabase as any)
    .from('profiles')
    .select('id, email, full_name, phone, emergency_contact, role, membership_type, membership_status, membership_start, membership_expires, waiver_signed, waiver_signed_at, stripe_customer_id, stripe_subscription_id, dependents, team_standard_hours, team_buyout_hours')
    .eq('id', user.id)
    .single()

  let data = result.data
  let error = result.error

  // If the query fails due to missing columns, retry without team hour columns
  if (error?.code === '42703') {
    const fallback = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name, phone, emergency_contact, role, membership_type, membership_status, membership_start, membership_expires, waiver_signed, waiver_signed_at, stripe_customer_id, stripe_subscription_id, dependents')
      .eq('id', user.id)
      .single()

    data = fallback.data
    error = fallback.error

    // Add defaults for team hours
    if (data) {
      data.team_standard_hours = 0
      data.team_buyout_hours = 0
    }
  }

  if (error) {
    console.error('me.get: Supabase error:', JSON.stringify(error))
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch profile.' })
  }

  return data
})
