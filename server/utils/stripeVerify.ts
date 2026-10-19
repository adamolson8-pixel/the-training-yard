import Stripe from 'stripe'

/**
 * Reconciles the payments ledger against Stripe, the source of truth.
 *
 * Every charge on the Stripe account (for whichever mode the site runs in) is
 * matched to the booking, team package, user and team it paid for, then upserted
 * into `payments` keyed by charge id. Nothing here changes bookings or charges;
 * it only records what Stripe says happened and reports what does not line up.
 *
 * Matching order, strongest first:
 *   1. Checkout Session metadata written by our own checkout endpoints
 *      (booking_id, team_package_id, supabase_user_id)
 *   2. Booking / team package rows that stored the payment intent or session id
 *   3. Stripe customer id saved on a profile
 *   4. Payer email equal to a profile email
 */

export function stripeClient() {
  const config = useRuntimeConfig()
  const isTestMode = String(config.stripeTestMode) === 'true'
  const key = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Stripe is not configured on the server.' })
  return { stripe: new Stripe(String(key)), isTestMode }
}

const id = (value: any): string | null => (typeof value === 'string' ? value : value?.id || null)
const lower = (value: any) => String(value || '').trim().toLowerCase()

export async function verifyStripePayments(supabase: any, stripe: Stripe) {
  const verifiedAt = new Date().toISOString()

  // Local records to match against.
  const [{ data: bookings }, { data: packages }, { data: profiles }, { data: existing }, { data: teams }] = await Promise.all([
    supabase.from('bookings').select('id,user_id,team_id,customer_name,customer_email,service_label,start_at,amount_cents,status,payment_status,stripe_session_id,stripe_payment_intent_id,payment_intent_id'),
    supabase.from('team_packages').select('id,team_id,purchased_by,package_name,amount_cents,stripe_session_id,stripe_payment_intent_id'),
    supabase.from('profiles').select('id,email,full_name,stripe_customer_id'),
    supabase.from('payments').select('id,stripe_charge_id,stripe_payment_intent_id,stripe_session_id'),
    supabase.from('teams').select('id,name'),
  ])
  const bookingById = new Map((bookings || []).map((b: any) => [b.id, b]))
  const bookingByPi = new Map<string, any>()
  const bookingBySession = new Map<string, any>()
  for (const b of bookings || []) {
    for (const pi of [b.stripe_payment_intent_id, b.payment_intent_id]) if (pi) bookingByPi.set(pi, b)
    if (b.stripe_session_id) bookingBySession.set(b.stripe_session_id, b)
  }
  const packageById = new Map((packages || []).map((p: any) => [p.id, p]))
  const packageByPi = new Map((packages || []).filter((p: any) => p.stripe_payment_intent_id).map((p: any) => [p.stripe_payment_intent_id, p]))
  const packageBySession = new Map((packages || []).filter((p: any) => p.stripe_session_id).map((p: any) => [p.stripe_session_id, p]))
  const profileById = new Map((profiles || []).map((p: any) => [p.id, p]))
  const profileByCustomer = new Map((profiles || []).filter((p: any) => p.stripe_customer_id).map((p: any) => [p.stripe_customer_id, p]))
  const profileByEmail = new Map((profiles || []).filter((p: any) => p.email).map((p: any) => [lower(p.email), p]))
  const teamName = new Map((teams || []).map((t: any) => [t.id, t.name]))

  // Every Checkout Session, indexed by payment intent; subscription sessions
  // also teach us which Stripe customer belongs to which user.
  const sessionByPi = new Map<string, Stripe.Checkout.Session>()
  const userByCustomer = new Map<string, string>()
  for await (const session of stripe.checkout.sessions.list({ limit: 100 })) {
    const pi = id(session.payment_intent)
    if (pi) sessionByPi.set(pi, session)
    const customer = id(session.customer)
    if (customer && session.metadata?.supabase_user_id) userByCustomer.set(customer, session.metadata.supabase_user_id)
  }

  const rows: any[] = []
  const unmatched: any[] = []
  const amountMismatches: any[] = []
  const seenPi = new Set<string>()
  let scanned = 0

  for await (const charge of stripe.charges.list({ limit: 100 })) {
    scanned++
    if (charge.status === 'failed') continue
    const pi = id(charge.payment_intent)
    if (pi) seenPi.add(pi)
    const session = pi ? sessionByPi.get(pi) : undefined
    const meta = { ...(charge.metadata || {}), ...(session?.metadata || {}) } as Record<string, string>
    const methods: string[] = []

    let booking: any = null
    if (meta.booking_id && bookingById.has(meta.booking_id)) { booking = bookingById.get(meta.booking_id); methods.push('checkout metadata') }
    else if (pi && bookingByPi.has(pi)) { booking = bookingByPi.get(pi); methods.push('booking payment intent') }
    else if (session && bookingBySession.has(session.id)) { booking = bookingBySession.get(session.id); methods.push('booking session') }

    let pkg: any = null
    if (meta.team_package_id && packageById.has(meta.team_package_id)) { pkg = packageById.get(meta.team_package_id); methods.push('checkout metadata') }
    else if (pi && packageByPi.has(pi)) { pkg = packageByPi.get(pi); methods.push('package payment intent') }
    else if (session && packageBySession.has(session.id)) { pkg = packageBySession.get(session.id); methods.push('package session') }

    const customerId = id(charge.customer) || id(session?.customer)
    const email = lower(charge.billing_details?.email || charge.receipt_email || session?.customer_details?.email)
    let userId: string | null = booking?.user_id || pkg?.purchased_by || meta.supabase_user_id || null
    if (!userId && customerId && profileByCustomer.has(customerId)) { userId = profileByCustomer.get(customerId).id; methods.push('stripe customer') }
    if (!userId && customerId && userByCustomer.has(customerId)) { userId = userByCustomer.get(customerId)!; methods.push('stripe customer') }
    if (!userId && email && profileByEmail.has(email)) { userId = profileByEmail.get(email).id; methods.push('email') }
    if (userId && !profileById.has(userId)) userId = null
    const teamId: string | null = booking?.team_id || pkg?.team_id || null

    const refunded = Number(charge.amount_refunded || 0)
    const status = charge.status !== 'succeeded' ? charge.status : refunded >= charge.amount ? 'refunded' : refunded > 0 ? 'partially_refunded' : 'paid'
    const profile = userId ? profileById.get(userId) : null
    const description = charge.description
      || booking?.service_label
      || pkg?.package_name
      || (meta.type === 'membership' ? `Membership${meta.membership_type ? ` (${meta.membership_type})` : ''}` : null)
      || (session?.mode === 'subscription' || (!session && customerId && !booking && !pkg) ? 'Membership / subscription' : null)

    const notes: string[] = []
    const expected = booking ? Number(booking.amount_cents || 0) : pkg ? Number(pkg.amount_cents || 0) : null
    if (expected !== null && expected > 0 && expected !== charge.amount) {
      notes.push(`Stripe charged $${(charge.amount / 100).toFixed(2)} but the ${booking ? 'booking' : 'package'} shows $${(expected / 100).toFixed(2)}`)
      amountMismatches.push({ charge: charge.id, stripe_cents: charge.amount, record_cents: expected, booking_id: booking?.id || null, team_package_id: pkg?.id || null })
    }
    if (!userId && !teamId) notes.push('No matching user or team found in the portal')

    const row = {
      stripe_charge_id: charge.id,
      stripe_payment_intent_id: pi,
      stripe_session_id: session?.id || null,
      stripe_customer_id: customerId,
      booking_id: booking?.id || null,
      team_package_id: pkg?.id || null,
      user_id: userId,
      team_id: teamId,
      amount_cents: charge.amount,
      amount_refunded_cents: refunded,
      refund_amount_cents: refunded || null,
      currency: charge.currency,
      status,
      customer_email: email || profile?.email || null,
      customer_name: charge.billing_details?.name || session?.customer_details?.name || profile?.full_name || booking?.customer_name || null,
      description,
      paid_at: new Date(charge.created * 1000).toISOString(),
      livemode: charge.livemode,
      verified_at: verifiedAt,
      match_method: [...new Set(methods)].join(', ') || null,
      verification_note: notes.join('; ') || null,
    }
    rows.push(row)
    if (!userId && !teamId) unmatched.push({ charge: charge.id, amount_cents: charge.amount, email: row.customer_email, name: row.customer_name, paid_at: row.paid_at, description })
  }

  // Write: update an existing row for the same charge (or the same payment
  // intent, for rows the webhook wrote before charge ids were stored); insert the rest.
  const byCharge = new Map((existing || []).filter((p: any) => p.stripe_charge_id).map((p: any) => [p.stripe_charge_id, p.id]))
  const byPi = new Map((existing || []).filter((p: any) => !p.stripe_charge_id && p.stripe_payment_intent_id).map((p: any) => [p.stripe_payment_intent_id, p.id]))
  let inserted = 0
  let updated = 0
  const toInsert: any[] = []
  for (const row of rows) {
    const existingId = byCharge.get(row.stripe_charge_id) || (row.stripe_payment_intent_id ? byPi.get(row.stripe_payment_intent_id) : undefined)
    if (existingId) {
      const { error } = await supabase.from('payments').update(row).eq('id', existingId)
      if (error) throw createError({ statusCode: 500, statusMessage: `Unable to save charge ${row.stripe_charge_id}.` })
      if (row.stripe_payment_intent_id) byPi.delete(row.stripe_payment_intent_id)
      updated++
    } else {
      toInsert.push(row)
    }
  }
  for (let index = 0; index < toInsert.length; index += 100) {
    const { error } = await supabase.from('payments').insert(toInsert.slice(index, index + 100))
    if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to save verified Stripe charges.' })
    inserted += toInsert.slice(index, index + 100).length
  }

  // Portal records that claim money changed hands but have no Stripe charge.
  const missingFromStripe = (bookings || [])
    .filter((b: any) => b.payment_status === 'paid' && Number(b.amount_cents || 0) > 0)
    .filter((b: any) => ![b.stripe_payment_intent_id, b.payment_intent_id].some(pi => pi && seenPi.has(pi)) && !rows.some(r => r.booking_id === b.id))
    .map((b: any) => ({ booking_id: b.id, customer: b.customer_name || b.customer_email, service: b.service_label, start_at: b.start_at, amount_cents: b.amount_cents }))

  const paid = rows.filter(r => r.status === 'paid' || r.status === 'partially_refunded')
  return {
    verified_at: verifiedAt,
    charges_scanned: scanned,
    charges_recorded: rows.length,
    inserted,
    updated,
    linked_to_user: rows.filter(r => r.user_id).length,
    linked_to_team: rows.filter(r => r.team_id).length,
    net_collected_cents: paid.reduce((sum, r) => sum + r.amount_cents - r.amount_refunded_cents, 0),
    by_team: Object.entries(rows.filter(r => r.team_id).reduce((acc: Record<string, number>, r) => {
      const name = teamName.get(r.team_id) || r.team_id
      acc[name] = (acc[name] || 0) + r.amount_cents - r.amount_refunded_cents
      return acc
    }, {})).map(([team, cents]) => ({ team, net_cents: cents })),
    unmatched,
    amount_mismatches: amountMismatches,
    marked_paid_without_stripe_charge: missingFromStripe,
  }
}
