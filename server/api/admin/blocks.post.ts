import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'


export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  const { start_at, end_at, resource_id, reason, all_day } = body

  if (!start_at || !end_at) {
    throw createError({ statusCode: 400, statusMessage: 'start_at and end_at are required.' })
  }

  const { data, error } = await (supabase as any)
    .from('blocked_times')
    .insert({
      start_at,
      end_at,
      resource_id: resource_id || null,  // null = facility-wide
      reason: reason || 'Admin block',
      all_day: all_day || false,
      created_by: admin.id,
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to create block.' })

  return data
})
