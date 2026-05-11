export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()
  
  nuxtApp.hook('app:error', (error) => {
    console.error('=============================================')
    console.error('[NUXT SSR ERROR CAUGHT]:', error)
    if (error.stack) console.error(error.stack)
    if (error.cause) console.error('CAUSE:', error.cause)
    
    console.error('--- DEBUG ENVIRONMENT INFO ---')
    console.error('public.supabase.url:', config.public?.supabase?.url ? 'PRESENT' : 'MISSING OR EMPTY')
    console.error('public.supabase.key:', config.public?.supabase?.key ? 'PRESENT' : 'MISSING OR EMPTY')
    console.error('NUXT_PUBLIC_SUPABASE_URL env:', process.env.NUXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING OR EMPTY')
    console.error('=============================================')
  })
})
