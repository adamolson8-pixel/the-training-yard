<template>
  <div class="p-6 md:p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Waivers</h1>
      <p class="text-gray-500 text-sm mt-0.5">Track liability waiver status for all users.</p>
    </div>

    <!-- Stats + filter -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">Filter</label>
        <select v-model="filterSigned" @change="filterUsers()"
          class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All</option>
          <option value="signed">Signed</option>
          <option value="pending">Pending</option>
        </select>
      </div>
      <div class="ml-auto flex gap-3 text-xs font-bold">
        <span class="px-3 py-1 rounded-full bg-green-100 text-green-700">{{ signedCount }} Signed</span>
        <span class="px-3 py-1 rounded-full bg-amber-100 text-amber-700">{{ pendingCount }} Pending</span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">User</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Signed At</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Override By</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="5" class="py-12 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!filteredUsers.length"><td colspan="5" class="py-12 text-center text-gray-400">No records.</td></tr>
            <tr v-for="u in filteredUsers" :key="u.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-semibold text-gray-800">{{ u.full_name || '—' }}</div>
                <div class="text-gray-400 text-xs">{{ u.email }}</div>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="u.waiver_signed ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'">
                  {{ u.waiver_signed ? '✓ Signed' : '✗ Pending' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ u.waiver_signed_at ? fmtDate(u.waiver_signed_at) : '—' }}</td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ u.waiver_override_by ? 'Admin override' : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="!u.waiver_signed"
                  @click="approveWaiver(u)"
                  :disabled="approvingId === u.id"
                  class="text-xs font-bold text-amber-600 hover:text-amber-800 border border-amber-200 hover:border-amber-400 px-3 py-1 rounded-lg transition-colors"
                >
                  {{ approvingId === u.id ? '...' : '✓ Mark Signed' }}
                </button>
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Waivers — Admin' })

const allUsers = ref<any[]>([])
const pending = ref(false)
const filterSigned = ref('')
const approvingId = ref<string | null>(null)

const filteredUsers = computed(() => {
  if (!filterSigned.value) return allUsers.value
  if (filterSigned.value === 'signed') return allUsers.value.filter(u => u.waiver_signed)
  return allUsers.value.filter(u => !u.waiver_signed)
})
const signedCount = computed(() => allUsers.value.filter(u => u.waiver_signed).length)
const pendingCount = computed(() => allUsers.value.filter(u => !u.waiver_signed).length)
function filterUsers() {} // triggers computed

async function fetchUsers() {
  pending.value = true
  const data = await $fetch<any>('/api/admin/users', { query: { limit: 100 } })
  allUsers.value = data.users || []
  pending.value = false
}
fetchUsers()

async function approveWaiver(u: any) {
  if (!confirm(`Mark waiver as signed for ${u.full_name || u.email}? (Paper copy received in person)`)) return
  approvingId.value = u.id
  try {
    await $fetch(`/api/admin/waivers/${u.id}`, { method: 'PATCH' })
    const idx = allUsers.value.findIndex(x => x.id === u.id)
    if (idx !== -1) {
      allUsers.value[idx].waiver_signed = true
      allUsers.value[idx].waiver_signed_at = new Date().toISOString()
      allUsers.value[idx].waiver_override_by = 'admin'
    }
  } catch {
    alert('Failed to update waiver status.')
  } finally {
    approvingId.value = null
  }
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
