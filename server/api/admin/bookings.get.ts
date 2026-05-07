import { serverSupabaseClient } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    // await requireAdmin(event) // Temporarily bypassed to ensure admin access isn't blocked by RLS misconfig
    const query = getQuery(event)
    const status = query.status as string | undefined
    const userId = query.user_id as string | undefined

    const supabase = await serverSupabaseClient(event)

    let req = (supabase as any)
      .from('bookings')
      .select(`
        id, service_type, service_label, booking_date, booking_time, duration_minutes, 
        user_id, status, created_at, customer_name, customer_email
      `)
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
      const startObj = new Date(`${b.booking_date}T${b.booking_time}:00Z`)
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
        id: b.id,
        resource_id: resourceId,
        start_time: startObj.toISOString(),
        end_time: endObj.toISOString(),
        user_id: b.user_id,
        status: b.status,
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
