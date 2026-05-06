import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string | undefined

  const supabase = serverSupabaseServiceRole(event)

  let req = (supabase as any)
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: true })

  if (status && status !== 'all') {
    req = req.eq('status', status)
  }

  const { data, error } = await req

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to fetch bookings.' })
  }

  return data
})
