<template>
  <div v-if="post">
    <!-- Hero -->
    <section class="relative py-16 md:py-24 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0">
        <img :src="post.image" :alt="post.title" class="w-full h-full object-cover opacity-20" />
        <div class="absolute inset-0 bg-gradient-to-t from-dark via-dark/80 to-dark/60"></div>
      </div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <NuxtLink to="/resources" class="hover:text-white transition-colors">Resources</NuxtLink>
          <span>/</span>
          <span class="text-white truncate max-w-[200px]">{{ post.title }}</span>
        </nav>
        <div class="flex items-center gap-3 mb-4">
          <span :class="post.category === 'baseball' ? 'badge-cage' : post.category === 'soccer' ? 'badge-turf' : 'badge-primary'">{{ post.categoryLabel }}</span>
          <span class="text-gray-400 text-sm">📝 Article · {{ post.readTime }}</span>
        </div>
        <h1 class="heading-lg text-white mb-4 max-w-4xl">{{ post.title }}</h1>
        <div class="flex items-center gap-4 text-sm text-gray-400">
          <span>By {{ post.author }}</span>
          <span>·</span>
          <time :datetime="post.publishDate">{{ formatDate(post.publishDate) }}</time>
        </div>
      </div>
    </section>

    <!-- Article Body -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <div class="max-w-3xl mx-auto">
          <div class="prose-content" v-html="renderedContent"></div>

          <!-- CTA Box -->
          <div class="mt-12 p-8 rounded-2xl bg-gradient-to-r from-primary-dark/30 to-dark-card border border-primary/20">
            <h3 class="font-display font-bold text-xl text-white mb-2">Ready to Train?</h3>
            <p class="text-gray-400 mb-4">Put these techniques into practice at The Training Yard. Book a cage or reserve turf time today.</p>
            <div class="flex flex-wrap gap-3">
              <NuxtLink to="/training" class="btn-primary">Book a Session</NuxtLink>
              <NuxtLink to="/about" class="btn-secondary">Contact Us</NuxtLink>
            </div>
          </div>
        </div>

        <!-- Related Posts -->
        <div v-if="related.length" class="max-w-5xl mx-auto mt-16 pt-12 border-t border-white/10">
          <h2 class="heading-sm text-white mb-8 text-center">More Training Resources</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <NuxtLink
              v-for="r in related"
              :key="r.slug"
              :to="`/resources/${r.slug}`"
              class="glass-card-hover overflow-hidden group"
            >
              <div class="relative h-40 overflow-hidden">
                <img :src="r.image" :alt="r.title" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              </div>
              <div class="p-5">
                <div class="text-xs text-gray-500 mb-2">{{ r.categoryLabel }} · {{ r.readTime }}</div>
                <h3 class="font-display font-semibold text-white text-sm group-hover:text-primary-light transition-colors">{{ r.title }}</h3>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
  <div v-else class="section-spacing bg-dark text-center">
    <div class="section-container">
      <h1 class="heading-lg text-white mb-4">Article Not Found</h1>
      <p class="text-gray-400 mb-8">The resource you're looking for doesn't exist.</p>
      <NuxtLink to="/resources" class="btn-primary">Back to Resources</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { getPost, getRelatedPosts } = useBlogData()

const post = computed(() => getPost(route.params.slug as string))
const related = computed(() => post.value ? getRelatedPosts(post.value.slug) : [])

const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

// Simple markdown-to-HTML renderer for article content
const renderedContent = computed(() => {
  if (!post.value) return ''
  let html = post.value.content
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => '<ul>' + m + '</ul>')
  // Table support
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim())
    if (cells.every(c => /^[\s-:]+$/.test(c))) return ''
    const tag = 'td'
    return '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>'
  })
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, (m) => '<table>' + m + '</table>')
  // Paragraphs
  html = html.split('\n\n').map(block => {
    const trimmed = block.trim()
    if (!trimmed || trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<table')) return trimmed
    return `<p>${trimmed}</p>`
  }).join('\n')
  return html
})

// SEO
if (post.value) {
  useHead({
    title: `${post.value.title} | The Training Yard | Des Moines`,
    meta: [{ name: 'description', content: post.value.metaDescription }],
  })
  useJsonLd([
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.value.title,
      description: post.value.metaDescription,
      image: `https://trainingyarddsm.com${post.value.image}`,
      datePublished: post.value.publishDate,
      author: { '@type': 'Organization', name: 'The Training Yard' },
      publisher: { '@type': 'Organization', name: 'The Training Yard', logo: { '@type': 'ImageObject', url: 'https://trainingyarddsm.com/images/logo.jpg' } },
    },
    getBreadcrumbSchema([
      { name: 'Home', url: 'https://trainingyarddsm.com/' },
      { name: 'Resources', url: 'https://trainingyarddsm.com/resources' },
      { name: post.value.title, url: `https://trainingyarddsm.com/resources/${post.value.slug}` },
    ]),
  ])
}
</script>

<style scoped>
.prose-content :deep(h2) {
  @apply font-display font-bold text-2xl text-white mt-10 mb-4;
}
.prose-content :deep(h3) {
  @apply font-display font-semibold text-lg text-white mt-8 mb-3;
}
.prose-content :deep(p) {
  @apply text-gray-300 leading-relaxed mb-4;
}
.prose-content :deep(strong) {
  @apply text-white font-semibold;
}
.prose-content :deep(a) {
  @apply text-primary hover:text-primary-light underline transition-colors;
}
.prose-content :deep(ul) {
  @apply space-y-2 mb-6 pl-5;
}
.prose-content :deep(li) {
  @apply text-gray-300 list-disc;
}
.prose-content :deep(table) {
  @apply w-full border-collapse mb-6 text-sm;
}
.prose-content :deep(td) {
  @apply border border-white/10 px-3 py-2 text-gray-300;
}
.prose-content :deep(tr:first-child td) {
  @apply bg-white/5 text-white font-semibold;
}
</style>
