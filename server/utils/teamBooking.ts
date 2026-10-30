import { addFacilityDays, bookingWindow, facilityDateParts, CAGE_CAPACITY, LAST_START_HOUR, TURF_CAPACITY } from './booking'
import { loadTeamHourlyRates } from './teamRates'

/**
 * Team accounts (owners, coaches and managers on an active team, without an
 * active membership of their own) book team time through the team booking
 * flow at team rates (/api/portal/team-availability and
 * /api/stripe/create-team-booking-checkout). The individual booking endpoints
 * reject them so they can't book individual services at individual prices.
 * Coaches who are also active members keep booking their own sessions.
 */
export const TEAM_MANAGER_ROLES = ['owner', 'coach', 'manager']

export const TEAM_BOOKING_PAUSED_MESSAGE = 'Team accounts book team time from Book a Session in the team portal.'

/** True when this account is a team account and isn't an active member. */
export function teamBookingPaused(memberships: { role: string }[] | null | undefined, membershipStatus?: string | null) {
  return (memberships || []).some(m => TEAM_MANAGER_ROLES.includes(m.role)) && membershipStatus !== 'active'
}

/**
 * Throws 403 for a logged-in team account on the individual booking endpoints.
 * Guests (no user id) pass. Pass the membership status when the caller already
 * loaded it; otherwise it's read from the profile. A failed team lookup is
 * logged and allowed, so a database hiccup doesn't stop regular customers.
 */
export async function assertTeamBookingAllowed(supabase: any, userId: string | null | undefined, membershipStatus?: string | null) {
  if (!userId) return
  let status = membershipStatus
  if (status === undefined) {
    const { data: profile } = await supabase.from('profiles').select('membership_status').eq('id', userId).maybeSingle()
    status = profile?.membership_status
  }
  const { data: memberships, error } = await supabase.from('team_members').select('role').eq('user_id', userId).eq('status', 'active')
  if (error) {
    console.error('[booking] Team account check failed:', error)
    return
  }
  if (teamBookingPaused(memberships, status)) {
    throw createError({ statusCode: 403, statusMessage: TEAM_BOOKING_PAUSED_MESSAGE })
  }
}

// ─── Online team booking ─────────────────────────────────────────────────────

/** Teams can book online up to two weeks out. */
export const TEAM_BOOKING_HORIZON_DAYS = 14
/** Whole-hour team sessions; they must end by the close of online booking hours. */
export const TEAM_BOOKING_HOURS = [1, 2, 3]
export const TEAM_BOOKING_LAST_END_HOUR = LAST_START_HOUR + 1

export type TeamBookingOption = 'turf_cage' | 'cages'

/**
 * What a team booking holds and costs per hour.
 * - turf_cage: half turf + 1 cage, plus 0-3 more cages
 * - cages: 1-4 cages, no turf
 */
export function teamBookingUnits(option: string, rawCages: unknown, rates: { id: string; cents: number }[]) {
  const turfCage = rates.find(r => r.id === 'turf_cage')
  const cage = rates.find(r => r.id === 'cage')
  if (!turfCage || !cage) throw createError({ statusCode: 503, statusMessage: 'Team rates are not set up.' })
  const cages = Math.floor(Number(rawCages))
  if (option === 'turf_cage') {
    if (!Number.isInteger(cages) || cages < 0 || cages > CAGE_CAPACITY - 1) throw createError({ statusCode: 400, statusMessage: `Add between 0 and ${CAGE_CAPACITY - 1} extra cages.` })
    return {
      turfUnits: TURF_CAPACITY, cageUnits: 1 + cages, hourlyCents: turfCage.cents + cages * cage.cents,
      label: `Half turf + ${1 + cages} cage${cages ? 's' : ''}`,
    }
  }
  if (option === 'cages') {
    if (!Number.isInteger(cages) || cages < 1 || cages > CAGE_CAPACITY) throw createError({ statusCode: 400, statusMessage: `Choose between 1 and ${CAGE_CAPACITY} cages.` })
    return { turfUnits: 0, cageUnits: cages, hourlyCents: cages * cage.cents, label: `${cages} batting cage${cages > 1 ? 's' : ''}` }
  }
  throw createError({ statusCode: 400, statusMessage: 'Choose half turf + cage or cages.' })
}

/** Validates hours, the two-week horizon and online booking hours; returns the time window. */
export function teamBookingWindow(date: string, time: string, rawHours: unknown, now: Date = new Date()) {
  const hours = Number(rawHours)
  if (!TEAM_BOOKING_HOURS.includes(hours)) throw createError({ statusCode: 400, statusMessage: `Choose ${TEAM_BOOKING_HOURS.join(', ')} hours.` })
  const lastDate = addFacilityDays(facilityDateParts(now).date, TEAM_BOOKING_HORIZON_DAYS)
  if (date > lastDate) throw createError({ statusCode: 400, statusMessage: `Team bookings open ${TEAM_BOOKING_HORIZON_DAYS} days in advance. Choose a date on or before ${lastDate}.` })
  const window = bookingWindow(date, time, hours * 60)
  const startHour = Number(window.normalizedTime.split(':')[0])
  if (startHour + hours > TEAM_BOOKING_LAST_END_HOUR) throw createError({ statusCode: 400, statusMessage: 'That session would run past online booking hours.' })
  return { ...window, hours }
}

/**
 * Whether the facility has the units free for the whole window. Returns only
 * yes/no: who holds the other time is never exposed to the team.
 */
export async function windowHasCapacity(supabase: any, startAt: Date, endAt: Date, cageUnits: number, turfUnits: number) {
  const [{ data: bookings, error: bookingError }, { data: blocks, error: blockError }] = await Promise.all([
    supabase.from('bookings').select('cage_units,turf_units,status,hold_expires_at')
      .lt('start_at', endAt.toISOString()).gt('end_at', startAt.toISOString()).in('status', ['pending', 'confirmed']),
    supabase.from('blocked_times').select('cage_units,turf_units')
      .lt('start_at', endAt.toISOString()).gt('end_at', startAt.toISOString()),
  ])
  if (bookingError || blockError) throw bookingError || blockError
  const active = (bookings || []).filter((b: any) => b.status === 'confirmed' || !b.hold_expires_at || new Date(b.hold_expires_at) > new Date())
  const sum = (rows: any[], key: string) => rows.reduce((total, row) => total + Number(row[key] || 0), 0)
  return sum(active, 'cage_units') + sum(blocks || [], 'cage_units') + cageUnits <= CAGE_CAPACITY
    && sum(active, 'turf_units') + sum(blocks || [], 'turf_units') + turfUnits <= TURF_CAPACITY
}

/** The team this user manages (owner/coach/manager); 403 otherwise. */
export async function requireTeamManager(supabase: any, userId: string, teamId?: string) {
  let query = supabase.from('team_members').select('team_id,role,teams(id,name)').eq('user_id', userId).eq('status', 'active').in('role', TEAM_MANAGER_ROLES)
  if (teamId) query = query.eq('team_id', teamId)
  const { data } = await query.limit(1)
  const membership = data?.[0]
  if (!membership) throw createError({ statusCode: 403, statusMessage: 'Team manager access is required.' })
  return { teamId: membership.team_id as string, teamName: (membership.teams?.name || 'Your team') as string }
}

export { loadTeamHourlyRates }
