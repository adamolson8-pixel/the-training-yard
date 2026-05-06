import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Booking ID required.' })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await (supabase as any)
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) {
    throw createError({ statusCode: 500, message: 'Failed to cancel booking.' })
  }

  return { success: true }
})
