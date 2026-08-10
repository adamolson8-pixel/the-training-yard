export default defineNuxtRouteMiddleware(async () => {
  // Auth state is restored from the browser session. Avoid redirecting during SSR
  // before the Supabase module has had a chance to hydrate that session.
  if (import.meta.server) return
  const user = useSupabaseUser()
  if (user.value) return
  const supabase = useSupabaseClient()
  const { data } = await supabase.auth.getSession()
  if (!data.session?.user) return navigateTo('/login')
  // Let the backend route (e.g. /api/admin/bookings) enforce actual admin privileges.
  // This avoids tricky SSR hydration mismatch errors with the Supabase client.
})
