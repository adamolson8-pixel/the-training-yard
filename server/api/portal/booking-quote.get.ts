import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { bookingPrice, serviceCapacity } from '../../utils/booking'
import { MAX_UPCOMING_INCLUDED_BOOKINGS, includedCoverage, includedMinutesUsed, upcomingIncludedBookings } from '../../utils/includedTime'
import { membershipIncludesTurf } from '../../utils/teamMembership'

/**
 * GET /api/portal/booking-quote?service_id=single_cage_60&date=2026-10-24
 * What a logged-in customer will pay for a booking, including how much of a
 * member's daily cage hour it uses. Same math as create-checkout.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const date = String(query.date || '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw createError({ statusCode: 400, statusMessage: 'A booking date is required.' })
  const { service } = serviceCapacity(String(query.service_id || ''))
  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await (supabase as any).from('profiles')
    .select('membership_status,membership_discount_code,membership_team_id').eq('id', user.id).single()
  const membershipStatus = profile?.membership_status || 'none'
  const used = await includedMinutesUsed(supabase, user.id, date)
  const upcoming = await upcomingIncludedBookings(supabase, user.id)
  const coverage = includedCoverage(service, membershipStatus, used, upcoming)
  const amountCents = coverage.amountCents ?? bookingPrice(service, membershipStatus, await membershipIncludesTurf(supabase, profile))
  return {
    amountCents,
    regularCents: service.priceCents,
    includedMinutes: coverage.includedMinutes,
    chargedMinutes: coverage.chargedMinutes,
    includedMinutesUsedToday: used,
    upcomingIncludedBookings: upcoming,
    maxUpcomingIncludedBookings: MAX_UPCOMING_INCLUDED_BOOKINGS,
    includedLimitReached: coverage.limitReached,
  }
})
