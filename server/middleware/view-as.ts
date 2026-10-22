import { VIEW_AS_COOKIE } from '../utils/auth'

/**
 * While an admin is viewing the portal as another account, nothing can be
 * changed: block every non-GET request outside the admin API (bookings,
 * checkouts, waivers, profile edits, membership sync, ...). Admin pages keep
 * working, including the endpoint that ends view mode.
 */
export default defineEventHandler((event) => {
  if (!getCookie(event, VIEW_AS_COOKIE)) return
  const method = event.method.toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return
  const path = event.path || ''
  if (!path.startsWith('/api/') || path.startsWith('/api/admin/') || path.startsWith('/api/stripe/webhook') || path.startsWith('/api/cron/')) return
  throw createError({
    statusCode: 403,
    statusMessage: "Read-only: you're viewing the portal as another account. Exit view mode to make changes.",
    message: "Read-only: you're viewing the portal as another account. Exit view mode to make changes.",
  })
})
