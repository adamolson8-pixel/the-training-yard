/**
 * Online booking is paused for team accounts (owners, coaches and managers on
 * an active team) while custom team pricing is set up. Coaches who are also
 * active members keep booking their own sessions. The portal greys booking out
 * with the same rule (`team_booking_soon` from /api/portal/me), and every
 * booking endpoint enforces it so the pause can't be bypassed.
 */
export const TEAM_MANAGER_ROLES = ['owner', 'coach', 'manager']

export const TEAM_BOOKING_PAUSED_MESSAGE = 'Online booking for teams is coming soon. Contact us to schedule team time.'

/** True when this account is a team account and isn't an active member. */
export function teamBookingPaused(memberships: { role: string }[] | null | undefined, membershipStatus?: string | null) {
  return (memberships || []).some(m => TEAM_MANAGER_ROLES.includes(m.role)) && membershipStatus !== 'active'
}

/**
 * Throws 403 for a logged-in team account. Guests (no user id) pass. Pass the
 * membership status when the caller already loaded it; otherwise it's read
 * from the profile. A failed team lookup is logged and allowed, so a database
 * hiccup doesn't stop regular customers from booking.
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
