/**
 * While an admin is viewing the portal as another account, nothing can be
 * changed: block every non-GET request outside the admin API (bookings,
 * checkouts, waivers, profile edits, membership sync, ...). Admin pages keep
 * working, including the endpoint that ends view mode.
 *
 * Keep this file free of imports from server/utils: middleware is bundled into
 * the server entry, and pulling the utils in there breaks the lib/*.mjs
 * imports during prerender.
 */
const VIEW_AS_COOKIE = 'tty_view_as' // same name as in server/utils/auth.ts

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
