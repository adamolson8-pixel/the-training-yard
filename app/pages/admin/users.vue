<template>
  <div class="p-6 md:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Users</h1>
        <p class="text-gray-500 text-sm mt-0.5">{{ total }} registered accounts</p>
      </div>
    </div>

    <!-- Search -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5 flex items-center gap-3">
      <span class="text-gray-400">🔍</span>
      <input
        v-model="search"
        type="text"
        placeholder="Search by name, email, or phone..."
        class="flex-1 bg-transparent outline-none text-gray-800 text-sm placeholder-gray-400"
        @input="debouncedFetch"
      />
      <button v-if="search" @click="search = ''; fetchUsers()" class="text-gray-400 hover:text-gray-600 text-xs">Clear</button>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Name / Email</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Phone</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Membership</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Waiver</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="6" class="py-12 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!users.length"><td colspan="6" class="py-12 text-center text-gray-400">No users found.</td></tr>
            <tr
              v-for="u in users"
              :key="u.id"
              class="hover:bg-gray-50 cursor-pointer transition-colors"
              @click="openDrawer(u)"
            >
              <td class="px-4 py-3">
                <div class="font-semibold text-gray-800">{{ u.full_name || '—' }}</div>
                <div class="text-gray-400 text-xs">{{ u.email }}</div>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ u.phone || '—' }}</td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="u.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">
                  {{ u.role }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold"
                  :class="membershipBadge(u.membership_status)">
                  {{ u.membership_status || 'none' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="u.waiver_signed ? 'text-green-600' : 'text-amber-500'" class="text-xs font-bold">
                  {{ u.waiver_signed ? '✓ Signed' : '✗ Pending' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ fmtDate(u.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <span>Page {{ page }} · {{ total }} total</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--; fetchUsers()"
            class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <button :disabled="(page * limit) >= total" @click="page++; fetchUsers()"
            class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      </div>
    </div>

    <!-- User Detail Drawer -->
    <Teleport to="body">
      <div v-if="drawer" class="fixed inset-0 z-50 flex" @keydown.esc="drawer = null">
        <div class="absolute inset-0 bg-black/50" @click="drawer = null" />
        <div class="relative ml-auto w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">

          <!-- Drawer Header -->
          <div class="px-6 py-5 border-b border-gray-200 flex items-start justify-between">
            <div>
              <div class="font-bold text-gray-900 text-lg">{{ drawer.full_name || 'Unnamed User' }}</div>
              <div class="text-gray-400 text-sm">{{ drawer.email }}</div>
            </div>
            <button @click="drawer = null" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <div class="flex-1 overflow-y-auto p-6 space-y-6">

            <!-- Profile Info -->
            <section>
              <div class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Profile</div>
              <dl class="grid grid-cols-2 gap-3 text-sm">
                <div><dt class="text-gray-400 text-xs">Phone</dt><dd class="text-gray-800 font-medium">{{ drawer.phone || '—' }}</dd></div>
                <div><dt class="text-gray-400 text-xs">Role</dt>
                  <dd>
                    <select
                      v-model="drawerRole"
                      class="border border-gray-200 rounded-lg px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-400"
                      @change="updateRole"
                    >
                      <option value="customer">customer</option>
                      <option value="admin">admin</option>
                    </select>
                  </dd>
                </div>
                <div><dt class="text-gray-400 text-xs">Membership</dt><dd class="font-medium" :class="membershipColor(drawer.membership_status)">{{ drawer.membership_status || 'none' }}</dd></div>
                <div><dt class="text-gray-400 text-xs">Expires</dt><dd class="text-gray-800 font-medium">{{ drawer.membership_expires ? fmtDate(drawer.membership_expires) : '—' }}</dd></div>
                <div><dt class="text-gray-400 text-xs">Waiver</dt>
                  <dd class="flex items-center gap-2">
                    <span :class="drawer.waiver_signed ? 'text-green-600' : 'text-amber-500'" class="font-bold text-xs">{{ drawer.waiver_signed ? '✓ Signed' : '✗ Pending' }}</span>
                    <button v-if="!drawer.waiver_signed" @click="approveWaiver" :disabled="waiverSaving"
                      class="text-xs bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold px-2 py-0.5 rounded-lg transition-colors">
                      {{ waiverSaving ? '...' : 'Approve' }}
                    </button>
                  </dd>
                </div>
                <div><dt class="text-gray-400 text-xs">Joined</dt><dd class="text-gray-800">{{ fmtDate(drawer.created_at) }}</dd></div>
              </dl>
            </section>

            <!-- Booking History -->
            <section>
              <div class="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Booking History</div>
              <div v-if="drawerBookingsPending" class="text-gray-400 text-sm">Loading...</div>
              <div v-else-if="!drawerBookings.length" class="text-gray-400 text-sm">No bookings yet.</div>
              <div v-else class="space-y-2 max-h-48 overflow-y-auto">
                <div v-for="b in drawerBookings" :key="b.id"
                  class="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-gray-100 text-xs">
                  <div>
                    <div class="font-semibold text-gray-700">{{ b.service_label }}</div>
                    <div class="text-gray-400">{{ b.booking_date }} {{ b.booking_time }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-bold text-amber-600">${{ ((b.amount_cents || 0) / 100).toFixed(0) }}</div>
                    <span class="px-1.5 py-0.5 rounded-full font-bold" :class="b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">{{ b.status }}</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Danger Zone -->
            <section class="border border-red-200 rounded-xl p-4 bg-red-50">
              <div class="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Danger Zone</div>
              <p class="text-gray-500 text-xs mb-3">These actions are permanent and cannot be undone.</p>
              <div class="flex gap-2">
                <button @click="deleteUser"
                  class="flex-1 py-2 text-xs font-bold text-red-600 border border-red-300 bg-white hover:bg-red-50 rounded-lg transition-colors">
                  🗑 Delete Account
                </button>
              </div>
            </section>

          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Users — Admin' })

const search = ref('')
const page = ref(1)
const limit = 25
const users = ref<any[]>([])
const total = ref(0)
const pending = ref(false)
const drawer = ref<any>(null)
const drawerRole = ref('')
const drawerBookings = ref<any[]>([])
const drawerBookingsPending = ref(false)
const waiverSaving = ref(false)

async function fetchUsers() {
  pending.value = true
  const data = await $fetch<any>('/api/admin/users', {
    query: { search: search.value, page: page.value, limit }
  })
  users.value = data.users || []
  total.value = data.total || 0
  pending.value = false
}
fetchUsers()

let debounceTimer: any
function debouncedFetch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; fetchUsers() }, 300)
}

async function openDrawer(u: any) {
  drawer.value = { ...u }
  drawerRole.value = u.role
  drawerBookings.value = []
  drawerBookingsPending.value = true
  const data = await $fetch<any>('/api/admin/bookings', { query: { user_id: u.id } })
  drawerBookings.value = Array.isArray(data) ? data : []
  drawerBookingsPending.value = false
}

async function updateRole() {
  if (!drawer.value) return
  await $fetch(`/api/admin/users/${drawer.value.id}`, { method: 'PATCH', body: { role: drawerRole.value } })
  drawer.value.role = drawerRole.value
  fetchUsers()
}

async function approveWaiver() {
  if (!drawer.value) return
  waiverSaving.value = true
  await $fetch(`/api/admin/waivers/${drawer.value.id}`, { method: 'PATCH' })
  drawer.value.waiver_signed = true
  drawer.value.waiver_signed_at = new Date().toISOString()
  waiverSaving.value = false
  fetchUsers()
}

async function deleteUser() {
  if (!drawer.value) return
  if (!confirm(`Permanently delete ${drawer.value.email}? This cannot be undone.`)) return
  // Note: Supabase user deletion requires service role admin auth API — flag for admin to do in dashboard
  alert('To fully delete a Supabase auth account, go to Supabase Dashboard → Authentication → Users and delete from there. The profile will also need to be removed from the profiles table.')
}

function membershipBadge(status: string) {
  if (status === 'active') return 'bg-green-100 text-green-700'
  if (status === 'past_due') return 'bg-red-100 text-red-700'
  if (status === 'canceled') return 'bg-gray-100 text-gray-500'
  return 'bg-gray-100 text-gray-500'
}
function membershipColor(status: string) {
  if (status === 'active') return 'text-green-600 font-bold'
  if (status === 'past_due') return 'text-red-500 font-bold'
  return 'text-gray-500'
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
