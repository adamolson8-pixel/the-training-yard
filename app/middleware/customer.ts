// Blocks unauthenticated users from /portal/* routes.
// Admins can also access portal routes (they have a customer view too).
export default defineNuxtRouteMiddleware(async () => {
  const user = useSupabaseUser()

  if (!user.value) {
    return navigateTo('/login')
  }

  // Both customers and admins may access the portal.
  // If you want to restrict admins entirely, add a role check here.
})
