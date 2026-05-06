<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
    <div class="max-w-lg w-full">
      <!-- Loading -->
      <div v-if="pending" class="text-center py-16">
        <div class="inline-block w-10 h-10 border-4 border-green-900 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p class="text-gray-500">Loading your booking details...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-white rounded-2xl shadow p-8 text-center">
        <div class="text-5xl mb-4">⚠️</div>
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Booking Not Found</h1>
        <p class="text-gray-500 mb-6">We couldn't find your booking. Please contact us at info@trainingyarddsm.com</p>
        <NuxtLink to="/training" class="bg-green-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-800 transition-colors">
          Back to Bookings
        </NuxtLink>
      </div>

      <!-- Success -->
      <div v-else-if="booking" class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-green-900 px-8 py-8 text-center">
          <div class="text-5xl mb-3">✅</div>
          <h1 class="text-2xl font-bold text-white mb-1">You're Booked!</h1>
          <p class="text-green-300">A confirmation email is on its way.</p>
        </div>

        <div class="p-8 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-500 text-xs mb-1">Service</div>
              <div class="font-semibold text-gray-800">{{ booking.serviceLabel }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-500 text-xs mb-1">Amount Paid</div>
              <div class="font-bold text-amber-600 text-lg">${{ (booking.amountTotal / 100).toFixed(0) }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-500 text-xs mb-1">Date</div>
              <div class="font-semibold text-gray-800">{{ formatDate(booking.date) }}</div>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <div class="text-gray-500 text-xs mb-1">Time</div>
              <div class="font-semibold text-gray-800">{{ booking.time }}</div>
            </div>
          </div>

          <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
            <p class="font-semibold text-green-900 mb-1">📍 Location</p>
            <p class="text-green-800">2519 NW 66th Ave, Des Moines, IA</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button
              class="flex-1 border border-green-900 text-green-900 font-semibold px-4 py-2.5 rounded-lg hover:bg-green-50 transition-colors text-sm"
              @click="downloadIcs"
            >
              📅 Add to Calendar
            </button>
            <NuxtLink
              to="/training"
              class="flex-1 bg-green-900 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors text-sm text-center"
            >
              Book Again
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Booking Confirmed | Training Yard DSM',
})

const route = useRoute()
const sessionId = route.query.session_id as string

const { data: booking, pending, error } = await useFetch<{
  serviceLabel: string
  date: string
  time: string
  customerName: string
  customerEmail: string
  amountTotal: number
  status: string
}>(`/api/stripe/session`, {
  query: { session_id: sessionId },
  server: false,
})

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}

function downloadIcs() {
  if (!booking.value) return
  const { serviceLabel, date, time } = booking.value

  // Parse the time (e.g. "10:00 AM")
  const match = time.match(/^(\d+):(\d+)\s*(AM|PM)$/i)
  if (!match || !date || !match[1] || !match[2] || !match[3]) return
  let hour = parseInt(match[1])
  const minute = parseInt(match[2])
  const ampm = match[3].toUpperCase()
  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0

  const dtStart = date.replace(/-/g, '') + 'T' + String(hour).padStart(2, '0') + String(minute).padStart(2, '0') + '00'
  const endHour = hour + 1
  const dtEnd = date.replace(/-/g, '') + 'T' + String(endHour).padStart(2, '0') + String(minute).padStart(2, '0') + '00'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Training Yard DSM//Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${serviceLabel} @ Training Yard DSM`,
    'LOCATION:2519 NW 66th Ave\\, Des Moines\\, IA',
    'DESCRIPTION:Your Training Yard DSM session. Questions? info@trainingyarddsm.com',
    `UID:${Date.now()}@trainingyarddsm.com`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'training-yard-booking.ics'
  a.click()
  URL.revokeObjectURL(url)
}
</script>
