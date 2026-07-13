import Stripe from 'stripe'
import { serverSupabaseUser } from '#supabase/server'

/**
 * Server-side team package definitions.
 * NEVER trust client-supplied prices — always look up from this map.
 */
const TEAM_PACKAGES: Record<string, { name: string; priceCents: number; hours: number }> = {
  // Standard Team (2 Cages + Half Turf)
  'standard-single':   { name: 'Standard Team – Single Practice (1 hr)',     priceCents: 15000,  hours: 1 },
  'standard-6hr':      { name: 'Standard Team – 6-Hour Package',            priceCents: 85500,  hours: 6 },
  'standard-12hr':     { name: 'Standard Team – 12-Hour Package',           priceCents: 153000, hours: 12 },
  'standard-vip':      { name: 'Standard Team VIP – 24-Hour Annual',        priceCents: 270000, hours: 24 },
  // Full Facility Buyout (4 Cages + Full Turf)
  'buyout-single':     { name: 'Full Facility Buyout – Single Practice (1 hr)', priceCents: 22500,  hours: 1 },
  'buyout-6hr':        { name: 'Full Facility Buyout – 6-Hour Package',      priceCents: 128250, hours: 6 },
  'buyout-12hr':       { name: 'Full Facility Buyout – 12-Hour Package',     priceCents: 229500, hours: 12 },
  'buyout-vip':        { name: 'Full Facility VIP – 24-Hour Annual',         priceCents: 405000, hours: 24 },
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const { packageId, packageType } = body

  if (!packageId || !packageType) {
    throw createError({ statusCode: 400, message: 'Missing package details' })
  }

  // Look up the package server-side — NEVER use client-supplied price
  const pkg = TEAM_PACKAGES[packageId]
  if (!pkg) {
    throw createError({ statusCode: 400, message: `Unknown package: ${packageId}` })
  }

  const config = useRuntimeConfig()
  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const stripe = new Stripe(stripeKey)

  const baseUrl = config.public.siteUrl || 'http://localhost:3001'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: pkg.name,
            description: `Adding ${pkg.hours} hours to your account.`,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'team_package',
      user_id: user.id,
      package_id: packageId,
      package_type: packageType, // 'standard' or 'buyout'
      hours_to_add: pkg.hours.toString(),
    },
    success_url: `${baseUrl}/team-success`,
    cancel_url: `${baseUrl}/teams`,
  })

  return { url: session.url }
})
