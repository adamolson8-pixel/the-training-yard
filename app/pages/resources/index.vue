<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0">
        <img src="/images/Training_Yard_Facility_Coaching.jpg" alt="" class="w-full h-full object-cover object-center" />
      </div>
      <div class="absolute inset-0 bg-dark/70"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">Resources</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Training Resources &amp; Education</h1>
        <p class="text-xl text-gray-300 max-w-2xl">Drills and practice plans to maximize every session on our turf and in our cages.</p>
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
          <NuxtLink
            v-for="resource in filteredResources"
            :key="resource.slug"
            :to="`/resources/${resource.slug}`"
            class="glass-card-hover overflow-hidden group block"
          >
            <div class="relative h-48 overflow-hidden">
              <img :src="resource.image" :alt="resource.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div class="absolute top-3 left-3">
                <span :class="getCategoryBadge(resource.category)">{{ resource.categoryLabel }}</span>
              </div>
            </div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2 text-xs text-gray-500">
                <span>📝 Article</span>
                <span>·</span>
                <span>{{ resource.readTime }}</span>
              </div>
              <h3 class="font-display font-semibold text-white text-lg mb-2 group-hover:text-primary-light transition-colors">{{ resource.title }}</h3>
              <p class="text-gray-400 text-sm leading-relaxed mb-4">{{ resource.excerpt }}</p>
              <span class="text-primary text-sm font-semibold">Read More →</span>
            </div>
          </NuxtLink>
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
        <NuxtLink to="/training" class="btn-primary-lg">Book a Rental</NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Training Resources | The Training Yard | Des Moines',
  meta: [{ name: 'description', content: 'Free baseball, softball, soccer, and agility training resources. Drill videos, practice plans, and facility guides from The Training Yard in Des Moines, IA.' }],
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

const submitLeadMagnet = async () => {
  if (leadEmail.value) {
    try {
      // Save the lead to the database and notify admin
      await $fetch('/api/leads', {
        method: 'POST',
        body: {
          email: leadEmail.value,
          resource: 'Pre-Season Indoor Practice Template',
          source: 'Resources Page'
        }
      })
    } catch (e) {
      console.error('Failed to save lead', e)
    }

    leadSubmitted.value = true
    
    // Trigger download of the practice template
    const link = document.createElement('a')
    link.href = '/documents/Pre-Season-Indoor-Practice-Template.html'
    link.download = 'Pre-Season-Indoor-Practice-Template.html'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const categories = [
  { id: 'all', label: 'All Resources' },
  { id: 'baseball', label: 'Baseball / Softball' },
  { id: 'soccer', label: 'Soccer Agility' },
  { id: 'coaching', label: 'Coaching Resources' },
]

const { getAllPosts } = useBlogData()
const resources = getAllPosts()

const filteredResources = computed(() =>
  activeCategory.value === 'all' ? resources : resources.filter(r => r.category === activeCategory.value)
)

const getCategoryBadge = (cat: string) => {
  if (cat === 'baseball') return 'badge-cage'
  if (cat === 'soccer') return 'badge-turf'
  return 'badge-primary'
}
</script>
