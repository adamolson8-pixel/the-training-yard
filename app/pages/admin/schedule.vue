<template>
  <div class="p-6 md:p-8 bg-gray-50 min-h-full">
    <div class="max-w-full">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="heading-md text-gray-900 mb-2">Schedule Management</h1>
          <p class="text-gray-600">View and manage all facility reservations.</p>
        </div>
        <div class="flex gap-3">
          <button v-if="isAdmin" @click="showBlockModal = true" class="btn-primary py-2 px-4 shadow-md">+ Block Time</button>
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
        <!-- Controls -->
        <div class="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
             <h2 class="text-xl text-gray-900 font-display font-bold">Daily Master Schedule</h2>
             <input type="date" v-model="selectedDate" class="bg-white border border-gray-300 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" style="color-scheme: light;">
          </div>
          <!-- View Toggle -->
          <div class="flex bg-gray-200 rounded-xl p-1 shrink-0 overflow-x-auto">
             <button @click="viewMode = 'daily'" :class="viewMode === 'daily' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap">Daily</button>
             <button @click="viewMode = 'weekly'" :class="viewMode === 'weekly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap">Weekly</button>
             <button @click="viewMode = 'monthly'" :class="viewMode === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap">Monthly</button>
             <button @click="viewMode = 'list'" :class="viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap">List</button>
          </div>
        </div>

        <!-- Universal Filter Bar -->
        <div class="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
           <div class="flex items-center gap-4 w-full md:w-auto">
             <div class="text-sm font-bold text-gray-700 whitespace-nowrap">Filter Resource:</div>
             <select v-model="selectedResourceFilter" class="bg-white border border-gray-200 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary font-medium shadow-sm w-full sm:w-auto">
               <option value="all">Show All Resources</option>
               <option v-for="res in resources" :key="res.id" :value="res.id">{{ res.name }}</option>
             </select>
           </div>
           
           <div v-if="viewMode !== 'list'" class="flex items-center gap-2 bg-gray-200 p-1 rounded-lg w-full md:w-auto">
              <button @click="calendarShowMode = 'bookings'" :class="calendarShowMode === 'bookings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all">Show Bookings</button>
              <button @click="calendarShowMode = 'openings'" :class="calendarShowMode === 'openings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'" class="flex-1 md:flex-none px-4 py-1.5 rounded-md text-sm font-bold transition-all">Show Openings</button>
           </div>
        </div>

        <!-- Master Schedule Grid -->
        <div v-if="viewMode === 'daily'" class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse min-w-[800px] table-fixed">
              <thead>
                <tr>
                  <th class="p-4 bg-gray-50 border-b border-r border-gray-200 text-gray-700 font-bold text-sm w-24">Time</th>
                  <th v-for="res in filteredResources" :key="res.id" class="p-4 bg-gray-50 border-b border-gray-200 text-gray-700 font-bold text-center text-sm">
                    {{ res.name }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="hour in hours" :key="hour">
                  <td class="p-4 border-r border-gray-100 text-gray-500 text-xs font-semibold whitespace-nowrap bg-gray-50/50">
                    {{ formatHourOnly(hour) }}
                  </td>
                  <td v-for="res in filteredResources" :key="res.id" class="p-2 border-r border-gray-100 relative h-[72px] group hover:bg-gray-50 transition-colors" @click="!getBooking(res.id, hour) ? openBlockModalFor(res.id, hour) : null">
                    <!-- If booked -->
                    <div v-if="getBooking(res.id, hour)" class="absolute inset-1 rounded-lg p-2 text-xs flex flex-col justify-center overflow-hidden cursor-pointer shadow-sm" 
                         :class="getBooking(res.id, hour).user_id === user?.id ? 'bg-green-100 border border-green-300 text-green-800' : (getBooking(res.id, hour).status === 'pending' ? 'bg-gray-200 border border-gray-300 text-gray-800' : 'bg-red-50 border border-red-200 text-red-800')" 
                         @click.stop="selectedBooking = getBooking(res.id, hour); showDetailsModal = true">
                       <span class="font-bold truncate text-[11px] sm:text-xs">
                          {{ getBooking(res.id, hour).user_id === user?.id ? 'ADMIN BLOCK' : (getBooking(res.id, hour).status === 'pending' ? '(PENDING) ' : '') + (getBooking(res.id, hour).profiles?.full_name || getBooking(res.id, hour).customer_name || 'Customer') }}
                       </span>
                    </div>
                    <!-- If empty -->
                    <div v-else class="w-full h-full flex items-center justify-center transition-all cursor-pointer" :class="calendarShowMode === 'openings' ? 'bg-blue-50 hover:bg-blue-100 opacity-100 border border-blue-200 rounded-lg absolute inset-1' : 'opacity-0 group-hover:opacity-100'">
                       <span class="text-xs font-bold" :class="calendarShowMode === 'openings' ? 'text-blue-600' : 'text-gray-400'">{{ calendarShowMode === 'openings' ? 'OPEN SLOT' : '+ Block Time' }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Calendar View (FullCalendar) -->
        <div v-else-if="viewMode === 'weekly' || viewMode === 'monthly'" class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden relative z-0">
          <ClientOnly>
            <!-- Use :key to force FullCalendar to re-mount and re-fetch events when toggles change -->
            <FullCalendar :key="viewMode + calendarShowMode + selectedResourceFilter" :options="calendarOptions" class="admin-calendar" />
          </ClientOnly>
        </div>

        <!-- List View -->
        <div v-else class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-gray-50 border-b border-gray-200">
                  <th class="p-4 font-bold text-gray-700 text-sm">Date & Time</th>
                  <th class="p-4 font-bold text-gray-700 text-sm">Resource</th>
                  <th class="p-4 font-bold text-gray-700 text-sm">User</th>
                  <th class="p-4 font-bold text-gray-700 text-sm">Status</th>
                  <th class="p-4 font-bold text-gray-700 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                <tr v-for="b in filteredBookingsList" :key="b.id" class="hover:bg-gray-50 transition-colors">
                  <td class="p-4 text-sm text-gray-800">
                    <div class="font-medium">{{ formatDate(b.start_time) }}</div>
                    <div class="text-xs text-gray-500">{{ formatTime(b.start_time) }} - {{ formatTime(b.end_time) }}</div>
                  </td>
                  <td class="p-4 text-sm text-gray-800 font-bold capitalize">
                    {{ b.resource_id.replace('-', ' ') }}
                  </td>
                  <td class="p-4 text-sm text-gray-700">
                    <span v-if="b.user_id === user?.id && b.status === 'confirmed' && isAdmin" class="text-green-600 font-bold">ADMIN BLOCK</span>
                    <span v-else>{{ b.profiles?.full_name || b.profiles?.email || 'User ' + b.user_id.substring(0,6) }}</span>
                  </td>
                  <td class="p-4 text-sm">
                    <span class="px-2 py-1 rounded-md text-xs font-bold" :class="b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
                      {{ b.status }}
                    </span>
                  </td>
                  <td class="p-4 text-sm text-right">
                    <button v-if="isAdmin && b.status === 'confirmed'" @click="cancelBooking(b.id)" class="text-red-500 hover:text-red-700 transition-colors text-xs font-bold">
                      Cancel
                    </button>
                    <span v-else-if="!isAdmin" class="text-xs text-gray-400">Read-only</span>
                  </td>
                </tr>
                <tr v-if="bookings.length === 0">
                  <td colspan="5" class="p-8 text-center text-gray-500 font-medium">No bookings found.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Block Time Modal -->
    <div v-if="showBlockModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 max-w-md w-full">
        <h3 class="font-display text-2xl font-bold text-gray-900 mb-2">Block Off Time</h3>
        <p class="text-gray-500 mb-6 text-sm font-medium">This prevents customers from booking this specific resource and time slot.</p>
        
        <div class="space-y-4 mb-6">
            <label class="block text-sm font-bold text-gray-700 mb-1">Resources</label>
            <div class="grid grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <label v-for="res in resources" :key="res.id" class="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input type="checkbox" :value="res.id" v-model="blockForm.resource_ids" class="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4">
                {{ res.name }}
              </label>
            </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
              <input type="date" v-model="blockForm.startDate" @change="blockForm.endDate = blockForm.startDate" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" style="color-scheme: light;">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">Start Time</label>
              <input type="time" v-model="blockForm.startTime" @change="updateEndTime" step="3600" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" style="color-scheme: light;">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">End Date</label>
              <input type="date" v-model="blockForm.endDate" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" style="color-scheme: light;">
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-1">End Time</label>
              <input type="time" v-model="blockForm.endTime" step="3600" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary shadow-sm" style="color-scheme: light;">
            </div>
          </div>
        </div>

        <div v-if="blockError" class="text-red-700 font-medium text-sm mb-4 bg-red-50 border border-red-100 p-3 rounded-lg">{{ blockError }}</div>

        <div class="flex gap-3">
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors" @click="showBlockModal = false" :disabled="blockInProgress">Cancel</button>
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-primary hover:bg-red-600 transition-all disabled:opacity-50 shadow-md" @click="submitBlockTime" :disabled="blockInProgress || !blockForm.startDate || !blockForm.startTime || !blockForm.endDate || !blockForm.endTime || blockForm.resource_ids.length === 0">
            <span v-if="blockInProgress">Blocking...</span>
            <span v-else>Confirm Block</span>
          </button>
        </div>
      </div>
  </div>

    <!-- Booking Details Modal -->
    <div v-if="showDetailsModal && selectedBooking" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 max-w-md w-full relative">
        <button @click="showDetailsModal = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h3 class="font-display text-2xl font-bold text-gray-900 mb-1">Booking Details</h3>
        <p class="text-sm font-bold px-2 py-0.5 rounded-full inline-block mb-6" :class="selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'">
          Status: {{ selectedBooking.status.toUpperCase() }}
        </p>
        
        <div class="space-y-4 mb-8">
          <div>
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Resource</div>
            <div class="font-bold text-gray-900 capitalize">{{ selectedBooking.resource_id.replace('-', ' ') }}</div>
          </div>
          <div>
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Time</div>
            <div class="text-gray-900 font-medium">{{ formatDate(selectedBooking.start_time) }}</div>
            <div class="text-gray-600">{{ formatTime(selectedBooking.start_time) }} - {{ formatTime(selectedBooking.end_time) }}</div>
          </div>
          <div v-if="selectedBooking.user_id !== user?.id">
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Customer</div>
            <div class="font-bold text-gray-900">{{ selectedBooking.profiles?.full_name || selectedBooking.customer_name || 'Customer' }}</div>
            <div class="text-gray-600 text-sm">{{ selectedBooking.profiles?.email || selectedBooking.customer_email || 'No email provided' }}</div>
          </div>
          <div v-if="selectedBooking.user_id === user?.id">
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Type</div>
            <div class="font-bold text-green-600">Admin Block</div>
          </div>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button class="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gray-900 hover:bg-gray-800 transition-colors" @click="showDetailsModal = false">Close</button>
          <button v-if="isAdmin" class="py-3 px-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors flex items-center gap-2" @click="cancelBooking(selectedBooking.id); showDetailsModal = false">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

// Protect route — admin only
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})


const user = useSupabaseUser()
const supabase = useSupabaseClient()
const loading = ref(true)
const error = ref('')
const bookings = ref<any[]>([])
const isAdmin = ref(false)

// Grid View State
const viewMode = ref<'daily' | 'weekly' | 'monthly' | 'list'>('daily')
const calendarShowMode = ref<'bookings' | 'openings'>('bookings')
const selectedDate = ref(new Date().toISOString().split('T')[0])
const selectedResourceFilter = ref('all')

const resources = [
  { id: 'cage-1', name: 'Cage 1' },
  { id: 'cage-2', name: 'Cage 2' },
  { id: 'cage-3', name: 'Cage 3' },
  { id: 'cage-4', name: 'Cage 4' },
  { id: 'half-turf', name: 'Half Turf' },
  { id: 'full-turf', name: 'Full Turf' }
]

const filteredResources = computed(() => {
  if (selectedResourceFilter.value === 'all') return resources
  return resources.filter(r => r.id === selectedResourceFilter.value)
})

const filteredBookingsList = computed(() => {
  return bookings.value.filter(b => selectedResourceFilter.value === 'all' || b.resource_id === selectedResourceFilter.value)
})

const hours = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
]

// FullCalendar Setup
const calendarEvents = computed(() => {
  if (calendarShowMode.value === 'bookings') {
    return bookings.value
      .filter(b => selectedResourceFilter.value === 'all' || b.resource_id === selectedResourceFilter.value)
      .filter(b => b.status === 'confirmed' || b.status === 'pending')
      .map(b => {
        const resourceName = b.resource_id.replace('-', ' ').toUpperCase();
        let statusTitle = b.user_id === user.value?.id ? 'ADMIN BLOCK' : (b.profiles?.full_name || b.customer_name || 'Customer');
        if (b.status === 'pending') statusTitle = `(PENDING) ${statusTitle}`
        
        let bgColor = '#dc2626' // red for confirmed customer
        let classNames = ['is-customer']
        
        if (b.user_id === user.value?.id) {
          bgColor = '#16a34a' // green for admin
          classNames = ['is-admin']
        } else if (b.status === 'pending') {
          bgColor = '#9ca3af' // gray for pending
          classNames = ['is-pending']
        }

        return {
          id: b.id,
          title: `${resourceName}: ${statusTitle}`,
          start: b.start_time,
          end: b.end_time,
          backgroundColor: bgColor, 
          borderColor: bgColor,
          classNames: classNames,
          extendedProps: { booking: b }
        }
      })
  } else {
    // Generate Openings
    const openings: any[] = []
    const resourcesToProcess = selectedResourceFilter.value === 'all' ? resources : resources.filter(r => r.id === selectedResourceFilter.value)
    
    // Generate from 14 days ago to 30 days ahead based on selectedDate
    const baseDate = new Date(selectedDate.value)
    baseDate.setUTCHours(0,0,0,0)
    
    const startDay = new Date(baseDate)
    startDay.setUTCDate(startDay.getUTCDate() - 14)
    
    const endDay = new Date(baseDate)
    endDay.setUTCDate(endDay.getUTCDate() + 30)
    
    let current = new Date(startDay.getTime())
    while (current <= endDay) {
      for (let h = 6; h < 22; h++) {
        const slotStart = new Date(current)
        slotStart.setUTCHours(h, 0, 0, 0)
        const slotEnd = new Date(current)
        slotEnd.setUTCHours(h + 1, 0, 0, 0)
        
        resourcesToProcess.forEach(res => {
          const isBooked = bookings.value.some(b => {
            if ((b.status !== 'confirmed' && b.status !== 'pending') || b.resource_id !== res.id) return false
            const bStart = new Date(b.start_time).getTime()
            const bEnd = new Date(b.end_time).getTime()
            return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart
          })
          
          if (!isBooked) {
            openings.push({
              id: `open-${res.id}-${slotStart.getTime()}`,
              title: `OPEN: ${res.name.toUpperCase()}`,
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              backgroundColor: '#3b82f6', 
              borderColor: '#3b82f6',
              classNames: ['is-open'],
              extendedProps: { isOpen: true, resource_id: res.id, start_time: slotStart.toISOString() }
            })
          }
        })
      }
      current.setUTCDate(current.getUTCDate() + 1)
    }
    return openings
  }
})

const handleDateClick = (info: any) => {
  const dateObj = info.date
  const year = dateObj.getFullYear()
  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
  const day = String(dateObj.getDate()).padStart(2, '0')
  const hour = String(dateObj.getHours()).padStart(2, '0')
  const min = String(dateObj.getMinutes()).padStart(2, '0')
  
  const dStr = `${year}-${month}-${day}`
  const tStr = `${hour}:${min}`
  
  let endHour = String(dateObj.getHours() + 1).padStart(2, '0')
  if (endHour === '24') endHour = '00'

  blockForm.value = {
    resource_ids: [selectedResourceFilter.value === 'all' ? 'cage-1' : selectedResourceFilter.value],
    startDate: dStr,
    startTime: tStr,
    endDate: dStr,
    endTime: `${endHour}:${min}`
  }
  showBlockModal.value = true
}

const updateEndTime = () => {
  if (blockForm.value.startTime) {
    const [h, m] = blockForm.value.startTime.split(':')
    const endH = (parseInt(h) + 1).toString().padStart(2, '0')
    blockForm.value.endTime = `${endH === '24' ? '00' : endH}:${m}`
  }
}

const handleEventClick = (info: any) => {
  if (info.event.extendedProps.isOpen) {
    const resId = info.event.extendedProps.resource_id
    const startIso = info.event.extendedProps.start_time
    const dObj = new Date(startIso)
    
    // We treat the ISO string as UTC, so we extract the UTC components to fill the local form inputs
    const dStr = startIso.split('T')[0]
    const tStr = `${String(dObj.getUTCHours()).padStart(2,'0')}:00`
    
    let endHour = String(dObj.getUTCHours() + 1).padStart(2, '0')
    if (endHour === '24') endHour = '00'
    
    blockForm.value = {
      resource_ids: [resId],
      startDate: dStr,
      startTime: tStr,
      endDate: dStr,
      endTime: `${endHour}:00`
    }
    showBlockModal.value = true
  } else {
    // Open Booking Details Modal instead of immediately prompting for delete
    selectedBooking.value = info.event.extendedProps.booking
    showDetailsModal.value = true
  }
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: viewMode.value === 'monthly' ? 'dayGridMonth' : 'timeGridWeek',
  timeZone: 'UTC',
  views: {
    dayGridMonth: {
      eventDisplay: 'block', // Forces solid color blocks in month view only!
      dayMaxEvents: 3 // Only show 3 events per day, hide the rest behind "+X more"
    }
  },
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: '' // Hide internal view buttons, we use our unified toggle
  },
  events: calendarEvents.value,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  slotMinTime: '06:00:00',
  slotMaxTime: '22:00:00',
  height: 'auto',
  allDaySlot: false,
  expandRows: true
}))

// Booking Details Modal State
const showDetailsModal = ref(false)
const selectedBooking = ref<any>(null)

// Block Time Modal State
const showBlockModal = ref(false)
const blockInProgress = ref(false)
const blockError = ref('')
const blockForm = ref({
  resource_ids: ['cage-1'],
  startDate: '',
  startTime: '06:00',
  endDate: '',
  endTime: '21:00'
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

const formatHourOnly = (timeStr: string) => {
  const [h, m] = timeStr.split(':')
  const hourNum = parseInt(h)
  const period = hourNum >= 12 ? 'PM' : 'AM'
  const display = hourNum % 12 || 12
  return `${display}:${m} ${period}`
}

const getBooking = (resourceId: string, hourStr: string) => {
  if (!selectedDate.value) return null
  const cellStart = new Date(`${selectedDate.value}T${hourStr}:00Z`).getTime()
  const cellEnd = cellStart + 60 * 60 * 1000 // 1 hour slot
  
  return bookings.value.find(b => {
    if (b.resource_id !== resourceId || (b.status !== 'confirmed' && b.status !== 'pending')) return false
    const bStart = new Date(b.start_time).getTime()
    const bEnd = new Date(b.end_time).getTime()
    // Overlap math
    return cellStart < bEnd && cellEnd > bStart
  })
}

const openBlockModalFor = (resourceId: string, hourStr: string) => {
  blockForm.value = {
    resource_ids: [resourceId],
    startDate: selectedDate.value,
    startTime: hourStr,
    endDate: selectedDate.value,
    // default 1 hour block
    endTime: `${(parseInt(hourStr.split(':')[0]) + 1).toString().padStart(2, '0')}:00` 
  }
  showBlockModal.value = true
}

const cancelBooking = async (id: string) => {
  if (!confirm('Would you like to delete this booking/block? (To edit a time, delete it first and then click the new time to re-block)')) return
  try {
    await $fetch(`/api/admin/bookings/${id}`, {
      method: 'DELETE'
    })
    fetchBookings()
  } catch (e: any) {
    alert('Failed to delete: ' + (e.data?.message || e.message))
  }
}

const submitBlockTime = async () => {
  blockInProgress.value = true
  blockError.value = ''
  
  try {
    // Format the date/time string as ISO
    const startRaw = `${blockForm.value.startDate}T${blockForm.value.startTime}:00Z`
    const endRaw = `${blockForm.value.endDate}T${blockForm.value.endTime}:00Z`
    
    // Promise.all to handle multiple resource bookings concurrently
    await Promise.all(blockForm.value.resource_ids.map(resId => 
      $fetch('/api/bookings', {
        method: 'POST',
        body: {
          resource_id: resId,
          start_time: startRaw,
          end_time: endRaw
        }
      })
    ))
    
    showBlockModal.value = false
    blockForm.value = { resource_ids: ['cage-1'], startDate: '', startTime: '06:00', endDate: '', endTime: '21:00' }
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

<style>
/* Custom FullCalendar Overrides to match our theme */
.fc-theme-standard td, .fc-theme-standard th, .fc-theme-standard .fc-scrollgrid {
  border-color: #e5e7eb !important;
}

/* Fix the Month/Week Title at the top */
.fc .fc-toolbar-title {
  color: #111827 !important; /* text-gray-900 */
  font-weight: 800 !important;
  font-size: 1.5rem !important;
}

/* Fix the header buttons */
.fc .fc-button-primary {
  background-color: #f3f4f6 !important;
  border-color: #e5e7eb !important;
  color: #374151 !important; /* text-gray-700 */
  font-weight: 700 !important;
  text-transform: capitalize !important;
}

.fc .fc-button-primary:not(:disabled):active, .fc .fc-button-primary:not(:disabled).fc-button-active {
  background-color: #ef4444 !important;
  border-color: #dc2626 !important;
  color: white !important;
}

/* Fix Column Headers (Mon, Tue, etc) */
.fc .fc-col-header-cell-cushion {
  color: #4b5563 !important; /* text-gray-600 */
  font-weight: 700 !important;
  padding: 8px !important;
  text-decoration: none !important;
}

/* Fix Day Numbers in Month View (1, 2, 3...) */
.fc .fc-daygrid-day-number {
  color: #374151 !important; /* text-gray-700 */
  font-weight: 700 !important;
  padding: 8px !important;
  text-decoration: none !important;
}

/* Fix Times on the left axis */
.fc .fc-timegrid-slot-label-cushion {
  color: #6b7280 !important;
  font-weight: 600 !important;
  font-size: 0.75rem !important;
}

/* Fix Event Bookings Visibility */
.fc-event {
  cursor: pointer;
  border-radius: 4px !important;
  border: none !important;
}

/* Ensure text is always white on the solid background blocks */
.fc-event .fc-event-main {
  color: #ffffff !important; 
  font-weight: 700 !important;
  padding: 4px !important;
  font-size: 0.80rem !important;
  line-height: 1.2 !important;
}

/* Force solid blocks in Month View since FullCalendar defaults to transparent dots */
.fc-daygrid-event.is-admin {
  background-color: #16a34a !important;
  border-color: #16a34a !important;
}

.fc-daygrid-event.is-customer {
  background-color: #dc2626 !important;
  border-color: #dc2626 !important;
}

.fc-daygrid-event.is-open {
  background-color: #3b82f6 !important;
  border-color: #3b82f6 !important;
}

.fc-daygrid-event.is-pending {
  background-color: #9ca3af !important;
  border-color: #9ca3af !important;
}
</style>
