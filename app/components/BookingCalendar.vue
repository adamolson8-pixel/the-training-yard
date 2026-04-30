<template>
  <div class="max-w-4xl mx-auto">
    <!-- Resource Selector -->
    <div class="flex flex-wrap justify-center gap-3 mb-8">
      <button
        v-for="r in resources"
        :key="r.id"
        class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
        :class="selectedResource === r.id ? 'bg-red-gradient text-white shadow-glow-red' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'"
        @click="selectedResource = r.id"
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
            <div v-if="!isPast(day) && getAvailability(day) > 0" class="absolute bottom-1 left-1/2 -translate-x-1/2">
              <div class="flex gap-0.5">
                <div v-for="n in Math.min(getAvailability(day), 3)" :key="n" class="w-1 h-1 rounded-full" :class="getAvailability(day) > 5 ? 'bg-turf' : getAvailability(day) > 2 ? 'bg-cage' : 'bg-primary'"></div>
              </div>
            </div>
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
          >
            <div class="font-semibold">{{ slot.time }}</div>
            <div class="text-xs mt-1" :class="slot.available ? 'text-turf' : 'text-gray-600'">
              {{ slot.available ? 'Available' : 'Booked' }}
            </div>
          </button>
        </div>
        <div v-else class="text-center py-8 text-gray-400">No slots available for this day.</div>
      </div>

      <!-- Legend -->
      <div class="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-white/5 text-xs text-gray-500">
        <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-turf"></div> Many available</div>
        <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-cage"></div> Few remaining</div>
        <div class="flex items-center gap-1.5"><div class="w-2 h-2 rounded-full bg-primary"></div> Almost full</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const selectedResource = ref('single-cage')
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDay = ref<number | null>(null)
const loading = ref(false)
const slots = ref<{ time: string; available: boolean }[]>([])

const resources = [
  { id: 'single-cage', label: 'Single Cage' },
  { id: 'two-cage', label: 'Two Cages' },
  { id: 'half-turf', label: 'Half Turf' },
  { id: 'full-turf', label: 'Full Turf' },
]

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

const getAvailability = (day: number) => {
  // Mock availability - will be replaced by real API data
  const seed = (day * 7 + currentMonth.value * 31) % 10
  return isPast(day) ? 0 : seed
}

const getDayClass = (day: number) => {
  if (isPast(day)) return 'text-gray-700 cursor-not-allowed'
  if (selectedDay.value === day) return 'bg-red-gradient text-white shadow-glow-red'
  return 'text-gray-300 hover:bg-white/10'
}

const selectDay = async (day: number) => {
  if (isPast(day)) return
  selectedDay.value = day
  loading.value = true
  // Simulate API call to /.netlify/functions/check-availability
  await new Promise(r => setTimeout(r, 600))
  const mockSlots = ['6:00 AM','7:00 AM','8:00 AM','9:00 AM','10:00 AM','11:00 AM','12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM','6:00 PM','7:00 PM','8:00 PM','9:00 PM']
  slots.value = mockSlots.map(time => ({
    time,
    available: Math.random() > 0.3,
  }))
  loading.value = false
}
</script>
