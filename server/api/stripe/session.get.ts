import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const sessionId = String(getQuery(event).session_id || '')
  if (!sessionId) throw createError({ statusCode: 400, statusMessage: 'session_id is required.' })
  const supabase = serverSupabaseServiceRole(event)

  let bookingId = ''
  let amountTotal = 0
  let paid = false
  if (sessionId.startsWith('redeemed_')) {
    const user = await requireAuth(event)
    bookingId = sessionId.slice('redeemed_'.length)
    const { data: owned } = await (supabase as any).from('bookings').select('id').eq('id', bookingId).eq('user_id', user.id).maybeSingle()
    if (!owned) throw createError({ statusCode: 404, statusMessage: 'Booking not found.' })
    paid = true
  } else {
    const isTestMode = String(config.stripeTestMode) === 'true'
    const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
    if (!stripeKey) throw createError({ statusCode: 503, statusMessage: 'Checkout verification is unavailable.' })
    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    bookingId = session.metadata?.booking_id || ''
    amountTotal = session.amount_total || 0
    paid = session.payment_status === 'paid'
  }
  if (!bookingId || !paid) throw createError({ statusCode: 409, statusMessage: 'Payment is not complete.' })

  const { data: booking, error } = await (supabase as any).from('bookings')
    .select('service_label,booking_date,booking_time,customer_name,customer_email,amount_cents,status,payment_status')
    .eq('id', bookingId).single()
  if (error || !booking) throw createError({ statusCode: 404, statusMessage: 'Booking not found.' })
  return {
    serviceLabel: booking.service_label, date: booking.booking_date, time: booking.booking_time,
    customerName: booking.customer_name, customerEmail: booking.customer_email,
    amountTotal: amountTotal || booking.amount_cents || 0, status: booking.payment_status,
  }
})
