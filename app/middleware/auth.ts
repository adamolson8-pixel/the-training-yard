// Redirects any unauthenticated user to /login
export default defineNuxtRouteMiddleware(() => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
})
