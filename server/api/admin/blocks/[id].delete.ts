import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await (supabase as any)
    .from('blocked_times')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to delete block.' })
  await recordAdminAction(supabase, admin.id, 'block.removed', 'blocked_time', id)
  return { success: true }
})
