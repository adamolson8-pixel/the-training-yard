import Stripe from 'stripe'
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { bookingPrice, bookingWindow, displayTime, serviceCapacity } from '../../utils/booking'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const required = ['serviceId', 'date', 'time', 'customerName', 'customerEmail', 'customerPhone', 'waiverSignerName']
  for (const field of required) {
    if (!String(body[field] || '').trim()) throw createError({ statusCode: 400, statusMessage: `Missing required field: ${field}` })
  }
  if (!body.waiverAccepted) throw createError({ statusCode: 400, statusMessage: 'The liability waiver must be accepted.' })

  const { service, cageUnits, turfUnits } = serviceCapacity(String(body.serviceId))
  if (service.isTeam) throw createError({ statusCode: 400, statusMessage: 'Team sessions must be redeemed through a team account.' })
  const window = bookingWindow(String(body.date), String(body.time), service.durationMinutes)
  const supabase = serverSupabaseServiceRole(event)
  const user = await serverSupabaseUser(event).catch(() => null)
  const userId = (user as any)?.id || (user as any)?.sub || null

  let membershipStatus = 'none'
  let customerEmail = String(body.customerEmail).trim().toLowerCase()
  if (userId) {
    const { data: profile } = await (supabase as any).from('profiles').select('email,membership_status').eq('id', userId).single()
    membershipStatus = profile?.membership_status || 'none'
    customerEmail = profile?.email || user?.email || customerEmail
  }
  const amountCents = bookingPrice(service, membershipStatus)

  const { data: waiverDocument, error: waiverDocumentError } = await (supabase as any)
    .from('waiver_documents').select('*').eq('slug', 'facility-liability-release').eq('active', true).order('version', { ascending: false }).limit(1).single()
  if (waiverDocumentError || !waiverDocument) throw createError({ statusCode: 503, statusMessage: 'The waiver service is temporarily unavailable.' })

  const { data: signature, error: signatureError } = await (supabase as any).from('waiver_signatures').insert({
    document_id: waiverDocument.id,
    user_id: userId,
    participant_name: String(body.playerName || body.customerName).trim(),
    participant_date_of_birth: body.participantDateOfBirth || null,
    signer_name: String(body.waiverSignerName).trim(),
    guardian_relationship: body.guardianRelationship || null,
    liability_accepted: true,
    photo_consent: body.photoConsent === true,
    ip_address: getRequestIP(event, { xForwardedFor: true }) || null,
    user_agent: getHeader(event, 'user-agent') || null,
    document_snapshot: {
      slug: waiverDocument.slug,
      version: waiverDocument.version,
      title: waiverDocument.title,
      content: waiverDocument.content,
      content_hash: waiverDocument.content_hash,
    },
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  }).select('id').single()
  if (signatureError || !signature) throw createError({ statusCode: 503, statusMessage: 'We could not record the waiver. Please try again.' })

  const { data: bookingId, error: holdError } = await (supabase as any).rpc('create_booking_hold', {
    p_user_id: userId,
    p_team_id: null,
    p_service_type: service.id,
    p_service_label: service.label,
    p_duration_minutes: service.durationMinutes,
    p_booking_date: body.date,
    p_booking_time: displayTime(window.normalizedTime),
    p_start_at: window.startAt.toISOString(),
    p_end_at: window.endAt.toISOString(),
    p_cage_units: cageUnits,
    p_turf_units: turfUnits,
    p_customer_name: String(body.customerName).trim(),
    p_customer_email: customerEmail,
    p_customer_phone: String(body.customerPhone).trim(),
    p_player_name: String(body.playerName || ''),
    p_player_age: body.playerAge ? Number(body.playerAge) : null,
    p_sport: String(body.sport || ''),
    p_notes: String(body.notes || ''),
    p_waiver_accepted: true,
    p_waiver_signer_name: String(body.waiverSignerName).trim(),
    p_amount_cents: amountCents,
  })
  if (holdError || !bookingId) {
    await (supabase as any).from('waiver_signatures').delete().eq('id', signature.id)
    const unavailable = /slot_(unavailable|blocked)/.test(holdError?.message || '')
    throw createError({ statusCode: unavailable ? 409 : 503, statusMessage: unavailable ? 'That time was just booked. Please choose another.' : 'Unable to reserve that time.' })
  }
  await (supabase as any).from('bookings').update({ waiver_signature_id: signature.id }).eq('id', bookingId)

  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  if (!stripeKey) throw createError({ statusCode: 503, statusMessage: 'Checkout is temporarily unavailable.' })
  const stripe = new Stripe(stripeKey)
  const siteUrl = String(config.public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [{ price_data: { currency: 'usd', unit_amount: amountCents, product_data: {
        name: service.label,
        description: `${service.durationMinutes} minute session on ${body.date} at ${displayTime(window.normalizedTime)}`,
      } }, quantity: 1 }],
      success_url: `${siteUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/training?checkout=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: { type: 'booking', booking_id: String(bookingId), supabase_user_id: userId || '' },
      payment_intent_data: { metadata: { type: 'booking', booking_id: String(bookingId) } },
    })
    const { error: attachError } = await (supabase as any).from('bookings').update({ stripe_session_id: session.id }).eq('id', bookingId)
    if (attachError) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined)
      throw attachError
    }
    return { url: session.url, bookingId }
  } catch (error) {
    await (supabase as any).from('bookings').update({ status: 'expired', payment_status: 'failed', hold_expires_at: new Date().toISOString() }).eq('id', bookingId)
    console.error('[checkout] Failed after hold creation:', error)
    throw createError({ statusCode: 503, statusMessage: 'Checkout could not be started. Your time was released; please try again.' })
  }
})
