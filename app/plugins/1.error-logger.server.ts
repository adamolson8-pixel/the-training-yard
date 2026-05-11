export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:error', (error) => {
    console.error('=============================================')
    console.error('[NUXT SSR ERROR CAUGHT]:', error)
    if (error.stack) console.error(error.stack)
    console.error('=============================================')
  })
  nuxtApp.hook('vue:error', (error) => {
    console.error('=============================================')
    console.error('[VUE SSR ERROR CAUGHT]:', error)
    console.error('=============================================')
  })
})
