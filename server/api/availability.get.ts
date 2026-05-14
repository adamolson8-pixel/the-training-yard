export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = query.date as string
  // resource_id / service_type filter is optional — we block by time slot regardless of service
  const serviceType = query.resource_id as string | undefined

  if (!date) {
    throw createError({ statusCode: 400, statusMessage: 'Missing date' })
  }

  // Don't allow bookings in the past
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const isPast = date < todayStr

  const allSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00',
  ]

  const formatSlot = (time: string) => {
    const [hour, minute] = time.split(':')
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const display = h % 12 || 12
    return { time: `${display}:${minute} ${period}`, raw_time: `${date}T${time}:00` }
  }

  // Past date → all unavailable
  if (isPast) {
    return {
      slots: allSlots.map(t => ({ ...formatSlot(t), available: false })),
    }
  }

  try {
    // Dynamic import to avoid SSR issues
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || ''
    const supabaseKey = process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials')
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch confirmed bookings for this date (schema: booking_date DATE, booking_time TIME)
    const qb = supabase
      .from('bookings')
      .select('booking_time')
      .eq('booking_date', date)
      .in('status', ['confirmed', 'pending'])

    const { data: bookings, error } = await qb

    if (error) throw error

    // Build set of booked hour strings e.g. "09:00", "14:00"
    const bookedTimes = new Set<string>()
    for (const b of bookings ?? []) {
      if (b.booking_time) {
        let timeStr = b.booking_time as string
        const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
        if (match) {
          let hour = parseInt(match[1])
          const minute = match[2]
          const ampm = match[3].toUpperCase()
          if (ampm === 'PM' && hour !== 12) hour += 12
          if (ampm === 'AM' && hour === 12) hour = 0
          timeStr = `${String(hour).padStart(2, '0')}:${minute}`
        }
        const hhmm = timeStr.substring(0, 5)
        bookedTimes.add(hhmm)
      }
    }

    // For today, block past hours
    const nowHour = today.getHours()
    const isToday = date === todayStr

    const slots = allSlots.map(time => {
      const slotHour = parseInt(time.split(':')[0])
      const pastHour = isToday && slotHour <= nowHour
      const booked = bookedTimes.has(time)
      return {
        ...formatSlot(time),
        available: !booked && !pastHour,
      }
    })

    return { slots }
  } catch (err: any) {
    console.error('Availability error:', err.message)
    // On error, return all slots as AVAILABLE so we don't block real customers
    // The booking step itself will validate properly
    return {
      slots: allSlots.map(t => ({ ...formatSlot(t), available: true })),
    }
  }
})
