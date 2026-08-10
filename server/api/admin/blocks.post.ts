import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { blockCapacity, facilityWindow } from '../../utils/booking'
import { recordAdminAction } from '../../utils/adminAudit'


export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const resourceId = body.resource_id ? String(body.resource_id) : null
  const allDay = body.all_day === true
  const startDate = String(body.start_date || '')
  const endDate = String(body.end_date || startDate)
  const startTime = allDay ? '00:00' : String(body.start_time || '')
  const endTime = allDay ? '00:00' : String(body.end_time || '')
  const nextDate = (date: string) => {
    const [year, month, day] = date.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10)
  }
  const start = facilityWindow(startDate, startTime, 1).startAt
  const end = facilityWindow(allDay ? nextDate(endDate) : endDate, endTime, 1).startAt
  if (end <= start) throw createError({ statusCode: 400, statusMessage: 'End must be after start.' })
  const capacity = blockCapacity(resourceId)

  const { data, error } = await (supabase as any)
    .from('blocked_times')
    .insert({
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      resource_id: resourceId,
      reason: String(body.reason || 'Admin block').slice(0, 250),
      all_day: allDay,
      created_by: admin.id,
      cage_units: capacity.cageUnits,
      turf_units: capacity.turfUnits,
      user_id: body.user_id || null,
      team_id: body.team_id || null,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to create block.' })

  await recordAdminAction(supabase, admin.id, 'block.created', 'blocked_time', data.id, {
    resource_id: resourceId, start_at: start.toISOString(), end_at: end.toISOString(),
    user_id: body.user_id || null, team_id: body.team_id || null,
  })

  return data
})
