import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'
import { displayTime, facilityDateParts } from '../../utils/booking'
import { resourceLabel } from '../../../lib/facilityResources.mjs'

const TEAM_MANAGER_ROLES = ['owner', 'coach', 'manager']

/**
 * Upcoming time the facility has reserved for teams this user coaches or
 * manages (Admin > Schedule blocks tagged with the team). Shaped like a
 * booking so the portal lists it alongside their own, but view-only: it has
 * no price and only staff can change it.
 */
async function upcomingTeamReservations(supabase: any, userId: string, now: Date) {
  const { data: memberships } = await supabase.from('team_members')
    .select('team_id,role,teams(name)').eq('user_id', userId).eq('status', 'active')
  const teams = (memberships || []).filter((m: any) => TEAM_MANAGER_ROLES.includes(m.role))
  if (!teams.length) return []
  const teamName = new Map(teams.map((m: any) => [m.team_id, m.teams?.name || 'Your team']))
  const { data: blocks, error } = await supabase.from('blocked_times')
    .select('id,team_id,start_at,end_at,all_day,resource_id')
    .in('team_id', [...teamName.keys()]).gte('end_at', now.toISOString()).order('start_at')
  if (error) {
    console.error('Team reservations fetch error:', error)
    return []
  }
  return (blocks || []).map((block: any) => {
    const start = facilityDateParts(block.start_at)
    return {
      id: `team-${block.id}`,
      kind: 'team_reservation',
      team_name: teamName.get(block.team_id),
      service_label: `Team Reservation — ${teamName.get(block.team_id)}`,
      resource_label: resourceLabel(block.resource_id),
      booking_date: start.date,
      booking_time: block.all_day ? '' : displayTime(start.time),
      end_time: block.all_day ? '' : displayTime(facilityDateParts(block.end_at).time),
      all_day: Boolean(block.all_day),
      duration_minutes: Math.round((Date.parse(block.end_at) - Date.parse(block.start_at)) / 60000),
      start_at: block.start_at,
      status: 'reserved',
    }
  })
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = serverSupabaseServiceRole(event)

  // Fetch bookings for this user
  const { data, error } = await (supabase as any)
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('booking_date', { ascending: false })

  if (error) {
    console.error('Bookings Fetch Error:', error)
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch bookings.' })
  }

  console.log(`Fetched ${data?.length} bookings for ${user.email}`)

  // Split into upcoming vs past based on booking_date + booking_time
  const upcoming: any[] = []
  const past: any[] = []
  const now = new Date()

  for (const b of data ?? []) {
    if (!b.booking_date) {
      past.push(b)
      continue
    }

    // Parse the booking datetime properly
    // booking_time can be "1:00 PM", "12:00 PM", "9:00 AM" (12-hour format)
    // or "13:00", "09:00" (24-hour format)
    // We need to handle both
    let bookingDateTime: Date
    const timeStr = b.booking_time || '12:00 PM'

    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      // 12-hour format: parse manually
      const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const period = match[3].toUpperCase()
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        bookingDateTime = new Date(`${b.booking_date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)
      } else {
        // Fallback: just use the date at noon
        bookingDateTime = new Date(`${b.booking_date}T12:00:00`)
      }
    } else {
      // 24-hour format: works natively
      bookingDateTime = new Date(`${b.booking_date}T${timeStr}`)
    }

    console.log(`  Booking ${b.id}: date=${b.booking_date}, time=${timeStr}, parsed=${bookingDateTime.toISOString()}, status=${b.status}, isFuture=${bookingDateTime >= now}`)

    if (bookingDateTime >= now && b.status !== 'cancelled') {
      upcoming.push(b)
    } else {
      past.push(b)
    }
  }

  // The team's reserved practice times (coaches/managers), then soonest first
  upcoming.push(...await upcomingTeamReservations(supabase, user.id, now))
  const startsAt = (b: any) => (b.start_at ? Date.parse(b.start_at) : new Date(`${b.booking_date}T12:00:00`).getTime())
  upcoming.sort((a, b) => startsAt(a) - startsAt(b))

  console.log(`Result: ${upcoming.length} upcoming, ${past.length} past`)

  return { upcoming, past }
})
