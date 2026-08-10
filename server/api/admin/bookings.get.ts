import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { facilityWindow } from '../../utils/booking'

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event)
    const query = getQuery(event)
    const status = query.status as string | undefined
    const userId = query.user_id as string | undefined

    const supabase = await serverSupabaseServiceRole(event)

    let req = (supabase as any)
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })

    if (status && status !== 'all') {
      req = req.eq('status', status)
    }
    if (userId) {
      req = req.eq('user_id', userId)
    }

    const { data, error } = await req

    if (error) {
      console.error('[admin bookings] Database query failed:', error)
      throw createError({ statusCode: 500, statusMessage: 'Unable to load bookings.' })
    }

    const mappedBookings = data.map((b: any) => {
      let timeStr = b.booking_time || '12:00'
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
      if (match) {
        let hour = parseInt(match[1])
        const minute = match[2]
        const ampm = match[3].toUpperCase()
        if (ampm === 'PM' && hour !== 12) hour += 12
        if (ampm === 'AM' && hour === 12) hour = 0
        timeStr = `${String(hour).padStart(2, '0')}:${minute}`
      } else if (timeStr.length === 5) {
        // Already 24h (HH:mm)
      } else {
        // Fallback or bad format, attempt to fix if missing leading zero
        if (timeStr.indexOf(':') === 1) timeStr = '0' + timeStr
      }

      const legacyWindow = !b.start_at ? facilityWindow(b.booking_date, timeStr, b.duration_minutes || 60) : null
      const startObj = b.start_at ? new Date(b.start_at) : legacyWindow!.startAt
      const endObj = b.end_at ? new Date(b.end_at) : legacyWindow!.endAt
      const resourceId = Number(b.cage_units || 0) === 4 && Number(b.turf_units || 0) === 2
        ? 'full-facility'
        : `cages-${Number(b.cage_units || 0)}-turf-${Number(b.turf_units || 0)}`

      return {
        ...b,
        resource_id: resourceId,
        start_time: startObj.toISOString(),
        end_time: endObj.toISOString(),
        profiles: { full_name: b.customer_name, email: b.customer_email },
      }
    })

    return { bookings: mappedBookings, isAdmin: true }
  } catch (err: any) {
    if (err?.statusCode) throw err
    console.error('[admin bookings] Unexpected failure:', err)
    throw createError({ statusCode: 500, statusMessage: 'Unable to load bookings.' })
  }
})
