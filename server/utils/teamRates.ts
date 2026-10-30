/**
 * Hourly rates for team accounts booking hours beyond their agreement.
 * Defaults come from the team pricing Jesse set (Oct 2026); admins can change
 * them in Admin > Settings (system_settings key `team_hourly_rates`).
 */
export type TeamHourlyRate = { id: string; label: string; description: string; cents: number }

export const TEAM_RATES_SETTING_KEY = 'team_hourly_rates'

export const DEFAULT_TEAM_HOURLY_RATES: TeamHourlyRate[] = [
  { id: 'turf_cage', label: 'Turf + 1 cage', description: 'The turf field (half the facility) plus one batting cage', cents: 8800 },
  { id: 'turf', label: 'Turf only', description: "The 60'x50' turf field (half the facility)", cents: 7500 },
  { id: 'cage', label: 'Additional cage', description: 'One batting cage, per cage', cents: 4000 },
  { id: 'full', label: 'Full facility', description: 'Turf plus all four batting cages', cents: 15000 },
]

/** Saved rates merged over the defaults: only the price is editable, ids and labels stay fixed. */
export async function loadTeamHourlyRates(supabase: any): Promise<TeamHourlyRate[]> {
  const { data } = await supabase.from('system_settings').select('value').eq('key', TEAM_RATES_SETTING_KEY).maybeSingle()
  const saved = data?.value && typeof data.value === 'object' ? data.value as Record<string, number> : {}
  return DEFAULT_TEAM_HOURLY_RATES.map(rate => {
    const cents = Number(saved[rate.id])
    return Number.isInteger(cents) && cents > 0 ? { ...rate, cents } : rate
  })
}
