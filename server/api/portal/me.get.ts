import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { membershipIncludesTurf } from '../../utils/teamMembership'
import { teamBookingPaused, TEAM_MANAGER_ROLES } from '../../utils/teamBooking'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

  const result = await (supabase as any)
    .from('profiles')
    .select('id, email, full_name, phone, emergency_contact, role, membership_type, membership_status, membership_start, membership_expires, membership_discount_code, membership_team_id, waiver_signed, waiver_signed_at, stripe_customer_id, stripe_subscription_id, dependents, team_standard_hours, team_buyout_hours')
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
  // Team accounts can't book online until custom team pricing is ready, so the
  // portal shows booking as "coming soon" (the booking endpoints enforce it too)
  data.team_booking_soon = teamBookingPaused(memberships, data.membership_status)
  // Team account (owner, coach or manager) without its own active membership:
  // the portal shows "Custom Pricing" and the team instead of individual plans
  data.is_team_account = data.team_booking_soon
  // Teams this account manages, with roster counts, for the dashboard and profile team cards
  const managed = (memberships || []).filter((m: any) => TEAM_MANAGER_ROLES.includes(m.role))
  const rosterCounts = new Map<string, number>()
  if (managed.length) {
    const { data: roster } = await (supabase as any).from('team_participants')
      .select('team_id').in('team_id', managed.map((m: any) => m.team_id)).eq('status', 'active')
    for (const row of roster || []) rosterCounts.set(row.team_id, (rosterCounts.get(row.team_id) || 0) + 1)
  }
  data.managed_teams = managed.map((m: any) => ({ id: m.team_id, name: m.teams?.name || 'Your team', role: m.role, roster_count: rosterCounts.get(m.team_id) || 0 }))
  // False for cage-only team memberships (e.g. a team code without turf benefits)
  data.membership_includes_turf = await membershipIncludesTurf(supabase, data)
  // An admin viewing the portal as this account (read-only banner in the portal)
  data.viewing_as = (user as any).viewAs ? { full_name: data.full_name, email: data.email } : null
  return data
})
