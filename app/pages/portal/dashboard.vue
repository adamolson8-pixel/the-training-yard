<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto w-full">

    <!-- Welcome header -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">
        Welcome back{{ profile?.full_name ? ', ' + profile.full_name.split(' ')[0] : '' }}! 👋
      </h1>
      <p class="text-gray-400 mt-1">Here's a summary of your Training Yard account.</p>
    </div>

    <!-- Alerts -->
    <div v-if="!profile?.waiver_signed" class="mb-6 flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <span class="text-xl mt-0.5">⚠️</span>
      <div class="flex-1">
        <div class="text-amber-400 font-semibold text-sm">Waiver Required</div>
        <div class="text-gray-400 text-sm mt-0.5">You must sign a liability waiver before your first session.</div>
      </div>
      <NuxtLink to="/portal/waiver" class="btn-primary text-xs whitespace-nowrap py-2 px-3">Sign Now</NuxtLink>
    </div>

    <div v-if="profile?.membership_status === 'past_due'" class="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
      <span class="text-xl mt-0.5">❗</span>
      <div class="flex-1">
        <div class="text-red-400 font-semibold text-sm">Membership Payment Past Due</div>
        <div class="text-gray-400 text-sm mt-0.5">Update your payment method to keep your member discount.</div>
      </div>
      <NuxtLink to="/portal/membership" class="text-xs text-red-400 font-semibold hover:text-red-300 whitespace-nowrap py-2">Update →</NuxtLink>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
        <span class="text-gray-500 text-xs font-semibold uppercase tracking-widest">Upcoming</span>
        <span class="text-3xl font-bold text-white">{{ upcomingCount }}</span>
        <span class="text-gray-400 text-xs">bookings</span>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
        <span class="text-gray-500 text-xs font-semibold uppercase tracking-widest">Total Sessions</span>
        <span class="text-3xl font-bold text-white">{{ totalCount }}</span>
        <span class="text-gray-400 text-xs">all time</span>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
        <span class="text-gray-500 text-xs font-semibold uppercase tracking-widest">Membership</span>
        <span class="text-sm font-bold mt-1" :class="membershipColor">{{ membershipLabel }}</span>
        <span v-if="profile?.membership_expires" class="text-gray-400 text-xs">Expires {{ formatDate(profile.membership_expires) }}</span>
        <span v-else class="text-gray-400 text-xs">—</span>
      </div>
      <div class="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1">
        <span class="text-gray-500 text-xs font-semibold uppercase tracking-widest">Waiver</span>
        <span class="text-sm font-bold mt-1" :class="profile?.waiver_signed ? 'text-green-400' : 'text-amber-400'">
          {{ profile?.waiver_signed ? '✓ Signed' : 'Not Signed' }}
        </span>
        <span v-if="profile?.waiver_signed_at" class="text-gray-400 text-xs">{{ formatDate(profile.waiver_signed_at) }}</span>
      </div>
    </div>

    <!-- Team Balances (Only show if they have hours) -->
    <div v-if="(profile?.team_standard_hours > 0 || profile?.team_buyout_hours > 0)" class="mb-8 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5">
      <div class="flex items-center gap-3 mb-4">
        <span class="text-2xl">🏆</span>
        <h2 class="text-lg font-bold text-white">Team Package Balances</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-if="profile?.team_standard_hours > 0" class="bg-black/20 rounded-xl p-4 border border-white/5">
          <div class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Standard Team</div>
          <div class="text-3xl font-bold text-amber-400">{{ profile.team_standard_hours }} <span class="text-base font-normal text-gray-500">hours left</span></div>
        </div>
        <div v-if="profile?.team_buyout_hours > 0" class="bg-black/20 rounded-xl p-4 border border-white/5">
          <div class="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Full Facility Buyout</div>
          <div class="text-3xl font-bold text-amber-400">{{ profile.team_buyout_hours }} <span class="text-base font-normal text-gray-500">hours left</span></div>
        </div>
      </div>
      <div class="mt-4 flex gap-3">
        <NuxtLink to="/portal/book" class="btn-primary text-sm px-4 py-2">Book a Team Session →</NuxtLink>
        <NuxtLink to="/teams" class="border border-amber-500/50 text-amber-400 hover:bg-amber-500/10 transition-colors font-semibold text-sm px-4 py-2 rounded-lg">Buy More Hours</NuxtLink>
      </div>
    </div>

    <!-- Quick Action Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <NuxtLink
        v-for="action in quickActions"
        :key="action.to"
        :to="action.to"
        class="group flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/30 transition-all"
      >
        <span class="text-3xl">{{ action.icon }}</span>
        <div>
          <div class="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">{{ action.label }}</div>
          <div class="text-gray-500 text-xs mt-0.5">{{ action.desc }}</div>
        </div>
        <span class="ml-auto text-gray-600 group-hover:text-amber-400 transition-colors">→</span>
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Upcoming Bookings -->
      <div>
        <h2 class="text-lg font-bold text-white mb-4">Upcoming Sessions</h2>
        <div v-if="upcomingBookings.length" class="space-y-3">
          <div
            v-for="b in upcomingBookings.slice(0, 3)"
            :key="b.id"
            class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div class="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">🗓️</div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-semibold text-sm">{{ b.service_label }}</div>
              <div class="text-gray-400 text-xs mt-0.5">{{ formatDate(b.booking_date) }} at {{ formatTime(b.booking_time) }}</div>
            </div>
            <span class="text-green-400 text-xs font-bold bg-green-500/15 border border-green-500/30 px-2 py-0.5 rounded-full">Confirmed</span>
          </div>
          <NuxtLink to="/portal/bookings" class="mt-3 inline-block text-amber-400 text-sm font-medium hover:text-amber-300">
            View all bookings →
          </NuxtLink>
        </div>
        <div v-else class="text-sm text-gray-500 py-4 bg-white/5 rounded-xl border border-white/10 text-center">
          No upcoming sessions. <NuxtLink to="/portal/book" class="text-amber-400 hover:underline">Book one now</NuxtLink>.
        </div>
      </div>

      <!-- Dependents -->
      <div>
        <h2 class="text-lg font-bold text-white mb-4">Family & Dependents</h2>
        <div v-if="profile?.dependents?.length" class="space-y-3">
          <div
            v-for="(dep, idx) in profile.dependents"
            :key="idx"
            class="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div class="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-xl shrink-0">👤</div>
            <div class="flex-1 min-w-0">
              <div class="text-white font-semibold text-sm">{{ dep.name }}</div>
              <div class="text-gray-400 text-xs mt-0.5">{{ dep.relation }} • Age {{ dep.age }}</div>
            </div>
          </div>
          <NuxtLink to="/portal/profile" class="mt-3 inline-block text-amber-400 text-sm font-medium hover:text-amber-300">
            Manage dependents →
          </NuxtLink>
        </div>
        <div v-else class="text-sm text-gray-500 py-4 bg-white/5 rounded-xl border border-white/10 text-center">
          No dependents listed. <NuxtLink to="/portal/profile" class="text-amber-400 hover:underline">Add them to your profile</NuxtLink>.
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Dashboard — My Training Yard' })

const user = useSupabaseUser()
const supabase = useSupabaseClient()

const { data: profile } = await useFetch('/api/portal/me', { server: false })
const { data: bookingsData } = await useFetch<{ upcoming: any[], past: any[] }>('/api/portal/bookings', { server: false })

const upcomingBookings = computed(() => bookingsData.value?.upcoming ?? [])
const upcomingCount = computed(() => upcomingBookings.value.length)
const totalCount = computed(() => (bookingsData.value?.upcoming?.length ?? 0) + (bookingsData.value?.past?.length ?? 0))

const membershipLabel = computed(() => {
  const s = (profile.value as any)?.membership_status
  if (s === 'active') return '✓ Active'
  if (s === 'past_due') return '⚠ Past Due'
  if (s === 'canceled') return 'Canceled'
  return 'None'
})

const membershipColor = computed(() => {
  const s = (profile.value as any)?.membership_status
  if (s === 'active') return 'text-green-400'
  if (s === 'past_due') return 'text-red-400'
  return 'text-gray-500'
})

const quickActions = [
  { to: '/portal/book', icon: '⚡', label: 'Book a Session', desc: 'Reserve a cage or field now' },
  { to: '/portal/bookings', icon: '📅', label: 'My Bookings', desc: 'View upcoming & past sessions' },
  { to: '/portal/membership', icon: '🌟', label: 'Membership', desc: 'View plan & billing status' },
  { to: '/portal/waiver', icon: '📋', label: 'Waiver Status', desc: 'View or sign your liability waiver' },
  { to: '/portal/profile', icon: '⚙️', label: 'Profile', desc: 'Update your account info' },
  { to: '/teams', icon: '🏆', label: 'Team Packages', desc: 'Explore bulk & VIP plans' },
]

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:${m} ${period}`
}
</script>
