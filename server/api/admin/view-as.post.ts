import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin, VIEW_AS_COOKIE } from '../../utils/auth'
import { recordAdminAction } from '../../utils/adminAudit'

/**
 * POST /api/admin/view-as { user_id }
 * Starts read-only view mode: the customer portal shows exactly what that
 * account sees until the admin exits (DELETE) or the cookie expires.
 */
export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody(event)
  const userId = String(body?.user_id || '')
  const supabase = serverSupabaseServiceRole(event)
  const { data: viewed } = await (supabase as any).from('profiles').select('id,full_name,email').eq('id', userId).maybeSingle()
  if (!viewed) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })

  setCookie(event, VIEW_AS_COOKIE, viewed.id, {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: 4 * 60 * 60,
  })
  await recordAdminAction(supabase, admin.id, 'user.view_as_started', 'profile', viewed.id, { email: viewed.email })
  return { viewing: { id: viewed.id, full_name: viewed.full_name, email: viewed.email } }
})
