// Redirects any unauthenticated user to /login
export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return
  const user = useSupabaseUser()
  if (user.value) return
  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return navigateTo('/login')
})
