<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0 opacity-20">
        <img src="/images/hero-facility.png" alt="" class="w-full h-full object-cover" />
      </div>
      <div class="absolute inset-0 bg-dark/80"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">The Facility</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Inside The Training Yard</h1>
        <p class="text-xl text-gray-300 max-w-2xl">
          6,000 sq ft of premium synthetic turf and 4 professional-grade batting cages.
          One space, infinite training possibilities.
        </p>
      </div>
    </section>

    <!-- Interactive Diagram -->
    <FacilityDiagram />

    <!-- Specs Grid -->
    <section class="section-spacing bg-dark-card/30">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-primary mb-4 inline-block">Specifications</span>
          <h2 class="heading-lg text-white mb-4">Facility Specifications</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div v-for="spec in specs" :key="spec.label" class="glass-card p-6 flex items-start gap-4">
            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span class="text-2xl">{{ spec.icon }}</span>
            </div>
            <div>
              <h3 class="font-semibold text-white mb-1">{{ spec.label }}</h3>
              <p class="text-gray-400 text-sm">{{ spec.value }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Usage Scenarios -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-turf mb-4 inline-block">Training Scenarios</span>
          <h2 class="heading-lg text-white mb-4">How Athletes Use the Space</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div v-for="scenario in scenarios" :key="scenario.title" class="glass-card-hover overflow-hidden group">
            <div class="h-48 overflow-hidden">
              <img :src="scenario.image" :alt="scenario.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2">
                <span :class="scenario.badgeClass">{{ scenario.badge }}</span>
              </div>
              <h3 class="font-display font-semibold text-white text-lg mb-2">{{ scenario.title }}</h3>
              <p class="text-gray-400 text-sm leading-relaxed">{{ scenario.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery -->
    <section class="py-16 bg-dark-card/30">
      <div class="section-container">
        <div class="text-center mb-12">
          <h2 class="heading-md text-white mb-3">See the Space</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div class="md:col-span-2 rounded-2xl overflow-hidden aspect-video">
            <img src="/images/hero-facility.png" alt="The Training Yard full facility" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div class="space-y-4">
            <div class="rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/images/baseball-training.png" alt="Batting cage training" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
            <div class="rounded-2xl overflow-hidden aspect-[4/3]">
              <img src="/images/soccer-agility.png" alt="Soccer and agility training" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 bg-dark">
      <div class="section-container text-center">
        <h2 class="heading-md text-white mb-4">Ready to Train?</h2>
        <p class="text-gray-400 mb-8 max-w-xl mx-auto">Book a cage, reserve the turf, or tour the facility in person.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink id="facility-cta-book" to="/training" class="btn-primary-lg">Book Online</NuxtLink>
          <NuxtLink id="facility-cta-contact" to="/about" class="btn-secondary px-8 py-4 text-lg">Contact Us</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'The Facility | The Training Yard | Des Moines Indoor Sports',
  meta: [
    {
      name: 'description',
      content: 'Explore The Training Yard\'s 6,000 sq ft indoor facility. 60\' × 100\' synthetic turf, 4 retractable batting cages, and multi-sport configurations for baseball, softball, soccer & agility.',
    },
  ],
})

useJsonLd([
  getServiceSchema(
    'Indoor Turf Rental',
    'Rent the full 60\' × 100\' indoor synthetic turf field at The Training Yard for team practices, soccer, agility drills, and more.',
  ),
  getServiceSchema(
    'Batting Cage Rental',
    'Reserve one or more of 4 professional indoor batting cages at The Training Yard for baseball and softball hitting practice.',
  ),
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
    { name: 'The Facility', url: 'https://trainingyarddsm.com/facility' },
  ]),
])

const specs = [
  { icon: '📐', label: 'Total Area', value: '6,000 sq ft (60\' × 100\') of premium synthetic turf' },
  { icon: '🥎', label: 'Batting Cages', value: '4 professional-grade retractable cages with automated pitching' },
  { icon: '🌿', label: 'Turf Surface', value: 'High-density synthetic turf rated for cleats (no metal)' },
  { icon: '💡', label: 'Lighting', value: 'Full LED high-bay lighting system — zero shadow zones' },
  { icon: '🔒', label: 'Safety', value: 'Impact-rated netting, padded walls, first aid station on-site' },
  { icon: '🅿️', label: 'Parking', value: 'Free on-site parking with easy load-in access for gear' },
]

const scenarios = [
  {
    title: 'Individual Batting Practice',
    description: 'Reserve a single cage for focused hitting reps. Use our machines or bring your own pitcher. Tees, balls, and L-screens provided.',
    image: '/images/baseball-training.png',
    badge: 'Cages',
    badgeClass: 'badge-cage',
  },
  {
    title: 'Team Turf Practice',
    description: 'Retract all 4 cages and use the full 60\' × 100\' turf for team batting rotations, fielding drills, or full infield work.',
    image: '/images/hero-facility.png',
    badge: 'Full Field',
    badgeClass: 'badge-turf',
  },
  {
    title: 'Soccer & Futsal Training',
    description: 'Full open turf supports small-sided soccer games, futsal practice, and team tactical drills on quality synthetic surface.',
    image: '/images/soccer-agility.png',
    badge: 'Open Turf',
    badgeClass: 'badge-turf',
  },
  {
    title: 'Agility & Conditioning',
    description: 'Set up ladder drills, cone patterns, shuttle runs, and SAQ circuits on the turf. Perfect for multi-sport athletes.',
    image: '/images/soccer-agility.png',
    badge: 'Speed Work',
    badgeClass: 'badge-primary',
  },
]
</script>
