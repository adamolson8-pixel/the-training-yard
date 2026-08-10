import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'
import { recordAdminAction } from '../../../utils/adminAudit'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const supabase = serverSupabaseServiceRole(event)
  const body = await readBody(event)

  const { email, password, full_name, phone, role } = body

  if (!email || !password || !full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Email, password, and full name are required.' })
  }

  // Create the auth user bypassing email verification
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name
    }
  })

  if (authError || !authData.user) {
    throw createError({ statusCode: 400, statusMessage: authError?.message || 'Failed to create user.' })
  }

  const userId = authData.user.id

  // Wait a tiny bit to allow the DB trigger to create the profile row
  await new Promise(res => setTimeout(res, 500))

  // Update the profile row that was created by the trigger
  const { error: profileError } = await (supabase as any)
    .from('profiles')
    .update({
      full_name,
      phone: phone || null,
      role: role === 'admin' ? 'admin' : 'customer'
    })
    .eq('id', userId)

  if (profileError) {
    // Attempt insert if the trigger didn't fire
    await (supabase as any).from('profiles').insert({
      id: userId,
      email,
      full_name,
      phone: phone || null,
      role: role === 'admin' ? 'admin' : 'customer'
    })
  }

  await recordAdminAction(supabase, admin.id, 'account.created', 'user', userId, { role: role === 'admin' ? 'admin' : 'customer' })
  return { success: true, user_id: userId }
})
