<template>
  <div class="min-h-screen bg-dark pt-32 pb-20">
    <div class="section-container">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="heading-md text-white mb-2">Schedule Management</h1>
          <p class="text-gray-400">View and manage all facility reservations.</p>
        </div>
        <button @click="logout" class="btn-secondary py-2 px-4">Log Out</button>
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
                    {{ b.profiles?.full_name || b.profiles?.email || 'User ' + b.user_id.substring(0,6) }}
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

const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const bookings = ref<any[]>([])
const isAdmin = ref(false)

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
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const formatTime = (isoString: string) => {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const cancelBooking = async (id: string) => {
  if (!confirm('Are you sure you want to cancel this booking?')) return
  
  // Here we would call a DELETE or PUT /api/admin/bookings/[id] route.
  // For the sake of the prototype without setting up more API routes, we can just update it via Supabase directly if RLS allows,
  // but usually we should use an API. 
  // Let's implement a quick mock update if RLS allows, or alert that API is needed.
  try {
    const { error: cancelError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      
    if (cancelError) throw cancelError
    
    // Refresh
    fetchBookings()
  } catch (e: any) {
    alert('Failed to cancel: ' + e.message + '. (You may need to configure Row Level Security)')
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>
