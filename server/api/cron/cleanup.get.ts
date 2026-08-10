import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const cronSecret = config.cronSecret || process.env.CRON_SECRET
  if (!cronSecret || getHeader(event, 'authorization') !== `Bearer ${cronSecret}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const supabase = serverSupabaseServiceRole(event)
  const { data, error } = await (supabase as any).from('bookings').update({
    status: 'expired', payment_status: 'failed', updated_at: new Date().toISOString(),
  }).eq('status', 'pending').lt('hold_expires_at', new Date().toISOString()).select('id')
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to release expired holds.' })
  return { released: data?.length || 0 }
})
