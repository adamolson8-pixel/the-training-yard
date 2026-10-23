/**
 * GET /api/cron/reminders
 *
 * Sends 24-hour session reminder emails to customers.
 * Run this via a cron job / Netlify scheduled function every hour.
 *
 * Security: protected by CRON_SECRET header check.
 * Add to Netlify: netlify/functions/reminders-cron.ts
 */
import { serverSupabaseServiceRole } from '#supabase/server'
import { sendBookingReminder } from '../../utils/email'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Simple shared-secret guard — set CRON_SECRET in your env
  const authHeader = getHeader(event, 'authorization')
  const cronSecret = config.cronSecret || process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const supabase = serverSupabaseServiceRole(event)
  const now = new Date()

  // Find bookings starting between 23 and 25 hours from now
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

  const { data: bookings, error } = await (supabase as any)
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .gte('start_at', windowStart.toISOString())
    .lte('start_at', windowEnd.toISOString())
    .is('reminder_sent_at', null)   // Only send once

  if (error) {
    console.error('[reminder] Booking lookup failed:', error)
    throw createError({ statusCode: 500, statusMessage: 'DB error fetching bookings.' })
  }

  // Customer names/emails from profiles (bookings.user_id points at auth.users, so no embed)
  const userIds = [...new Set((bookings ?? []).map((b: any) => b.user_id).filter(Boolean))]
  const { data: profiles } = userIds.length
    ? await (supabase as any).from('profiles').select('id,full_name,email').in('id', userIds)
    : { data: [] }
  const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  const results: { id: string; sent: boolean }[] = []

  for (const booking of bookings ?? []) {
    try {
      const profile: any = profileById.get(booking.user_id)
      const enriched = {
        ...booking,
        customer_name: profile?.full_name || booking.customer_name || 'Customer',
        customer_email: profile?.email || booking.customer_email,
      }
      await sendBookingReminder(enriched)

      // Mark reminder sent (requires reminder_sent_at column — see note below)
      await (supabase as any)
        .from('bookings')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', booking.id)

      results.push({ id: booking.id, sent: true })
    } catch (err: any) {
      console.error(`[reminder] Failed for booking ${booking.id}:`, err.message)
      results.push({ id: booking.id, sent: false })
    }
  }

  return { processed: results.length, results }
})
