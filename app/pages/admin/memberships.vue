<template>
  <div class="p-6 md:p-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Memberships</h1>
      <p class="text-gray-500 text-sm mt-0.5">All user subscription statuses synced from Stripe.</p>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">Status</label>
        <select v-model="filterStatus" @change="page = 1; fetchUsers()"
          class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="past_due">Past Due</option>
          <option value="canceled">Canceled</option>
          <option value="none">No Membership</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">Type</label>
        <select v-model="filterType" @change="page = 1; fetchUsers()"
          class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none">
          <option value="">All Types</option>
          <option value="individual">Individual ($89/mo)</option>
          <option value="family">Family ($129/mo)</option>
          <option value="team_vip_standard">Team VIP Standard</option>
          <option value="team_vip_full">Team VIP Full Facility</option>
        </select>
      </div>
      <!-- Stats badges -->
      <div class="ml-auto flex gap-3 text-xs font-bold">
        <span class="px-3 py-1 rounded-full bg-green-100 text-green-700">{{ stats.active }} Active</span>
        <span class="px-3 py-1 rounded-full bg-red-100 text-red-700">{{ stats.past_due }} Past Due</span>
        <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-500">{{ stats.none }} No Plan</span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Member</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Expires</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Stripe</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="5" class="py-12 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!users.length"><td colspan="5" class="py-12 text-center text-gray-400">No records found.</td></tr>
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50">
              <td class="px-4 py-3">
                <div class="font-semibold text-gray-800">{{ u.full_name || '—' }}</div>
                <div class="text-gray-400 text-xs">{{ u.email }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600 text-xs">{{ planLabel(u.membership_type) }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusBadge(u.membership_status)">
                  {{ u.membership_status || 'none' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ u.membership_expires ? fmtDate(u.membership_expires) : '—' }}</td>
              <td class="px-4 py-3">
                <span v-if="u.stripe_subscription_id" class="text-gray-400 text-xs font-mono">{{ u.stripe_subscription_id.slice(0, 14) }}...</span>
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <span>Page {{ page }} · {{ total }} total</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--; fetchUsers()" class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <button :disabled="(page * 25) >= total" @click="page++; fetchUsers()" class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Memberships — Admin' })

const users = ref<any[]>([])
const total = ref(0)
const pending = ref(false)
const page = ref(1)
const filterStatus = ref('')
const filterType = ref('')

const stats = computed(() => ({
  active: users.value.filter(u => u.membership_status === 'active').length,
  past_due: users.value.filter(u => u.membership_status === 'past_due').length,
  none: users.value.filter(u => !u.membership_status || u.membership_status === 'none').length,
}))

async function fetchUsers() {
  pending.value = true
  const data = await $fetch<any>('/api/admin/users', { query: { page: page.value, limit: 25 } })
  let all = data.users || []
  if (filterStatus.value) all = all.filter((u: any) => (u.membership_status || 'none') === filterStatus.value)
  if (filterType.value) all = all.filter((u: any) => u.membership_type === filterType.value)
  users.value = all
  total.value = data.total || 0
  pending.value = false
}
fetchUsers()

const planMap: Record<string, string> = {
  individual: 'Individual — $89/mo',
  family: 'Family — $129/mo',
  team_vip_standard: 'Team VIP Standard',
  team_vip_full: 'Team VIP Full Facility',
}
function planLabel(t: string) { return t ? (planMap[t] ?? t) : '—' }
function statusBadge(s: string) {
  if (s === 'active') return 'bg-green-100 text-green-700'
  if (s === 'past_due') return 'bg-red-100 text-red-700'
  if (s === 'canceled') return 'bg-gray-100 text-gray-500'
  return 'bg-gray-100 text-gray-400'
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
</script>
