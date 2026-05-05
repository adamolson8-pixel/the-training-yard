import { serverSupabaseServiceRole } from '#supabase/server'

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
    const supabase = serverSupabaseServiceRole(event)
    
    const dayStart = `${date}T00:00:00Z`
    const dayEnd = `${date}T23:59:59Z`

    // Fetch bookings that overlap with this date
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('start_time, end_time')
      .eq('resource_id', resourceId)
      .lt('start_time', dayEnd)
      .gt('end_time', dayStart)
      .eq('status', 'confirmed')

    if (error) throw error

    // Return slots with availability based on precise overlap
    const slots = allSlots.map(time => {
      const slotStart = new Date(`${date}T${time}:00Z`).getTime()
      // Each slot is 1 hour long
      const slotEnd = slotStart + 60 * 60 * 1000 

      let isBlocked = false
      if (bookings) {
        for (const b of bookings) {
          const bStart = new Date(b.start_time).getTime()
          const bEnd = new Date(b.end_time).getTime()
          // Overlap condition: (Slot Start < Booking End) AND (Slot End > Booking Start)
          if (slotStart < bEnd && slotEnd > bStart) {
            isBlocked = true
            break
          }
        }
      }

      // simple formatting for frontend (e.g. "06:00" -> "6:00 AM")
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      const period = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum % 12 || 12
      const formattedTime = `${displayHour}:${minute} ${period}`

      return {
        time: formattedTime,
        raw_time: `${date}T${time}:00Z`, // ISO format for easy booking
        available: !isBlocked
      }
    })

    return { slots }
  } catch (err: any) {
    console.error('Supabase availability error:', err.message)
    // If it fails, return all slots as unavailable rather than random mock data
    const slots = allSlots.map(time => {
      const [hour, minute] = time.split(':')
      const hourNum = parseInt(hour)
      const period = hourNum >= 12 ? 'PM' : 'AM'
      const displayHour = hourNum % 12 || 12
      return {
        time: `${displayHour}:${minute} ${period}`,
        raw_time: `${date}T${time}:00Z`,
        available: false
      }
    })
    return { error: 'Failed to fetch availability.', slots }
  }
})
