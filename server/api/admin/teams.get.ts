import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const { data: teams, error } = await (supabase as any).from('teams').select('*').order('created_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to load teams.' })
  const ids = (teams || []).map((team: any) => team.id)
  if (!ids.length) return { teams: [] }
  const [{ data: members }, { data: participants }, { data: packages }, { data: bookings }] = await Promise.all([
    (supabase as any).from('team_members').select('*').in('team_id', ids).neq('status', 'removed'),
    (supabase as any).from('team_participants').select('*,waiver_signatures!team_participants_waiver_signature_id_fkey(expires_at,revoked_at)').in('team_id', ids).eq('status', 'active'),
    (supabase as any).from('team_packages').select('*').in('team_id', ids).in('status', ['active', 'pending']),
    (supabase as any).from('bookings').select('id,team_id,service_label,start_at,end_at,status').in('team_id', ids).gte('end_at', new Date().toISOString()).in('status', ['pending', 'confirmed']).order('start_at'),
  ])
  return {
    teams: (teams || []).map((team: any) => ({
      ...team,
      members: (members || []).filter((row: any) => row.team_id === team.id),
      participants: (participants || []).filter((row: any) => row.team_id === team.id),
      packages: (packages || []).filter((row: any) => row.team_id === team.id),
      bookings: (bookings || []).filter((row: any) => row.team_id === team.id),
    })),
  }
})
