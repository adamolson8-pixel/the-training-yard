import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { getServiceById } from '~/utils/services'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)

  // --- Validate ---
  const required = ['serviceId', 'date', 'time', 'customerName', 'customerEmail', 'customerPhone']
  for (const field of required) {
    if (!body[field]) {
      throw createError({ statusCode: 400, message: `Missing required field: ${field}` })
    }
  }
  if (!body.waiverAccepted) {
    throw createError({ statusCode: 400, message: 'Waiver must be accepted before checkout.' })
  }

  // --- Look up service ---
  const service = getServiceById(body.serviceId)
  if (!service) {
    throw createError({ statusCode: 400, message: 'Invalid service ID.' })
  }

  // --- Stripe (test vs live) ---
  const isTestMode = config.stripeTestMode === 'true' || config.stripeTestMode === true || String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!stripeKey) {
    throw createError({ statusCode: 500, message: `Stripe ${isTestMode ? 'test' : 'live'} secret key is not configured.` })
  }
  const stripe = new Stripe(stripeKey)
  const origin = getRequestHeader(event, 'origin') || getRequestHeader(event, 'referer')?.split('/').slice(0,3).join('/')
  const siteUrl = origin || config.public?.siteUrl || process.env.SITE_URL || 'https://trainingyarddsm.com'

  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60 // 30 minutes

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    customer_email: body.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: service.priceCents,
          product_data: {
            name: service.label,
            description: `${service.durationMinutes} min session on ${body.date} at ${body.time}`,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${siteUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/training`,
    expires_at: expiresAt,
    metadata: {
      service_id: service.id,
      service_label: service.label,
      duration_minutes: String(service.durationMinutes),
      booking_date: body.date,
      booking_time: body.time,
      customer_name: body.customerName,
      customer_email: body.customerEmail,
      customer_phone: body.customerPhone,
      player_name: body.playerName || '',
      player_age: body.playerAge ? String(body.playerAge) : '',
      sport: body.sport || '',
      notes: body.notes || '',
      waiver_signer_name: body.waiverSignerName || '',
    },
  })

  // --- Insert pending booking in Supabase ---
  const supabase = serverSupabaseServiceRole(event)
  const { error: dbError } = await (supabase as any).from('bookings').insert({
    service_type: service.id,
    service_label: service.label,
    duration_minutes: service.durationMinutes,
    booking_date: body.date,
    booking_time: body.time,
    customer_name: body.customerName,
    customer_email: body.customerEmail,
    customer_phone: body.customerPhone,
    player_name: body.playerName || null,
    player_age: body.playerAge ? parseInt(body.playerAge) : null,
    sport: body.sport || null,
    waiver_accepted: true,
    waiver_accepted_at: new Date().toISOString(),
    waiver_signer_name: body.waiverSignerName || null,
    stripe_session_id: session.id,
    amount_cents: service.priceCents,
    status: 'pending',
    notes: body.notes || null,
  })

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    // Don't block checkout — log and continue
  }

  return { url: session.url }
})
