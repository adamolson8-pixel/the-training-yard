import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)
  const now = new Date().toISOString()

  // Fetch bookings for this user, join payments
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select(`
      id,
      service_label,
      service_id,
      booking_date,
      booking_time,
      duration_minutes,
      amount_cents,
      status,
      payment_status,
      stripe_payment_intent_id,
      cancelled_at,
      cancellation_reason,
      created_at,
      start_time,
      end_time,
      resource_id
    `)
    .eq('user_id', user.id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch bookings.' })
  }

  // Split into upcoming vs past based on booking_date + booking_time
  const upcoming: any[] = []
  const past: any[] = []

  for (const b of data ?? []) {
    if (!b.booking_date || !b.booking_time) {
      past.push(b)
      continue
    }
    const bookingDateTime = new Date(`${b.booking_date}T${b.booking_time}`)
    if (bookingDateTime >= new Date() && b.status !== 'cancelled') {
      upcoming.push(b)
    } else {
      past.push(b)
    }
  }

  // Sort upcoming ascending (soonest first)
  upcoming.sort((a, b) => {
    const aDate = new Date(`${a.booking_date}T${a.booking_time}`)
    const bDate = new Date(`${b.booking_date}T${b.booking_time}`)
    return aDate.getTime() - bDate.getTime()
  })

  return { upcoming, past }
})
