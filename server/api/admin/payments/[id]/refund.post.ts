import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const paymentId = getRouterParam(event, 'id')  // This is the payments table row ID
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)
  const config = useRuntimeConfig()

  if (!paymentId) throw createError({ statusCode: 400, statusMessage: 'Payment ID required.' })

  // Fetch the payment record
  const { data: payment, error: fetchErr } = await (supabase as any)
    .from('payments')
    .select('*, bookings(amount_cents, stripe_payment_intent_id)')
    .eq('id', paymentId)
    .single()

  if (fetchErr || !payment) throw createError({ statusCode: 404, statusMessage: 'Payment not found.' })

  const stripePaymentIntentId = payment.stripe_payment_intent_id || payment.bookings?.stripe_payment_intent_id
  if (!stripePaymentIntentId) throw createError({ statusCode: 400, statusMessage: 'No Stripe payment intent found for this record.' })

  const isTestMode = config.stripeTestMode === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const stripe = new Stripe(stripeKey)

  // Optional partial refund amount in cents
  const refundAmountCents = body.amount_cents ? parseInt(body.amount_cents) : undefined

  const refund = await stripe.refunds.create({
    payment_intent: stripePaymentIntentId,
    ...(refundAmountCents ? { amount: refundAmountCents } : {}),
  })

  const isPartial = refundAmountCents !== undefined
  const refundedAmount = refund.amount

  // Update the payments row
  await (supabase as any).from('payments').update({
    status: isPartial ? 'partially_refunded' : 'refunded',
    stripe_refund_id: refund.id,
    refund_amount_cents: refundedAmount,
    notes: `Admin refund — ${isPartial ? 'partial' : 'full'}. Refund ID: ${refund.id}`,
  }).eq('id', paymentId)

  // Update the booking payment status if there's a linked booking
  if (payment.booking_id) {
    await (supabase as any).from('bookings').update({
      payment_status: isPartial ? 'partially_refunded' : 'refunded',
    }).eq('id', payment.booking_id)
  }

  return { success: true, refundId: refund.id, amountRefunded: refundedAmount }
})
