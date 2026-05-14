<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Bookings Admin</h1>
          <p class="text-gray-500 text-sm">Training Yard DSM</p>
        </div>
        <button
          class="bg-green-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition-colors text-sm flex items-center gap-2"
          :disabled="pending"
          @click="refresh()"
        >
          <span :class="pending ? 'animate-spin' : ''">↻</span>
          Refresh
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-wrap items-center gap-4">
        <label class="text-sm font-semibold text-gray-700">Status:</label>
        <select
          v-model="statusFilter"
          class="text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-700"
          @change="refresh()"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <label class="text-sm font-semibold text-gray-700">From:</label>
        <input type="date" v-model="dateFrom" class="text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" style="color-scheme:light" />
        <label class="text-sm font-semibold text-gray-700">To:</label>
        <input type="date" v-model="dateTo" class="text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none" style="color-scheme:light" />
        <span class="text-gray-400 text-sm ml-auto">{{ filtered?.length ?? 0 }} bookings</span>
        <button @click="exportCSV" class="flex items-center gap-1.5 text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg shadow-sm">
          ⬇ CSV
        </button>
      </div>

      <!-- Error -->
      <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-6">
        Failed to load bookings: {{ error.message }}
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-200">
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Date / Time</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Player</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Amount</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th class="text-left px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pending">
                <td colspan="7" class="text-center py-12 text-gray-400">Loading...</td>
              </tr>
              <tr v-else-if="!filtered?.length">
                <td colspan="7" class="text-center py-12 text-gray-400">No bookings found.</td>
              </tr>
              <tr
                v-for="booking in filtered"

                :key="booking.id"
                class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td class="px-4 py-3">
                  <div class="font-semibold text-gray-800">{{ formatDate(booking.booking_date) }}</div>
                  <div class="text-gray-500">{{ booking.booking_time }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800">{{ booking.service_label }}</div>
                  <div class="text-gray-400 text-xs">{{ booking.duration_minutes }} min</div>
                </td>
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-800">{{ booking.customer_name }}</div>
                  <div class="text-gray-500 text-xs">{{ booking.customer_email }}</div>
                  <div class="text-gray-400 text-xs">{{ booking.customer_phone }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-700">{{ booking.player_name || '—' }}</div>
                  <div class="text-gray-400 text-xs">{{ booking.sport || '' }}{{ booking.player_age ? ` · age ${booking.player_age}` : '' }}</div>
                </td>
                <td class="px-4 py-3 font-bold text-amber-600">
                  ${{ (booking.amount_cents / 100).toFixed(0) }}
                </td>
                <td class="px-4 py-3">
                  <span
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                    :class="{
                      'bg-yellow-100 text-yellow-800': booking.status === 'pending',
                      'bg-green-100 text-green-800': booking.status === 'confirmed',
                      'bg-red-100 text-red-800': booking.status === 'cancelled',
                    }"
                  >
                    {{ booking.status }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <button
                    v-if="booking.status !== 'cancelled'"
                    class="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
                    :disabled="cancelling === booking.id"
                    @click="cancelBooking(booking.id)"
                  >
                    {{ cancelling === booking.id ? 'Cancelling...' : 'Cancel' }}
                  </button>
                  <span v-else class="text-gray-300 text-xs">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})


useHead({
  title: 'Bookings — Admin',
})

const statusFilter = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const cancelling = ref<string | null>(null)

const { data: bookings, pending, error, refresh } = await useFetch<any[]>('/api/admin/bookings', {
  query: computed(() => ({ status: statusFilter.value })),
  server: false,
})

const filtered = computed(() => {
  let list = (bookings.value as any)?.bookings ?? []
  if (dateFrom.value) list = list.filter((b: any) => b.booking_date >= dateFrom.value)
  if (dateTo.value) list = list.filter((b: any) => b.booking_date <= dateTo.value)
  return list
})

function exportCSV() {
  const rows = [
    ['Date', 'Time', 'Service', 'Customer', 'Email', 'Phone', 'Player', 'Amount', 'Status'],
    ...(filtered.value ?? []).map((b: any) => [
      b.booking_date, b.booking_time, b.service_label,
      b.customer_name, b.customer_email, b.customer_phone,
      b.player_name || '', ((b.amount_cents || 0) / 100).toFixed(2), b.status,
    ])
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

async function cancelBooking(id: string) {
  if (!confirm('Cancel this booking?')) return
  cancelling.value = id
  try {
    await $fetch(`/api/admin/bookings/${id}/cancel`, { method: 'POST' })
    await refresh()
  } catch {
    alert('Failed to cancel booking.')
  } finally {
    cancelling.value = null
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
</script>
