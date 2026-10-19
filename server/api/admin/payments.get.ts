import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const query = getQuery(event)

  const page = parseInt((query.page as string) || '1')
  const limit = parseInt((query.limit as string) || '50')
  const from = (page - 1) * limit
  const to = from + limit - 1
  const status = query.status as string | undefined
  const dateFrom = query.date_from as string | undefined
  const dateTo = query.date_to as string | undefined

  let req = (supabase as any)
    .from('payments')
    .select(`
      id, amount_cents, status, stripe_payment_intent_id, stripe_refund_id, stripe_charge_id,
      refund_amount_cents, amount_refunded_cents, notes, created_at, paid_at, booking_id, user_id, team_id,
      customer_email, customer_name, description, verified_at, match_method, verification_note, livemode,
      bookings ( service_label, booking_date, booking_time, customer_name, customer_email )
    `, { count: 'exact' })
    .order('paid_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') req = req.eq('status', status)
  if (query.user_id) req = req.eq('user_id', String(query.user_id))
  if (query.team_id) req = req.eq('team_id', String(query.team_id))
  if (dateFrom) req = req.gte('created_at', dateFrom)
  if (dateTo) req = req.lte('created_at', dateTo + 'T23:59:59')

  const { data, error, count } = await req

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to fetch payments.' })

  // Names for the user/team each payment is documented against.
  const userIds = [...new Set((data || []).map((p: any) => p.user_id).filter(Boolean))]
  const teamIds = [...new Set((data || []).map((p: any) => p.team_id).filter(Boolean))]
  const [{ data: profiles }, { data: teams }] = await Promise.all([
    userIds.length ? (supabase as any).from('profiles').select('id,full_name,email').in('id', userIds) : { data: [] },
    teamIds.length ? (supabase as any).from('teams').select('id,name').in('id', teamIds) : { data: [] },
  ])
  const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))
  const teamMap = new Map((teams || []).map((t: any) => [t.id, t]))
  const payments = (data || []).map((p: any) => ({ ...p, profile: profileMap.get(p.user_id) || null, team: teamMap.get(p.team_id) || null }))

  return { payments, total: count, page, limit }
})
