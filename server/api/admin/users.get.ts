import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const query = getQuery(event)

  const search = (query.search as string) || ''
  const page = parseInt((query.page as string) || '1')
  const limit = parseInt((query.limit as string) || '25')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let req = (supabase as any)
    .from('profiles')
    .select('id, email, full_name, phone, role, membership_type, membership_status, membership_expires, waiver_signed, waiver_signed_at, created_at, team_standard_hours, team_buyout_hours', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (search) {
    req = req.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await req

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch users.' })
  }

  return { users: data, total: count, page, limit }
})
