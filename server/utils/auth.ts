import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Extracts the reliable user ID from serverSupabaseUser result.
 * The Nuxt Supabase module may return the UUID as `id`, `sub`, or `user_id`
 * depending on the version and context.
 */
function getUserId(user: any): string | undefined {
  return user.id || user.sub || user.user_id
}

/**
 * Verifies the current request is from an authenticated admin.
 * Throws 401 if not logged in, 403 if not admin.
 * Returns the user object on success (with normalized `id`).
 * @param event The H3 event
 * @param supabase The initialized serverSupabaseClient
 */
export async function requireAdmin(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized.' })
  }
  
  const { serverSupabaseServiceRole } = await import('#supabase/server')
  const supabase = serverSupabaseServiceRole(event)

  // Normalize id
  const uid = getUserId(user)
  if (uid && !user.id) (user as any).id = uid

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single()

  if (error) {
    console.error("Auth Utility Error checking role:", error)
  }

  if (!profile || profile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden: Admin access required.' })
  }

  return user
}

/**
 * Verifies the current request is from any authenticated user.
 * Throws 401 if not logged in.
 * Returns the user object on success (with normalized `id`).
 */
export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please log in.' })
  }

  // Normalize id — some versions of nuxt-supabase put the UUID in `sub` not `id`
  const uid = getUserId(user)
  if (uid && !user.id) (user as any).id = uid

  if (!uid) {
    console.error('requireAuth: Cannot determine user ID. Keys:', Object.keys(user))
    throw createError({ statusCode: 500, statusMessage: 'Cannot determine user identity.' })
  }

  return user
}
