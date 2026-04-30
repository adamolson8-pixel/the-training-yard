<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">Resources</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Training Resources &amp; Education</h1>
        <p class="text-xl text-gray-300 max-w-2xl">Drills, coaching guides, and training tips to maximize every session on our turf and in our cages.</p>
      </div>
    </section>

    <!-- Lead Magnet -->
    <section class="py-12 bg-gradient-to-r from-primary-dark/50 to-dark-card border-y border-primary/20">
      <div class="section-container">
        <div class="flex flex-col md:flex-row items-center gap-8 max-w-4xl mx-auto">
          <div class="flex-1">
            <span class="badge-cage mb-3 inline-block">Free Download</span>
            <h2 class="heading-sm text-white mb-2">Pre-Season Indoor Practice Template</h2>
            <p class="text-gray-400 text-sm">A complete 60-minute practice plan optimized for a 60' × 100' indoor space. Includes warm-up, station rotations, and cool-down. Used by 50+ Central Iowa coaches.</p>
          </div>
          <div class="w-full md:w-auto">
            <form id="lead-magnet-form" class="flex flex-col sm:flex-row gap-3" @submit.prevent="submitLeadMagnet">
              <input
                v-model="leadEmail"
                type="email"
                required
                placeholder="Enter your email"
                class="input-field sm:w-64"
                aria-label="Email address for practice template download"
              />
              <button type="submit" class="btn-primary whitespace-nowrap" :disabled="leadSubmitted">
                {{ leadSubmitted ? '✓ Sent!' : 'Download Free' }}
              </button>
            </form>
            <p class="text-gray-500 text-xs mt-2">No spam. Unsubscribe anytime.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Category Filter + Resource Grid -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <!-- Category Tabs -->
        <div class="flex flex-wrap justify-center gap-3 mb-12">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            :class="activeCategory === cat.id ? 'bg-red-gradient text-white shadow-glow-red' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'"
            @click="activeCategory = cat.id"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- Resource Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="resource in filteredResources"
            :key="resource.title"
            class="glass-card-hover overflow-hidden group"
          >
            <div class="relative h-48 overflow-hidden">
              <img :src="resource.image" :alt="resource.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div class="absolute top-3 left-3">
                <span :class="getCategoryBadge(resource.category)">{{ resource.categoryLabel }}</span>
              </div>
              <div v-if="resource.type === 'video'" class="absolute inset-0 flex items-center justify-center">
                <div class="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span>{{ resource.type === 'video' ? '📹 Video' : '📝 Article' }}</span>
                <span>·</span>
                <span>{{ resource.readTime }}</span>
              </div>
              <h3 class="font-display font-semibold text-white text-lg mb-2 group-hover:text-primary-light transition-colors">{{ resource.title }}</h3>
              <p class="text-gray-400 text-sm leading-relaxed mb-4">{{ resource.excerpt }}</p>
              <div class="flex items-center justify-between">
                <span class="text-primary text-sm font-semibold cursor-pointer hover:underline">{{ resource.type === 'video' ? 'Watch Now' : 'Read More' }} →</span>
              </div>
            </div>
          </article>
        </div>

        <!-- Load More -->
        <div class="text-center mt-12">
          <button class="btn-secondary">Load More Resources</button>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-16 bg-dark-card/30">
      <div class="section-container text-center">
        <h2 class="heading-md text-white mb-4">Put These Drills Into Action</h2>
        <p class="text-gray-400 mb-8 max-w-xl mx-auto">Book a cage or reserve the turf to practice the techniques you've learned.</p>
        <NuxtLink to="/training" class="btn-primary-lg">Book a Training Session</NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Training Resources | The Training Yard | Des Moines',
  meta: [{ name: 'description', content: 'Free baseball, softball, soccer, and agility training resources. Drill videos, coaching guides, and practice plans from The Training Yard in Des Moines, IA.' }],
})

useJsonLd([
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
    { name: 'Resources', url: 'https://trainingyarddsm.com/resources' },
  ]),
])

const activeCategory = ref('all')
const leadEmail = ref('')
const leadSubmitted = ref(false)

const submitLeadMagnet = () => {
  if (leadEmail.value) leadSubmitted.value = true
}

const categories = [
  { id: 'all', label: 'All Resources' },
  { id: 'baseball', label: 'Baseball / Softball' },
  { id: 'soccer', label: 'Soccer Agility' },
  { id: 'coaching', label: 'Coaching Resources' },
]

const resources = [
  { title: 'Indoor Hitting Drill: Tee Work Progressions', excerpt: 'A 4-station tee drill rotation designed for a single batting cage. Build bat speed and contact consistency in 30 minutes.', image: '/images/baseball-training.png', type: 'video', readTime: '8 min', category: 'baseball', categoryLabel: 'Baseball' },
  { title: 'Winter Practice Plan for Youth Teams', excerpt: 'How to run a productive 60-minute indoor practice with 12-15 players in a 60\' × 100\' turf space.', image: '/images/hero-facility.png', type: 'article', readTime: '6 min read', category: 'coaching', categoryLabel: 'Coaching' },
  { title: 'Soccer Footwork: Ladder Drills for Speed', excerpt: 'Five ladder drill patterns that develop first-step quickness and change-of-direction speed on indoor turf.', image: '/images/soccer-agility.png', type: 'video', readTime: '5 min', category: 'soccer', categoryLabel: 'Soccer' },
  { title: 'Softball Pitching Warm-Up Routine', excerpt: 'A complete pre-session warm-up sequence for fastpitch pitchers training in an indoor cage environment.', image: '/images/baseball-training.png', type: 'article', readTime: '4 min read', category: 'baseball', categoryLabel: 'Softball' },
  { title: 'Agility Cone Drills for Multi-Sport Athletes', excerpt: 'Eight cone configurations that build lateral movement, deceleration, and reaction time on synthetic turf.', image: '/images/soccer-agility.png', type: 'video', readTime: '10 min', category: 'soccer', categoryLabel: 'Agility' },
  { title: 'Coaching 101: Managing Indoor Practice Time', excerpt: 'Station rotation strategies, time management, and group sizing tips for coaches renting indoor facility time.', image: '/images/hero-facility.png', type: 'article', readTime: '7 min read', category: 'coaching', categoryLabel: 'Coaching' },
]

const filteredResources = computed(() =>
  activeCategory.value === 'all' ? resources : resources.filter(r => r.category === activeCategory.value)
)

const getCategoryBadge = (cat: string) => {
  if (cat === 'baseball') return 'badge-cage'
  if (cat === 'soccer') return 'badge-turf'
  return 'badge-primary'
}
</script>
