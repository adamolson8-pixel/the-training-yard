import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { facilityDateParts } from '../../utils/booking'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const query = getQuery(event)
  const from = query.from ? new Date(String(query.from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const to = query.to ? new Date(String(query.to)) : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || to <= from) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid calendar range.' })
  }

  const [{ data: bookings, error: bookingError }, { data: blocks, error: blockError }] = await Promise.all([
    (supabase as any).from('bookings').select('*')
      .lt('start_at', to.toISOString()).gt('end_at', from.toISOString())
      .in('status', ['pending', 'confirmed']).order('start_at'),
    (supabase as any).from('blocked_times').select('*')
      .lt('start_at', to.toISOString()).gt('end_at', from.toISOString()).order('start_at'),
  ])
  if (bookingError || blockError) throw createError({ statusCode: 500, statusMessage: 'Unable to load the calendar.' })

  const userIds = [...new Set([...(bookings || []), ...(blocks || [])].map((row: any) => row.user_id).filter(Boolean))]
  const teamIds = [...new Set([...(bookings || []), ...(blocks || [])].map((row: any) => row.team_id).filter(Boolean))]
  const [{ data: profiles }, { data: teams }] = await Promise.all([
    userIds.length ? (supabase as any).from('profiles').select('id,full_name,email').in('id', userIds) : { data: [] },
    teamIds.length ? (supabase as any).from('teams').select('id,name,organization_name').in('id', teamIds) : { data: [] },
  ])
  const profileMap = new Map((profiles || []).map((row: any) => [row.id, row]))
  const teamMap = new Map((teams || []).map((row: any) => [row.id, row]))

  setHeader(event, 'Cache-Control', 'no-store')
  return {
    timeZone: 'America/Chicago',
    capacity: { cages: 4, turfHalves: 2 },
    bookings: (bookings || []).map((row: any) => ({
      ...row, facility_start: facilityDateParts(row.start_at), facility_end: facilityDateParts(row.end_at),
      profile: row.user_id ? profileMap.get(row.user_id) || null : null,
      team: row.team_id ? teamMap.get(row.team_id) || null : null,
    })),
    blocks: (blocks || []).map((row: any) => ({
      ...row, facility_start: facilityDateParts(row.start_at), facility_end: facilityDateParts(row.end_at),
      profile: row.user_id ? profileMap.get(row.user_id) || null : null,
      team: row.team_id ? teamMap.get(row.team_id) || null : null,
    })),
  }
})
