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

  const startStr = windowStart.toISOString().split('T')[0]
  const endStr = windowEnd.toISOString().split('T')[0]

  const { data: bookings, error } = await (supabase as any)
    .from('bookings')
    .select('*, profiles(full_name, email)')
    .eq('status', 'confirmed')
    .gte('booking_date', startStr)
    .lte('booking_date', endStr)
    .is('reminder_sent_at', null)   // Only send once

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'DB error fetching bookings.' })
  }

  const results: { id: string; sent: boolean }[] = []

  for (const booking of bookings ?? []) {
    try {
      const enriched = {
        ...booking,
        customer_name: booking.profiles?.full_name || booking.customer_name || 'Customer',
        customer_email: booking.profiles?.email || booking.customer_email,
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
