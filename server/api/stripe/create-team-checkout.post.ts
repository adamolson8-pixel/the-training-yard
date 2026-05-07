import Stripe from 'stripe'
import { serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const { packageId, packageName, priceCents, hoursToAdd, packageType } = body

  if (!packageId || !priceCents || !hoursToAdd || !packageType) {
    throw createError({ statusCode: 400, message: 'Missing package details' })
  }

  const config = useRuntimeConfig()
  const isTestMode = config.stripeTestMode === 'true' || config.stripeTestMode === true || String(config.stripeTestMode) === 'true'
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
            name: packageName,
            description: `Adding ${hoursToAdd} hours to your account.`,
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'team_package',
      user_id: user.id,
      package_type: packageType, // 'standard' or 'buyout'
      hours_to_add: hoursToAdd.toString(),
    },
    success_url: `${baseUrl}?booking_success=true`,
    cancel_url: `${baseUrl}/teams`,
  })

  return { url: session.url }
})
