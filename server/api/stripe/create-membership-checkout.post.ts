import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { normalizeCode, resolveMembershipCode } from '../../utils/teamMembership'
import { MEMBERSHIP_PLANS } from '../../utils/membershipPlans'
import { signMembershipWaiver, validateMemberSignup } from '../../utils/membershipSignup'

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

  // --- Validate player, parent/guardian and waiver ---
  const signup = validateMemberSignup(body)
  const { memberName, memberDob, relationshipLabel: memberRelationship, guardianName } = signup

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

  // --- Team or promo code ---
  // Codes are entered on our membership page, not Stripe's, so team rules
  // (plans, contract end) are checked before the discount is attached.
  const code = normalizeCode(body.teamCode)
  const resolved = code ? await resolveMembershipCode(supabase, stripe, code, planId) : null
  if (resolved && !resolved.valid) throw createError({ statusCode: 400, message: resolved.message })
  const team = resolved?.valid ? resolved.team : null
  const terms = resolved?.valid ? resolved.terms.join(' ') : ''
  if (resolved?.valid && resolved.requiresAgreement && body.teamTermsAccepted !== true) {
    throw createError({ statusCode: 400, message: 'Please review and accept the team rate terms to continue.' })
  }

  // --- Liability waiver for the player, signed by the parent/guardian (or the adult player) ---
  const waiverSignatureId = await signMembershipWaiver(supabase, event, signup, user.id, team?.id || null)

  // --- Create Stripe Checkout Session (subscription mode) ---
  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    mode: 'subscription',
    ...(resolved?.valid ? { discounts: [{ promotion_code: resolved.promotionCodeId }] } : {}),
    // The team rate terms again, next to Stripe's pay button
    ...(terms ? { custom_text: { submit: { message: terms.slice(0, 1200) } } } : {}),
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
        member_relationship: memberRelationship,
        ...(guardianName ? { guardian_name: guardianName } : {}),
        waiver_signature_id: waiverSignatureId,
        ...(team ? { team_id: team.id, team_code: code } : {}),
        // Record of the team rate terms the member accepted
        // (Stripe metadata values max out at 500 characters, so the terms are split across team_terms_1, _2, ...)
        ...(team && resolved?.requiresAgreement ? {
          team_terms_accepted_at: new Date().toISOString(),
          ...Object.fromEntries((terms.match(/[\s\S]{1,500}/g) || []).map((chunk, i) => [`team_terms_${i + 1}`, chunk])),
        } : {}),
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
      member_relationship: memberRelationship,
      ...(guardianName ? { guardian_name: guardianName } : {}),
    },
  })

  return { url: session.url }
})
