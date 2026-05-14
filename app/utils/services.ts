export interface ServicePackage {
  label: string   // e.g. '6 hrs'
  priceCents: number
  hourlyRate?: string  // e.g. '$142.50/hr'
}

export interface Service {
  id: string
  label: string
  description: string
  priceCents: number
  memberPriceCents: number
  memberText?: string
  durationMinutes: number
  facilityType: 'cage' | 'turf' | 'team'
  maxPlayers: number
  emoji: string
  isTeam?: boolean
  singlePriceCents?: number   // single-practice hourly rate in cents
  teamNote?: string
  packages?: ServicePackage[]
}

export function formatPrice(cents: number): string {
  const dollars = cents / 100
  const formatted = dollars % 1 === 0
    ? dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : dollars.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return '$' + formatted
}

export function getServiceById(id: string): Service | undefined {
  return SERVICES.find(s => s.id === id)
}

export const SERVICES: Service[] = [
  {
    id: 'single_cage_30',
    label: 'Single Cage – 30 min',
    description: 'One batting cage for up to 2 players. Great for a focused individual session.',
    priceCents: 3000,
    memberPriceCents: 2250,
    memberText: 'Included (up to 1 hr/day)',
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
    memberText: 'Included (1 hr/day)',
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
    memberText: 'Included (1 hr/week)',
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
    description: "60'×50' half turf (open field) + 2 batting cages available. Ideal for organized practices, skill work, and small team training.",
    priceCents: 15000,
    memberPriceCents: 11250,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 20,
    emoji: '👥',
    isTeam: true,
    singlePriceCents: 15000,
    teamNote: 'From $112.50/hr',
    packages: [
      { label: '6 hrs', priceCents: 85500, hourlyRate: '$142.50/hr' },
      { label: '12 hrs', priceCents: 153000, hourlyRate: '$127.50/hr' },
      { label: '24 hrs', priceCents: 270000, hourlyRate: '$112.50/hr' },
    ],
  },
  {
    id: 'full_buyout_60',
    label: 'Full Facility Buyout',
    description: "Full 60'×100' facility — all 4 batting cages open + complete turf field. Your team owns the whole space, no sharing.",
    priceCents: 22500,
    memberPriceCents: 16875,
    durationMinutes: 60,
    facilityType: 'team',
    maxPlayers: 40,
    emoji: '🏆',
    isTeam: true,
    singlePriceCents: 22500,
    teamNote: 'From $168.75/hr',
    packages: [
      { label: '6 hrs', priceCents: 128250, hourlyRate: '$213.75/hr' },
      { label: '12 hrs', priceCents: 229500, hourlyRate: '$191.25/hr' },
      { label: '24 hrs', priceCents: 405000, hourlyRate: '$168.75/hr' },
    ],
  },
]
