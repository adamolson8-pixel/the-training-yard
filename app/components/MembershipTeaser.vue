<template>
  <section id="membership-teaser" class="section-spacing bg-dark relative overflow-hidden">
    <!-- Background accents -->
    <div class="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
    <div class="absolute top-0 right-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

    <div class="section-container relative">
      <div class="text-center mb-16">
        <span class="badge-primary mb-4 inline-block">Memberships</span>
        <h2 class="heading-lg text-white mb-4">Train Consistently. Save Significantly.</h2>
        <p class="text-gray-400 max-w-2xl mx-auto text-lg">
          Stop paying per visit. Our membership tiers give you priority booking, discounted rates, and unlimited access to build real skills.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(tier, index) in tiers"
          :key="tier.name"
          class="relative group"
        >
          <!-- Popular badge -->
          <div
            v-if="tier.popular"
            class="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-red-gradient rounded-full text-xs font-bold text-white shadow-glow-red"
          >
            Most Popular
          </div>

          <div
            class="h-full p-8 rounded-2xl border transition-all duration-500 group-hover:-translate-y-2"
            :class="tier.popular
              ? 'bg-gradient-to-b from-primary/10 to-dark-card border-primary/30 shadow-glow-red'
              : 'glass-card border-white/10 hover:border-white/20'"
          >
            <h3 class="font-display font-bold text-xl text-white mb-1">{{ tier.name }}</h3>
            <p class="text-gray-400 text-sm mb-6">{{ tier.target }}</p>

            <div class="flex items-baseline gap-1 mb-6">
              <span class="font-display text-4xl font-bold text-white">${{ tier.price }}</span>
              <span class="text-gray-400">/{{ tier.period }}</span>
            </div>

            <ul class="space-y-3 mb-8">
              <li v-for="feature in tier.features" :key="feature" class="flex items-start gap-2 text-sm text-gray-300">
                <svg class="w-5 h-5 text-turf shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <NuxtLink
              :id="`membership-cta-${tier.name.toLowerCase().replace(/\s/g, '-')}`"
              to="/training"
              :class="tier.popular ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'"
            >
              {{ tier.cta }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <div class="text-center mt-10">
        <NuxtLink to="/training" class="text-gray-400 hover:text-white transition-colors duration-300 text-sm underline underline-offset-4">
          View full membership comparison →
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const tiers = [
  {
    name: 'Individual Monthly',
    target: 'One athlete',
    price: 89,
    period: 'mo',
    popular: false,
    cta: 'Get Started',
    features: [
      'Off-peak cage access included',
      'Discounted peak-hour rates',
      '10% off turf rentals',
      'Online booking priority',
      'Member-only open gym hours',
    ],
  },
  {
    name: 'Family Pass',
    target: 'Household members (up to 4)',
    price: 129,
    period: 'mo',
    popular: true,
    cta: 'Join Now',
    features: [
      'Up to 4 family members',
      'Shared cage & turf hours',
      '15% off additional cage rentals',
      'Priority peak-hour booking',
      'Free equipment rentals',
      'Exclusive member events',
    ],
  },
  {
    name: 'Annual Team VIP',
    target: 'Club & Travel Teams',
    price: '2,700',
    period: 'yr',
    popular: false,
    cta: 'Contact for Details',
    features: [
      '24 Hours Standard Practice',
      'First-Priority Scheduling',
      '20% off additional hours',
      '10% Roster Discount',
      'Dedicated scheduling coordinator',
    ],
  },
]
</script>
