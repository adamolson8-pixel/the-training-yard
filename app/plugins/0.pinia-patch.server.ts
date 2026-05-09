export default defineNuxtPlugin({
  name: 'pinia-patch',
  enforce: 'post',
  setup(nuxtApp) {
    nuxtApp.hook('app:rendered', () => {
      // Netlify prerendering bug workaround: 
      // If a 500 error happens early in SSR (e.g. from missing Supabase env vars),
      // the pinia plugin's setup might be skipped or fail, leaving $pinia undefined.
      // This causes the error handler itself to crash with "Cannot read properties of undefined (reading 'state')",
      // completely masking the true error. We inject a dummy $pinia here just for the error page render.
      if (!nuxtApp.$pinia) {
        nuxtApp.$pinia = { state: { value: {} } }
      }
    })
  }
})
