<template>
  <div class="min-h-screen bg-dark pt-32 pb-20">
    <div class="section-container">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="heading-md text-white mb-2">Schedule Management</h1>
          <p class="text-gray-400">View and manage all facility reservations.</p>
        </div>
        <div class="flex gap-4">
          <button v-if="isAdmin" @click="showBlockModal = true" class="btn-primary py-2 px-4">Block Time</button>
          <button @click="logout" class="btn-secondary py-2 px-4">Log Out</button>
        </div>
      </div>

      <div v-if="loading" class="text-center py-12 text-gray-400">
        <div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        Loading bookings...
      </div>

      <div v-else-if="error" class="bg-primary/10 border border-primary/20 text-primary p-6 rounded-xl">
        {{ error }}
      </div>

      <div v-else>
        <div class="glass-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-white/5 border-b border-white/10">
                  <th class="p-4 font-semibold text-white text-sm">Date & Time</th>
                  <th class="p-4 font-semibold text-white text-sm">Resource</th>
                  <th class="p-4 font-semibold text-white text-sm">User</th>
                  <th class="p-4 font-semibold text-white text-sm">Status</th>
                  <th class="p-4 font-semibold text-white text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr v-for="b in bookings" :key="b.id" class="hover:bg-white/5 transition-colors">
                  <td class="p-4 text-sm text-gray-300">
                    <div>{{ formatDate(b.start_time) }}</div>
                    <div class="text-xs text-gray-500">{{ formatTime(b.start_time) }} - {{ formatTime(b.end_time) }}</div>
                  </td>
                  <td class="p-4 text-sm text-white font-medium capitalize">
                    {{ b.resource_id.replace('-', ' ') }}
                  </td>
                  <td class="p-4 text-sm text-gray-300">
                    <span v-if="b.user_id === user?.id && b.status === 'confirmed' && isAdmin" class="text-primary font-medium">ADMIN BLOCK</span>
                    <span v-else>{{ b.profiles?.full_name || b.profiles?.email || 'User ' + b.user_id.substring(0,6) }}</span>
                  </td>
                  <td class="p-4 text-sm">
                    <span class="px-2 py-1 rounded-md text-xs font-medium" :class="b.status === 'confirmed' ? 'bg-turf/20 text-turf' : 'bg-gray-800 text-gray-400'">
                      {{ b.status }}
                    </span>
                  </td>
                  <td class="p-4 text-sm text-right">
                    <button v-if="isAdmin && b.status === 'confirmed'" @click="cancelBooking(b.id)" class="text-primary hover:text-red-400 transition-colors text-xs font-semibold">
                      Cancel
                    </button>
                    <span v-else-if="!isAdmin" class="text-xs text-gray-500">Read-only</span>
                  </td>
                </tr>
                <tr v-if="bookings.length === 0">
                  <td colspan="5" class="p-8 text-center text-gray-500">No bookings found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Block Time Modal -->
    <div v-if="showBlockModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="glass-card p-6 md:p-8 max-w-md w-full">
        <h3 class="font-display text-2xl font-bold text-white mb-2">Block Off Time</h3>
        <p class="text-gray-400 mb-6 text-sm">This prevents customers from booking this specific resource and time slot.</p>
        
        <div class="space-y-4 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Resource</label>
            <select v-model="blockForm.resource_id" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary">
              <option value="single-cage">Single Cage</option>
              <option value="two-cage">Two Cages</option>
              <option value="half-turf">Half Turf</option>
              <option value="full-turf">Full Turf</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Date</label>
            <input type="date" v-model="blockForm.date" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" style="color-scheme: dark;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Start Time</label>
            <input type="time" v-model="blockForm.time" step="3600" class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary" style="color-scheme: dark;">
          </div>
        </div>

        <div v-if="blockError" class="text-primary text-sm mb-4 bg-primary/10 p-3 rounded-lg">{{ blockError }}</div>

        <div class="flex gap-3">
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors" @click="showBlockModal = false" :disabled="blockInProgress">Cancel</button>
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-red-600 transition-all disabled:opacity-50" @click="submitBlockTime" :disabled="blockInProgress || !blockForm.date || !blockForm.time">
            <span v-if="blockInProgress">Blocking...</span>
            <span v-else>Confirm Block</span>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
// Protect route
definePageMeta({
  middleware: [
    function (to, from) {
      const user = useSupabaseUser()
      if (!user.value) {
        return navigateTo('/login')
      }
    }
  ]
})

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const bookings = ref<any[]>([])
const isAdmin = ref(false)

// Block Time Modal State
const showBlockModal = ref(false)
const blockInProgress = ref(false)
const blockError = ref('')
const blockForm = ref({
  resource_id: 'single-cage',
  date: '',
  time: '06:00'
})

const fetchBookings = async () => {
  try {
    const data = await $fetch('/api/admin/bookings')
    if ((data as any).error) throw new Error((data as any).error)
    bookings.value = (data as any).bookings || []
    isAdmin.value = (data as any).isAdmin || false
  } catch (e: any) {
    error.value = e.message || 'Failed to load bookings'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBookings()
})

const formatDate = (isoString: string) => {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

const formatTime = (isoString: string) => {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
}

const cancelBooking = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this booking/block?')) return
  try {
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      
    if (cancelError) throw cancelError
    fetchBookings()
  } catch (e: any) {
    alert('Failed to cancel: ' + e.message)
  }
}

const submitBlockTime = async () => {
  blockInProgress.value = true
  blockError.value = ''
  
  try {
    // Format the date/time string as ISO
    const rawTime = `${blockForm.value.date}T${blockForm.value.time}:00Z`
    
    // We reuse the public booking endpoint but because the admin is logged in, it acts as their booking.
    // To distinguish it visually in the list, we look for bookings made by the admin user.
    await $fetch('/api/bookings', {
      method: 'POST',
      body: {
        resource_id: blockForm.value.resource_id,
        start_time: rawTime
      }
    })
    
    showBlockModal.value = false
    blockForm.value = { resource_id: 'single-cage', date: '', time: '06:00' }
    fetchBookings()
  } catch (e: any) {
    blockError.value = e.data?.statusMessage || e.message || 'Failed to block time slot. It may already be booked.'
  } finally {
    blockInProgress.value = false
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>
