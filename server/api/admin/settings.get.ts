import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await (supabase as any)
    .from('system_settings')
    .select('*')

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to fetch settings' })
  }

  return data
})
