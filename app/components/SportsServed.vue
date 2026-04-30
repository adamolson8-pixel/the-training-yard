<template>
  <section id="sports-served" class="py-16 bg-dark-card/50 relative">
    <div class="section-container">
      <div class="text-center mb-12">
        <h2 class="heading-md text-white mb-3">Sports We Support</h2>
        <p class="text-gray-400">Multi-sport training under one roof, year-round.</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div
          v-for="sport in sports"
          :key="sport.name"
          class="glass-card-hover p-6 text-center group cursor-pointer"
        >
          <div class="text-4xl mb-3 transition-transform duration-300 group-hover:scale-125">{{ sport.emoji }}</div>
          <h3 class="font-display font-semibold text-white text-sm">{{ sport.name }}</h3>
          <p class="text-gray-500 text-xs mt-1">{{ sport.tagline }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const sports = [
  { name: 'Baseball', emoji: '⚾', tagline: 'Cages & turf' },
  { name: 'Softball', emoji: '🥎', tagline: 'Hitting & fielding' },
  { name: 'Soccer', emoji: '⚽', tagline: 'Full-field turf' },
  { name: 'Agility', emoji: '⚡', tagline: 'Speed & conditioning' },
]
</script>
