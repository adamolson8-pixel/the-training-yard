import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { addFacilityDays, displayTime, facilityDateParts, OPENING_HOUR } from '../../utils/booking'
import { loadTeamHourlyRates, requireTeamManager, teamBookingUnits, teamBookingWindow, windowHasCapacity, TEAM_BOOKING_HORIZON_DAYS, TEAM_BOOKING_HOURS, TEAM_BOOKING_LAST_START_HOUR } from '../../utils/teamBooking'

/**
 * Open start times for a team booking (option + cages + hours) on one date.
 * Returns only the time and whether it's open, never who holds the other time.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const supabase = serverSupabaseServiceRole(event)
  await requireTeamManager(supabase, user.id, query.team_id ? String(query.team_id) : undefined)

  const date = String(query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, statusMessage: 'Choose a date.' })
  if (!TEAM_BOOKING_HOURS.includes(Number(query.hours))) throw createError({ statusCode: 400, statusMessage: `Choose ${TEAM_BOOKING_HOURS.join(', ')} hours.` })
  if (date > addFacilityDays(facilityDateParts(new Date()).date, TEAM_BOOKING_HORIZON_DAYS)) throw createError({ statusCode: 400, statusMessage: `Team bookings open ${TEAM_BOOKING_HORIZON_DAYS} days in advance.` })
  const units = teamBookingUnits(String(query.option || ''), query.cages, await loadTeamHourlyRates(supabase))
  const slots: { time: string; available: boolean }[] = []
  try {
    for (let hour = OPENING_HOUR; hour <= TEAM_BOOKING_LAST_START_HOUR; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`
      let window
      try {
        window = teamBookingWindow(date, time, query.hours)
      } catch {
        slots.push({ time: displayTime(time), available: false })
        continue
      }
      slots.push({ time: displayTime(time), available: await windowHasCapacity(supabase, window.startAt, window.endAt, units.cageUnits, units.turfUnits) })
    }
  } catch (error) {
    console.error('[team-availability] Failed closed:', error)
    throw createError({ statusCode: 503, statusMessage: 'Live availability is temporarily unavailable. Please try again.' })
  }
  setHeader(event, 'Cache-Control', 'no-store')
  return { slots, hourlyCents: units.hourlyCents, label: units.label }
})
