<template>
  <div class="max-w-4xl mx-auto relative">
    <!-- Resource Selector -->
    <div class="flex flex-wrap justify-center gap-3 mb-8">
      <button
        v-for="r in resources"
        :key="r.id"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
        :class="selectedResource === r.id ? 'bg-red-gradient text-white shadow-glow-red' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'"
        @click="changeResource(r.id)"
      >
        {{ r.label }}
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="glass-card p-6 md:p-8">
      <!-- Month Navigation -->
      <div class="flex items-center justify-between mb-6">
        <button class="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5" @click="prevMonth">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h3 class="font-display font-semibold text-white text-lg">{{ monthName }} {{ currentYear }}</h3>
        <button class="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5" @click="nextMonth">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <!-- Day Headers -->
      <div class="grid grid-cols-7 gap-1 mb-2">
        <div v-for="d in ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']" :key="d" class="text-center text-xs font-medium text-gray-500 py-2">{{ d }}</div>
      </div>

      <!-- Calendar Days -->
      <div class="grid grid-cols-7 gap-1">
        <div v-for="(day, i) in calendarDays" :key="i">
          <button
            v-if="day"
            class="w-full aspect-square rounded-xl text-sm font-medium transition-all duration-300 relative"
            :class="getDayClass(day)"
            @click="selectDay(day)"
            :disabled="isPast(day)"
          >
            {{ day }}
          </button>
          <div v-else class="w-full aspect-square"></div>
        </div>
      </div>

      <!-- Selected Day Slots -->
      <div v-if="selectedDay" class="mt-6 pt-6 border-t border-white/10">
        <h4 class="font-display font-semibold text-white mb-4">Available Slots — {{ monthName }} {{ selectedDay }}</h4>
        <div v-if="loading" class="text-center py-8 text-gray-400">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Loading availability...
        </div>
        <div v-else-if="slots.length" class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            v-for="slot in slots"
            :key="slot.time"
            class="p-3 rounded-xl text-sm text-center transition-all duration-300"
            :class="slot.available ? 'bg-turf/10 border border-turf/30 text-white hover:bg-turf/20 hover:border-turf/50' : 'bg-white/5 border border-white/5 text-gray-600 cursor-not-allowed'"
            :disabled="!slot.available"
            @click="openBookingModal(slot)"
          >
            <div class="font-semibold">{{ slot.time }}</div>
            <div class="text-xs mt-1" :class="slot.available ? 'text-turf' : 'text-gray-600'">
              {{ slot.available ? 'Available' : 'Booked' }}
            </div>
          </button>
        </div>
        <div v-else class="text-center py-8 text-gray-400">No slots available for this day.</div>
      </div>
    </div>

    <!-- Booking Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="glass-card p-6 md:p-8 max-w-md w-full">
        <h3 class="font-display text-2xl font-bold text-white mb-2">Confirm Booking</h3>
        <p class="text-gray-400 mb-6">You are booking a <strong>{{ selectedResourceLabel }}</strong>.</p>
        
        <div class="bg-white/5 rounded-xl p-4 mb-6">
          <div class="flex justify-between mb-2">
            <span class="text-gray-500">Date</span>
            <span class="text-white font-medium">{{ monthName }} {{ selectedDay }}, {{ currentYear }}</span>
          </div>
          <div class="flex justify-between mb-3">
            <span class="text-gray-500">Time</span>
            <span class="text-white font-medium">{{ selectedSlot?.time }} (1 Hour)</span>
          </div>
          <div class="flex justify-between items-center border-t border-white/10 pt-3 mt-3">
            <span class="text-gray-400 font-bold">Total Due</span>
            <span class="text-white font-display font-bold text-2xl">${{ selectedResourcePrice }}.00</span>
          </div>
        </div>

        <div v-if="bookingError" class="text-primary text-sm mb-4 bg-primary/10 p-3 rounded-lg">{{ bookingError }}</div>
        <div v-if="user" class="text-sm text-turf mb-4">Logged in as {{ user.email }}</div>
        <div v-else class="text-sm text-primary mb-4">You must be logged in to book.</div>

        <div class="flex gap-3">
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors" @click="showModal = false" :disabled="bookingInProgress">Cancel</button>
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-red-gradient hover:shadow-glow-red transition-all disabled:opacity-50" @click="confirmBooking" :disabled="!user || bookingInProgress">
            <span v-if="bookingInProgress">Redirecting to Stripe...</span>
            <span v-else>Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()

const selectedResource = ref('cage-1')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDay = ref<number | null>(null)
const loading = ref(false)
const slots = ref<any[]>([])

const showModal = ref(false)
const selectedSlot = ref<any>(null)
const bookingInProgress = ref(false)
const bookingError = ref('')

const resources = [
  { id: 'cage-1', label: 'Cage 1', price: 30 },
  { id: 'cage-2', label: 'Cage 2', price: 30 },
  { id: 'cage-3', label: 'Cage 3', price: 30 },
  { id: 'cage-4', label: 'Cage 4', price: 30 },
  { id: 'half-turf', label: 'Half Turf', price: 60 },
  { id: 'full-turf', label: 'Full Turf', price: 100 },
]

const selectedResourcePrice = computed(() => resources.find(r => r.id === selectedResource.value)?.price || 0)

const selectedResourceLabel = computed(() => resources.find(r => r.id === selectedResource.value)?.label)

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
const monthName = computed(() => monthNames[currentMonth.value])

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1).getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const days: (number | null)[] = Array(firstDay).fill(null)
  for (let i = 1; i <= daysInMonth; i++) days.push(i)
  return days
})

const prevMonth = () => {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
  selectedDay.value = null
}

const nextMonth = () => {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
  selectedDay.value = null
}

const isPast = (day: number) => {
  const d = new Date(currentYear.value, currentMonth.value, day)
  const today = new Date(); today.setHours(0,0,0,0)
  return d < today
}

const getDayClass = (day: number) => {
  if (isPast(day)) return 'text-gray-700 cursor-not-allowed'
  if (selectedDay.value === day) return 'bg-red-gradient text-white shadow-glow-red'
  return 'text-gray-300 hover:bg-white/10'
}

const changeResource = (id: string) => {
  selectedResource.value = id
  if (selectedDay.value) selectDay(selectedDay.value)
}

const selectDay = async (day: number) => {
  if (isPast(day)) return
  selectedDay.value = day
  loading.value = true
  
  // Format date to YYYY-MM-DD
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  
  try {
    const data = await $fetch('/api/availability', {
      query: { date: dateStr, resource_id: selectedResource.value }
    })
    slots.value = (data as any).slots || []
  } catch (e) {
    console.error('Failed to fetch availability', e)
    slots.value = []
  }
  
  loading.value = false
}

const openBookingModal = (slot: any) => {
  if (!slot.available) return
  if (!user.value) {
    navigateTo('/login')
    return
  }
  selectedSlot.value = slot
  bookingError.value = ''
  showModal.value = true
}

const confirmBooking = async () => {
  bookingInProgress.value = true
  bookingError.value = ''
  
  try {
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        resource_id: selectedResource.value,
        start_time: selectedSlot.value.raw_time
      }
    })
    showModal.value = false
    // Refresh slots
    if (selectedDay.value) selectDay(selectedDay.value)
  } catch (e: any) {
    bookingError.value = e.data?.statusMessage || 'Booking failed. Please try again.'
  }
  
  bookingInProgress.value = false
}
</script>
