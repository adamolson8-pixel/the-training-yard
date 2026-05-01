import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string
  const resourceId = query.resource_id as string

  if (!date || !resourceId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing date or resource_id' })
  }

  // Define full list of possible slots (e.g. 6AM to 9PM)
  const allSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00'
  ]

  try {
    const supabase = await serverSupabaseClient(event)
    
    // Fetch bookings for this date and resource
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('resource_id', resourceId)
      .gte('start_time', `${date}T00:00:00`)
      .lt('start_time', `${date}T23:59:59`)
      .eq('status', 'confirmed')

    if (error) throw error

    // Map existing bookings to blocked slots
    const blockedSlots = new Set()
    bookings?.forEach(b => {
      // Basic implementation: if start_time is 14:00, block it.
      const startTimeStr = new Date(b.start_time).toISOString().substring(11, 16)
      blockedSlots.add(startTimeStr)
    })

    // Return slots with availability
    const slots = allSlots.map(time => {
      // simple formatting for frontend (e.g. "06:00" -> "6:00 AM")
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      const period = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum % 12 || 12
      const formattedTime = `${displayHour}:${minute} ${period}`

      return {
        time: formattedTime,
        raw_time: `${date}T${time}:00Z`, // ISO format for easy booking
        available: !blockedSlots.has(time)
      }
    })

    return { slots }
  } catch (err: any) {
    // Return mock slots if supabase fails (e.g. not configured yet)
    console.error('Supabase error:', err.message)
    const slots = allSlots.map(time => {
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      const period = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum % 12 || 12
      return {
        time: `${displayHour}:${minute} ${period}`,
        raw_time: `${date}T${time}:00Z`,
        available: Math.random() > 0.3
      }
    })
    return { error: 'Failed to fetch availability. Showing mock data.', slots }
  }
})
