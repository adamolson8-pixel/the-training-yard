import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

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

  const { data: memberships } = await (supabase as any).from('team_members')
    .select('team_id,role,teams(id,name)')
    .eq('user_id', user.id).eq('status', 'active')
  const teamIds = (memberships || []).map((membership: any) => membership.team_id)
  let packages: any[] = []
  if (teamIds.length) {
    const { data: packageRows } = await (supabase as any).from('team_packages')
      .select('id,team_id,package_type,hours_remaining,status,expires_at')
      .in('team_id', teamIds).eq('status', 'active')
    packages = (packageRows || []).filter((pkg: any) => !pkg.expires_at || new Date(pkg.expires_at) > new Date())
  }
  data.teams = memberships || []
  data.team_packages = packages
  data.default_team_id = memberships?.[0]?.team_id || null
  data.team_standard_hours = packages.filter((pkg: any) => pkg.package_type === 'standard').reduce((sum: number, pkg: any) => sum + Number(pkg.hours_remaining), 0)
  data.team_buyout_hours = packages.filter((pkg: any) => pkg.package_type === 'buyout').reduce((sum: number, pkg: any) => sum + Number(pkg.hours_remaining), 0)
  return data
})
