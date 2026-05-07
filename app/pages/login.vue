<template>
  <div class="min-h-screen pt-32 pb-20 flex items-center justify-center bg-dark">
    <div class="absolute inset-0 bg-hero-gradient opacity-50"></div>
    
    <div class="relative glass-card p-8 md:p-12 max-w-md w-full mx-4">
      <div class="text-center mb-8">
        <h1 class="heading-lg text-white mb-2">{{ isSignUp ? 'Create an Account' : 'Welcome Back' }}</h1>
        <p class="text-gray-400">{{ isSignUp ? 'Join The Training Yard to manage bookings.' : 'Log in to manage your bookings and memberships.' }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <div v-if="isSignUp">
          <label for="fullName" class="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
          <input
            id="fullName"
            v-model="fullName"
            type="text"
            :required="isSignUp"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="John Doe"
          >
        </div>

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
          <label for="password" class="block text-sm font-medium text-gray-300 mb-2">{{ isSignUp ? 'Create a Password' : 'Password' }}</label>
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

const route = useRoute()

const fullName = ref('')
const email = ref('')
const password = ref('')
const isSignUp = ref(route.query.signup === 'true')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// React to URL changes if the user clicks between Log In and Sign Up in the header
// without leaving the page (since the component doesn't remount)
watch(() => route.query.signup, (newVal) => {
  if (newVal === 'true') {
    isSignUp.value = true
  } else if (newVal === undefined || newVal === 'false') {
    isSignUp.value = false
  }
})

// Role-based redirect on login
watchEffect(async () => {
  if (!user.value) return

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.value.id)
      .single()

    if (error) {
      console.error("Failed to fetch role in login watchEffect:", error)
      return
    }

    if (profile?.role === 'admin') {
      navigateTo('/admin/schedule')
    } else if (profile?.role === 'customer') {
      navigateTo('/portal/dashboard')
    }
  } catch (err) {
    console.error("Exception in watchEffect:", err)
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
        options: {
          data: {
            full_name: fullName.value
          }
        }
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
