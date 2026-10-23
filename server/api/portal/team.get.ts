import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { stripeClient } from '../../utils/stripeVerify'
import { teamSignupDetails } from '../../utils/teamMembership'

const MANAGER_ROLES = ['owner', 'coach', 'manager']

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)
  const { data: memberships, error } = await (supabase as any).from('team_members')
    .select('team_id,role,teams(id,name,organization_name,sport,age_group,membership_code,membership_code_plan,membership_includes_turf,membership_discount_ends_on)')
    .eq('user_id', user.id).eq('status', 'active')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load team access.' })
  const teamIds = (memberships || []).map((row: any) => row.team_id)
  if (!teamIds.length) return { teams: [] }
  const [{ data: members }, { data: participants }, { data: packages }] = await Promise.all([
    (supabase as any).from('team_members').select('id,team_id,email,full_name,role,status,created_at').in('team_id', teamIds).neq('status', 'removed'),
    (supabase as any).from('team_participants').select('id,team_id,full_name,date_of_birth,guardian_name,guardian_email,guardian_relationship,waiver_signature_id,status').in('team_id', teamIds).eq('status', 'active'),
    (supabase as any).from('team_packages').select('id,team_id,package_type,package_name,hours_purchased,hours_remaining,status,expires_at').in('team_id', teamIds).in('status', ['active', 'pending']),
  ])

  // Team code for players to sign up at the team rate (shown to the team's coaches and managers)
  const signups = new Map<string, any>()
  const withCode = (memberships || []).filter((m: any) => m.teams?.membership_code && MANAGER_ROLES.includes(m.role))
  if (withCode.length) {
    const { stripe } = stripeClient()
    await Promise.all(withCode.map(async (m: any) => signups.set(m.team_id, await teamSignupDetails(stripe, m.teams))))
  }

  return {
    teams: (memberships || []).map((membership: any) => ({
      ...membership.teams,
      currentUserRole: membership.role,
      signup: signups.get(membership.team_id) || null,
      members: (members || []).filter((row: any) => row.team_id === membership.team_id),
      participants: (participants || []).filter((row: any) => row.team_id === membership.team_id),
      packages: (packages || []).filter((row: any) => row.team_id === membership.team_id),
    })),
  }
})
