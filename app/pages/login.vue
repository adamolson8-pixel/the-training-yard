<template>
  <div class="min-h-screen pt-32 pb-20 flex items-center justify-center bg-dark">
    <div class="absolute inset-0 bg-hero-gradient opacity-50"></div>
    
    <div class="relative glass-card p-8 md:p-12 max-w-md w-full mx-4">
      <div class="text-center mb-8">
        <h1 class="heading-lg text-white mb-2">Welcome Back</h1>
        <p class="text-gray-400">Log in to manage your bookings and memberships.</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="athlete@example.com"
          >
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="••••••••"
          >
        </div>

        <div v-if="errorMsg" class="text-primary text-sm bg-primary/10 p-3 rounded-lg">
          {{ errorMsg }}
        </div>
        <div v-if="successMsg" class="text-turf text-sm bg-turf/10 p-3 rounded-lg">
          {{ successMsg }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full btn-primary py-3 flex justify-center items-center"
        >
          <span v-if="loading" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          <span v-else>{{ isSignUp ? 'Sign Up' : 'Log In' }}</span>
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-400">
        <button @click="isSignUp = !isSignUp" class="hover:text-white transition-colors">
          {{ isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// If user is already logged in, redirect them
watchEffect(() => {
  if (user.value) {
    navigateTo('/admin/schedule')
  }
})

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isSignUp.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      successMsg.value = 'Check your email for the confirmation link!'
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      // watchEffect will redirect on success
    }
  } catch (error: any) {
    errorMsg.value = error.message
  } finally {
    loading.value = false
  }
}
</script>
