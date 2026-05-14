import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendBookingConfirmation, sendAdminNotification } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const webhookSecret = isTestMode ? config.stripeTestWebhookSecret : config.stripeWebhookSecret
  const stripe = new Stripe(stripeKey)

  const rawBody = await readRawBody(event)
  const sig = getHeader(event, 'stripe-signature')

  if (!rawBody || !sig) {
    throw createError({ statusCode: 400, message: 'Missing body or signature.' })
  }

  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    throw createError({ statusCode: 400, message: `Webhook signature verification failed: ${err.message}` })
  }

  const supabase = serverSupabaseServiceRole(event)

  // ─── One-time booking payment confirmed ───────────────────────────────────
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session

    console.log('Webhook: checkout.session.completed for session', session.id)

    // ─── Membership subscription checkout ────────────────────────────────
    if (session.metadata?.type === 'membership' && session.mode === 'subscription') {
      const userId = session.metadata.supabase_user_id
      const membershipType = session.metadata.membership_type
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as any)?.id

      console.log('Webhook: Membership checkout completed for user', userId, 'type:', membershipType)

      if (userId && membershipType) {
        // Fetch subscription to get period end
        let periodEnd: string | null = null
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()
          } catch (e) {
            console.error('Webhook: failed to retrieve subscription details:', e)
          }
        }

        const updates: Record<string, any> = {
          membership_type: membershipType,
          membership_status: 'active',
          membership_start: new Date().toISOString(),
          stripe_subscription_id: subscriptionId || null,
        }
        if (periodEnd) updates.membership_expires = periodEnd

        // stripe_customer_id should already be set by create-membership-checkout,
        // but set it here too in case
        const customerId = typeof session.customer === 'string' ? session.customer : (session.customer as any)?.id
        if (customerId) updates.stripe_customer_id = customerId

        await (supabase as any)
          .from('profiles')
          .update(updates)
          .eq('id', userId)

        console.log('Webhook: Profile updated with membership:', membershipType)
      }
    }

    // ─── Regular booking payment ─────────────────────────────────────────
    if (session.mode === 'payment') {
      const { data: booking, error: updateError } = await (supabase as any)
        .from('bookings')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('stripe_session_id', session.id)
        .select()
        .single()

      if (updateError) {
        console.error('Webhook: Failed to update booking:', updateError)
      } else if (booking) {
        console.log('Webhook: Booking confirmed successfully:', booking.id)
        // Log to payments table (best-effort, don't crash if payments table schema differs)
        try {
          await (supabase as any).from('payments').insert({
            booking_id: booking.id,
            amount_cents: session.amount_total,
            status: 'paid',
          })
        } catch (paymentErr) {
          console.error('Webhook: payments insert failed (non-fatal):', paymentErr)
        }

        await Promise.allSettled([
          sendBookingConfirmation(booking),
          sendAdminNotification(booking),
        ])
      }
    }
  }

  // ─── Team Package Payment Confirmed ───────────────────────────────────────
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    
    if (session.metadata?.type === 'team_package') {
      const userId = session.metadata.user_id
      const packageType = session.metadata.package_type // 'standard' or 'buyout'
      const hoursToAdd = parseInt(session.metadata.hours_to_add || '0')

      if (userId && hoursToAdd > 0) {
        // Fetch current hours
        const { data: profile } = await (supabase as any)
          .from('profiles')
          .select('team_standard_hours, team_buyout_hours')
          .eq('id', userId)
          .single()
        
        if (profile) {
          const updates: any = {}
          if (packageType === 'standard') {
            updates.team_standard_hours = (profile.team_standard_hours || 0) + hoursToAdd
          } else if (packageType === 'buyout') {
            updates.team_buyout_hours = (profile.team_buyout_hours || 0) + hoursToAdd
          }
          
          await (supabase as any)
            .from('profiles')
            .update(updates)
            .eq('id', userId)
        }
      }
    }
  }

  // ─── Subscription payment succeeded (membership renewal) ─────────────────
  if (stripeEvent.type === 'invoice.payment_succeeded') {
    const invoice = stripeEvent.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id

    if (!customerId || !subscriptionId) return { received: true }

    // Fetch subscription to get current period end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()

    await (supabase as any)
      .from('profiles')
      .update({
        membership_status: 'active',
        membership_expires: periodEnd,
        stripe_subscription_id: subscriptionId,
      })
      .eq('stripe_customer_id', customerId)
  }

  // ─── Subscription updated (plan change, reactivation) ────────────────────
  if (stripeEvent.type === 'customer.subscription.updated') {
    const subscription = stripeEvent.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
    const periodEnd = new Date((subscription as any).current_period_end * 1000).toISOString()

    // Map Stripe status to our status
    const statusMap: Record<string, string> = {
      active: 'active',
      past_due: 'past_due',
      canceled: 'canceled',
      unpaid: 'past_due',
      trialing: 'active',
    }
    const membershipStatus = statusMap[subscription.status] ?? subscription.status

    await (supabase as any)
      .from('profiles')
      .update({
        membership_status: membershipStatus,
        membership_expires: periodEnd,
      })
      .eq('stripe_customer_id', customerId)
  }

  // ─── Subscription canceled ────────────────────────────────────────────────
  if (stripeEvent.type === 'customer.subscription.deleted') {
    const subscription = stripeEvent.data.object as Stripe.Subscription
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

    await (supabase as any)
      .from('profiles')
      .update({
        membership_status: 'canceled',
        stripe_subscription_id: null,
      })
      .eq('stripe_customer_id', customerId)
  }

  return { received: true }
})
