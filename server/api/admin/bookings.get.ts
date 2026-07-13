import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

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
      return { error: `DB Error: ${error.message} - ${error.details}` }
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

      const startObj = new Date(`${b.booking_date}T${timeStr}:00Z`)
      const endObj = new Date(startObj.getTime() + (b.duration_minutes || 60) * 60000)

      let resourceId = 'cage-1'
      if (b.service_type === 'cage_rental') {
         if (b.service_label?.toLowerCase().includes('cage 2')) resourceId = 'cage-2'
         else if (b.service_label?.toLowerCase().includes('cage 3')) resourceId = 'cage-3'
         else if (b.service_label?.toLowerCase().includes('cage 4')) resourceId = 'cage-4'
         else if (b.service_label?.toLowerCase().includes('full turf')) resourceId = 'full-turf'
         else if (b.service_label?.toLowerCase().includes('half turf')) resourceId = 'half-turf'
      }

      return {
        ...b,
        resource_id: resourceId,
        start_time: startObj.toISOString(),
        end_time: endObj.toISOString(),
        profiles: b.profiles || { full_name: b.customer_name, email: b.customer_email }
      }
    })

    return { bookings: mappedBookings, isAdmin: true }
  } catch (err: any) {
    // If we throw here, $fetch intercepts it and hides it.
    // By returning it as a 200 JSON object with an 'error' key, schedule.vue will display it.
    return { error: `Fatal Server Error: ${err.message || err}` }
  }
})
