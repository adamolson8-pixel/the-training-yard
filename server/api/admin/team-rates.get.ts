import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'
import { loadTeamHourlyRates } from '../../utils/teamRates'

/** Team hourly rates (saved values over defaults) for Admin > Settings. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return { rates: await loadTeamHourlyRates(serverSupabaseServiceRole(event)) }
})
