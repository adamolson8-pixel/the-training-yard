import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)

  const { error } = await (supabase as any)
    .from('blocked_times')
    .delete()
    .eq('id', id)

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to delete block.' })
  return { success: true }
})
