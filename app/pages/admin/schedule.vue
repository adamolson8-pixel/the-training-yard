<template>
  <div class="p-4 md:p-8 bg-gray-50 min-h-screen">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Facility Schedule</h1>
        <p class="text-sm text-gray-500 mt-1">Bookings, blocks, and remaining capacity in Central Time.</p>
      </div>
      <div class="flex gap-2">
        <NuxtLink to="/admin/blocks" class="px-4 py-2 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-700">Block Time</NuxtLink>
        <button class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold" @click="openReservation">+ Manual Reservation</button>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div class="bg-white border border-gray-200 rounded-xl p-4"><div class="text-xs font-bold text-gray-400 uppercase">Upcoming</div><div class="text-2xl font-bold text-gray-900">{{ upcomingBookings }}</div></div>
      <div class="bg-white border border-gray-200 rounded-xl p-4"><div class="text-xs font-bold text-gray-400 uppercase">Active blocks</div><div class="text-2xl font-bold text-gray-900">{{ calendar.blocks.length }}</div></div>
      <div class="bg-white border border-gray-200 rounded-xl p-4"><div class="text-xs font-bold text-gray-400 uppercase">Facility capacity</div><div class="font-bold text-gray-900">4 cages</div></div>
      <div class="bg-white border border-gray-200 rounded-xl p-4"><div class="text-xs font-bold text-gray-400 uppercase">Turf capacity</div><div class="font-bold text-gray-900">2 halves</div></div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm mb-5 p-3 flex flex-wrap items-center gap-2">
      <button class="nav-btn" @click="shiftWeek(-7)">← Previous</button>
      <button class="nav-btn" @click="selectedDate = todayKey">Today</button>
      <button class="nav-btn" @click="shiftWeek(7)">Next →</button>
      <input v-model="selectedDate" type="date" class="border border-gray-200 rounded-lg px-3 py-2 text-sm ml-auto" />
      <button class="nav-btn" :disabled="loading" @click="fetchAll">{{ loading ? 'Loading…' : 'Refresh' }}</button>
    </div>

    <div v-if="loadError" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-5">{{ loadError }}</div>
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[1050px] table-fixed text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="w-20 px-2 py-3 text-left text-xs font-bold text-gray-500">Time</th>
              <th v-for="day in weekDays" :key="day" class="px-2 py-3 text-center">
                <div class="text-xs text-gray-500">{{ dayLabel(day) }}</div><div class="font-bold text-gray-900">{{ shortDate(day) }}</div>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="hour in hours" :key="hour">
              <td class="px-2 py-3 text-xs font-bold text-gray-500 bg-gray-50">{{ hourLabel(hour) }}</td>
              <td v-for="day in weekDays" :key="`${day}-${hour}`" class="p-1.5 align-top border-l border-gray-100 h-24">
                <div class="rounded-lg p-1.5 h-full" :class="slotClass(day, hour)">
                  <div class="text-[10px] font-bold mb-1" :class="remaining(day, hour).cages === 0 && remaining(day, hour).turf === 0 ? 'text-red-700' : 'text-gray-500'">
                    {{ remaining(day, hour).cages }}/4 cages · {{ remaining(day, hour).turf }}/2 turf open
                  </div>
                  <button v-for="event in slotEvents(day, hour)" :key="`${event.kind}-${event.id}`" class="w-full text-left text-[10px] leading-tight rounded px-1.5 py-1 mb-1 truncate" :class="event.kind === 'block' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'" :title="eventTitle(event)">
                    {{ event.kind === 'block' ? 'BLOCK' : event.team?.name || event.customer_name || 'Booking' }} · {{ event.cage_units }}C/{{ event.turf_units }}T
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl shadow-sm mt-5 overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-200"><h2 class="font-bold text-gray-900">Upcoming Bookings & Blocks</h2></div>
      <div class="divide-y divide-gray-100 max-h-96 overflow-auto">
        <div v-if="!upcomingEvents.length" class="p-8 text-center text-gray-400">No upcoming events.</div>
        <div v-for="event in upcomingEvents" :key="`${event.kind}-${event.id}`" class="p-4 flex flex-wrap items-center gap-4">
          <span class="text-xs font-bold px-2 py-1 rounded-full" :class="event.kind === 'block' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">{{ event.kind === 'block' ? 'BLOCK' : 'BOOKING' }}</span>
          <div class="min-w-44"><div class="font-semibold text-gray-800">{{ fmtDateTime(event.start_at) }}</div><div class="text-xs text-gray-400">to {{ fmtDateTime(event.end_at) }}</div></div>
          <div class="flex-1"><div class="font-semibold text-gray-800">{{ eventTitle(event) }}</div><div class="text-xs text-gray-500">{{ event.cage_units }} cage · {{ event.turf_units }} turf units</div></div>
        </div>
      </div>
    </div>

    <div v-if="showReservation" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <form class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto" @submit.prevent="submitReservation">
        <h2 class="text-xl font-bold text-gray-900">Create Manual Reservation</h2>
        <p class="text-sm text-gray-500 mb-5">Creates a confirmed reservation against live capacity. Times are Central.</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <label class="field">Service *<select v-model="reservation.service_id" required><option value="">Select service</option><option v-for="service in services" :key="service.id" :value="service.id">{{ service.label }}</option></select></label>
          <label class="field">Account<select v-model="reservation.user_id" @change="fillAccount"><option value="">Guest / no account</option><option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name || u.email }} — {{ u.email }}</option></select></label>
          <label class="field">Team<select v-model="reservation.team_id"><option value="">No team</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select></label>
          <label class="field">Date *<input v-model="reservation.date" type="date" required /></label>
          <label class="field">Start time *<input v-model="reservation.time" type="time" step="1800" required /></label>
          <label class="field">Amount due ($)<input v-model.number="reservation.amount" type="number" min="0" step="0.01" /></label>
          <label class="field">Customer name *<input v-model="reservation.customer_name" required /></label>
          <label class="field">Email *<input v-model="reservation.customer_email" type="email" required /></label>
          <label class="field">Phone<input v-model="reservation.customer_phone" /></label>
          <label class="field">Player / group<input v-model="reservation.player_name" /></label>
        </div>
        <label class="field mt-4">Internal notes<textarea v-model="reservation.admin_notes" rows="3" /></label>
        <div v-if="reservationError" class="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{{ reservationError }}</div>
        <div class="flex gap-3 mt-6"><button type="button" class="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold" @click="showReservation = false">Cancel</button><button class="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold disabled:opacity-50" :disabled="savingReservation">{{ savingReservation ? 'Saving…' : 'Create Reservation' }}</button></div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SERVICES } from '~/utils/services'

definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Facility Schedule — Admin' })

const services = SERVICES
const route = useRoute()
const loading = ref(false)
const loadError = ref('')
const calendar = reactive<{ bookings: any[]; blocks: any[] }>({ bookings: [], blocks: [] })
const users = ref<any[]>([])
const teams = ref<any[]>([])
const hours = Array.from({ length: 12 }, (_, index) => index + 8)
const centralParts = (date: Date) => Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date).map(part => [part.type, part.value]))
const todayParts = centralParts(new Date())
const todayKey = `${todayParts.year}-${todayParts.month}-${todayParts.day}`
const selectedDate = ref(todayKey)
const showReservation = ref(false)
const savingReservation = ref(false)
const reservationError = ref('')
const emptyReservation = () => ({ service_id: '', user_id: '', team_id: '', date: selectedDate.value, time: '17:00', amount: 0, customer_name: '', customer_email: '', customer_phone: '', player_name: '', admin_notes: '' })
const reservation = reactive(emptyReservation())

const weekDays = computed(() => {
  const base = new Date(`${selectedDate.value}T12:00:00Z`)
  const day = base.getUTCDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  return Array.from({ length: 7 }, (_, index) => new Date(base.getTime() + (mondayOffset + index) * 86400000).toISOString().slice(0, 10))
})
const allEvents = computed(() => [...calendar.bookings.map(row => ({ ...row, kind: 'booking' })), ...calendar.blocks.map(row => ({ ...row, kind: 'block' }))])
const upcomingEvents = computed(() => allEvents.value.filter(row => new Date(row.end_at) >= new Date()).sort((a, b) => +new Date(a.start_at) - +new Date(b.start_at)).slice(0, 100))
const upcomingBookings = computed(() => calendar.bookings.filter(row => new Date(row.end_at) >= new Date()).length)

function eventSpans(event: any, day: string, hour: number) {
  const startDay = event.facility_start.date
  const endDay = event.facility_end.date
  if (day < startDay || day > endDay) return false
  const startMinute = day === startDay ? Number(event.facility_start.time.slice(0, 2)) * 60 + Number(event.facility_start.time.slice(3)) : 0
  const endMinute = day === endDay ? Number(event.facility_end.time.slice(0, 2)) * 60 + Number(event.facility_end.time.slice(3)) : 1440
  return startMinute < (hour + 1) * 60 && endMinute > hour * 60
}
function slotEvents(day: string, hour: number) { return allEvents.value.filter(event => eventSpans(event, day, hour)) }
function remaining(day: string, hour: number) {
  const rows = slotEvents(day, hour)
  return { cages: Math.max(0, 4 - rows.reduce((sum, row) => sum + Number(row.cage_units || 0), 0)), turf: Math.max(0, 2 - rows.reduce((sum, row) => sum + Number(row.turf_units || 0), 0)) }
}
function slotClass(day: string, hour: number) { const r = remaining(day, hour); return r.cages === 0 && r.turf === 0 ? 'bg-red-50' : r.cages < 4 || r.turf < 2 ? 'bg-amber-50' : 'bg-green-50/60' }
function eventTitle(event: any) { return event.kind === 'block' ? `${event.reason || 'Admin block'}${event.team?.name ? ` — ${event.team.name}` : ''}${event.profile?.full_name ? ` — ${event.profile.full_name}` : ''}` : `${event.service_label || 'Reservation'} — ${event.team?.name || event.customer_name || event.profile?.full_name || 'Customer'}` }
function hourLabel(hour: number) { return `${hour % 12 || 12}:00 ${hour >= 12 ? 'PM' : 'AM'}` }
function dayLabel(day: string) { return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) }
function shortDate(day: string) { return new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }) }
function fmtDateTime(value: string) { return new Date(value).toLocaleString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }
function shiftWeek(days: number) { const date = new Date(`${selectedDate.value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); selectedDate.value = date.toISOString().slice(0, 10) }

async function fetchAll() {
  loading.value = true; loadError.value = ''
  try {
    const [calendarData, userData, teamData] = await Promise.all([
      $fetch<any>('/api/admin/calendar'),
      $fetch<any>('/api/admin/users', { query: { limit: 1000 } }),
      $fetch<any>('/api/admin/teams'),
    ])
    calendar.bookings = calendarData.bookings || []; calendar.blocks = calendarData.blocks || []
    users.value = userData.users || []; teams.value = teamData.teams || []
  } catch (error: any) { loadError.value = error?.data?.statusMessage || 'Unable to load the schedule.' }
  finally { loading.value = false }
}
function openReservation() { Object.assign(reservation, emptyReservation()); reservationError.value = ''; showReservation.value = true }
function fillAccount() { const user = users.value.find(row => row.id === reservation.user_id); if (user) { reservation.customer_name = user.full_name || ''; reservation.customer_email = user.email || ''; reservation.customer_phone = user.phone || '' } }
async function submitReservation() {
  savingReservation.value = true; reservationError.value = ''
  try {
    await $fetch('/api/admin/reservations', { method: 'POST', body: { ...reservation, amount_cents: Math.round(Number(reservation.amount || 0) * 100) } })
    showReservation.value = false; await fetchAll()
  } catch (error: any) { reservationError.value = error?.data?.statusMessage || 'Unable to create the reservation.' }
  finally { savingReservation.value = false }
}

await fetchAll()
if (route.query.team) {
  openReservation()
  reservation.team_id = String(route.query.team)
}
</script>

<style scoped>
.nav-btn { @apply px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50; }
.field { @apply block text-xs font-bold text-gray-600; }
.field input, .field select, .field textarea { @apply mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-normal focus:outline-none focus:ring-2 focus:ring-red-400; }
</style>
