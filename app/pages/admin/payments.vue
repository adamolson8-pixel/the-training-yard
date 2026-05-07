<template>
  <div class="p-6 md:p-8">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
        <p class="text-gray-500 text-sm mt-0.5">Full financial log · {{ total }} records</p>
      </div>
      <button @click="exportCSV" class="flex items-center gap-2 text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 rounded-lg shadow-sm transition-colors">
        ⬇ Export CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-5 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">Status</label>
        <select v-model="filterStatus" @change="page = 1; fetchPayments()"
          class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
          <option value="all">All</option>
          <option value="paid">Paid</option>
          <option value="refunded">Refunded</option>
          <option value="partially_refunded">Partial Refund</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">From</label>
        <input type="date" v-model="filterFrom" @change="page = 1; fetchPayments()" class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" style="color-scheme:light" />
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs font-bold text-gray-500">To</label>
        <input type="date" v-model="filterTo" @change="page = 1; fetchPayments()" class="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none" style="color-scheme:light" />
      </div>
      <button @click="filterStatus = 'all'; filterFrom = ''; filterTo = ''; page = 1; fetchPayments()"
        class="text-xs text-gray-400 hover:text-gray-600">Reset</button>
      <div class="ml-auto text-sm font-bold text-gray-700">Total: ${{ totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
    </div>

    <!-- Table -->
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Date</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Customer</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Service</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Amount</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
              <th class="text-left px-4 py-3 font-semibold text-gray-600">Stripe ID</th>
              <th class="text-right px-4 py-3 font-semibold text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="pending"><td colspan="7" class="py-12 text-center text-gray-400">Loading...</td></tr>
            <tr v-else-if="!payments.length"><td colspan="7" class="py-12 text-center text-gray-400">No payments found.</td></tr>
            <tr v-for="p in payments" :key="p.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-gray-600 whitespace-nowrap">{{ fmtDate(p.created_at) }}</td>
              <td class="px-4 py-3">
                <div class="font-medium text-gray-800">{{ p.profiles?.full_name || '—' }}</div>
                <div class="text-gray-400 text-xs">{{ p.profiles?.email }}</div>
              </td>
              <td class="px-4 py-3 text-gray-700">{{ p.bookings?.service_label || '—' }}</td>
              <td class="px-4 py-3 text-right font-bold" :class="p.amount_cents < 0 ? 'text-red-500' : 'text-amber-600'">
                {{ p.amount_cents < 0 ? '-' : '' }}${{ Math.abs((p.amount_cents || 0) / 100).toFixed(2) }}
              </td>
              <td class="px-4 py-3">
                <span class="px-2 py-0.5 rounded-full text-xs font-bold" :class="statusBadge(p.status)">{{ p.status }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="text-gray-400 text-xs font-mono">{{ p.stripe_payment_intent_id?.slice(0, 20) }}...</span>
              </td>
              <td class="px-4 py-3 text-right">
                <button
                  v-if="p.status === 'paid'"
                  @click="openRefund(p)"
                  class="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
                >
                  Refund
                </button>
                <span v-else class="text-gray-300 text-xs">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Pagination -->
      <div class="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <span>Page {{ page }} · {{ total }} total</span>
        <div class="flex gap-2">
          <button :disabled="page <= 1" @click="page--; fetchPayments()" class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Prev</button>
          <button :disabled="(page * 50) >= total" @click="page++; fetchPayments()" class="px-3 py-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Next →</button>
        </div>
      </div>
    </div>

    <!-- Refund Modal -->
    <div v-if="refundTarget" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div class="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
        <h3 class="font-bold text-gray-900 text-lg mb-2">Issue Refund</h3>
        <p class="text-gray-500 text-sm mb-1">Customer: <strong class="text-gray-800">{{ refundTarget.profiles?.full_name || refundTarget.profiles?.email }}</strong></p>
        <p class="text-gray-500 text-sm mb-4">Original amount: <strong class="text-gray-800">${{ (refundTarget.amount_cents / 100).toFixed(2) }}</strong></p>
        <div class="mb-4">
          <label class="block text-xs font-bold text-gray-500 mb-1">Refund Amount (leave blank for full refund)</label>
          <div class="flex items-center gap-2">
            <span class="text-gray-500">$</span>
            <input v-model="refundAmount" type="number" step="0.01" :placeholder="(refundTarget.amount_cents / 100).toFixed(2)"
              class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
          </div>
        </div>
        <div v-if="refundError" class="text-red-500 text-xs mb-3">{{ refundError }}</div>
        <div class="flex gap-3">
          <button @click="refundTarget = null; refundAmount = ''" class="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
          <button @click="processRefund" :disabled="refunding" class="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
            {{ refunding ? 'Processing...' : 'Confirm Refund' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Payments — Admin' })

const payments = ref<any[]>([])
const total = ref(0)
const pending = ref(false)
const page = ref(1)
const filterStatus = ref('all')
const filterFrom = ref('')
const filterTo = ref('')
const refundTarget = ref<any>(null)
const refundAmount = ref('')
const refunding = ref(false)
const refundError = ref('')

const totalRevenue = computed(() =>
  payments.value.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_cents || 0), 0) / 100
)

async function fetchPayments() {
  pending.value = true
  const data = await $fetch<any>('/api/admin/payments', {
    query: { page: page.value, limit: 50, status: filterStatus.value, date_from: filterFrom.value, date_to: filterTo.value }
  })
  payments.value = data.payments || []
  total.value = data.total || 0
  pending.value = false
}
fetchPayments()

function openRefund(p: any) { refundTarget.value = p; refundAmount.value = ''; refundError.value = '' }

async function processRefund() {
  if (!refundTarget.value) return
  refunding.value = true
  refundError.value = ''
  try {
    const body: any = {}
    if (refundAmount.value) body.amount_cents = Math.round(parseFloat(refundAmount.value) * 100)
    await $fetch(`/api/admin/payments/${refundTarget.value.id}/refund`, { method: 'POST', body })
    refundTarget.value = null
    refundAmount.value = ''
    await fetchPayments()
  } catch (e: any) {
    refundError.value = e?.data?.statusMessage || 'Refund failed. Check Stripe dashboard.'
  } finally {
    refunding.value = false
  }
}

function exportCSV() {
  const rows = [
    ['Date', 'Customer', 'Email', 'Service', 'Amount', 'Status', 'Stripe ID'],
    ...payments.value.map(p => [
      fmtDate(p.created_at),
      p.profiles?.full_name || '',
      p.profiles?.email || '',
      p.bookings?.service_label || '',
      ((p.amount_cents || 0) / 100).toFixed(2),
      p.status,
      p.stripe_payment_intent_id || '',
    ])
  ]
  const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `training-yard-payments-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

function statusBadge(s: string) {
  if (s === 'paid') return 'bg-green-100 text-green-700'
  if (s === 'refunded') return 'bg-blue-100 text-blue-700'
  if (s === 'partially_refunded') return 'bg-purple-100 text-purple-700'
  if (s === 'failed') return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-500'
}
function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>
