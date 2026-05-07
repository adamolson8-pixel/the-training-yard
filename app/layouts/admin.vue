<template>
  <div class="min-h-screen bg-gray-100 flex flex-col md:flex-row">

    <!-- Mobile Top Bar -->
    <div class="md:hidden sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-white/10 shadow-lg">
      <div>
        <div class="text-white font-bold text-[13px] leading-tight">Training Yard</div>
        <div class="text-red-400 text-[10px] font-bold">Admin Portal</div>
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
      <div class="hidden md:block px-5 py-5 border-b border-white/10">
        <div class="text-white font-bold text-base leading-tight">The Training Yard</div>
        <div class="text-red-400 text-[11px] font-bold mt-0.5 uppercase tracking-widest">Admin Portal</div>
      </div>

      <!-- Admin badge -->
      <div class="px-4 py-3.5 border-b border-white/10 flex items-center gap-3">
        <div class="w-9 h-9 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
          {{ adminInitial }}
        </div>
        <div class="min-w-0">
          <div class="text-white text-[13px] font-bold truncate">{{ user?.email }}</div>
          <div class="flex items-center gap-1 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
            <span class="text-red-400 text-[10px] font-bold">Administrator</span>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">

        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 pt-1 pb-1.5">Scheduling</div>
        <NuxtLink v-for="link in schedLinks" :key="link.to" :to="link.to" @click="mobileOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          :class="isActive(link.to) ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'">
          <span class="w-5 text-center text-base shrink-0">{{ link.icon }}</span>
          {{ link.label }}
        </NuxtLink>

        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 pt-3.5 pb-1.5">People</div>
        <NuxtLink v-for="link in peopleLinks" :key="link.to" :to="link.to" @click="mobileOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          :class="isActive(link.to) ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'">
          <span class="w-5 text-center text-base shrink-0">{{ link.icon }}</span>
          {{ link.label }}
        </NuxtLink>

        <div class="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-3 pt-3.5 pb-1.5">System</div>
        <NuxtLink v-for="link in systemLinks" :key="link.to" :to="link.to" @click="mobileOpen = false"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
          :class="isActive(link.to) ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'">
          <span class="w-5 text-center text-base shrink-0">{{ link.icon }}</span>
          {{ link.label }}
        </NuxtLink>
      </nav>

      <!-- Bottom -->
      <div class="px-3 py-3 border-t border-white/10 space-y-0.5">
        <NuxtLink to="/portal/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <span class="w-5 text-center">👤</span> Customer Portal
        </NuxtLink>
        <NuxtLink to="/" class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/5 transition-all">
          <span class="w-5 text-center">🌐</span> View Public Site
        </NuxtLink>
        <button class="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all" @click="logout">
          <span class="w-5 text-center">🚪</span> Sign Out
        </button>
      </div>
    </aside>

    <!-- Mobile overlay -->
    <Transition name="fade">
      <div v-if="mobileOpen" class="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-sm" @click="mobileOpen = false" />
    </Transition>

    <!-- Main -->
    <main class="flex-1 min-w-0 overflow-x-hidden bg-gray-50">
      <NuxtPage />
    </main>

  </div>
</template>

<script setup lang="ts">
const user = useSupabaseUser()
const supabase = useSupabaseClient()
const route = useRoute()
const mobileOpen = ref(false)

watch(() => route.path, () => { mobileOpen.value = false })

onMounted(() => {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') mobileOpen.value = false
  })
})

const adminInitial = computed(() => (user.value?.email ?? 'A').charAt(0).toUpperCase())

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}

const schedLinks = [
  { to: '/admin/schedule', icon: '📅', label: 'Schedule' },
  { to: '/admin/bookings', icon: '📋', label: 'Bookings' },
  { to: '/admin/blocks', icon: '🚫', label: 'Block Time' },
]
const peopleLinks = [
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/payments', icon: '💳', label: 'Payments' },
  { to: '/admin/memberships', icon: '🌟', label: 'Memberships' },
  { to: '/admin/waivers', icon: '📝', label: 'Waivers' },
]
const systemLinks = [
  { to: '/admin/settings', icon: '⚙️', label: 'Settings' },
]

async function logout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
