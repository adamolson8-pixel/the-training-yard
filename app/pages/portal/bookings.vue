<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto w-full">

    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">My Bookings</h1>
      <p class="text-gray-400 mt-1">Your upcoming sessions and booking history.</p>
    </div>

    <!-- Tab switcher -->
    <div class="flex bg-white/5 rounded-xl p-1 mb-6 w-fit gap-1">
      <button
        class="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="tab === 'upcoming' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'"
        @click="tab = 'upcoming'"
      >
        Upcoming <span v-if="upcoming.length" class="ml-1 bg-black/20 px-1.5 py-0.5 rounded-full text-xs">{{ upcoming.length }}</span>
      </button>
      <button
        class="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
        :class="tab === 'past' ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'"
        @click="tab = 'past'"
      >
        Past
      </button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-12 text-gray-500">Loading bookings...</div>

    <!-- Upcoming Tab -->
    <div v-else-if="tab === 'upcoming'">
      <div v-if="!upcoming.length" class="text-center py-16 text-gray-500">
        <div class="text-5xl mb-4">📅</div>
        <div class="font-semibold text-gray-400">No upcoming sessions</div>
        <NuxtLink to="/portal/book" class="btn-primary mt-4 inline-block text-sm">Book a Session</NuxtLink>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="b in upcoming"
          :key="b.id"
          class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
        >
          <div class="flex items-center gap-4 p-5">
            <div class="w-14 h-14 rounded-xl bg-amber-500/15 border border-amber-500/30 flex flex-col items-center justify-center shrink-0">
              <span class="text-amber-400 text-xs font-bold uppercase">{{ formatMonth(b.booking_date) }}</span>
              <span class="text-white text-xl font-bold leading-none">{{ formatDay(b.booking_date) }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-bold">{{ b.service_label }}</div>
              <div class="text-gray-400 text-sm">{{ formatDate(b.booking_date) }} at {{ formatTime(b.booking_time) }}</div>
              <div v-if="b.duration_minutes" class="text-gray-500 text-xs mt-0.5">{{ b.duration_minutes }} min session</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-amber-400 font-bold">${{ b.amount_cents ? (b.amount_cents / 100).toFixed(0) : '—' }}</div>
              <div class="mt-1">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="paymentBadge(b.status)">
                  {{ b.status || 'pending' }}
                </span>
              </div>
            </div>
          </div>
          <!-- Cancel row -->
          <div class="px-5 py-3 border-t border-white/10 bg-white/3 flex items-center justify-between gap-3">
            <span class="text-gray-500 text-xs">{{ cancelPolicy(b.booking_date, b.booking_time) }}</span>
            <button
              v-if="b.status !== 'cancelled'"
              class="text-xs text-red-400 hover:text-red-300 font-semibold border border-red-500/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg transition-all"
              :disabled="cancelling === b.id"
              @click="cancelBooking(b)"
            >
              {{ cancelling === b.id ? 'Cancelling...' : 'Cancel Session' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Past Tab -->
    <div v-else>
      <div v-if="!past.length" class="text-center py-16 text-gray-500">
        <div class="text-5xl mb-4">🏋️</div>
        <div class="font-semibold text-gray-400">No past sessions yet</div>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="b in past"
          :key="b.id"
          class="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
        >
          <div class="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-lg shrink-0">⚾</div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-semibold">{{ b.service_label }}</div>
            <div class="text-gray-500 text-xs">{{ formatDate(b.booking_date) }} · {{ b.duration_minutes }} min</div>
          </div>
          <div class="text-right shrink-0">
            <div class="text-gray-300 text-sm font-semibold">${{ b.amount_cents ? (b.amount_cents / 100).toFixed(0) : '—' }}</div>
            <span class="text-xs px-1.5 py-0.5 rounded-full" :class="paymentBadge(b.status)">{{ b.status || '—' }}</span>
          </div>
          <NuxtLink to="/portal/book" class="text-xs text-amber-400/70 hover:text-amber-400 font-medium whitespace-nowrap transition-colors ml-2">
            Rebook →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div v-if="cancelTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div class="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 class="text-lg font-bold text-white mb-2">Cancel Session?</h3>
        <p class="text-gray-400 text-sm mb-2">
          <strong class="text-white">{{ cancelTarget.service_label }}</strong> on {{ formatDate(cancelTarget.booking_date) }}
        </p>
        <div class="p-3 rounded-xl mb-5 text-sm" :class="isCancelFullRefund ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'">
          <span v-if="isCancelFullRefund">✓ Full refund — you're cancelling more than 24 hours before your session.</span>
          <span v-else>⚠ 50% cancellation fee — this session is less than 24 hours away.</span>
        </div>
        <div class="flex gap-3">
          <button class="flex-1 py-2.5 px-4 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium transition-all" @click="cancelTarget = null">Keep Booking</button>
          <button class="flex-1 py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm font-bold transition-all" :disabled="cancelling !== null" @click="confirmCancel">
            {{ cancelling ? 'Cancelling...' : 'Yes, Cancel' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'My Bookings — Training Yard' })

const tab = ref<'upcoming' | 'past'>('upcoming')
const cancelling = ref<string | null>(null)
const cancelTarget = ref<any>(null)

const { data, pending, refresh } = await useFetch<{ upcoming: any[], past: any[] }>('/api/portal/bookings', {
  server: false, // Only fetch on client-side where auth cookies are guaranteed
})
const upcoming = computed(() => data.value?.upcoming ?? [])
const past = computed(() => data.value?.past ?? [])

// Helper: parse "1:00 PM" style booking times into a real Date
function parseBookingDateTime(date: string, time: string): Date {
  if (!date || !time) return new Date(0)
  if (time.includes('AM') || time.includes('PM')) {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match) {
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const period = match[3].toUpperCase()
      if (period === 'PM' && hours !== 12) hours += 12
      if (period === 'AM' && hours === 12) hours = 0
      return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`)
    }
  }
  return new Date(`${date}T${time}`)
}

const isCancelFullRefund = computed(() => {
  if (!cancelTarget.value) return false
  const dt = parseBookingDateTime(cancelTarget.value.booking_date, cancelTarget.value.booking_time)
  return (dt.getTime() - Date.now()) >= 24 * 60 * 60 * 1000
})

function cancelBooking(booking: any) {
  cancelTarget.value = booking
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelling.value = cancelTarget.value.id
  try {
    await $fetch(`/api/portal/bookings/${cancelTarget.value.id}`, { method: 'DELETE' })
    cancelTarget.value = null
    await refresh()
  } catch (e: any) {
    alert(e?.data?.statusMessage || 'Failed to cancel. Please contact us.')
  } finally {
    cancelling.value = null
  }
}

function cancelPolicy(date: string, time: string): string {
  if (!date || !time) return ''
  const dt = parseBookingDateTime(date, time)
  const hrs = (dt.getTime() - Date.now()) / (1000 * 60 * 60)
  return hrs >= 24 ? 'Full refund available (24+ hrs away)' : 'Less than 24 hrs — 50% fee applies'
}

function paymentBadge(status: string) {
  if (status === 'confirmed' || status === 'paid') return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (status === 'pending') return 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
  if (status === 'cancelled') return 'bg-red-500/20 text-red-400 border border-red-500/30'
  if (status === 'refunded') return 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
  return 'bg-white/10 text-gray-400'
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
function formatMonth(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short' })
}
function formatDay(d: string) {
  return new Date(d + 'T12:00:00').getDate()
}
function formatTime(t: string) {
  if (!t) return ''
  // Time may already be in "1:00 PM" format from the DB
  if (t.includes('AM') || t.includes('PM')) return t
  // Fallback: 24-hour format "13:00"
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}
</script>
