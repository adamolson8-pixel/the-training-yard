import { VIEW_AS_COOKIE } from '../../utils/auth'

/** DELETE /api/admin/view-as: ends view mode (always allowed; clearing the cookie is harmless). */
export default defineEventHandler((event) => {
  deleteCookie(event, VIEW_AS_COOKIE, { path: '/' })
  return { viewing: null }
})
