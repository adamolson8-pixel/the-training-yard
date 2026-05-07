<template>
  <div class="p-6 md:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Block Time</h1>
        <p class="text-gray-500 text-sm mt-0.5">Prevent bookings for specific resources or the entire facility.</p>
      </div>
      <button @click="showForm = true" class="btn-admin-primary">+ Add Block</button>
    </div>

    <!-- Active Blocks List -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
      <div class="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 class="font-semibold text-gray-800">Active Blocks</h2>
        <button @click="fetchBlocks" class="text-xs text-gray-400 hover:text-gray-600">↻ Refresh</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Resource</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Start</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">End</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Reason</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="5" class="py-10 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!blocks.length"><td colspan="5" class="py-10 text-center text-gray-400">No blocks set. The facility is fully open.</td></tr>
            <tr v-for="b in blocks" :key="b.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="b.resource_id ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'">
                  {{ b.resource_id ? resourceLabel(b.resource_id) : '🏟 Facility-Wide' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ fmtDateTime(b.start_at) }}</td>
              <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ fmtDateTime(b.end_at) }}</td>
              <td class="px-4 py-3 text-gray-500">{{ b.reason || '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="deleteBlock(b.id)" class="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg transition-colors">Remove</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Block Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <h3 class="font-bold text-gray-900 text-lg mb-4">Add Block</h3>

        <div class="space-y-4">
          <!-- Resource selector -->
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Resource *</label>
            <select v-model="form.resource_id" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="">🏟 Facility-Wide (blocks everything)</option>
              <option v-for="r in resources" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Reason</label>
            <select v-model="form.reason" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="Maintenance">🔧 Maintenance</option>
              <option value="Private Event">🎉 Private Event</option>
              <option value="Holiday">🗓 Holiday / Closed</option>
              <option value="Staff Training">📚 Staff Training</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <!-- All Day toggle -->
          <label class="flex items-center gap-3 cursor-pointer">
            <div class="relative">
              <input type="checkbox" v-model="form.all_day" class="sr-only peer" />
              <div class="w-10 h-5 bg-gray-300 peer-checked:bg-red-500 rounded-full transition-colors cursor-pointer" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span class="text-sm font-medium text-gray-700">All Day</span>
          </label>

          <!-- Date/Time range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Start Date *</label>
              <input type="date" v-model="form.startDate" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
            <div v-if="!form.all_day">
              <label class="block text-xs font-bold text-gray-500 mb-1">Start Time *</label>
              <input type="time" v-model="form.startTime" step="3600" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">End Date *</label>
              <input type="date" v-model="form.endDate" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
            <div v-if="!form.all_day">
              <label class="block text-xs font-bold text-gray-500 mb-1">End Time *</label>
              <input type="time" v-model="form.endTime" step="3600" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
          </div>
        </div>

        <div v-if="formError" class="mt-3 text-red-500 text-xs">{{ formError }}</div>

        <div class="flex gap-3 mt-5">
          <button @click="showForm = false" class="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button @click="submitBlock" :disabled="submitting" class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors">
            {{ submitting ? 'Saving...' : 'Add Block' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Block Time — Admin' })

const blocks = ref<any[]>([])
const pending = ref(false)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')

const resources = [
  { id: 'cage-1', name: '🏏 Cage 1' },
  { id: 'cage-2', name: '🏏 Cage 2' },
  { id: 'cage-3', name: '🏏 Cage 3' },
  { id: 'cage-4', name: '🏏 Cage 4' },
  { id: 'half-turf', name: '⚽ Half Turf' },
  { id: 'full-turf', name: '⚽ Full Turf' },
]

const form = reactive({
  resource_id: '',
  reason: 'Maintenance',
  all_day: false,
  startDate: new Date().toISOString().split('T')[0],
  startTime: '06:00',
  endDate: new Date().toISOString().split('T')[0],
  endTime: '22:00',
})

async function fetchBlocks() {
  pending.value = true
  blocks.value = await $fetch<any[]>('/api/admin/blocks')
  pending.value = false
}
fetchBlocks()

async function submitBlock() {
  formError.value = ''
  if (!form.startDate || !form.endDate) { formError.value = 'Start and end dates are required.'; return }

  const start_at = form.all_day ? `${form.startDate}T00:00:00Z` : `${form.startDate}T${form.startTime}:00Z`
  const end_at = form.all_day ? `${form.endDate}T23:59:59Z` : `${form.endDate}T${form.endTime}:00Z`

  submitting.value = true
  try {
    await $fetch('/api/admin/blocks', {
      method: 'POST',
      body: { start_at, end_at, resource_id: form.resource_id || null, reason: form.reason, all_day: form.all_day }
    })
    showForm.value = false
    await fetchBlocks()
  } catch (e: any) {
    formError.value = e?.data?.statusMessage || 'Failed to save block.'
  } finally {
    submitting.value = false
  }
}

async function deleteBlock(id: string) {
  if (!confirm('Remove this block? Customers will be able to book that time again.')) return
  // Use service role delete via bookings route — blocks are in blocked_times table
  // For now, call a simple supabase delete from the client via admin API
  await $fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' }).catch(() => null)
  await fetchBlocks()
}

function resourceLabel(id: string) {
  return resources.find(r => r.id === id)?.name ?? id
}

function fmtDateTime(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
}
</script>

<style scoped>
.btn-admin-primary {
  @apply bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm;
}
</style>
