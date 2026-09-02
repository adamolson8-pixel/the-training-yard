import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/auth'
import { recordAdminAction } from '../../../../utils/adminAudit'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const recurrenceId = getRouterParam(event, 'id') || ''
  if (!UUID_PATTERN.test(recurrenceId)) throw createError({ statusCode: 400, statusMessage: 'Invalid series id.' })
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await (supabase as any)
    .from('blocked_times')
    .delete()
    .eq('recurrence_id', recurrenceId)
    .select('id')

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to delete the series.' })
  if (!data?.length) throw createError({ statusCode: 404, statusMessage: 'That series no longer exists.' })

  await recordAdminAction(supabase, admin.id, 'block.series_removed', 'blocked_time', recurrenceId, { removed: data.length })
  return { success: true, removed: data.length }
})
