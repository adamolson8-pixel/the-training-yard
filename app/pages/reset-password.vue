<template>
  <div class="min-h-screen pt-32 pb-20 flex items-center justify-center bg-dark">
    <div class="glass-card p-8 md:p-12 max-w-md w-full mx-4">
      <h1 class="heading-lg text-white mb-2">Choose a New Password</h1>
      <p class="text-gray-400 mb-8">Use at least eight characters.</p>
      <form @submit.prevent="updatePassword" class="space-y-5">
        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-300 mb-2">New Password</label>
          <input id="newPassword" v-model="password" type="password" minlength="8" required autocomplete="new-password" class="form-input">
        </div>
        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
          <input id="confirmPassword" v-model="confirmation" type="password" minlength="8" required autocomplete="new-password" class="form-input">
        </div>
        <p v-if="message" :class="success ? 'text-green-400' : 'text-red-400'" class="text-sm">{{ message }}</p>
        <button type="submit" :disabled="loading" class="btn-primary w-full">{{ loading ? 'Updating...' : 'Update Password' }}</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Reset Password | The Training Yard', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const supabase = useSupabaseClient()
const password = ref('')
const confirmation = ref('')
const loading = ref(false)
const success = ref(false)
const message = ref('')

async function updatePassword() {
  message.value = ''
  success.value = false
  if (password.value !== confirmation.value) {
    message.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: password.value })
    if (error) throw error
    success.value = true
    message.value = 'Password updated. Redirecting to your portal…'
    setTimeout(() => navigateTo('/portal/dashboard'), 800)
  } catch (error: any) {
    message.value = error.message || 'Unable to update your password. Request a new reset link.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-input { @apply w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500; }
</style>
