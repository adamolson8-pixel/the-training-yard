<template>
  <header class="sticky top-0 z-40 bg-dark/90 backdrop-blur-xl border-b border-white/5">
    <div class="section-container">
      <div class="flex items-center justify-between h-16 md:h-20">
        <!-- Logo -->
        <NuxtLink id="header-logo" to="/" class="flex items-center gap-3 group">
          <img
            src="/images/logo.jpg"
            alt="The Training Yard Logo"
            class="h-12 md:h-14 w-auto rounded-lg transition-transform duration-300 group-hover:scale-105"
          />
          <div class="hidden lg:block">
            <div class="font-display font-bold text-lg text-white leading-tight">THE TRAINING YARD</div>
            <div class="text-xs text-primary tracking-widest uppercase">Indoor Sports Facility</div>
          </div>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden lg:flex items-center gap-1" role="navigation" aria-label="Main navigation">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :id="`nav-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`"
            :to="item.to"
            class="px-4 py-2 text-sm font-medium text-gray-300 rounded-lg transition-all duration-300 hover:text-white hover:bg-white/5 link-underline"
            active-class="!text-white !bg-primary/10"
          >
            {{ item.label }}
          </NuxtLink>
          <NuxtLink
            id="nav-book-now-desktop"
            to="/training"
            class="btn-primary !px-5 !py-2 !text-sm ml-2"
          >
            Book Now
          </NuxtLink>
        </nav>

        <!-- Mobile Menu Toggle -->
        <button
          id="mobile-menu-toggle"
          class="lg:hidden p-2 text-gray-300 hover:text-white transition-colors"
          @click="mobileMenuOpen = !mobileMenuOpen"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-4"
    >
      <div
        v-if="mobileMenuOpen"
        class="lg:hidden bg-dark-card/95 backdrop-blur-xl border-t border-white/5"
      >
        <nav class="section-container py-4 space-y-1" aria-label="Mobile navigation">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="block px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all duration-300 font-medium"
            active-class="!text-white !bg-primary/10"
            @click="mobileMenuOpen = false"
          >
            {{ item.label }}
          </NuxtLink>
          <div class="pt-2 px-4">
            <NuxtLink
              to="/training"
              class="btn-primary w-full text-center"
              @click="mobileMenuOpen = false"
            >
              Book Now / Member Login
            </NuxtLink>
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
const mobileMenuOpen = ref(false)

const navItems = [
  { label: 'The Facility', to: '/facility' },
  { label: 'Training & Memberships', to: '/training' },
  { label: 'Resources', to: '/resources' },
  { label: 'About & Contact', to: '/about' },
]

// Close mobile menu on route change
const route = useRoute()
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>
