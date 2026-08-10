import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../../utils/auth'
import { recordAdminAction } from '../../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const userId = getRouterParam(event, 'id')
  const supabase = serverSupabaseServiceRole(event)
  const { data: profile } = await (supabase as any).from('profiles').select('email').eq('id', userId).maybeSingle()
  if (!profile?.email) throw createError({ statusCode: 404, statusMessage: 'Account not found.' })
  const siteUrl = String(useRuntimeConfig().public.siteUrl || process.env.URL || 'https://trainingyarddsm.com').replace(/\/$/, '')
  const { error } = await supabase.auth.resetPasswordForEmail(profile.email, { redirectTo: `${siteUrl}/reset-password` })
  if (error) throw createError({ statusCode: 500, statusMessage: 'Unable to send the reset email.' })
  await recordAdminAction(supabase, admin.id, 'account.password_reset_sent', 'user', userId)
  return { success: true }
})
