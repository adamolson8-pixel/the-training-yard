import { serverSupabaseUser } from '#supabase/server'
import type { H3Event } from 'h3'

/**
 * Verifies the current request is from an authenticated admin.
 * Throws 401 if not logged in, 403 if not admin.
 * Returns the user object on success.
 * @param event The H3 event
 * @param supabase The initialized serverSupabaseClient
 */
export async function requireAdmin(event: H3Event, supabase: any) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized.' })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
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
 * Returns the user object on success.
 */
export async function requireAuth(event: H3Event) {
  const user = await serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized. Please log in.' })
  }
  return user
}
