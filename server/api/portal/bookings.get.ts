import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch bookings for this user
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('booking_date', { ascending: false })

  if (error) {
    console.error('Bookings Fetch Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch bookings.' })
  }

  console.log(`Fetched ${data?.length} bookings for ${user.email}`)

  // Split into upcoming vs past based on booking_date + booking_time
  const upcoming: any[] = []
  const past: any[] = []
  const now = new Date()

  for (const b of data ?? []) {
    if (!b.booking_date) {
      past.push(b)
      continue
    }

    // Parse the booking datetime properly
    // booking_time can be "1:00 PM", "12:00 PM", "9:00 AM" (12-hour format)
    // or "13:00", "09:00" (24-hour format)
    // We need to handle both
    let bookingDateTime: Date
    const timeStr = b.booking_time || '12:00 PM'

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // 12-hour format: parse manually
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3].toUpperCase()
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        bookingDateTime = new Date(`${b.booking_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)
      } else {
        // Fallback: just use the date at noon
        bookingDateTime = new Date(`${b.booking_date}T12:00:00`)
      }
    } else {
      // 24-hour format: works natively
      bookingDateTime = new Date(`${b.booking_date}T${timeStr}`)
    }

    console.log(`  Booking ${b.id}: date=${b.booking_date}, time=${timeStr}, parsed=${bookingDateTime.toISOString()}, status=${b.status}, isFuture=${bookingDateTime >= now}`)

    if (bookingDateTime >= now && b.status !== 'cancelled') {
      upcoming.push(b)
    } else {
      past.push(b)
    }
  }

  // Sort upcoming ascending (soonest first)
  upcoming.sort((a, b) => {
    return new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
  })

  console.log(`Result: ${upcoming.length} upcoming, ${past.length} past`)

  return { upcoming, past }
})
