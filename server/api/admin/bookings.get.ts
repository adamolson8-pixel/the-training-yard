import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  // Ensure user is logged in
  const user = await serverSupabaseUser(event)
  
  const userId = user?.id || user?.sub
  if (!user || !userId) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  try {
    const supabase = await serverSupabaseClient(event)

    // Optional: Check if user is an admin.
    // For now, we'll assume any logged in user can see their own bookings, 
    // or if we have a profiles table we could check `role === 'admin'`.
    // Let's fetch all bookings if admin, or just user's bookings if not.

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    const isAdmin = profile?.role === 'admin'

    let query = supabase.from('bookings').select('*, profiles(email, full_name)').order('start_time', { ascending: false })

    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }

    const { data: bookings, error } = await query

    if (error) throw error

    return { success: true, bookings, isAdmin }
  } catch (err: any) {
    // Return empty if supabase fails (e.g. not configured yet)
    console.error('Supabase error:', err.message)
    return { error: 'Failed to fetch bookings. Ensure DB is connected.', bookings: [], isAdmin: false }
  }
})
