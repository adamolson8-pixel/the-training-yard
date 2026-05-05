<template>
  <div>
    <HeroSection />
    <FacilityHighlights />
    <SportsServed />
    <MembershipTeaser />
    <TestimonialsBlock />
    <HomeFAQ />

    <!-- CTA Banner -->
    <section class="py-20 bg-gradient-to-r from-primary-dark via-primary to-accent relative overflow-hidden">
      <div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
      <div class="section-container relative text-center">
        <h2 class="heading-lg text-white mb-4">Ready to Level Up Your Game?</h2>
        <p class="text-white/80 text-lg max-w-2xl mx-auto mb-8">
          Book a cage, reserve the turf, or start a membership. Year-round indoor training starts here.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink id="cta-banner-book" to="/training" class="inline-flex items-center justify-center px-8 py-4 bg-white text-primary font-bold rounded-xl text-lg transition-all duration-300 hover:bg-gray-100 hover:shadow-xl hover:scale-[1.02]">
            Book Now
          </NuxtLink>
          <NuxtLink id="cta-banner-tour" to="/about" class="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white font-semibold rounded-xl text-lg border border-white/20 transition-all duration-300 hover:bg-white/20">
            Schedule a Tour
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// SEO
useHead({
  title: 'The Training Yard | Indoor Sports Facility | Des Moines, IA',
  meta: [
    {
      name: 'description',
      content: 'The Training Yard is Des Moines\' premier 6,000 sq ft indoor sports facility. 4 batting cages, 60x100 synthetic turf. Baseball, softball, soccer & agility training. Memberships from $89/mo.',
    },
  ],
})

// JSON-LD Schema
useJsonLd([
  getLocalBusinessSchema(),
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
  ]),
  getFaqSchema([
    {
      question: 'What sports can you train at The Training Yard?',
      answer: 'The Training Yard supports baseball, softball, soccer, agility and speed training, flag football, and general athletic conditioning. Our 60\' × 100\' turf and 4 retractable batting cages accommodate virtually any indoor sport or drill.',
    },
    {
      question: 'How big is the facility?',
      answer: 'The Training Yard is 6,000 square feet (60 feet wide × 100 feet long) of premium synthetic turf with a ceiling height that accommodates fly balls and pop-ups.',
    },
    {
      question: 'Can a team rent the whole turf?',
      answer: 'Yes. We offer full-turf team rentals by the hour and seasonal team contracts. When you book the full turf, all four batting cages retract to give your team the complete 60\' × 100\' space.',
    },
    {
      question: 'Do members get discounts or priority booking?',
      answer: 'Yes. All membership tiers include priority booking, discounted hourly rates, and member-only open gym sessions. Family Pass and Team members get additional discounts on clinics, camps, and equipment.',
    },
    {
      question: 'What ages is the facility best for?',
      answer: 'The Training Yard serves athletes from age 6 through adult, with the primary focus on youth athletes ages 8–18 including club/travel teams and high school players.',
    },
    {
      question: 'What should players bring?',
      answer: 'For batting cages: your own bat, batting gloves, and helmet. For turf: indoor athletic shoes (no metal cleats). For soccer: indoor soccer shoes or turf shoes. We provide balls, tees, and nets.',
    },
  ]),
])
</script>
