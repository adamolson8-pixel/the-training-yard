import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  // Verify Admin Status
  const supabase = serverSupabaseServiceRole(event)
  const userId = user.id || (user as any).sub

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden: Admins only' })
  }

  const bookingId = getRouterParam(event, 'id')
  if (!bookingId) {
    throw createError({ statusCode: 400, message: 'Booking ID required' })
  }

  // Cancel the booking using service role to bypass RLS
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return { success: true }
})
