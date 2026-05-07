import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)

  const { key, value } = body

  if (!key || value === undefined) {
    throw createError({ statusCode: 400, statusMessage: 'Key and value are required' })
  }

  const { data, error } = await (supabase as any)
    .from('system_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update setting' })
  }

  return data
})
