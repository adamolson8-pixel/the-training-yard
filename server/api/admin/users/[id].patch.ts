import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAdmin } from '../../../utils/auth'

const ADMIN_ALLOWED_FIELDS = ['role', 'membership_type', 'membership_status', 'membership_start', 'membership_expires', 'waiver_signed', 'waiver_signed_at', 'waiver_override_by', 'full_name', 'phone', 'stripe_customer_id', 'stripe_subscription_id']

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const targetId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  if (!targetId) throw createError({ statusCode: 400, statusMessage: 'User ID required.' })

  const updates: Record<string, any> = {}
  for (const field of ADMIN_ALLOWED_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  // If promoting to admin, record who did it in a note (audit trail)
  if (updates.role === 'admin') {
    console.log(`[AUDIT] Admin ${admin.email} promoted user ${targetId} to admin role`)
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields provided.' })
  }

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', targetId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, statusMessage: 'Failed to update user.' })

  return data
})
