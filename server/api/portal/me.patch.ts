import { serverSupabaseServiceRole } from '#supabase/server'
import { requireAuth } from '../../utils/auth'

// Only these fields may be updated by the user themselves
const ALLOWED_FIELDS = ['full_name', 'phone', 'emergency_contact', 'waiver_signed', 'waiver_signed_at', 'dependents'] as const


export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const supabase = serverSupabaseServiceRole(event)

  // Whitelist — never let users update role, membership, stripe IDs, etc.
  const updates: Record<string, string> = {}
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field]
    }
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid fields to update.' })
  }

  const { data, error } = await (supabase as any)
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to update profile.' })
  }

  return data
})
