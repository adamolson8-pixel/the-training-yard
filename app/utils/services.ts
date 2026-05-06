export interface Service {
  id: string
  label: string
  description: string
  priceCents: number
  memberPriceCents: number
  durationMinutes: number
  facilityType: 'cage' | 'turf' | 'team'
  maxPlayers: number
  emoji: string
  isTeam?: boolean
  teamNote?: string
}

export function formatPrice(cents: number): string {
  const dollars = cents / 100
  return '$' + (dollars % 1 === 0 ? dollars.toFixed(0) : dollars.toFixed(2))
}

export const SERVICES: Service[] = [
  {
    id: 'single_cage_30',
    label: 'Single Cage – 30 min',
    description: 'One batting cage for up to 2 players. Great for a focused individual session.',
    priceCents: 3000,
    memberPriceCents: 2250,
    durationMinutes: 30,
    facilityType: 'cage',
    maxPlayers: 2,
    emoji: '⚾',
  },
  {
    id: 'single_cage_60',
    label: 'Single Cage – 60 min',
    description: 'One batting cage for up to 2 players. Double the reps, double the results.',
    priceCents: 5000,
    memberPriceCents: 3750,
    durationMinutes: 60,
    facilityType: 'cage',
    maxPlayers: 2,
    emoji: '⚾',
  },
  {
    id: 'half_turf_60',
    label: 'Half Turf – 60 min',
    description: 'Half of the synthetic turf field for small group training or practice.',
    priceCents: 7500,
    memberPriceCents: 5625,
    durationMinutes: 60,
    facilityType: 'turf',
    maxPlayers: 15,
    emoji: '🏟️',
  },
  {
    id: 'full_facility_60',
    label: 'Full Facility – 60 min',
    description: 'Entire facility including all cages and full turf. Maximum space for your team.',
    priceCents: 22500,
    memberPriceCents: 16875,
    durationMinutes: 60,
    facilityType: 'turf',
    maxPlayers: 40,
    emoji: '🏟️',
  },
  {
    id: 'team_standard_60',
    label: 'Team Standard',
    description: '2 cages + half turf. Ideal for organized practices and skill work. Book 60, 90, or 120-min blocks.',
    priceCents: 11250,
    memberPriceCents: 11250,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 20,
    emoji: '👥',
    isTeam: true,
    teamNote: 'Single practice $150/hr · Packages from $855 (6 hrs) to $2,700 (24 hrs)',
  },
  {
    id: 'full_buyout_60',
    label: 'Full Facility Buyout',
    description: '4 cages + full turf. Your team owns the whole space — no sharing. Book 60, 90, or 120-min blocks.',
    priceCents: 16875,
    memberPriceCents: 16875,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 40,
    emoji: '🏆',
    isTeam: true,
    teamNote: 'Single practice $225/hr · Packages from $1,282 (6 hrs) to $4,050 (24 hrs)',
  },
]
