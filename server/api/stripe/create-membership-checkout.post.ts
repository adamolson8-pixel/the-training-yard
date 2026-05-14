import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

const MEMBERSHIP_PLANS: Record<string, { name: string; priceCents: number; interval: 'month' | 'year'; membershipType: string }> = {
  individual: {
    name: 'Individual Monthly Membership',
    priceCents: 8900,
    interval: 'month',
    membershipType: 'individual',
  },
  individual_annual: {
    name: 'Individual Annual Membership',
    priceCents: 89000,
    interval: 'year',
    membershipType: 'individual',
  },
  family: {
    name: 'Family Monthly Membership',
    priceCents: 12900,
    interval: 'month',
    membershipType: 'family',
  },
  family_annual: {
    name: 'Family Annual Membership',
    priceCents: 129000,
    interval: 'year',
    membershipType: 'family',
  },
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // --- Auth required ---
  const user = await requireAuth(event)

  // --- Validate plan ---
  const planId = body.planId as string
  const plan = MEMBERSHIP_PLANS[planId]
  if (!plan) {
    throw createError({ statusCode: 400, message: `Invalid plan: ${planId}. Must be "individual" or "family".` })
  }

  // --- Validate member info ---
  const memberName = (body.memberName || '').trim()
  const memberDob = (body.memberDob || '').trim()
  const memberRelationship = (body.memberRelationship || '').trim()

  if (!memberName) {
    throw createError({ statusCode: 400, message: 'Member name is required.' })
  }

  // --- Stripe setup ---
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!stripeKey) {
    throw createError({ statusCode: 500, message: `Stripe ${isTestMode ? 'test' : 'live'} secret key is not configured.` })
  }
  const stripe = new Stripe(stripeKey)

  const origin = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer')?.split('/').slice(0, 3).join('/')
  const siteUrl = origin || config.public?.siteUrl || 'https://trainingyarddsm.com'

  // --- Get or create Stripe customer ---
  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id, full_name, email, membership_status, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  // --- Block duplicate membership purchases ---
  // Check the profile first
  if (profile?.membership_status === 'active' && profile?.stripe_subscription_id) {
    throw createError({
      statusCode: 409,
      message: 'You already have an active membership. Please manage or cancel your existing membership before purchasing a new one.',
    })
  }

  let stripeCustomerId = profile?.stripe_customer_id

  if (!stripeCustomerId) {
    // Try to find existing customer by email
    const userEmail = profile?.email || user.email
    const existingCustomers = await stripe.customers.list({ email: userEmail, limit: 1 })
    
    if (existingCustomers.data.length > 0) {
      stripeCustomerId = existingCustomers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name || user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id
    }

    // Save the Stripe customer ID to the profile
    await (supabase as any)
      .from('profiles')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', user.id)
  }

  // Also check Stripe directly for active subscriptions (belt-and-suspenders)
  const existingSubs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 10,
  })

  // Filter to only membership subscriptions (not team packages)
  const activeMembershipSubs = existingSubs.data.filter(s =>
    s.metadata?.membership_type === 'individual' || s.metadata?.membership_type === 'family'
  )

  if (activeMembershipSubs.length > 0) {
    // Update the profile to reflect the existing active subscription
    const existingSub = activeMembershipSubs[0]
    await (supabase as any)
      .from('profiles')
      .update({
        membership_status: 'active',
        membership_type: existingSub.metadata?.membership_type || 'individual',
        stripe_subscription_id: existingSub.id,
      })
      .eq('id', user.id)

    throw createError({
      statusCode: 409,
      message: 'You already have an active membership subscription. Go to your Billing Portal to manage it.',
    })
  }

  // --- Create Stripe Checkout Session (subscription mode) ---
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: plan.priceCents,
          recurring: { interval: plan.interval },
          product_data: {
            name: plan.name,
            description: `The Training Yard — ${plan.name} for ${memberName}`,
          },
        },
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        supabase_user_id: user.id,
        membership_type: plan.membershipType,
        member_name: memberName,
        member_dob: memberDob,
        member_relationship: memberRelationship || 'self',
      },
    },
    success_url: `${siteUrl}/portal/membership?checkout=success`,
    cancel_url: `${siteUrl}/portal/membership`,
    metadata: {
      type: 'membership',
      supabase_user_id: user.id,
      membership_type: plan.membershipType,
      member_name: memberName,
      member_dob: memberDob,
      member_relationship: memberRelationship || 'self',
    },
  })

  return { url: session.url }
})
