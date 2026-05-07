export default defineNuxtRouteMiddleware((to, from) => {
  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
  // Let the backend route (e.g. /api/admin/bookings) enforce actual admin privileges.
  // This avoids tricky SSR hydration mismatch errors with the Supabase client.
})
