import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

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
    .select('stripe_customer_id, membership_status, membership_type, email')
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

  if (!subscriptions.data.length) {
    return { synced: false, reason: 'No subscriptions found for this customer.' }
  }

  // Find the most recent active (or trialing) subscription
  const activeSub = subscriptions.data.find(s => ['active', 'trialing'].includes(s.status))
    || subscriptions.data[0] // fallback to most recent

  console.log('sync-membership: Using subscription', activeSub.id, 'status:', activeSub.status)

  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'active',
    incomplete: 'none',
    incomplete_expired: 'none',
    paused: 'canceled',
  }

  const membershipStatus = statusMap[activeSub.status] ?? activeSub.status

  // Stripe API may return dates as Unix timestamps (number) or ISO strings
  function parseStripeDate(val: any): string {
    if (!val) return new Date().toISOString()
    if (typeof val === 'number') return new Date(val * 1000).toISOString()
    return new Date(val).toISOString()
  }

  const periodEnd = parseStripeDate((activeSub as any).current_period_end)

  // Determine membership type from subscription metadata
  const membershipType = activeSub.metadata?.membership_type || profile.membership_type || 'individual'

  const updates: Record<string, any> = {
    membership_status: membershipStatus,
    membership_type: membershipType,
    membership_expires: periodEnd,
    stripe_subscription_id: activeSub.id,
  }

  // Only set membership_start if not already set
  if (membershipStatus === 'active') {
    updates.membership_start = parseStripeDate((activeSub as any).start_date)
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
