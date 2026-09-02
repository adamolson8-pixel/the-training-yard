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
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Related To</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="6" class="py-10 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!rows.length"><td colspan="6" class="py-10 text-center text-gray-400">No blocks set. The facility is fully open.</td></tr>
            <template v-for="row in rows" :key="row.key">
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                    :class="row.block.resource_id ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'">
                    {{ row.block.resource_id ? resourceLabel(row.block.resource_id) : '🏟 Facility-Wide' }}
                  </span>
                  <div v-if="row.kind === 'series'" class="mt-1 text-[11px] font-bold text-gray-500">
                    🔁 {{ seriesDays(row) }} · {{ occurrenceTimeRange(row.block) }}
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-700 whitespace-nowrap">{{ fmtDateTime(row.block.start_at) }}</td>
                <td class="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {{ fmtDateTime(row.kind === 'series' ? row.occurrences[row.occurrences.length - 1].end_at : row.block.end_at) }}
                </td>
                <td class="px-4 py-3 text-gray-500">
                  {{ row.block.reason || '—' }}
                  <div v-if="row.kind === 'series'" class="text-[11px] text-gray-400 mt-0.5">
                    {{ row.occurrences.length }} dates · {{ upcomingCount(row) }} upcoming
                  </div>
                </td>
                <td class="px-4 py-3 text-gray-500 text-xs">{{ relationLabel(row.block) }}</td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button v-if="row.kind === 'series'" @click="toggleSeries(row.key)" class="text-xs font-bold text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1 rounded-lg mr-2 transition-colors">
                    {{ expanded.has(row.key) ? 'Hide dates' : 'Dates' }}
                  </button>
                  <button
                    @click="row.kind === 'series' ? deleteSeries(row) : deleteBlock(row.block.id)"
                    class="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 px-3 py-1 rounded-lg transition-colors">
                    {{ row.kind === 'series' ? 'Remove series' : 'Remove' }}
                  </button>
                </td>
              </tr>
              <tr v-if="row.kind === 'series' && expanded.has(row.key)" class="bg-gray-50/70">
                <td colspan="6" class="px-4 py-3">
                  <div class="grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                    <div v-for="occurrence in row.occurrences" :key="occurrence.id"
                      class="flex items-center justify-between gap-3 text-xs bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                      :class="isPast(occurrence) ? 'text-gray-400' : 'text-gray-700'">
                      <span>{{ fmtDate(occurrence.start_at) }} · {{ occurrenceTimeRange(occurrence) }}</span>
                      <button @click="deleteBlock(occurrence.id)" class="font-bold text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Block Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
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

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Related account</label>
              <select v-model="form.user_id" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"><option value="">None</option><option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name || u.email }}</option></select>
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">Related team</label>
              <select v-model="form.team_id" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"><option value="">None</option><option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option></select>
            </div>
          </div>

          <!-- Reason -->
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1">Reason</label>
            <select v-model="form.reason" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
              <option value="Team Reservation">🥎 Team Reservation</option>
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

          <!-- Repeat weekly toggle -->
          <label class="flex items-center gap-3 cursor-pointer">
            <div class="relative">
              <input type="checkbox" v-model="form.repeat" class="sr-only peer" />
              <div class="w-10 h-5 bg-gray-300 peer-checked:bg-red-500 rounded-full transition-colors cursor-pointer" />
              <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span class="text-sm font-medium text-gray-700">Repeat weekly</span>
          </label>

          <!-- Date/Time range -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">{{ form.repeat ? 'First Date *' : 'Start Date *' }}</label>
              <input type="date" v-model="form.startDate" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
            <div v-if="!form.all_day">
              <label class="block text-xs font-bold text-gray-500 mb-1">Start Time *</label>
              <input type="time" v-model="form.startTime" step="3600" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-gray-500 mb-1">{{ form.repeat ? 'Repeat Until *' : 'End Date *' }}</label>
              <input type="date" :value="form.repeat ? form.repeatUntil : form.endDate"
                @input="onEndDateInput(($event.target as HTMLInputElement).value)"
                class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
            <div v-if="!form.all_day">
              <label class="block text-xs font-bold text-gray-500 mb-1">End Time *</label>
              <input type="time" v-model="form.endTime" step="3600" class="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" style="color-scheme:light" />
            </div>
          </div>

          <!-- Weekly pattern -->
          <div v-if="form.repeat">
            <label class="block text-xs font-bold text-gray-500 mb-1">Repeat on *</label>
            <div class="flex flex-wrap gap-1.5">
              <button v-for="(label, index) in weekdayLabels" :key="index" type="button" @click="toggleDay(index)"
                :aria-pressed="form.repeatDays.includes(index)" :aria-label="`Repeat on ${label}`"
                class="w-11 py-1.5 rounded-lg text-xs font-bold border transition-colors"
                :class="form.repeatDays.includes(index) ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'">
                {{ label }}
              </button>
            </div>
            <p class="text-[11px] text-gray-400 mt-2">
              {{ form.all_day ? 'Blocks each selected day in full.' : 'Blocks the same time window on every selected day.' }}
              Removing the series later takes them all out at once.
            </p>
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
import { FACILITY_RESOURCES } from '~~/lib/facilityResources.mjs'

definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Block Time — Admin' })

const FACILITY_TIME_ZONE = 'America/Chicago'
const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const blocks = ref<any[]>([])
const pending = ref(false)
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const users = ref<any[]>([])
const teams = ref<any[]>([])
const expanded = ref(new Set<string>())

const resources = FACILITY_RESOURCES

const form = reactive({
  resource_id: '',
  reason: 'Team Reservation',
  user_id: '',
  team_id: '',
  all_day: false,
  repeat: false,
  repeatDays: [] as number[],
  repeatUntil: '',
  startDate: new Date().toISOString().split('T')[0],
  startTime: '06:00',
  endDate: new Date().toISOString().split('T')[0],
  endTime: '22:00',
})

/** One row per one-off block, and one row per repeat series. */
const rows = computed(() => {
  const series = new Map<string, any[]>()
  const list: any[] = []
  for (const block of blocks.value) {
    if (!block.recurrence_id) {
      list.push({ kind: 'single', key: block.id, block, occurrences: [block] })
      continue
    }
    const group = series.get(block.recurrence_id) || []
    group.push(block)
    series.set(block.recurrence_id, group)
  }
  for (const [recurrenceId, group] of series) {
    const occurrences = [...group].sort((a, b) => String(a.start_at).localeCompare(String(b.start_at)))
    list.push({ kind: 'series', key: recurrenceId, block: occurrences[0], occurrences })
  }
  return list.sort((a, b) => String(a.block.start_at).localeCompare(String(b.block.start_at)))
})

async function fetchBlocks() {
  pending.value = true
  const [blockData, userData, teamData] = await Promise.all([
    $fetch<any[]>('/api/admin/blocks'),
    $fetch<any>('/api/admin/users', { query: { limit: 1000 } }),
    $fetch<any>('/api/admin/teams'),
  ])
  blocks.value = blockData
  users.value = userData.users || []
  teams.value = teamData.teams || []
  pending.value = false
}
fetchBlocks()

function toggleDay(index: number) {
  const position = form.repeatDays.indexOf(index)
  if (position === -1) form.repeatDays.push(index)
  else form.repeatDays.splice(position, 1)
}

function onEndDateInput(value: string) {
  if (form.repeat) form.repeatUntil = value
  else form.endDate = value
}

function toggleSeries(key: string) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
}

async function submitBlock() {
  formError.value = ''
  if (!form.startDate) { formError.value = 'A start date is required.'; return }
  if (form.repeat) {
    if (!form.repeatDays.length) { formError.value = 'Choose at least one day of the week.'; return }
    if (!form.repeatUntil) { formError.value = 'A repeat-until date is required.'; return }
  } else if (!form.endDate) {
    formError.value = 'Start and end dates are required.'
    return
  }

  submitting.value = true
  try {
    await $fetch('/api/admin/blocks', {
      method: 'POST',
      body: {
        start_date: form.startDate, start_time: form.startTime,
        end_date: form.repeat ? form.startDate : form.endDate, end_time: form.endTime,
        resource_id: form.resource_id || null, reason: form.reason, all_day: form.all_day,
        user_id: form.user_id || null, team_id: form.team_id || null,
        repeat: form.repeat ? { days_of_week: form.repeatDays, until: form.repeatUntil } : null,
      }
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
  await $fetch(`/api/admin/blocks/${id}`, { method: 'DELETE' }).catch(() => null)
  await fetchBlocks()
}

async function deleteSeries(row: any) {
  if (!confirm(`Remove all ${row.occurrences.length} dates in this repeating block? Customers will be able to book those times again.`)) return
  await $fetch(`/api/admin/blocks/series/${row.key}`, { method: 'DELETE' }).catch(() => null)
  await fetchBlocks()
}

function resourceLabel(id: string) {
  return resources.find(r => r.id === id)?.name ?? id
}

function fmtDateTime(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: FACILITY_TIME_ZONE })
}

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: FACILITY_TIME_ZONE })
}

function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: FACILITY_TIME_ZONE })
}

function occurrenceTimeRange(block: any) {
  if (block.all_day) return 'All day'
  return `${fmtTime(block.start_at)}–${fmtTime(block.end_at)}`
}

function seriesDays(row: any) {
  const indexes = new Set<number>()
  for (const occurrence of row.occurrences) {
    const label = new Date(occurrence.start_at).toLocaleDateString('en-US', { weekday: 'short', timeZone: FACILITY_TIME_ZONE })
    const index = weekdayLabels.indexOf(label)
    if (index !== -1) indexes.add(index)
  }
  return [...indexes].sort((a, b) => a - b).map(index => weekdayLabels[index]).join(', ')
}

function isPast(block: any) {
  return new Date(block.end_at).getTime() <= Date.now()
}

function upcomingCount(row: any) {
  return row.occurrences.filter((occurrence: any) => !isPast(occurrence)).length
}

function relationLabel(block: any) {
  const user = users.value.find(row => row.id === block.user_id)
  const team = teams.value.find(row => row.id === block.team_id)
  return team?.name || user?.full_name || user?.email || '—'
}
</script>

<style scoped>
.btn-admin-primary {
  @apply bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm;
}
</style>
