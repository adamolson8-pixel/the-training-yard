<template>
  <div class="p-6 md:p-10 max-w-2xl mx-auto w-full">

    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Profile Settings</h1>
      <p class="text-gray-400 mt-1">Update your contact information and preferences.</p>
    </div>

    <div v-if="pending" class="text-gray-500 text-center py-12">Loading...</div>

    <div v-else class="space-y-6">

      <!-- Account Info (read-only) -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Account</div>
        <div class="space-y-3">
          <div>
            <label class="text-xs text-gray-500 font-semibold">Email Address</label>
            <div class="text-white text-sm mt-1">{{ user?.email }}</div>
            <div class="text-gray-600 text-xs mt-0.5">Contact support to change your email.</div>
          </div>
          <div>
            <label class="text-xs text-gray-500 font-semibold">Account Type</label>
            <div class="mt-1">
              <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{{ profile?.role ?? 'customer' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Editable Profile -->
      <form @submit.prevent="saveProfile" class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Personal Info</div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
          <input v-model="form.full_name" type="text" placeholder="Jane Smith" class="form-input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
          <input v-model="form.phone" type="tel" placeholder="515-000-0000" class="form-input" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Emergency Contact</label>
          <input v-model="form.emergency_contact" type="text" placeholder="Name — Phone Number" class="form-input" />
        </div>

        <div v-if="saveError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{{ saveError }}</div>
        <div v-if="saveSuccess" class="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✓ Profile updated successfully.</div>

        <button type="submit" class="btn-primary w-full" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </form>

      <!-- Family & Dependents -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <div class="text-xs font-bold uppercase tracking-widest text-gray-500">Family & Dependents</div>
          <button @click="addDependent" class="text-xs text-amber-400 font-semibold hover:text-amber-300">
            + Add Dependent
          </button>
        </div>

        <div v-if="!form.dependents.length" class="text-sm text-gray-500 text-center py-4">
          No family members added yet. Add your children here so they are covered by your liability waiver.
        </div>

        <div v-else class="space-y-3">
          <div v-for="(dep, idx) in form.dependents" :key="idx" class="flex items-start gap-3 p-3 rounded-xl bg-gray-900 border border-white/5 relative group">
            <div class="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[10px] uppercase text-gray-500 mb-1">Full Name</label>
                <input v-model="dep.name" type="text" class="w-full bg-transparent border-b border-white/10 text-sm text-white px-1 py-1 focus:outline-none focus:border-amber-500" placeholder="e.g. John Doe Jr" />
              </div>
              <div>
                <label class="block text-[10px] uppercase text-gray-500 mb-1">Age</label>
                <input v-model="dep.age" type="number" class="w-full bg-transparent border-b border-white/10 text-sm text-white px-1 py-1 focus:outline-none focus:border-amber-500" placeholder="e.g. 12" />
              </div>
              <div>
                <label class="block text-[10px] uppercase text-gray-500 mb-1">Relation</label>
                <input v-model="dep.relation" type="text" class="w-full bg-transparent border-b border-white/10 text-sm text-white px-1 py-1 focus:outline-none focus:border-amber-500" placeholder="e.g. Son" />
              </div>
            </div>
            <button @click="removeDependent(idx)" class="text-red-400 opacity-50 hover:opacity-100 transition-opacity p-2 text-xs font-bold" title="Remove Dependent">
              ✕
            </button>
          </div>
          <button @click="saveProfile" class="btn-primary w-full mt-4" :disabled="saving">
            {{ saving ? 'Saving...' : 'Save Dependents' }}
          </button>
        </div>
      </div>

      <!-- Change Password -->
      <form @submit.prevent="changePassword" class="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
        <div class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Change Password</div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
          <input v-model="newPassword" type="password" placeholder="••••••••" class="form-input" autocomplete="new-password" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
          <input v-model="confirmPassword" type="password" placeholder="••••••••" class="form-input" autocomplete="new-password" />
        </div>

        <div v-if="passwordError" class="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">✓ Password updated.</div>

        <button type="submit" class="btn-primary w-full" :disabled="changingPassword">
          {{ changingPassword ? 'Updating...' : 'Update Password' }}
        </button>
      </form>

      <!-- Notification Preferences -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Notification Preferences</div>
        <div class="space-y-3">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-gray-300">Booking confirmation emails</span>
            <span class="text-xs text-gray-500">Always on</span>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-gray-300">Session reminder (24 hrs before)</span>
            <div class="relative">
              <input type="checkbox" v-model="notifyReminders" class="sr-only peer" />
              <div class="w-10 h-5 bg-gray-700 peer-checked:bg-amber-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-amber-500/30 cursor-pointer" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-sm text-gray-300">Membership renewal reminders</span>
            <div class="relative">
              <input type="checkbox" v-model="notifyMembership" class="sr-only peer" />
              <div class="w-10 h-5 bg-gray-700 peer-checked:bg-amber-500 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-amber-500/30 cursor-pointer" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Profile Settings — Training Yard' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { data: profile, pending, refresh } = await useFetch<any>('/api/portal/me')

// Form state — initialized after fetch
const form = reactive({
  full_name: '',
  phone: '',
  emergency_contact: '',
  dependents: [] as Array<{ name: string, age: string, relation: string }>,
})

// Pre-fill when data loads
watch(profile, (p) => {
  if (p) {
    form.full_name = p.full_name ?? ''
    form.phone = p.phone ?? ''
    form.emergency_contact = p.emergency_contact ?? ''
    form.dependents = JSON.parse(JSON.stringify(p.dependents ?? []))
  }
}, { immediate: true })

function addDependent() {
  form.dependents.push({ name: '', age: '', relation: '' })
}

function removeDependent(index: number) {
  form.dependents.splice(index, 1)
}

const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

async function saveProfile() {
  saving.value = true
  saveError.value = ''
  saveSuccess.value = false
  try {
    await $fetch('/api/portal/me', { method: 'PATCH', body: { ...form } })
    saveSuccess.value = true
    await refresh()
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e?.data?.statusMessage || 'Failed to save changes.'
  } finally {
    saving.value = false
  }
}

// Password change
const newPassword = ref('')
const confirmPassword = ref('')
const changingPassword = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

async function changePassword() {
  passwordError.value = ''
  passwordSuccess.value = false
  if (newPassword.value.length < 8) {
    passwordError.value = 'Password must be at least 8 characters.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'Passwords do not match.'
    return
  }
  changingPassword.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    passwordSuccess.value = true
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => { passwordSuccess.value = false }, 3000)
  } catch (e: any) {
    passwordError.value = e?.message || 'Failed to update password.'
  } finally {
    changingPassword.value = false
  }
}

// Notification preferences (UI only — wire to DB in Phase 4)
const notifyReminders = ref(true)
const notifyMembership = ref(true)
</script>

<style scoped>
.form-input {
  @apply w-full bg-gray-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors
    placeholder-gray-600;
}
</style>
