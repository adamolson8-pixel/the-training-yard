import { SERVICES } from '../../app/utils/services'

/**
 * Members' included daily cage hour: an active Individual or Family membership
 * covers 60 minutes of single-cage time per account per day (by booking date).
 * Covered minutes are free; anything beyond is charged at the member rate.
 */
export const DAILY_INCLUDED_CAGE_MINUTES = 60
/** A member can hold at most this many upcoming bookings that use included time. */
export const MAX_UPCOMING_INCLUDED_BOOKINGS = 3

type BookingService = { id: string; facilityType: string; durationMinutes: number; memberPriceCents: number }

/** Included minutes already used by a member on a booking date (confirmed or still-held bookings). */
export async function includedMinutesUsed(supabase: any, userId: string, bookingDate: string, now: Date = new Date()) {
  const { data, error } = await supabase.from('bookings')
    .select('included_minutes,status,hold_expires_at')
    .eq('user_id', userId).eq('booking_date', bookingDate).gt('included_minutes', 0)
    .in('status', ['pending', 'confirmed'])
  if (error) throw error
  return (data || [])
    .filter((b: any) => b.status === 'confirmed' || !b.hold_expires_at || new Date(b.hold_expires_at) > now)
    .reduce((sum: number, b: any) => sum + Number(b.included_minutes || 0), 0)
}

/** Upcoming (not yet started) bookings that use the member's included time: confirmed or still held. */
export async function upcomingIncludedBookings(supabase: any, userId: string, now: Date = new Date()) {
  const { data, error } = await supabase.from('bookings')
    .select('status,hold_expires_at')
    .eq('user_id', userId).gt('included_minutes', 0).gt('start_at', now.toISOString())
    .in('status', ['pending', 'confirmed'])
  if (error) throw error
  return (data || []).filter((b: any) => b.status === 'confirmed' || !b.hold_expires_at || new Date(b.hold_expires_at) > now).length
}

/** Member price for a number of single-cage minutes (the 30- or 60-minute cage service). */
function memberCagePrice(minutes: number) {
  const cage = SERVICES.find(s => s.facilityType === 'cage' && s.durationMinutes === minutes)
  return cage ? cage.memberPriceCents : Math.round((minutes / 60) * (SERVICES.find(s => s.id === 'single_cage_60')?.memberPriceCents || 0))
}

/**
 * How much of a booking the member's included hour covers and what's left to pay.
 * Non-members, inactive members and non-cage services get nothing included.
 * With MAX_UPCOMING_INCLUDED_BOOKINGS already booked, the next one is at the member rate.
 */
export function includedCoverage(service: BookingService, membershipStatus: string, usedMinutes: number, upcomingIncluded = 0) {
  if (membershipStatus !== 'active' || service.facilityType !== 'cage') {
    return { includedMinutes: 0, chargedMinutes: service.durationMinutes, amountCents: null as number | null, limitReached: false }
  }
  if (upcomingIncluded >= MAX_UPCOMING_INCLUDED_BOOKINGS) {
    return { includedMinutes: 0, chargedMinutes: service.durationMinutes, amountCents: service.memberPriceCents, limitReached: true }
  }
  const remaining = Math.max(0, DAILY_INCLUDED_CAGE_MINUTES - usedMinutes)
  const includedMinutes = Math.min(remaining, service.durationMinutes)
  const chargedMinutes = service.durationMinutes - includedMinutes
  const amountCents = chargedMinutes === 0 ? 0 : chargedMinutes === service.durationMinutes ? service.memberPriceCents : memberCagePrice(chargedMinutes)
  return { includedMinutes, chargedMinutes, amountCents, limitReached: false }
}
