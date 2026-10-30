<template>
  <div class="glass-card p-6 md:p-8 space-y-7">
    <p v-if="cancelled" class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">Checkout was cancelled and the time was released. Pick a time to try again.</p>

    <!-- Team (only when the account manages more than one) -->
    <div v-if="teams.length > 1">
      <label class="step-label" for="team-select">Team</label>
      <select id="team-select" v-model="teamId" class="form-input max-w-sm">
        <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
      </select>
    </div>

    <!-- 1. What -->
    <div>
      <div class="step-label">1. What do you need?</div>
      <div class="grid sm:grid-cols-2 gap-3">
        <button
          v-for="opt in options"
          :key="opt.id"
          type="button"
          class="text-left p-4 rounded-xl border-2 transition-all"
          :class="option === opt.id ? 'border-amber-500 bg-amber-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'"
          @click="setOption(opt.id)"
        >
          <div class="font-bold text-white text-sm">{{ opt.label }}</div>
          <div class="mt-1"><span class="text-amber-400 text-xl font-bold">{{ money(opt.cents) }}</span><span class="text-gray-400 text-sm">/hr{{ opt.id === 'cages' ? ' per cage' : '' }}</span></div>
          <div class="text-gray-400 text-xs mt-1">{{ opt.description }}</div>
        </button>
      </div>
      <div class="mt-4 flex flex-wrap gap-6">
        <label class="block">
          <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">{{ option === 'turf_cage' ? 'Extra cages' : 'Cages' }}</span>
          <select v-model.number="cages" class="form-input w-40">
            <option v-for="n in cageChoices" :key="n" :value="n">{{ option === 'turf_cage' ? (n ? `+${n} (+${money(n * cageCents)}/hr)` : 'None') : `${n} cage${n > 1 ? 's' : ''}` }}</option>
          </select>
        </label>
        <label class="block">
          <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Length</span>
          <select v-model.number="hours" class="form-input w-40">
            <option v-for="h in hourChoices" :key="h" :value="h">{{ h }} hour{{ h > 1 ? 's' : '' }}</option>
          </select>
        </label>
      </div>
    </div>

    <!-- 2. When -->
    <div>
      <div class="step-label">2. Pick a date and start time</div>
      <input v-model="date" type="date" :min="minDate" :max="maxDate" class="form-input max-w-xs">
      <p class="text-gray-500 text-xs mt-2">Team bookings open up to {{ horizonDays }} days in advance. Only open times are shown.</p>
      <div v-if="loadingSlots" class="text-gray-300 text-sm mt-4" role="status">Checking live availability…</div>
      <p v-else-if="slotsError" class="text-red-300 text-sm mt-4" role="alert">{{ slotsError }} <button class="underline ml-1" type="button" @click="loadSlots">Try again</button></p>
      <div v-else-if="date && openSlots.length" class="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-4">
        <button
          v-for="slot in openSlots"
          :key="slot"
          type="button"
          class="py-2 px-3 text-sm rounded-lg border-2 font-medium transition-all"
          :class="time === slot ? 'bg-amber-500 text-black border-amber-500 font-bold' : 'border-white/10 text-gray-300 hover:border-amber-500/50 bg-white/5'"
          @click="time = slot"
        >{{ slot }}</button>
      </div>
      <p v-else-if="date" class="text-gray-400 text-sm mt-4">No open times for this setup on that date. Try fewer cages, a shorter session, or another day.</p>
    </div>

    <!-- 3. Review -->
    <div>
      <div class="step-label">3. Review and pay</div>
      <label class="block mb-4">
        <span class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1">Notes (optional)</span>
        <input v-model="notes" type="text" maxlength="1000" class="form-input" placeholder="Anything we should know">
      </label>
      <div class="rounded-xl bg-white/5 border border-white/10 p-4 text-sm space-y-2">
        <div class="flex justify-between"><span class="text-gray-400">Booking</span><span class="text-white font-semibold">{{ summaryLabel }}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">When</span><span class="text-white font-semibold">{{ date && time ? `${longDate(date)} at ${time}` : 'Pick a date and time' }}</span></div>
        <div class="flex justify-between"><span class="text-gray-400">Rate</span><span class="text-white font-semibold">{{ money(hourlyCents) }}/hr × {{ hours }}</span></div>
        <div class="border-t border-white/10 pt-2 flex justify-between items-center"><span class="text-white font-bold">Total</span><span class="text-amber-400 text-2xl font-bold">{{ money(hourlyCents * hours) }}</span></div>
      </div>

      <div v-if="!waiverSigned" class="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm">
        <div class="text-red-400 font-bold">Waiver required</div>
        <p class="text-gray-400 mt-1">Sign your liability waiver before booking.</p>
        <NuxtLink to="/portal/waiver" class="btn-primary inline-block text-sm mt-3">Sign Waiver →</NuxtLink>
      </div>

      <p v-if="checkoutError" class="text-red-400 text-sm mt-4 bg-red-900/20 border border-red-500/20 rounded-lg px-4 py-3" role="alert">{{ checkoutError }}</p>
      <button type="button" class="btn-primary w-full mt-4" :disabled="!canCheckout || checkingOut" @click="checkout">
        {{ checkingOut ? 'Reserving your time…' : `🔒 Secure Checkout ${money(hourlyCents * hours)}` }}
      </button>
      <p class="text-xs text-gray-500 mt-2 text-center">Your time is held for 30 minutes while you pay. Payments are processed securely by Stripe.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ profile: any }>()
const route = useRoute()
const cancelled = route.query.checkout === 'cancelled'

const teams = computed<any[]>(() => props.profile?.managed_teams || [])
const teamId = ref(teams.value[0]?.id || '')
const rates = computed<any[]>(() => props.profile?.team_rates || [])
const turfCageCents = computed(() => rates.value.find(r => r.id === 'turf_cage')?.cents || 0)
const cageCents = computed(() => rates.value.find(r => r.id === 'cage')?.cents || 0)
const options = computed(() => [
  { id: 'turf_cage', label: 'Half turf + 1 cage', cents: turfCageCents.value, description: rates.value.find(r => r.id === 'turf_cage')?.description || '' },
  { id: 'cages', label: 'Batting cages', cents: cageCents.value, description: 'One to four cages, no turf' },
])
const horizonDays = computed(() => props.profile?.team_booking_horizon_days || 14)
const hourChoices = computed<number[]>(() => props.profile?.team_booking_hours || [1, 2, 3])

const option = ref<'turf_cage' | 'cages'>('turf_cage')
const cages = ref(0)
const hours = ref(1)
const cageChoices = computed(() => (option.value === 'turf_cage' ? [0, 1, 2, 3] : [1, 2, 3, 4]))
function setOption(id: string) {
  option.value = id as 'turf_cage' | 'cages'
  cages.value = id === 'turf_cage' ? 0 : 1
}
const hourlyCents = computed(() => (option.value === 'turf_cage' ? turfCageCents.value : 0) + cages.value * cageCents.value)
const summaryLabel = computed(() => option.value === 'turf_cage'
  ? `Half turf + ${1 + cages.value} cage${cages.value ? 's' : ''}`
  : `${cages.value} batting cage${cages.value > 1 ? 's' : ''}`)

// Facility dates (Central Time)
function centralDate(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}
const minDate = centralDate(0)
const maxDate = computed(() => centralDate(horizonDays.value))
const date = ref('')
const time = ref('')
const notes = ref('')

const openSlots = ref<string[]>([])
const loadingSlots = ref(false)
const slotsError = ref('')
let requestSeq = 0
async function loadSlots() {
  time.value = ''
  openSlots.value = []
  slotsError.value = ''
  if (!date.value) return
  const seq = ++requestSeq
  loadingSlots.value = true
  try {
    const result = await $fetch<{ slots: { time: string; available: boolean }[] }>('/api/portal/team-availability', {
      query: { team_id: teamId.value, date: date.value, option: option.value, cages: cages.value, hours: hours.value },
    })
    if (seq === requestSeq) openSlots.value = result.slots.filter(s => s.available).map(s => s.time)
  } catch (error: any) {
    if (seq === requestSeq) slotsError.value = error?.data?.statusMessage || 'Live availability is temporarily unavailable.'
  } finally {
    if (seq === requestSeq) loadingSlots.value = false
  }
}
watch([date, option, cages, hours, teamId], () => { void loadSlots() })

const waiverSigned = computed(() => Boolean(props.profile?.waiver_signed))
const canCheckout = computed(() => Boolean(teamId.value && date.value && time.value && waiverSigned.value && hourlyCents.value > 0))
const checkingOut = ref(false)
const checkoutError = ref('')
async function checkout() {
  if (!canCheckout.value) return
  checkingOut.value = true
  checkoutError.value = ''
  try {
    const res = await $fetch<{ url: string }>('/api/stripe/create-team-booking-checkout', {
      method: 'POST',
      body: { teamId: teamId.value, option: option.value, cages: cages.value, hours: hours.value, date: date.value, time: time.value, notes: notes.value },
    })
    window.location.assign(res.url)
  } catch (error: any) {
    checkoutError.value = error?.data?.statusMessage || error?.data?.message || 'Something went wrong. Please try again.'
    checkingOut.value = false
    if (error?.statusCode === 409 || error?.status === 409) void loadSlots()
  }
}

function money(cents: number) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}` }
function longDate(d: string) { return new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }) }
</script>

<style scoped>
.step-label { @apply block text-white font-bold mb-3; }
.form-input {
  @apply w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors [color-scheme:dark];
}
.form-input option { @apply bg-gray-900 text-white; }
</style>
