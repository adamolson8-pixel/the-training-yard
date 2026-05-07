import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../../utils/auth'
import { sendCancellationConfirmation } from '../../../utils/email'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const bookingId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()

  if (!bookingId) {
    throw createError({ statusCode: 400, statusMessage: 'Booking ID is required.' })
  }

  // Fetch the booking — must belong to this user
  const { data: booking, error: fetchError } = await (supabase as any)
    .from('bookings')
    .select('*, profiles(full_name, email)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !booking) {
    throw createError({ statusCode: 404, statusMessage: 'Booking not found.' })
  }

  if (booking.status === 'cancelled') {
    throw createError({ statusCode: 400, statusMessage: 'Booking is already cancelled.' })
  }

  // Determine cancellation fee logic (24 hr rule)
  const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time}`)
  const hoursUntilBooking = (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60)
  const isFullRefund = hoursUntilBooking >= 24

  let stripeRefundId: string | null = null

  // Attempt Stripe refund if there's a payment
  if (booking.stripe_payment_intent_id && booking.payment_status === 'paid') {
    const isTestMode = config.stripeTestMode === 'true'
    const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
    const stripe = new Stripe(stripeKey)

    try {
      const refundAmount = isFullRefund
        ? undefined // full refund
        : Math.floor(booking.amount_cents * 0.5) // 50% fee

      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        ...(refundAmount ? { amount: refundAmount } : {}),
      })
      stripeRefundId = refund.id

      // Update payments table
      await (supabase as any).from('payments').insert({
        user_id: user.id,
        booking_id: bookingId,
        amount_cents: -(isFullRefund ? booking.amount_cents : Math.floor(booking.amount_cents * 0.5)),
        stripe_refund_id: stripeRefundId,
        status: isFullRefund ? 'refunded' : 'partially_refunded',
        notes: isFullRefund ? 'Full refund — cancelled 24+ hours in advance' : '50% refund — cancelled less than 24 hours before session',
      })
    } catch (stripeErr: any) {
      console.error('Stripe refund failed:', stripeErr.message)
      // Still proceed with cancellation even if refund fails — admin can handle manually
    }
  }

  // Mark booking cancelled
  const { error: updateError } = await (supabase as any)
    .from('bookings')
    .update({
      status: 'cancelled',
      payment_status: stripeRefundId ? (isFullRefund ? 'refunded' : 'partially_refunded') : booking.payment_status,
      cancelled_at: new Date().toISOString(),
      cancellation_reason: 'Customer cancelled via portal',
    })
    .eq('id', bookingId)

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to cancel booking.' })
  }

  // Send cancellation email — enrich with customer data from profile join
  const enrichedBooking = {
    ...booking,
    customer_name: booking.profiles?.full_name || booking.customer_name || 'Customer',
    customer_email: booking.profiles?.email || booking.customer_email,
  }
  sendCancellationConfirmation(enrichedBooking, isFullRefund).catch(err =>
    console.error('[email] Cancellation email failed:', err)
  )

  return {
    success: true,
    isFullRefund,
    hoursUntilBooking: Math.round(hoursUntilBooking),
  }
})

