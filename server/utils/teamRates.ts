/**
 * Hourly rates for team accounts booking online (Book a Session in the team portal).
 * Defaults set by Adam (Oct 30, 2026): half turf + 1 cage $88/hr, $40/hr per cage.
 * Admins can change the prices in Admin > Settings (system_settings key `team_hourly_rates`).
 */
export type TeamHourlyRate = { id: string; label: string; description: string; cents: number }

export const TEAM_RATES_SETTING_KEY = 'team_hourly_rates'

export const DEFAULT_TEAM_HOURLY_RATES: TeamHourlyRate[] = [
  { id: 'turf_cage', label: 'Half turf + 1 cage', description: "The 60'x50' turf field (half the facility) plus one batting cage", cents: 8800 },
  { id: 'cage', label: 'Batting cage', description: 'Per cage, on its own or added to the turf', cents: 4000 },
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
