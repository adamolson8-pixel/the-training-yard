<template>
  <section id="facility-highlights" class="section-spacing bg-dark relative overflow-hidden">
    <!-- Background accent -->
    <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

    <div class="section-container relative">
      <!-- Section Header -->
      <div class="text-center mb-16">
        <span class="badge-primary mb-4 inline-block">How The Space Works</span>
        <h2 class="heading-lg text-white mb-4">One Facility. Infinite Configurations.</h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Our 60' × 100' space transforms to match your training needs. Four retractable batting cages let us
          adapt from individual hitting sessions to full-field team practices in minutes.
        </p>
      </div>

      <!-- Configuration Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="(config, index) in configurations"
          :key="config.title"
          class="glass-card-hover p-6 text-center group"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <!-- Icon -->
          <div class="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110"
               :class="config.iconBg">
            <div v-html="config.icon" class="w-8 h-8"></div>
          </div>

          <!-- Title -->
          <h3 class="font-display font-semibold text-white text-lg mb-2">{{ config.title }}</h3>

          <!-- Description -->
          <p class="text-gray-400 text-sm leading-relaxed mb-4">{{ config.description }}</p>

          <!-- Badge -->
          <span class="text-xs font-semibold uppercase tracking-wider" :class="config.badgeClass">
            {{ config.badge }}
          </span>
        </div>
      </div>

      <!-- CTA -->
      <div class="text-center mt-12">
        <NuxtLink id="highlights-cta-facility" to="/facility" class="btn-secondary group">
          Explore the Full Facility
          <svg class="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const configurations = [
  {
    title: 'Single Cage',
    description: 'Perfect for individual batting practice, pitching sessions, or tee work. Reserve one of four professional-grade cages.',
    badge: 'Individual',
    badgeClass: 'text-cage',
    iconBg: 'bg-cage/10',
    icon: '<svg fill="none" viewBox="0 0 24 24" stroke="#F39C12" stroke-width="1.5"><rect x="6" y="4" width="12" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
  },
  {
    title: 'Two-Cage Combo',
    description: 'Side-by-side cages for group lessons, pitcher-catcher pairs, or small team rotational drills.',
    badge: 'Small Groups',
    badgeClass: 'text-cage',
    iconBg: 'bg-cage/10',
    icon: '<svg fill="none" viewBox="0 0 24 24" stroke="#F39C12" stroke-width="1.5"><rect x="3" y="4" width="8" height="16" rx="2"/><rect x="13" y="4" width="8" height="16" rx="2"/></svg>',
  },
  {
    title: 'Four-Cage Setup',
    description: 'All four cages active simultaneously. Ideal for team batting practice with rotational stations.',
    badge: 'Teams',
    badgeClass: 'text-primary-light',
    iconBg: 'bg-primary/10',
    icon: '<svg fill="none" viewBox="0 0 24 24" stroke="#E8353C" stroke-width="1.5"><rect x="1" y="4" width="5" height="16" rx="1"/><rect x="7" y="4" width="4" height="16" rx="1"/><rect x="13" y="4" width="4" height="16" rx="1"/><rect x="18" y="4" width="5" height="16" rx="1"/></svg>',
  },
  {
    title: 'Open Turf',
    description: 'All cages retracted. Full 60\' × 100\' synthetic turf for soccer, agility drills, team practices, and conditioning.',
    badge: 'Full Field',
    badgeClass: 'text-turf',
    iconBg: 'bg-turf/10',
    icon: '<svg fill="none" viewBox="0 0 24 24" stroke="#2ECC71" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="12" y1="4" x2="12" y2="20" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="3"/></svg>',
  },
]
</script>
