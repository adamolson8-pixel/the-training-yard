import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendBookingConfirmation, sendAdminNotification } from '../../utils/email'
import { invoiceSubscriptionId, syncMembershipProfile } from '../../utils/stripeMembership'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const webhookSecret = isTestMode ? config.stripeTestWebhookSecret : config.stripeWebhookSecret
  if (!stripeKey || !webhookSecret) throw createError({ statusCode: 503, statusMessage: 'Stripe webhook is not configured.' })

  const rawBody = await readRawBody(event)
  const signature = getHeader(event, 'stripe-signature')
  if (!rawBody || !signature) throw createError({ statusCode: 400, statusMessage: 'Missing body or signature.' })
  const stripe = new Stripe(stripeKey)
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error: any) {
    throw createError({ statusCode: 400, statusMessage: `Webhook signature verification failed: ${error.message}` })
  }

  const supabase = serverSupabaseServiceRole(event)
  const { data: previous } = await (supabase as any).from('stripe_webhook_events').select('status').eq('event_id', stripeEvent.id).maybeSingle()
  if (previous?.status === 'processed') return { received: true, duplicate: true }
  await (supabase as any).from('stripe_webhook_events').upsert({
    event_id: stripeEvent.id, event_type: stripeEvent.type, status: 'processing', error_message: null,
  }, { onConflict: 'event_id' })

  try {
    if (stripeEvent.type === 'checkout.session.completed') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null

      if (session.metadata?.type === 'booking' && session.metadata.booking_id) {
        const { data: booking, error } = await (supabase as any).from('bookings').update({
          status: 'confirmed', payment_status: 'paid', confirmed_at: new Date().toISOString(), hold_expires_at: null,
          stripe_payment_intent_id: paymentIntentId, payment_intent_id: paymentIntentId,
        }).eq('id', session.metadata.booking_id).eq('stripe_session_id', session.id).select().single()
        if (error || !booking) throw error || new Error('Booking hold not found for completed checkout.')
        await (supabase as any).from('payments').upsert({
          user_id: booking.user_id, booking_id: booking.id, amount_cents: session.amount_total || booking.amount_cents,
          currency: session.currency || 'usd', stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntentId, event_id: stripeEvent.id, status: 'paid',
        }, { onConflict: 'event_id' })
        await Promise.allSettled([sendBookingConfirmation(booking), sendAdminNotification(booking)])
      }

      if (session.metadata?.type === 'team_package' && session.metadata.team_package_id) {
        const { data: teamPackage, error } = await (supabase as any).from('team_packages').update({
          status: 'active', hours_remaining: (session.metadata.package_id?.includes('vip') ? 24 : Number(session.metadata.package_id?.match(/-(\d+)hr$/)?.[1] || 1)),
          stripe_payment_intent_id: paymentIntentId, purchased_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', session.metadata.team_package_id).eq('stripe_session_id', session.id).select().single()
        if (error || !teamPackage) throw error || new Error('Team package not found for completed checkout.')
        await (supabase as any).from('team_package_ledger').upsert({
          team_package_id: teamPackage.id, hours_delta: teamPackage.hours_purchased, reason: 'package purchase', created_by: teamPackage.purchased_by, source_event_id: stripeEvent.id,
        }, { onConflict: 'source_event_id' })
        await (supabase as any).from('payments').upsert({
          user_id: teamPackage.purchased_by, team_id: teamPackage.team_id, team_package_id: teamPackage.id,
          amount_cents: session.amount_total || teamPackage.amount_cents, currency: session.currency || 'usd',
          stripe_session_id: session.id, stripe_payment_intent_id: paymentIntentId, event_id: stripeEvent.id, status: 'paid',
        }, { onConflict: 'event_id' })
      }

      if (session.metadata?.type === 'membership' && session.mode === 'subscription') {
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncMembershipProfile(supabase, subscription, { extra: { membership_start: new Date(subscription.start_date * 1000).toISOString() } })
        }
      }
    }

    if (stripeEvent.type === 'checkout.session.expired') {
      const session = stripeEvent.data.object as Stripe.Checkout.Session
      if (session.metadata?.booking_id) await (supabase as any).from('bookings').update({ status: 'expired', payment_status: 'failed', hold_expires_at: new Date().toISOString() }).eq('id', session.metadata.booking_id).eq('status', 'pending')
      if (session.metadata?.team_package_id) await (supabase as any).from('team_packages').update({ status: 'cancelled' }).eq('id', session.metadata.team_package_id).eq('status', 'pending')
    }

    // Monthly/annual renewal paid: membership stays active through the new period.
    if (stripeEvent.type === 'invoice.paid' || stripeEvent.type === 'invoice.payment_succeeded') {
      const subscriptionId = invoiceSubscriptionId(stripeEvent.data.object as Stripe.Invoice)
      if (subscriptionId) await syncMembershipProfile(supabase, await stripe.subscriptions.retrieve(subscriptionId))
    }

    // Failed renewals (past_due), plan changes, and cancellations. Re-read the
    // subscription so out-of-order events still leave the latest state.
    if (stripeEvent.type === 'customer.subscription.updated' || stripeEvent.type === 'customer.subscription.deleted') {
      const deleted = stripeEvent.type === 'customer.subscription.deleted'
      const subscription = await stripe.subscriptions.retrieve((stripeEvent.data.object as Stripe.Subscription).id)
      await syncMembershipProfile(supabase, subscription, { onlyIfCurrent: true, status: deleted ? 'canceled' : undefined })
    }

    await (supabase as any).from('stripe_webhook_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', stripeEvent.id)
    return { received: true }
  } catch (error: any) {
    console.error('[stripe webhook] Processing failed:', error)
    await (supabase as any).from('stripe_webhook_events').update({ status: 'failed', error_message: String(error?.message || error).slice(0, 1000) }).eq('event_id', stripeEvent.id)
    throw createError({ statusCode: 500, statusMessage: 'Webhook processing failed; Stripe should retry.' })
  }
})
