export interface Service {
  id: string
  label: string
  description: string
  priceCents: number
  durationMinutes: number
  facilityType: 'cage' | 'turf' | 'team'
  maxPlayers: number
  emoji: string
}

export const SERVICES: Service[] = [
  {
    id: 'single_cage_30',
    label: 'Single Cage – 30 min',
    description: 'One batting cage for up to 2 players. Great for a focused individual session.',
    priceCents: 3000,
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
    durationMinutes: 60,
    facilityType: 'turf',
    maxPlayers: 40,
    emoji: '🏟️',
  },
  {
    id: 'team_standard_60',
    label: 'Team Standard – 60 min',
    description: 'Dedicated team training space for organized team practices and skill work.',
    priceCents: 15000,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 20,
    emoji: '👥',
  },
  {
    id: 'full_buyout_60',
    label: 'Full Buyout – 60 min',
    description: 'Complete facility buyout. Your team gets the whole place — no sharing.',
    priceCents: 22500,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 40,
    emoji: '🏆',
  },
]

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find((s) => s.id === id)
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}
