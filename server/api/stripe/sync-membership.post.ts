import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { isMembershipSubscription, membershipStatusFor, subscriptionPeriodEnd } from '../../utils/stripeMembership'

/**
 * POST /api/stripe/sync-membership
 * 
 * Checks the user's Stripe subscription status directly and syncs
 * the membership fields on their profile. This is the fallback for
 * when webhooks can't reach the server (e.g. local dev).
 * 
 * If the profile has no stripe_customer_id, it will search Stripe
 * by email to find the customer.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // --- Auth required ---
  const user = await requireAuth(event)

  const supabase = serverSupabaseServiceRole(event)

  // Fetch profile to get stripe_customer_id
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, membership_status, membership_type, email')
    .eq('id', user.id)
    .single()

  console.log('sync-membership: user.id =', user.id, 'profile =', JSON.stringify(profile), 'error =', profileError ? JSON.stringify(profileError) : 'none')

  if (profileError || !profile) {
    return { synced: false, reason: `Profile not found for user.id=${user.id}` }
  }

  // --- Stripe setup ---
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!stripeKey) {
    throw createError({ statusCode: 500, message: 'Stripe key not configured.' })
  }
  const stripe = new Stripe(stripeKey)

  let stripeCustomerId = profile.stripe_customer_id

  // If no Stripe customer ID on profile, search Stripe by email
  if (!stripeCustomerId) {
    const userEmail = profile.email || user.email
    console.log('sync-membership: No stripe_customer_id on profile, searching Stripe by email:', userEmail)
    
    if (!userEmail) {
      return { synced: false, reason: 'No stripe_customer_id and no email to search with.' }
    }

    const customers = await stripe.customers.list({ email: userEmail, limit: 5 })
    console.log('sync-membership: Stripe customer search results:', customers.data.length, 'customers found')
    
    if (customers.data.length === 0) {
      return { synced: false, reason: `No Stripe customer found for email: ${userEmail}` }
    }

    // Use the first matching customer
    stripeCustomerId = customers.data[0].id
    console.log('sync-membership: Found Stripe customer:', stripeCustomerId)

    // Save the Stripe customer ID to the profile
    await (supabase as any)
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id)
    
    console.log('sync-membership: Saved stripe_customer_id to profile')
  }

  // List subscriptions for this customer
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 5,
  })

  console.log('sync-membership: Found', subscriptions.data.length, 'subscriptions for customer', stripeCustomerId)

  // Only membership subscriptions (or the one the profile already tracks, for
  // memberships bought before checkout tagged them).
  const memberships = subscriptions.data.filter(s => isMembershipSubscription(s) || s.id === profile.stripe_subscription_id)
  if (!memberships.length) {
    return { synced: false, reason: 'No membership subscriptions found for this customer.' }
  }

  // Find the most recent active (or trialing) subscription
  const activeSub = memberships.find(s => ['active', 'trialing'].includes(s.status))
    || memberships[0]! // fallback to most recent

  console.log('sync-membership: Using subscription', activeSub.id, 'status:', activeSub.status)

  const membershipStatus = membershipStatusFor(activeSub.status)
  const periodEnd = subscriptionPeriodEnd(activeSub)

  // Determine membership type from subscription metadata
  const membershipType = activeSub.metadata?.membership_type || profile.membership_type || 'individual'

  const updates: Record<string, any> = {
    membership_status: membershipStatus,
    membership_type: membershipType,
    membership_expires: periodEnd,
    stripe_subscription_id: activeSub.id,
  }

  if (membershipStatus === 'active') {
    updates.membership_start = new Date(activeSub.start_date * 1000).toISOString()
  }

  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', user.id)

  if (updateError) {
    console.error('sync-membership: Update error:', JSON.stringify(updateError))
    return { synced: false, reason: `Database update failed: ${updateError.message}` }
  }

  console.log(`sync-membership: Updated profile for user ${user.id}: status=${membershipStatus}, type=${membershipType}`)

  return {
    synced: true,
    membership_status: membershipStatus,
    membership_type: membershipType,
    expires: periodEnd,
  }
})
