import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()

  // Get the user's Stripe customer ID
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    throw createError({ statusCode: 400, statusMessage: 'No Stripe customer found for this account.' })
  }

  const isTestMode = config.stripeTestMode === 'true' || config.stripeTestMode === true || String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const stripe = new Stripe(stripeKey)

  const siteUrl = config.public.siteUrl || 'http://localhost:3001'

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${siteUrl}/portal/membership`,
  })

  return { url: session.url }
})
