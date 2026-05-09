import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const sessionId = query.session_id as string

  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'session_id is required.' })
  }

  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const stripe = new Stripe(stripeKey)

  const session = await stripe.checkout.sessions.retrieve(sessionId)

  const meta = session.metadata || {}

  return {
    serviceLabel: meta.service_label || '',
    date: meta.booking_date || '',
    time: meta.booking_time || '',
    customerName: meta.customer_name || '',
    customerEmail: meta.customer_email || session.customer_email || '',
    amountTotal: session.amount_total ?? 0,
    status: session.payment_status,
  }
})
