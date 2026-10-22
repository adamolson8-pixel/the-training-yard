import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { normalizeCode } from '../../utils/teamMembership'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const { data: teams, error } = await (supabase as any).from('teams').select('*').order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load teams.' })
  const ids = (teams || []).map((team: any) => team.id)
  if (!ids.length) return { teams: [] }
  const now = new Date().toISOString()
  const [{ data: members }, { data: participants }, { data: packages }, { data: bookings }, { data: blocks }, { data: payments }, { data: codeMembers }] = await Promise.all([
    (supabase as any).from('team_members').select('*').in('team_id', ids).neq('status', 'removed'),
    (supabase as any).from('team_participants').select('*,waiver_signatures!team_participants_waiver_signature_id_fkey(expires_at,revoked_at)').in('team_id', ids).eq('status', 'active'),
    (supabase as any).from('team_packages').select('*').in('team_id', ids).in('status', ['active', 'pending']),
    (supabase as any).from('bookings').select('id,team_id,service_label,start_at,end_at,status').in('team_id', ids).gte('end_at', now).in('status', ['pending', 'confirmed']).order('start_at'),
    // Standing team time is stored as blocks, not bookings, so a team's schedule needs both.
    (supabase as any).from('blocked_times').select('id,team_id,reason,resource_id,start_at,end_at,all_day,cage_units,turf_units,recurrence_id').in('team_id', ids).gte('end_at', now).order('start_at'),
    (supabase as any).from('payments').select('id,team_id,user_id,booking_id,amount_cents,amount_refunded_cents,status,description,paid_at,created_at,verified_at,stripe_charge_id,customer_email,customer_name').in('team_id', ids).order('paid_at', { ascending: false, nullsFirst: false }),
    // Members whose Stripe membership carries a team code.
    (supabase as any).from('profiles').select('id,full_name,email,membership_type,membership_status,membership_discount_code,membership_team_id').not('membership_discount_code', 'is', null),
  ])
  return {
    teams: (teams || []).map((team: any) => ({
      ...team,
      members: (members || []).filter((row: any) => row.team_id === team.id),
      participants: (participants || []).filter((row: any) => row.team_id === team.id),
      packages: (packages || []).filter((row: any) => row.team_id === team.id),
      bookings: (bookings || []).filter((row: any) => row.team_id === team.id),
      blocks: (blocks || []).filter((row: any) => row.team_id === team.id),
      payments: (payments || []).filter((row: any) => row.team_id === team.id),
      // On this team's rate: joined through the team, or (older signups) holding its current code
      code_members: (codeMembers || []).filter((row: any) => row.membership_team_id ? row.membership_team_id === team.id
        : Boolean(team.membership_code) && normalizeCode(row.membership_discount_code) === normalizeCode(team.membership_code)),
    })),
  }
})
