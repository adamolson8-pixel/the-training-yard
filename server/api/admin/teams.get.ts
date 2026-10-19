import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const { data: teams, error } = await (supabase as any).from('teams').select('*').order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load teams.' })
  const ids = (teams || []).map((team: any) => team.id)
  if (!ids.length) return { teams: [] }
  const now = new Date().toISOString()
  const [{ data: members }, { data: participants }, { data: packages }, { data: bookings }, { data: blocks }, { data: payments }] = await Promise.all([
    (supabase as any).from('team_members').select('*').in('team_id', ids).neq('status', 'removed'),
    (supabase as any).from('team_participants').select('*,waiver_signatures!team_participants_waiver_signature_id_fkey(expires_at,revoked_at)').in('team_id', ids).eq('status', 'active'),
    (supabase as any).from('team_packages').select('*').in('team_id', ids).in('status', ['active', 'pending']),
    (supabase as any).from('bookings').select('id,team_id,service_label,start_at,end_at,status').in('team_id', ids).gte('end_at', now).in('status', ['pending', 'confirmed']).order('start_at'),
    // Standing team time is stored as blocks, not bookings, so a team's schedule needs both.
    (supabase as any).from('blocked_times').select('id,team_id,reason,resource_id,start_at,end_at,all_day,cage_units,turf_units,recurrence_id').in('team_id', ids).gte('end_at', now).order('start_at'),
    (supabase as any).from('payments').select('id,team_id,user_id,booking_id,amount_cents,amount_refunded_cents,status,description,paid_at,created_at,verified_at,stripe_charge_id,customer_email,customer_name').in('team_id', ids).order('paid_at', { ascending: false, nullsFirst: false }),
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
    })),
  }
})
