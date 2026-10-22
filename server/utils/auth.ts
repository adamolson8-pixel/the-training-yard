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

/** Cookie an admin sets to see the customer portal as another account (read-only). */
export const VIEW_AS_COOKIE = 'tty_view_as'

/**
 * Verifies the current request is from any authenticated user.
 * Throws 401 if not logged in.
 * Returns the user object on success (with normalized `id`).
 *
 * When an admin is viewing the portal as someone else (VIEW_AS_COOKIE), this
 * returns that account instead, flagged with `viewAs`. Changes are blocked for
 * the whole session by server/middleware/view-as.ts.
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

  const viewAsId = getCookie(event, VIEW_AS_COOKIE)
  if (viewAsId && viewAsId !== uid) {
    const viewed = await viewedAccount(event, uid, viewAsId)
    if (viewed) return viewed
  }

  return user
}

/** The account an admin is viewing as, or null if the requester isn't an admin or it doesn't exist. */
async function viewedAccount(event: H3Event, adminId: string, viewAsId: string) {
  const { serverSupabaseServiceRole } = await import('#supabase/server')
  const supabase = serverSupabaseServiceRole(event)
  const { data: admin } = await (supabase as any).from('profiles').select('role').eq('id', adminId).maybeSingle()
  if (admin?.role !== 'admin') return null
  const { data: viewed } = await (supabase as any).from('profiles').select('id,email,full_name').eq('id', viewAsId).maybeSingle()
  if (!viewed) return null
  return { id: viewed.id, email: viewed.email, viewAs: { adminId, fullName: viewed.full_name, email: viewed.email } } as any
}
