<template>
  <!-- Additional hours beyond the team agreement, at the team hourly rate -->
  <div class="rounded-xl border border-white/10 bg-black/20 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-xs font-bold uppercase tracking-widest text-amber-400">Additional Hours</h3>
        <p class="text-gray-300 text-sm mt-1">Need time beyond your team schedule? These are your team rates. Send a request and we'll confirm the time with you.</p>
      </div>
    </div>
    <div class="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div v-for="rate in rates" :key="rate.id" class="rounded-lg bg-white/5 border border-white/10 p-3">
        <div class="text-white font-bold text-sm">{{ rate.label }}</div>
        <div class="mt-1"><span class="text-amber-400 text-xl font-bold">{{ money(rate.cents) }}</span><span class="text-gray-400 text-sm">/hr</span></div>
        <div class="text-gray-500 text-xs mt-1">{{ rate.description }}</div>
      </div>
    </div>

    <button v-if="!open" type="button" class="btn-primary text-sm mt-4" @click="open = true">Request Additional Hours</button>
    <form v-else class="mt-4 grid sm:grid-cols-2 gap-3" @submit.prevent="submit">
      <label class="block">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">What you need</span>
        <select v-model="form.rateId" required class="hours-input w-full [color-scheme:dark]">
          <option v-for="rate in rates" :key="rate.id" :value="rate.id">{{ rate.label }} ({{ money(rate.cents) }}/hr)</option>
        </select>
      </label>
      <label v-if="canAddCages" class="block">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Extra cages</span>
        <select v-model.number="form.extraCages" class="hours-input w-full [color-scheme:dark]">
          <option v-for="n in maxExtraCages + 1" :key="n" :value="n - 1">{{ n - 1 }}{{ n > 1 ? ` (+${money(cageCents * (n - 1))}/hr)` : '' }}</option>
        </select>
      </label>
      <label class="block">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Date</span>
        <input v-model="form.date" type="date" required :min="todayIso" class="hours-input w-full [color-scheme:dark]">
      </label>
      <label class="block">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Start time</span>
        <input v-model="form.time" type="time" required step="1800" class="hours-input w-full [color-scheme:dark]">
      </label>
      <label class="block">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Hours</span>
        <select v-model.number="form.hours" class="hours-input w-full [color-scheme:dark]">
          <option v-for="h in hourOptions" :key="h" :value="h">{{ h }} {{ h === 1 ? 'hour' : 'hours' }}</option>
        </select>
      </label>
      <label class="block sm:col-span-2">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Notes (optional)</span>
        <input v-model="form.notes" type="text" maxlength="1000" class="hours-input w-full" placeholder="e.g. recurring every Tuesday, flexible on time">
      </label>
      <div class="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
        <div class="text-sm text-gray-300">Estimated total: <span class="text-white font-bold text-lg">{{ money(totalCents) }}</span> <span class="text-gray-500 text-xs">({{ money(hourlyCents) }}/hr × {{ form.hours }})</span></div>
        <div class="flex gap-2">
          <button type="button" class="text-gray-400 hover:text-white text-sm px-3" @click="open = false">Cancel</button>
          <button type="submit" class="btn-primary text-sm" :disabled="sending">{{ sending ? 'Sending…' : 'Send Request' }}</button>
        </div>
      </div>
    </form>
    <p v-if="notice" class="text-sm mt-3" :class="noticeError ? 'text-red-300' : 'text-green-300'" role="status">{{ notice }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ teamId: string; rates: { id: string; label: string; description: string; cents: number }[] }>()

const todayIso = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const hourOptions = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8]
const open = ref(false)
const form = reactive({ rateId: props.rates[0]?.id || '', extraCages: 0, date: '', time: '', hours: 1, notes: '' })

const rate = computed(() => props.rates.find(r => r.id === form.rateId))
const cageCents = computed(() => props.rates.find(r => r.id === 'cage')?.cents || 0)
// Extra cages only make sense on the turf options (4 cages total, 1 already in "Turf + 1 cage")
const canAddCages = computed(() => form.rateId === 'turf' || form.rateId === 'turf_cage')
const maxExtraCages = computed(() => (form.rateId === 'turf_cage' ? 3 : 4))
watch(() => form.rateId, () => { if (!canAddCages.value || form.extraCages > maxExtraCages.value) form.extraCages = 0 })
const hourlyCents = computed(() => (rate.value?.cents || 0) + (canAddCages.value ? form.extraCages * cageCents.value : 0))
const totalCents = computed(() => Math.round(hourlyCents.value * form.hours))

const sending = ref(false)
const notice = ref('')
const noticeError = ref(false)
async function submit() {
  sending.value = true; notice.value = ''; noticeError.value = false
  try {
    await $fetch('/api/portal/team', {
      method: 'POST',
      body: { action: 'request-hours', teamId: props.teamId, ...form, extraCages: canAddCages.value ? form.extraCages : 0 },
    })
    notice.value = "Request sent. We'll confirm availability and follow up by email."
    open.value = false
    Object.assign(form, { extraCages: 0, date: '', time: '', hours: 1, notes: '' })
  } catch (error: any) {
    noticeError.value = true
    notice.value = error?.data?.statusMessage || 'Unable to send the request.'
  } finally {
    sending.value = false
  }
}

function money(cents: number) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}` }
</script>

<style scoped>.hours-input { @apply bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500; }</style>
