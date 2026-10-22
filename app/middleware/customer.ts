// Blocks unauthenticated users from /portal/* routes.
// Admins can also access portal routes (they have a customer view too).
// If you want to restrict admins entirely, add a role check here.
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  if (user.value) return

  // On a deep link the session can exist before useSupabaseUser() is hydrated;
  // check it so logged-in members aren't bounced through /login.
  if (import.meta.client) {
    const { data } = await useSupabaseClient().auth.getSession()
    if (data.session?.user) return
  }

  // Come back to the same page after login or sign-up (keeps links like ?team=DUCKS2627)
  return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
})
