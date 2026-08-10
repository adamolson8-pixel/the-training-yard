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
    teamNote: 'Call for custom discounted team pricing',
  },
  {
    id: 'team_standard_90', label: 'Team Standard – 90 min',
    description: "60'×50' half turf plus 2 batting cages for an extended team practice.",
    priceCents: 22500, memberPriceCents: 16875, durationMinutes: 90, facilityType: 'team', maxPlayers: 20,
    emoji: '👥', isTeam: true, singlePriceCents: 22500, teamNote: 'Redeem 1.5 package hours',
  },
  {
    id: 'team_standard_120', label: 'Team Standard – 120 min',
    description: "60'×50' half turf plus 2 batting cages for a full two-hour practice.",
    priceCents: 30000, memberPriceCents: 22500, durationMinutes: 120, facilityType: 'team', maxPlayers: 20,
    emoji: '👥', isTeam: true, singlePriceCents: 30000, teamNote: 'Redeem 2 package hours',
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
    teamNote: 'Call for custom discounted team pricing',
  },
  {
    id: 'full_buyout_90', label: 'Full Facility Buyout – 90 min',
    description: "Exclusive use of all 4 cages and the complete 60'×100' turf for 90 minutes.",
    priceCents: 33750, memberPriceCents: 25313, durationMinutes: 90, facilityType: 'team', maxPlayers: 40,
    emoji: '🏆', isTeam: true, singlePriceCents: 33750, teamNote: 'Redeem 1.5 package hours',
  },
  {
    id: 'full_buyout_120', label: 'Full Facility Buyout – 120 min',
    description: "Exclusive use of all 4 cages and the complete 60'×100' turf for two hours.",
    priceCents: 45000, memberPriceCents: 33750, durationMinutes: 120, facilityType: 'team', maxPlayers: 40,
    emoji: '🏆', isTeam: true, singlePriceCents: 45000, teamNote: 'Redeem 2 package hours',
  },
]
