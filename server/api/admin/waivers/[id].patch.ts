import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const targetId = getRouterParam(event, 'id')  // profile ID
  const supabase = serverSupabaseServiceRole(event)

  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'User ID required.' })

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({
      waiver_signed: true,
      waiver_signed_at: new Date().toISOString(),
      waiver_override_by: admin.id,
    })
    .eq('id', targetId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to update waiver status.' })

  return data
})
