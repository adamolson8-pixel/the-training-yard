import { serverSupabaseServiceRole } from '#supabase/server'
import { bookingWindow, displayTime, serviceCapacity, OPENING_HOUR, LAST_START_HOUR } from '../utils/booking'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = String(query.date || '')
  const serviceId = String(query.service_id || query.resource_id || '')
  if (!date || !serviceId) throw createError({ statusCode: 400, statusMessage: 'Date and service are required.' })

  const { service, cageUnits, turfUnits } = serviceCapacity(serviceId)
  const supabase = serverSupabaseServiceRole(event)
  const slots = []

  try {
    for (let hour = OPENING_HOUR; hour <= LAST_START_HOUR; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`
      let window
      try {
        window = bookingWindow(date, time, service.durationMinutes)
      } catch {
        slots.push({ time: displayTime(time), raw_time: `${date}T${time}:00`, available: false })
        continue
      }

      const [{ data: bookings, error: bookingError }, { data: blocks, error: blockError }] = await Promise.all([
        (supabase as any).from('bookings').select('cage_units,turf_units,status,hold_expires_at')
          .lt('start_at', window.endAt.toISOString()).gt('end_at', window.startAt.toISOString())
          .in('status', ['pending', 'confirmed']),
        (supabase as any).from('blocked_times').select('cage_units,turf_units')
          .lt('start_at', window.endAt.toISOString()).gt('end_at', window.startAt.toISOString()),
      ])
      if (bookingError || blockError) throw bookingError || blockError
      const active = (bookings || []).filter((booking: any) => booking.status === 'confirmed' || !booking.hold_expires_at || new Date(booking.hold_expires_at) > new Date())
      const usedCages = active.reduce((sum: number, booking: any) => sum + Number(booking.cage_units || 0), 0)
      const usedTurf = active.reduce((sum: number, booking: any) => sum + Number(booking.turf_units || 0), 0)
      const blockedCages = (blocks || []).reduce((sum: number, block: any) => sum + Number(block.cage_units || 0), 0)
      const blockedTurf = (blocks || []).reduce((sum: number, block: any) => sum + Number(block.turf_units || 0), 0)
      slots.push({
        time: displayTime(time),
        raw_time: `${date}T${time}:00`,
        available: usedCages + blockedCages + cageUnits <= 4 && usedTurf + blockedTurf + turfUnits <= 2,
      })
    }
    setHeader(event, 'Cache-Control', 'no-store')
    return { slots }
  } catch (error) {
    console.error('[availability] Failed closed:', error)
    throw createError({ statusCode: 503, statusMessage: 'Live availability is temporarily unavailable. Please try again.' })
  }
})
