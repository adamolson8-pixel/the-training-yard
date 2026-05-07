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
      id, amount_cents, status, stripe_payment_intent_id, stripe_refund_id,
      refund_amount_cents, notes, created_at, booking_id, user_id,
      bookings ( service_label, booking_date, booking_time ),
      profiles ( full_name, email )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status && status !== 'all') req = req.eq('status', status)
  if (dateFrom) req = req.gte('created_at', dateFrom)
  if (dateTo) req = req.lte('created_at', dateTo + 'T23:59:59')

  const { data, error, count } = await req

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to fetch payments.' })

  return { payments: data, total: count, page, limit }
})
