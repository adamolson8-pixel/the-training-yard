<template>
  <section id="testimonials" class="py-16 bg-dark-card/30 relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-b from-dark via-transparent to-dark"></div>

    <div class="section-container relative">
      <div class="text-center mb-12">
        <h2 class="heading-md text-white mb-3">What Our Athletes Say</h2>
        <p class="text-gray-400">Trusted by coaches, parents, and athletes across Central Iowa.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div
          v-for="(testimonial, index) in testimonials"
          :key="index"
          class="glass-card p-6 relative"
        >
          <!-- Quote mark -->
          <div class="absolute top-4 right-4 text-primary/20 text-5xl font-display leading-none">"</div>

          <!-- Stars -->
          <div class="flex gap-1 mb-4">
            <svg v-for="i in 5" :key="i" class="w-4 h-4 text-cage" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          <!-- Quote -->
          <p class="text-gray-300 text-sm leading-relaxed mb-4">{{ testimonial.quote }}</p>

          <!-- Author -->
          <div class="flex items-center gap-3 mt-auto">
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
              {{ testimonial.initials }}
            </div>
            <div>
              <div class="text-white text-sm font-semibold">{{ testimonial.name }}</div>
              <div class="text-gray-500 text-xs">{{ testimonial.role }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const testimonials = [
  {
    quote: 'The retractable cages are a game-changer. We run full team batting practice, then open it up for fielding drills — all in one session. No other facility in Des Moines offers that.',
    name: 'Coach Mike Reynolds',
    role: 'Youth Baseball Director',
    initials: 'MR',
  },
  {
    quote: 'My daughter practices softball and my son does soccer agility training here. The family pass saves us over $200/month compared to separate memberships elsewhere.',
    name: 'Sarah Thompson',
    role: 'Parent of Two Athletes',
    initials: 'ST',
  },
  {
    quote: 'As a club soccer coach, finding indoor turf in the winter is nearly impossible. The Training Yard gives us guaranteed weekly practice time on quality synthetic turf.',
    name: 'David Park',
    role: 'Club Soccer Coach',
    initials: 'DP',
  },
]
</script>
