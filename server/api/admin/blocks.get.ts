import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

/** Blocks that ended more than this long ago are history, not something to manage. */
const TRAILING_WINDOW_DAYS = 30
/** Ceiling well above a full season of repeats, so a series is never truncated. */
const MAX_ROWS = 2000

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const query = getQuery(event)

  // Season-long repeats can add hundreds of rows a year. Default to what staff
  // can still act on; `?all=1` returns the full history.
  let request = (supabase as any)
    .from('blocked_times')
    .select('*')
    .order('start_at', { ascending: true })
    .limit(MAX_ROWS)
  if (query.all !== '1' && query.all !== 'true') {
    request = request.gte('end_at', new Date(Date.now() - TRAILING_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString())
  }

  const { data, error } = await request
  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to fetch blocks.' })
  return data
})
