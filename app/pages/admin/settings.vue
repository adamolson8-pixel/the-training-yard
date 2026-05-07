<template>
  <div class="p-6 md:p-8 max-w-3xl">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Settings</h1>
      <p class="text-gray-500 text-sm mt-0.5">System configuration for The Training Yard.</p>
    </div>

    <!-- Operating Hours -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
      <h2 class="font-bold text-gray-800 mb-1">Operating Hours</h2>
      <p class="text-gray-400 text-xs mb-5">These hours control which time slots appear in the booking wizard.</p>
      <div class="space-y-3">
        <div v-for="day in days" :key="day.key" class="flex items-center gap-4">
          <div class="w-24 text-sm font-medium text-gray-700">{{ day.label }}</div>
          <label class="flex items-center gap-2 cursor-pointer">
            <div class="relative">
              <input type="checkbox" v-model="hours[day.key].open" class="sr-only peer" />
              <div class="w-9 h-5 bg-gray-200 peer-checked:bg-green-500 rounded-full transition-colors" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <span class="text-xs text-gray-500">{{ hours[day.key].open ? 'Open' : 'Closed' }}</span>
          </label>
          <template v-if="hours[day.key].open">
            <input type="time" v-model="hours[day.key].start" class="border border-gray-200 rounded-lg px-2 py-1 text-sm" style="color-scheme:light" />
            <span class="text-gray-400 text-sm">to</span>
            <input type="time" v-model="hours[day.key].end" class="border border-gray-200 rounded-lg px-2 py-1 text-sm" style="color-scheme:light" />
          </template>
          <span v-else class="text-gray-300 text-sm italic">Closed all day</span>
        </div>
      </div>
      <div v-if="hoursSaved" class="mt-4 text-green-600 text-xs font-semibold">✓ Hours saved.</div>
      <button @click="saveHours" class="mt-5 px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors">Save Hours</button>
    </div>

    <!-- Email Notification Templates (Resend prep) -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
      <h2 class="font-bold text-gray-800 mb-1">Email Notification Templates</h2>
      <p class="text-gray-400 text-xs mb-5">Customize the copy sent via Resend for system emails. Use <code class="bg-gray-100 px-1 rounded">{'{{name}}'}</code>, <code class="bg-gray-100 px-1 rounded">{'{{date}}'}</code>, <code class="bg-gray-100 px-1 rounded">{'{{service}}'}</code> as placeholders.</p>
      <div class="space-y-5">
        <div v-for="tpl in templates" :key="tpl.key">
          <label class="block text-sm font-semibold text-gray-700 mb-1">{{ tpl.label }}</label>
          <textarea v-model="tpl.body" rows="4"
            class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none font-mono"
          />
        </div>
      </div>
      <div v-if="tplSaved" class="mt-4 text-green-600 text-xs font-semibold">✓ Templates saved (will take effect on next deployment).</div>
      <button @click="saveTemplates" class="mt-5 px-5 py-2 bg-gray-900 hover:bg-gray-700 text-white text-sm font-bold rounded-xl transition-colors">Save Templates</button>
    </div>

    <!-- Environment Status -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <h2 class="font-bold text-gray-800 mb-4">Environment Status</h2>
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span class="text-gray-600 font-medium">Stripe Mode</span>
          <span class="font-bold" :class="stripeTestMode ? 'text-amber-500' : 'text-green-600'">
            {{ stripeTestMode ? '🟡 Test Mode' : '🟢 Live Mode' }}
          </span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span class="text-gray-600 font-medium">Supabase</span>
          <span class="text-green-600 font-bold">🟢 Connected</span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span class="text-gray-600 font-medium">Zoho Sign</span>
          <span class="font-bold" :class="zohoConfigured ? 'text-green-600' : 'text-gray-400'">
            {{ zohoConfigured ? '🟢 Configured' : '⚪ Not Set' }}
          </span>
        </div>
        <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50">
          <span class="text-gray-600 font-medium">SMTP / Email</span>
          <span class="text-green-600 font-bold">🟢 Zoho SMTP</span>
        </div>
      </dl>
      <p class="text-gray-400 text-xs mt-4">To change modes or keys, update your <code class="bg-gray-100 px-1 rounded">.env</code> file and redeploy.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Settings — Admin' })

const config = useRuntimeConfig()
const stripeTestMode = computed(() => (config as any).public?.stripeTestMode === 'true' || false)
const zohoConfigured = computed(() => !!(config as any).public?.zohoSignUrl)

const days = [
  { key: 'mon', label: 'Monday' }, { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' }, { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' }, { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const hours = reactive<Record<string, { open: boolean; start: string; end: string }>>({
  mon: { open: true, start: '06:00', end: '22:00' },
  tue: { open: true, start: '06:00', end: '22:00' },
  wed: { open: true, start: '06:00', end: '22:00' },
  thu: { open: true, start: '06:00', end: '22:00' },
  fri: { open: true, start: '06:00', end: '22:00' },
  sat: { open: true, start: '07:00', end: '20:00' },
  sun: { open: false, start: '09:00', end: '17:00' },
})
const hoursSaved = ref(false)
const isSavingHours = ref(false)
async function saveHours() {
  isSavingHours.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'POST',
      body: { key: 'operating_hours', value: hours }
    })
    hoursSaved.value = true
    setTimeout(() => { hoursSaved.value = false }, 2500)
  } catch (err) {
    console.error('Failed to save hours:', err)
    alert('Failed to save hours. Make sure to run the Phase 4 database migration first.')
  } finally {
    isSavingHours.value = false
  }
}

const templates = reactive([
  {
    key: 'booking_confirm',
    label: 'Booking Confirmation',
    body: `Hi {{name}},\n\nYour session at The Training Yard is confirmed!\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nSee you on the field!\n— The Training Yard Team`,
  },
  {
    key: 'booking_reminder',
    label: 'Session Reminder (24 hrs before)',
    body: `Hi {{name}},\n\nReminder: You have a session tomorrow at The Training Yard.\n\n📅 Date: {{date}}\n⚾ Service: {{service}}\n\nQuestions? Reply to this email.\n— The Training Yard Team`,
  },
  {
    key: 'booking_cancel',
    label: 'Cancellation Confirmation',
    body: `Hi {{name}},\n\nYour session on {{date}} has been cancelled. If a refund is due, allow 5–10 business days to appear.\n\nWe hope to see you again soon!\n— The Training Yard Team`,
  },
])
const tplSaved = ref(false)
const isSavingTpl = ref(false)
async function saveTemplates() {
  isSavingTpl.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'POST',
      body: { key: 'email_templates', value: templates }
    })
    tplSaved.value = true
    setTimeout(() => { tplSaved.value = false }, 2500)
  } catch (err) {
    console.error('Failed to save templates:', err)
    alert('Failed to save templates. Make sure to run the Phase 4 database migration first.')
  } finally {
    isSavingTpl.value = false
  }
}

onMounted(async () => {
  try {
    const data = await $fetch('/api/admin/settings')
    if (data && Array.isArray(data)) {
      const hoursData = data.find((row: any) => row.key === 'operating_hours')
      if (hoursData && hoursData.value) {
        Object.assign(hours, hoursData.value)
      }
      const tplData = data.find((row: any) => row.key === 'email_templates')
      if (tplData && tplData.value && Array.isArray(tplData.value)) {
        tplData.value.forEach((t: any) => {
          const match = templates.find(temp => temp.key === t.key)
          if (match) match.body = t.body
        })
      }
    }
  } catch (e) {
    console.error('Could not load settings:', e)
  }
})
</script>
