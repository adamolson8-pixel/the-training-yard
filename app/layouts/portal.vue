<template>
  <div class="min-h-screen bg-gray-950 flex flex-col md:flex-row">

    <!-- Mobile Top Bar -->
    <div class="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10 shadow-lg">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">TY</div>
        <div>
          <div class="font-bold text-white text-[13px] leading-tight">Training Yard</div>
          <div class="text-amber-400 text-[10px] font-bold">Customer Portal</div>
        </div>
      </div>
      <button @click="mobileOpen = !mobileOpen" class="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors" aria-label="Toggle navigation">
        <svg v-if="!mobileOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Sidebar -->
    <aside
      class="fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:translate-x-0 md:flex-shrink-0"
      :class="mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'"
    >
      <!-- Logo (desktop) -->
      <div class="hidden md:flex px-5 py-5 border-b border-white/10 items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-sm">TY</div>
        <div>
          <div class="text-white font-bold text-sm leading-tight">The Training Yard</div>
          <div class="text-amber-400 text-[11px] font-bold">Customer Portal</div>
        </div>
      </div>

      <!-- User card -->
      <div class="px-4 py-4 border-b border-white/10">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-base shrink-0">
            {{ userInitial }}
          </div>
          <div class="min-w-0">
            <div class="text-white text-[13px] font-bold truncate">{{ profile?.full_name || user?.email }}</div>
            <div v-if="profile?.membership_status === 'active'" class="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-[10px] font-bold">
              🌟 Member
            </div>
            <div v-else class="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded-full bg-white/10 text-gray-400 text-[10px] font-semibold">
              Non-Member
            </div>
          </div>
        </div>
      </div>

      <!-- Waiver alert in nav -->
      <div v-if="profile && !profile.waiver_signed" class="mx-3 mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2">
        <span class="text-amber-400 text-sm">⚠️</span>
        <div class="flex-1 min-w-0">
          <div class="text-amber-400 text-[11px] font-bold leading-tight">Waiver Required</div>
        </div>
        <NuxtLink to="/portal/waiver" class="text-[10px] font-bold text-amber-400 hover:text-amber-300 whitespace-nowrap" @click="mobileOpen = false">Sign →</NuxtLink>
      </div>

      <!-- Nav Links -->
      <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          :class="isActive(link.to)
            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25 shadow-sm'
            : 'text-gray-400 hover:text-white hover:bg-white/5'"
          @click="mobileOpen = false"
        >
          <span class="text-base w-5 text-center shrink-0">{{ link.icon }}</span>
          <span>{{ link.label }}</span>
          <span v-if="link.badge" class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{{ link.badge }}</span>
        </NuxtLink>
      </nav>

      <!-- Bottom actions -->
      <div class="px-3 py-3 border-t border-white/10 space-y-0.5">
        <NuxtLink to="/" class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <span class="text-base w-5 text-center">🌐</span> Back to Site
        </NuxtLink>
        <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all" @click="logout">
          <span class="text-base w-5 text-center">🚪</span> Sign Out
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-sm" @click="mobileOpen = false" />
    </Transition>

    <!-- Main content -->
    <main class="flex-1 min-w-0 overflow-x-hidden relative">
      <NuxtPage />
    </main>

  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
const mobileOpen = ref(false)

// Close mobile nav on route change
watch(() => route.path, () => { mobileOpen.value = false })

// Close on Escape key
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') mobileOpen.value = false
  })
})

const profileError = ref('')
const { data: profile } = await useAsyncData('portal-layout-profile', async () => {
  if (!user.value) {
    profileError.value = 'user.value is falsy'
    return null
  }
  // Debug: some versions of supabase wrap the user or have it in user.value.user.id
  const uid = user.value.id || (user.value.user && user.value.user.id) || user.value.sub
  if (!uid) {
    profileError.value = 'uid is missing. user is: ' + JSON.stringify(user.value)
    return null
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, membership_status, membership_type, waiver_signed, role')
    .eq('id', uid)
    .single()
  
  if (error) {
    profileError.value = error.message
    return null
  }
  return data
})

const userInitial = computed(() => {
  const name = profile.value?.full_name || user.value?.email || '?'
  return name.charAt(0).toUpperCase()
})

const navLinks = computed(() => {
  const links = [
    { to: '/portal/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/portal/bookings', icon: '📅', label: 'My Bookings' },
    { to: '/portal/book', icon: '⚡', label: 'Book a Session' },
    { to: '/portal/team', icon: '🏆', label: 'My Team' },
    { to: '/portal/membership', icon: '🌟', label: 'Membership' },
    { to: '/portal/waiver', icon: '📋', label: 'Waiver', badge: profile.value?.waiver_signed ? undefined : '!' },
    { to: '/portal/profile', icon: '⚙️', label: 'Profile' },
  ]
  if (profile.value?.role === 'admin') {
    links.push({ to: '/admin/schedule', icon: '🔐', label: 'Admin Portal' })
  }
  return links
})

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
