import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendBookingConfirmation, sendAdminNotification } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const stripe = new Stripe(config.stripeSecretKey)

  const rawBody = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!rawBody || !sig) {
    throw createError({ statusCode: 400, message: 'Missing body or signature.' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, config.stripeWebhookSecret)
  } catch (err: any) {
    throw createError({ statusCode: 400, message: `Webhook signature verification failed: ${err.message}` })
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const supabase = serverSupabaseServiceRole(event)

    // Update booking status to confirmed
    const { data: booking, error: updateError } = await (supabase as any)
      .from('bookings')
      .update({
        status: 'confirmed',
        stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
        confirmed_at: new Date().toISOString(),
      })
      .eq('stripe_session_id', session.id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update booking:', updateError)
    } else if (booking) {
      // Send confirmation emails
      await Promise.allSettled([
        sendBookingConfirmation(booking),
        sendAdminNotification(booking),
      ])
    }
  }

  return { received: true }
})
