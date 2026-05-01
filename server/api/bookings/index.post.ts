import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { resource_id, start_time, end_time } = body

  // Ensure user is logged in
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please log in to book.' })
  }

  if (!resource_id || !start_time) {
    throw createError({ statusCode: 400, statusMessage: 'Missing resource or start time' })
  }

  // Calculate end_time if not provided (default 1 hour)
  const finalEndTime = end_time || new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString()

  try {
    const supabase = await serverSupabaseClient(event)

    // Check for overlaps
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('resource_id', resource_id)
      .eq('start_time', start_time)
      .eq('status', 'confirmed')

    if (checkError) throw checkError
    if (existing && existing.length > 0) {
      throw createError({ statusCode: 409, statusMessage: 'Slot is already booked. Please refresh and try another.' })
    }

    // Insert booking
    const { data: booking, error: insertError } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        resource_id,
        start_time,
        end_time: finalEndTime,
        status: 'confirmed'
      })
      .select()
      .single()

    if (insertError) throw insertError

    // TODO: Future Key Fob Integration Webhook
    // await fetch('https://api.keyfob-system.example.com/grant-access', {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${process.env.KEYFOB_API_KEY}` },
    //   body: JSON.stringify({ 
    //      booking_id: booking.id, 
    //      user_email: user.email, 
    //      start: start_time, 
    //      end: finalEndTime 
    //   })
    // })

    return { success: true, booking }
  } catch (err: any) {
    throw createError({ statusCode: err.statusCode || 500, statusMessage: err.statusMessage || err.message })
  }
})
