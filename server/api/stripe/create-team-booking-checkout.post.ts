import Stripe from 'stripe'
import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { displayTime } from '../../utils/booking'
import { loadTeamHourlyRates, requireTeamManager, teamBookingUnits, teamBookingWindow } from '../../utils/teamBooking'

/**
 * Online team booking at team rates: holds the time (same capacity lock as every
 * booking), then sends the coach to Stripe. The Stripe webhook confirms it
 * (metadata type "booking"), exactly like individual bookings.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const user = await requireAuth(event)
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const { teamId, teamName } = await requireTeamManager(supabase, user.id, body.teamId ? String(body.teamId) : undefined)
  const { data: profile } = await (supabase as any).from('profiles').select('full_name,email,phone,waiver_signed').eq('id', user.id).single()
  if (!profile?.waiver_signed) throw createError({ statusCode: 400, statusMessage: 'Sign your liability waiver in the portal before booking.' })

  const units = teamBookingUnits(String(body.option || ''), body.cages, await loadTeamHourlyRates(supabase))
  const date = String(body.date || '')
  const window = teamBookingWindow(date, String(body.time || ''), body.hours)
  const amountCents = units.hourlyCents * window.hours
  const label = `Team Rental: ${units.label} (${teamName})`
  const email = String(profile.email || user.email || '').toLowerCase()
  const notes = String(body.notes || '').trim().slice(0, 1000)

  const { data: bookingId, error: holdError } = await (supabase as any).rpc('create_booking_hold', {
    p_user_id: user.id,
    p_team_id: teamId,
    p_service_type: `team_${String(body.option)}`,
    p_service_label: label,
    p_duration_minutes: window.hours * 60,
    p_booking_date: date,
    p_booking_time: displayTime(window.normalizedTime),
    p_start_at: window.startAt.toISOString(),
    p_end_at: window.endAt.toISOString(),
    p_cage_units: units.cageUnits,
    p_turf_units: units.turfUnits,
    p_customer_name: profile.full_name || teamName,
    p_customer_email: email,
    p_customer_phone: profile.phone || '',
    p_player_name: teamName,
    p_player_age: null,
    p_sport: '',
    p_notes: notes,
    p_waiver_accepted: true,
    p_waiver_signer_name: profile.full_name || '',
    p_amount_cents: amountCents,
  })
  if (holdError || !bookingId) {
    const unavailable = /slot_(unavailable|blocked)/.test(holdError?.message || '')
    if (!unavailable) console.error('[team-checkout] Hold failed:', holdError)
    throw createError({ statusCode: unavailable ? 409 : 503, statusMessage: unavailable ? 'That time was just booked. Please choose another.' : 'Unable to reserve that time.' })
  }

  const isTestMode = String(config.stripeTestMode) === 'true'
  const stripeKey = isTestMode ? config.stripeTestSecretKey : config.stripeSecretKey
  const release = () => (supabase as any).from('bookings').update({ status: 'expired', payment_status: 'failed', hold_expires_at: new Date().toISOString() }).eq('id', bookingId)
  if (!stripeKey) {
    await release()
    throw createError({ statusCode: 503, statusMessage: 'Checkout is temporarily unavailable.' })
  }
  const stripe = new Stripe(stripeKey)
  const siteUrl = String(config.public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: [{ price_data: { currency: 'usd', unit_amount: units.hourlyCents, product_data: {
        name: `Team Rental: ${units.label}`,
        description: `${teamName}, ${date} at ${displayTime(window.normalizedTime)}, ${window.hours} hour${window.hours > 1 ? 's' : ''} at the team rate`,
      } }, quantity: window.hours }],
      success_url: `${siteUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/portal/book?checkout=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: { type: 'booking', booking_id: String(bookingId), supabase_user_id: user.id, team_id: teamId },
      payment_intent_data: { metadata: { type: 'booking', booking_id: String(bookingId), team_id: teamId } },
    })
    const { error: attachError } = await (supabase as any).from('bookings').update({ stripe_session_id: session.id }).eq('id', bookingId)
    if (attachError) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined)
      throw attachError
    }
    return { url: session.url, bookingId }
  } catch (error) {
    await release()
    console.error('[team-checkout] Failed after hold creation:', error)
    throw createError({ statusCode: 503, statusMessage: 'Checkout could not be started. Your time was released; please try again.' })
  }
})
