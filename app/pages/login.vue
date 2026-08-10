<template>
  <div class="min-h-screen pt-32 pb-20 flex items-center justify-center bg-dark">
    <div class="absolute inset-0 bg-hero-gradient opacity-50"></div>
    
    <div class="relative glass-card p-8 md:p-12 max-w-md w-full mx-4">
      <div class="text-center mb-8">
        <h1 class="heading-lg text-white mb-2">{{ isSignUp ? 'Create an Account' : 'Welcome Back' }}</h1>
        <p class="text-gray-400">{{ isSignUp ? 'Join The Training Yard to manage bookings.' : 'Log in to manage your bookings and memberships.' }}</p>
      </div>

      <form v-if="!isForgotPassword" @submit.prevent="handleLogin" class="space-y-6">
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
            minlength="8"
            :autocomplete="isSignUp ? 'new-password' : 'current-password'"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="••••••••"
          >
        </div>

        <div v-if="isSignUp">
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            autocomplete="new-password"
            class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
            placeholder="••••••••"
          >
        </div>

        <label v-if="isSignUp" class="flex items-start gap-3 text-sm text-gray-300 cursor-pointer">
          <input v-model="acceptedTerms" type="checkbox" required class="mt-1 w-4 h-4 accent-red-500">
          <span>I agree to the <NuxtLink to="/terms" class="text-amber-400 hover:underline" target="_blank">Terms of Use</NuxtLink> and acknowledge the <NuxtLink to="/privacy" class="text-amber-400 hover:underline" target="_blank">Privacy Policy</NuxtLink>.</span>
        </label>

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

      <form v-else @submit.prevent="sendPasswordReset" class="space-y-6">
        <div>
          <label for="resetEmail" class="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
          <input id="resetEmail" v-model="email" type="email" required autocomplete="email" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="athlete@example.com">
        </div>
        <div v-if="errorMsg" class="text-primary text-sm bg-primary/10 p-3 rounded-lg">{{ errorMsg }}</div>
        <div v-if="successMsg" class="text-turf text-sm bg-turf/10 p-3 rounded-lg">{{ successMsg }}</div>
        <button type="submit" :disabled="loading" class="w-full btn-primary py-3">{{ loading ? 'Sending...' : 'Send Reset Link' }}</button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-400">
        <button v-if="!isForgotPassword" @click="toggleAuthMode" class="hover:text-white transition-colors">
          {{ isSignUp ? 'Already have an account? Log in' : 'Need an account? Sign up' }}
        </button>
        <button v-if="!isSignUp && !isForgotPassword" @click="isForgotPassword = true" class="block mx-auto mt-3 text-amber-400 hover:text-amber-300">Forgot your password?</button>
        <button v-if="isForgotPassword" @click="isForgotPassword = false" class="hover:text-white transition-colors">← Back to log in</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Log In | The Training Yard',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const route = useRoute()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const acceptedTerms = ref(false)
const isSignUp = ref(route.query.signup === 'true')
const isForgotPassword = ref(false)
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
}, { immediate: true })

onMounted(() => {
  // Prerendered /login does not see query parameters at build time.
  isSignUp.value = route.query.signup === 'true'
})

function toggleAuthMode() {
  isSignUp.value = !isSignUp.value
  errorMsg.value = ''
  successMsg.value = ''
  confirmPassword.value = ''
  acceptedTerms.value = false
  router.replace({ query: { ...route.query, signup: isSignUp.value ? 'true' : undefined } })
}

// Role-based redirect on login
watchEffect(async () => {
  if (!user.value) return

  try {
    const userId = (user.value as any).id || (user.value as any).sub || (user.value as any).user_id
    if (!userId) return
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    let redirectPath = route.query.redirect as string
    if (redirectPath && redirectPath.startsWith('/login')) {
      redirectPath = ''
    }
    
    if (error) {
      console.error("Failed to fetch role in login watchEffect:", error)
      router.push(redirectPath || '/portal/dashboard')
      return
    }

    if (profile?.role === 'admin') {
      router.push(redirectPath || '/admin/schedule')
    } else {
      router.push(redirectPath || '/portal/dashboard')
    }
  } catch (err) {
    console.error("Exception in watchEffect:", err)
    router.push(route.query.redirect as string || '/portal/dashboard')
  }
})

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (isSignUp.value) {
      if (password.value.length < 8) throw new Error('Password must be at least 8 characters.')
      if (password.value !== confirmPassword.value) throw new Error('Passwords do not match.')
      if (!acceptedTerms.value) throw new Error('Please accept the Terms of Use and Privacy Policy.')
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm${route.query.redirect ? `?next=${encodeURIComponent(String(route.query.redirect))}` : ''}`,
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

const sendPasswordReset = async () => {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
    successMsg.value = 'If an account exists for that email, a password reset link is on its way.'
  } catch (error: any) {
    errorMsg.value = error.message || 'Unable to send the reset link. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>
