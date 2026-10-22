/** Membership plans sold through the portal checkout (prices in cents). */
export const MEMBERSHIP_PLANS: Record<string, { name: string; priceCents: number; interval: 'month' | 'year'; membershipType: string }> = {
  individual: {
    name: 'Individual Monthly Membership',
    priceCents: 8900,
    interval: 'month',
    membershipType: 'individual',
  },
  individual_annual: {
    name: 'Individual Annual Membership',
    priceCents: 89000,
    interval: 'year',
    membershipType: 'individual',
  },
  family: {
    name: 'Family Monthly Membership',
    priceCents: 12900,
    interval: 'month',
    membershipType: 'family',
  },
  family_annual: {
    name: 'Family Annual Membership',
    priceCents: 129000,
    interval: 'year',
    membershipType: 'family',
  },
}

/** "Individual rate (currently $89/month)", "Family rate (currently $1,290/year)"; rates can change with notice. */
export function regularRateText(planId: string) {
  const plan = MEMBERSHIP_PLANS[planId]
  if (!plan) return 'regular rate'
  const price = (plan.priceCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  return `${plan.membershipType === 'family' ? 'Family' : 'Individual'} rate (currently ${price}/${plan.interval})`
}
