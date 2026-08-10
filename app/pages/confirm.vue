<template>
  <div class="min-h-screen bg-dark flex items-center justify-center">
    <div class="text-center max-w-md px-6">
      <div v-if="!errorMessage" class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div v-else class="text-4xl mb-4">⚠️</div>
      <p :class="errorMessage ? 'text-red-300' : 'text-gray-400'">{{ errorMessage || 'Confirming your account…' }}</p>
      <NuxtLink v-if="errorMessage" to="/login" class="btn-primary inline-block mt-5">Return to Log In</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Confirming Account | The Training Yard',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const route = useRoute()
const errorMessage = ref('')

onMounted(async () => {
  try {
    const code = typeof route.query.code === 'string' ? route.query.code : ''
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error && !/code verifier/i.test(error.message)) throw error
    }
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') && !route.query.next.startsWith('//')
      ? route.query.next : '/portal/dashboard'
    if (user.value || (await supabase.auth.getSession()).data.session) {
      await navigateTo(next, { replace: true })
      return
    }
    setTimeout(() => {
      if (!user.value) errorMessage.value = 'This confirmation link is invalid or expired. Please log in or request a new link.'
    }, 5000)
  } catch (error: any) {
    errorMessage.value = error?.message || 'We could not confirm your account.'
  }
})
</script>
