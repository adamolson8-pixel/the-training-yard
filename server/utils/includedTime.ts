import { SERVICES } from '../../app/utils/services'

/**
 * Members' included daily cage hour: an active Individual or Family membership
 * covers 60 minutes of single-cage time per account per day (by booking date).
 * Covered minutes are free; anything beyond is charged at the member rate.
 */
export const DAILY_INCLUDED_CAGE_MINUTES = 60

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

/** Member price for a number of single-cage minutes (the 30- or 60-minute cage service). */
function memberCagePrice(minutes: number) {
  const cage = SERVICES.find(s => s.facilityType === 'cage' && s.durationMinutes === minutes)
  return cage ? cage.memberPriceCents : Math.round((minutes / 60) * (SERVICES.find(s => s.id === 'single_cage_60')?.memberPriceCents || 0))
}

/**
 * How much of a booking the member's included hour covers and what's left to pay.
 * Non-members, inactive members and non-cage services get nothing included.
 */
export function includedCoverage(service: BookingService, membershipStatus: string, usedMinutes: number) {
  if (membershipStatus !== 'active' || service.facilityType !== 'cage') {
    return { includedMinutes: 0, chargedMinutes: service.durationMinutes, amountCents: null as number | null }
  }
  const remaining = Math.max(0, DAILY_INCLUDED_CAGE_MINUTES - usedMinutes)
  const includedMinutes = Math.min(remaining, service.durationMinutes)
  const chargedMinutes = service.durationMinutes - includedMinutes
  const amountCents = chargedMinutes === 0 ? 0 : chargedMinutes === service.durationMinutes ? service.memberPriceCents : memberCagePrice(chargedMinutes)
  return { includedMinutes, chargedMinutes, amountCents }
}
