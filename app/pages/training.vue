<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0">
        <img src="/images/Training_Yard_Facility_baseball.jpg" alt="" class="w-full h-full object-cover object-center" />
      </div>
      <div class="absolute inset-0 bg-dark/70"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">Memberships &amp; Rates</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Memberships &amp; Rates</h1>
        <p class="text-xl text-gray-300 max-w-2xl">
          From individual cage sessions to full-season team contracts. Choose the rental plan that matches your goals.
        </p>
        <div class="mt-8 flex flex-wrap gap-4">
          <a href="#pricing" class="btn-primary" @click.prevent="smoothScroll('#pricing')">View Plans</a>
          <a href="#book" class="btn-secondary" @click.prevent="smoothScroll('#book')">Book Now</a>
        </div>
      </div>
    </section>

    <!-- Pricing -->
    <section id="pricing" class="section-spacing bg-dark-card/30 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div class="section-container relative">
        <div class="text-center mb-16">
          <span class="badge-primary mb-4 inline-block">Membership Tiers</span>
          <h2 class="heading-lg text-white mb-4">Invest in Consistent Training</h2>
          <p class="text-gray-400 max-w-2xl mx-auto text-lg">Stop paying retail. Memberships guarantee your time slots and build real skills.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div v-for="tier in tiers" :key="tier.name" class="relative group">
            <div v-if="tier.popular" class="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 bg-red-gradient rounded-full text-xs font-bold text-white shadow-glow-red">Most Popular</div>
            <div
              class="h-full flex flex-col p-8 rounded-2xl border transition-all duration-500 group-hover:-translate-y-2"
              :class="tier.popular ? 'bg-gradient-to-b from-primary/10 to-dark-card border-primary/30 shadow-glow-red' : 'glass-card border-white/10 hover:border-white/20'"
            >
              <h3 class="font-display font-bold text-xl text-white mb-1">{{ tier.name }}</h3>
              <p class="text-gray-400 text-sm mb-6">{{ tier.target }}</p>
              <div v-if="tier.isTeam" class="mb-6">
                <div class="font-display text-2xl font-bold text-white">Custom Team Pricing</div>
                <div class="mt-1 text-sm text-amber-400">Built around your season</div>
              </div>
              <div v-else class="flex items-baseline gap-1 mb-6">
                <span class="text-gray-400 text-lg mr-1" v-if="tier.isTeam">from</span>
                <span class="font-display text-5xl font-bold text-white">${{ tier.price }}</span>
                <span class="text-gray-400">/{{ tier.period }}</span>
              </div>
              <div class="divider-glow mb-6"></div>
              <ul class="space-y-3 mb-8 flex-1">
                <li v-for="f in tier.features" :key="f" class="flex items-start gap-3 text-sm">
                  <svg class="w-5 h-5 text-turf shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  <span class="text-gray-300">{{ f }}</span>
                </li>
              </ul>
              <a
                v-if="tier.isTeam"
                href="/teams"
                class="btn-secondary w-full text-center"
              >{{ tier.cta }}</a>
              <a
                v-else
                href="#book"
                :class="tier.popular || tier.cta === 'Join Now' ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'"
                @click.prevent="scrollToBook(tier)"
              >{{ tier.cta }}</a>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Online Booking Wizard -->
    <section id="book" class="section-spacing bg-dark">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-cage mb-4 inline-block">Book Online</span>
          <h2 class="heading-lg text-white mb-4">Book Your Session</h2>
          <p class="text-gray-400 max-w-2xl mx-auto">Choose your service, pick a time, and pay securely online. Confirmation sent instantly.</p>
        </div>
        <div class="max-w-3xl mx-auto">
          <ClientOnly>
            <BookingWizard />
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="section-spacing bg-dark-card/30">
      <div class="section-container">
        <div class="max-w-3xl mx-auto">
          <div class="text-center mb-12">
            <h2 class="heading-md text-white mb-3">Membership &amp; Booking FAQ</h2>
          </div>
          <div class="space-y-4">
            <div v-for="(item, i) in faqs" :key="i" class="glass-card overflow-hidden">
              <button
                class="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors"
                @click="openFaq = openFaq === i ? null : i"
              >
                <h3 class="font-display font-semibold text-white pr-4 text-sm md:text-base">{{ item.q }}</h3>
                <svg
                  class="w-5 h-5 text-primary shrink-0 transition-transform duration-300"
                  :class="{ 'rotate-180': openFaq === i }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                ><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              <div v-if="openFaq === i" class="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">{{ item.a }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { TEAM_PRICING } from '~/utils/teamPricing'

useHead({
  title: 'Memberships & Rates | The Training Yard | Des Moines',
  meta: [
    { name: 'description', content: 'Individual and Family memberships plus custom discounted team pricing at The Training Yard Des Moines. Book batting cages and turf rentals online.' },
    { property: 'og:title', content: 'Memberships & Rates | The Training Yard | Des Moines' },
    { property: 'og:description', content: 'Individual and Family memberships plus custom discounted team pricing at The Training Yard Des Moines.' },
    { property: 'og:url', content: 'https://trainingyarddsm.com/training' },
  ],
  link: [
    { rel: 'canonical', href: 'https://trainingyarddsm.com/training' },
  ],
})

useJsonLd([
  getServiceSchema('Facility Memberships', 'Monthly membership plans for individuals, families, and teams at The Training Yard.'),
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
    { name: 'Memberships & Rates', url: 'https://trainingyarddsm.com/training' },
  ]),
  getFaqSchema([
    { question: 'What is included with a cage rental?', answer: 'Each cage rental includes pitching machine, tee, balls, L-screen, and helmets.' },
    { question: 'Do members get discounts?', answer: 'Yes. All tiers get priority booking, discounted rates, and member-only sessions.' },
    { question: 'Are outside instructors allowed?', answer: 'Yes. They must sign a waiver and follow facility guidelines.' },
    { question: 'What is the cancellation policy?', answer: '24+ hours advance: full refund. Same-day: 50% fee. Rescheduling free with 12+ hours notice.' },
  ]),
])

const openFaq = ref<number | null>(null)

const tiers = [
  { name: 'Individual', target: 'One athlete', price: '89', period: 'mo', popular: false, cta: 'Join Now',
    features: ['Daily 1-hour cage access included', 'One Half Turf session per week', 'Walk-On Access to unreserved turf', '25% off additional rentals', 'Parent/coach helpers are free', 'Annual Billing: $890/yr (Save $178)'] },
  { name: 'Family Pass', target: 'Household members', price: '129', period: 'mo', popular: true, cta: 'Join Now',
    features: ['Shared daily 1-hour cage access', 'One Half Turf session per week', 'Walk-On Access to unreserved turf', '25% off additional rentals', 'Parent/coach helpers are free', 'Annual Billing: $1,290/yr (Save $258)'] },
  { name: 'Team Partnerships', target: 'Organized teams & clubs', price: '', period: '', popular: false, cta: TEAM_PRICING.inquiryCta, isTeam: true,
    features: ['Custom discounted pricing for your team', 'Standard or full-facility configurations', 'One-time, recurring, and seasonal options', 'Scheduling shaped around your needs', 'Options for rosters of up to 40 athletes', 'Direct planning support from our team'] },
]

function scrollToBook(tier: { cta: string }) {
  if (tier.cta === TEAM_PRICING.inquiryCta) {
    navigateTo('/teams')
    return
  }
  if (tier.cta === 'Join Now') {
    const user = useSupabaseUser()
    if (user.value) {
      navigateTo('/portal/membership')
    } else {
      navigateTo('/login?signup=true&redirect=/portal/membership')
    }
    return
  }
  smoothScroll('#book')
}

function smoothScroll(hash: string) {
  const el = document.querySelector(hash)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

const faqs = [
  { q: 'What is included with a cage rental?', a: 'Each cage rental includes access to an automated pitching machine, batting tee, bucket of baseballs or softballs, and an L-screen. Helmets are available to borrow.' },
  { q: 'Do members get discounts or priority booking?', a: 'Yes. All membership tiers receive priority booking (up to 14 days in advance), 25% off all additional rentals, and Walk-On Access to unreserved turf.' },
  { q: 'Can non-members or guests train with me?', a: 'Yes. There is a $15 fee for any non-member guest actively training or hitting with an active member.' },
  { q: 'Are outside instructors allowed?', a: 'Yes. They must sign our standard waiver and follow all facility guidelines.' },
  { q: 'What is the cancellation policy?', a: 'Cancellations 24+ hours in advance get a full refund. Same-day cancellations incur a 50% fee. Rescheduling is free with 12+ hours notice.' },
  { q: 'Can I freeze or cancel my membership?', a: 'Monthly memberships can be frozen for up to 30 days/year. Cancellations require 30 days written notice.' },
]
</script>
