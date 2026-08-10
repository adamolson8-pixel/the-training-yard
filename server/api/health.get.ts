import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const supabase = serverSupabaseServiceRole(event)
  const { error } = await (supabase as any).from('service_capacity').select('service_id').limit(1)
  const database = error ? 'unavailable' : 'ok'
  setResponseStatus(event, error ? 503 : 200)
  setHeader(event, 'Cache-Control', 'no-store')
  return { status: error ? 'degraded' : 'ok', database, timestamp: new Date().toISOString() }
})
