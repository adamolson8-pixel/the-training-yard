<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">Training &amp; Memberships</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">Training Programs &amp; Memberships</h1>
        <p class="text-xl text-gray-300 max-w-2xl">
          From individual cage sessions to full-season team contracts. Choose the plan that matches your goals.
        </p>
      </div>
    </section>

    <!-- Booking Calendar -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-cage mb-4 inline-block">Book Online</span>
          <h2 class="heading-lg text-white mb-4">Check Availability &amp; Book</h2>
          <p class="text-gray-400 max-w-2xl mx-auto">Select a resource and date to see available time slots.</p>
        </div>
        <BookingCalendar />
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
            <div class="h-full flex flex-col p-8 rounded-2xl border transition-all duration-500 group-hover:-translate-y-2" :class="tier.popular ? 'bg-gradient-to-b from-primary/10 to-dark-card border-primary/30 shadow-glow-red' : 'glass-card border-white/10 hover:border-white/20'">
              <h3 class="font-display font-bold text-xl text-white mb-1">{{ tier.name }}</h3>
              <p class="text-gray-400 text-sm mb-6">{{ tier.target }}</p>
              <div class="flex items-baseline gap-1 mb-6">
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
              <NuxtLink to="/about" :class="tier.popular ? 'btn-primary w-full text-center' : 'btn-secondary w-full text-center'">{{ tier.cta }}</NuxtLink>
            </div>
          </div>
        </div>

        <!-- Walk-in rates -->
        <div class="max-w-3xl mx-auto mt-12 glass-card p-6 text-center">
          <h3 class="font-display font-semibold text-white mb-2">Walk-In &amp; One-Time Rates</h3>
          <p class="text-gray-400 text-sm mb-4">No membership needed for single sessions.</p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div class="p-3"><div class="text-2xl font-bold text-white">$30</div><div class="text-xs text-gray-400">Single Cage · 30 min</div></div>
            <div class="p-3"><div class="text-2xl font-bold text-white">$50</div><div class="text-xs text-gray-400">Single Cage · 60 min</div></div>
            <div class="p-3"><div class="text-2xl font-bold text-white">$150</div><div class="text-xs text-gray-400">Half Turf · 60 min</div></div>
            <div class="p-3"><div class="text-2xl font-bold text-white">$250</div><div class="text-xs text-gray-400">Full Turf · 60 min</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Programs -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-cage mb-4 inline-block">Programs</span>
          <h2 class="heading-lg text-white mb-4">Clinics, Camps &amp; Group Training</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div v-for="p in programs" :key="p.title" class="glass-card-hover p-6">
            <div class="text-3xl mb-4">{{ p.icon }}</div>
            <h3 class="font-display font-semibold text-white text-lg mb-2">{{ p.title }}</h3>
            <p class="text-gray-400 text-sm leading-relaxed mb-4">{{ p.desc }}</p>
            <div class="flex items-center gap-2 text-sm">
              <span class="text-primary font-semibold">{{ p.price }}</span>
              <span class="text-gray-500">·</span>
              <span class="text-gray-400">{{ p.sched }}</span>
            </div>
          </div>
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
              <button class="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors" @click="openFaq = openFaq === i ? null : i">
                <h3 class="font-display font-semibold text-white pr-4 text-sm md:text-base">{{ item.q }}</h3>
                <svg class="w-5 h-5 text-primary shrink-0 transition-transform duration-300" :class="{ 'rotate-180': openFaq === i }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
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
useHead({
  title: 'Training & Memberships | The Training Yard | Des Moines',
  meta: [{ name: 'description', content: 'Membership plans from $89/mo. Individual, Family & Team tiers. Book batting cages, turf rental, and clinics at The Training Yard Des Moines.' }],
})

useJsonLd([
  getServiceSchema('Training Memberships', 'Monthly membership plans for individuals, families, and teams at The Training Yard.'),
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
    { name: 'Training & Memberships', url: 'https://trainingyarddsm.com/training' },
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
  { name: 'Individual Monthly', target: 'Dedicated youth athletes', price: '89', period: 'mo', popular: false, cta: 'Get Started', features: ['Off-peak cage access included', '20% off peak-hour cage rates', '10% off private lessons', 'Online booking priority (48hr advance)', 'Member-only open gym hours', 'Free equipment usage'] },
  { name: 'Family Pass', target: 'Multi-sport households', price: '149', period: 'mo', popular: true, cta: 'Join Now', features: ['Everything in Individual for up to 4 members', 'Shared cage & turf hour credits', '15% off all clinics & camps', 'Priority peak-hour booking (72hr advance)', 'Free equipment rentals', 'Exclusive member events', '2 guest passes per month'] },
  { name: 'Seasonal Team', target: 'Club & travel teams', price: '1,200', period: 'season', popular: false, cta: 'Contact for Details', features: ['Guaranteed weekly prime-time full turf', 'Full 60\' × 100\' field access', 'Season commitment (10–16 weeks)', 'Team storage locker included', 'Dedicated scheduling coordinator', '20% off all cage add-ons'] },
]

const programs = [
  { icon: '⚾', title: 'Youth Hitting Clinic', desc: 'Progressive 6-week hitting program covering stance, mechanics, and pitch recognition.', price: '$199/player', sched: '6 weeks · Saturdays' },
  { icon: '🥎', title: 'Softball Skills Camp', desc: 'Intensive skills camp for hitting, fielding, base-running, and positional play.', price: '$179/player', sched: '1 week · Summer' },
  { icon: '⚽', title: 'Indoor Soccer Academy', desc: 'Technical skills and small-sided games. Footwork, passing, and tactics.', price: '$149/player', sched: '8 weeks · Evenings' },
  { icon: '⚡', title: 'Speed & Agility', desc: 'Ladder drills, cone work, shuttle runs, and SAQ programming for all sports.', price: '$129/player', sched: '4 weeks · Tue/Thu' },
  { icon: '🏈', title: 'Pre-Season Boot Camp', desc: 'Custom conditioning for teams preparing for their upcoming season.', price: 'Custom quote', sched: 'Flexible' },
  { icon: '🎯', title: 'Private Lessons', desc: 'One-on-one instruction with certified coaches in any discipline.', price: 'From $65', sched: 'By appointment' },
]

const faqs = [
  { q: 'What is included with a cage rental?', a: 'Each cage rental includes access to an automated pitching machine, batting tee, bucket of baseballs or softballs, and an L-screen. Helmets are available to borrow.' },
  { q: 'Do members get discounts or priority booking?', a: 'Yes. All membership tiers receive priority booking (48–72 hours in advance), 20% off peak cage rates, and member-only open gym sessions.' },
  { q: 'Are outside instructors allowed?', a: 'Yes. They must sign our standard waiver and follow all facility guidelines. We also offer in-house instruction.' },
  { q: 'What is the cancellation policy?', a: 'Cancellations 24+ hours in advance get a full refund. Same-day cancellations incur a 50% fee. Rescheduling is free with 12+ hours notice.' },
  { q: 'Can I freeze or cancel my membership?', a: 'Monthly memberships can be frozen for up to 30 days/year. Cancellations require 30 days written notice.' },
]
</script>
