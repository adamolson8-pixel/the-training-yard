import { randomUUID } from 'node:crypto'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { addFacilityDays, blockCapacity, facilityWindow } from '../../utils/booking'
import { expandWeeklyRepeat, parseWeeklyRepeat } from '../../utils/recurrence'
import { recordAdminAction } from '../../utils/adminAudit'

/** Supabase rejects very large single inserts; series are written in batches. */
const INSERT_BATCH_SIZE = 100

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
  const capacity = blockCapacity(resourceId)
  const repeat = parseWeeklyRepeat(body.repeat)

  // A repeating block covers the same window on every matching date, so the
  // series — not a single row — carries the end of the arrangement.
  const windows = repeat
    ? expandWeeklyRepeat({ startDate, startTime, endTime, allDay, repeat })
    : [{
        date: startDate,
        startAt: facilityWindow(startDate, startTime, 1).startAt,
        endAt: facilityWindow(allDay ? addFacilityDays(endDate, 1) : endDate, endTime, 1).startAt,
      }]
  if (!repeat && windows[0].endAt <= windows[0].startAt) {
    throw createError({ statusCode: 400, statusMessage: 'End must be after start.' })
  }

  const recurrenceId = repeat ? randomUUID() : null
  const rows = windows.map(window => ({
    start_at: window.startAt.toISOString(),
    end_at: window.endAt.toISOString(),
    resource_id: resourceId,
    reason: String(body.reason || 'Admin block').slice(0, 250),
    all_day: allDay,
    created_by: admin.id,
    cage_units: capacity.cageUnits,
    turf_units: capacity.turfUnits,
    user_id: body.user_id || null,
    team_id: body.team_id || null,
    recurrence_id: recurrenceId,
  }))

  const created: any[] = []
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const { data, error } = await (supabase as any)
      .from('blocked_times')
      .insert(rows.slice(index, index + INSERT_BATCH_SIZE))
      .select()
    if (error) {
      // Never leave half a series behind — the operator would have to delete the
      // stragglers one at a time.
      if (recurrenceId) await (supabase as any).from('blocked_times').delete().eq('recurrence_id', recurrenceId)
      throw createError({ statusCode: 500, statusMessage: 'Failed to create block.' })
    }
    created.push(...(data || []))
  }

  await recordAdminAction(
    supabase,
    admin.id,
    repeat ? 'block.series_created' : 'block.created',
    'blocked_time',
    recurrenceId || created[0]?.id,
    {
      resource_id: resourceId,
      start_at: created[0]?.start_at,
      end_at: created[created.length - 1]?.end_at,
      user_id: body.user_id || null,
      team_id: body.team_id || null,
      ...(repeat ? { recurrence_id: recurrenceId, days_of_week: repeat.daysOfWeek, until: repeat.until, occurrences: created.length } : {}),
    },
  )

  return { count: created.length, recurrence_id: recurrenceId, blocks: created }
})
