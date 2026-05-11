export default defineNuxtPlugin({
  name: 'pinia-patch',
  enforce: 'pre',
  hooks: {
    'app:rendered'() {
      const nuxtApp = useNuxtApp()
      if (!nuxtApp.$pinia) {
        nuxtApp.$pinia = { state: { value: {} } } as any
      }
    }
  }
})
