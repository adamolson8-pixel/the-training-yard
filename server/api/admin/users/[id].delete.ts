import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const userId = getRouterParam(event, 'id')
  if (!userId || userId === admin.id) throw createError({ statusCode: 400, statusMessage: 'You cannot delete your own administrator account.' })
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await (supabase as any).from('profiles').select('email,role').eq('id', userId).maybeSingle()
  if (!profile) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  if (String(body.confirm_email || '').trim().toLowerCase() !== String(profile.email).toLowerCase()) {
    throw createError({ statusCode: 400, statusMessage: 'Enter the account email exactly to confirm deletion.' })
  }
  if (profile.role === 'admin') {
    const { count } = await (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin')
    if ((count || 0) <= 1) throw createError({ statusCode: 400, statusMessage: 'The final administrator account cannot be deleted.' })
  }
  await recordAdminAction(supabase, admin.id, 'account.deleted', 'user', userId, { email: profile.email })
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to delete the account.' })
  return { success: true }
})
