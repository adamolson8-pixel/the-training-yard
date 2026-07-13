<template>
  <div>
    <!-- Hero -->
    <section class="relative py-20 md:py-28 bg-hero-gradient overflow-hidden">
      <div class="absolute inset-0">
        <img src="/images/Training_Yard_Facility_Softball.jpg" alt="" class="w-full h-full object-cover object-center" />
      </div>
      <div class="absolute inset-0 bg-dark/70"></div>
      <div class="section-container relative">
        <nav class="flex items-center gap-2 text-sm text-gray-400 mb-6" aria-label="Breadcrumb">
          <NuxtLink to="/" class="hover:text-white transition-colors">Home</NuxtLink>
          <span>/</span>
          <span class="text-white">About &amp; Contact</span>
        </nav>
        <h1 class="heading-xl text-white mb-4">About The Training Yard</h1>
        <p class="text-xl text-gray-300 max-w-2xl">Des Moines' dedicated indoor training facility for youth athletes, teams, and coaches. Built by athletes, for athletes.</p>
      </div>
    </section>

    <!-- About Content -->
    <section class="section-spacing bg-dark">
      <div class="section-container">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto items-center">
          <div>
            <span class="badge-primary mb-4 inline-block">Our Story</span>
            <h2 class="heading-md text-white mb-4">Why We Built The Training Yard</h2>
            <div class="space-y-4 text-gray-400 leading-relaxed">
              <p>Iowa winters are long. And for youth athletes who want to stay sharp, finding quality indoor space has always been a challenge. That's why we built The Training Yard — a purpose-built 6,000 sq ft indoor training facility right here in Des Moines.</p>
              <p>Our four retractable batting cages and full 60' × 100' synthetic turf give athletes the flexibility to train baseball, softball, soccer, and agility all under one roof, year-round. No more canceled practices. No more scrambling for gym time.</p>
              <p>We're not just renting space — we're building a community of dedicated athletes, coaches, and families who believe consistent, quality training makes the difference.</p>
            </div>
          </div>
          <div class="rounded-2xl overflow-hidden">
            <img src="/images/Training_Yard_Facility_homepage.jpg" alt="Inside The Training Yard facility" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>

    <!-- Contact + Map -->
    <section class="section-spacing bg-dark-card/30">
      <div class="section-container">
        <div class="text-center mb-12">
          <span class="badge-primary mb-4 inline-block">Get in Touch</span>
          <h2 class="heading-lg text-white mb-4">Contact Us</h2>
          <p class="text-gray-400 max-w-2xl mx-auto">Questions about booking, memberships, or facility rentals? We're here to help.</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <!-- Contact Form -->
          <div class="glass-card p-8">
            <h3 class="font-display font-semibold text-white text-xl mb-6">Send Us a Message</h3>
            <form id="contact-form" class="space-y-5" @submit.prevent="submitForm">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="contact-name" class="block text-sm text-gray-400 mb-1.5">Full Name *</label>
                  <input id="contact-name" v-model="form.name" type="text" required class="input-field" placeholder="Your name" />
                </div>
                <div>
                  <label for="contact-email" class="block text-sm text-gray-400 mb-1.5">Email *</label>
                  <input id="contact-email" v-model="form.email" type="email" required class="input-field" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label for="contact-phone" class="block text-sm text-gray-400 mb-1.5">Phone</label>
                <input id="contact-phone" v-model="form.phone" type="tel" class="input-field" placeholder="(515) 000-0000" />
              </div>
              <div>
                <label for="contact-interest" class="block text-sm text-gray-400 mb-1.5">I'm Interested In</label>
                <select id="contact-interest" v-model="form.interest" class="input-field">
                  <option value="">Select an option...</option>
                  <option value="cage-rental">Batting Cage Rental</option>
                  <option value="turf-rental">Turf / Team Rental</option>
                  <option value="membership">Memberships</option>
                  <option value="facility-tour">Facility Tour</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label for="contact-message" class="block text-sm text-gray-400 mb-1.5">Message *</label>
                <textarea id="contact-message" v-model="form.message" required rows="4" class="input-field resize-none" placeholder="Tell us about your training needs..."></textarea>
              </div>
              <div v-if="formError" class="text-red-500 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                {{ formError }}
              </div>
              <button id="contact-submit" type="submit" class="btn-primary w-full" :disabled="formSubmitted || isSubmitting">
                {{ isSubmitting ? 'Sending...' : formSubmitted ? '✓ Message Sent!' : 'Send Message' }}
              </button>
            </form>
          </div>

          <!-- Map + Info -->
          <div class="space-y-6">
            <!-- Google Map Embed -->
            <div class="glass-card overflow-hidden aspect-[4/3]">
              <iframe
                title="The Training Yard Location Map"
                src="https://maps.google.com/maps?q=2519%20NW%2066th%20Ave,%20Des%20Moines,%20IA%2050313&t=&z=15&ie=UTF8&iwloc=&output=embed"
                class="w-full h-full border-0"
                allowfullscreen
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <!-- Contact Details -->
            <div class="glass-card p-6 space-y-4">
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <div><div class="text-white font-semibold text-sm">Address</div><div class="text-gray-400 text-sm">2519 NW 66th Ave, Des Moines, IA 50313</div></div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <div><div class="text-white font-semibold text-sm">Phone</div><a href="tel:+15154410528" class="text-gray-400 text-sm hover:text-white transition-colors">515.441.0528</a></div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <div><div class="text-white font-semibold text-sm">Email</div><a href="mailto:info@trainingyarddsm.com" class="text-gray-400 text-sm hover:text-white transition-colors">info@trainingyarddsm.com</a></div>
              </div>
              <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div><div class="text-white font-semibold text-sm">Hours</div><div class="text-gray-400 text-sm">Mon–Fri 6am–10pm · Sat–Sun 8am–8pm</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Facility Rules -->
    <section class="section-spacing bg-dark">
      <div class="section-container max-w-3xl mx-auto">
        <div class="text-center mb-12">
          <span class="badge-primary mb-4 inline-block">Policies</span>
          <h2 class="heading-md text-white mb-3">Facility Rules &amp; Waivers</h2>
        </div>
        <div class="space-y-4">
          <div v-for="(rule, i) in rules" :key="i" class="glass-card overflow-hidden">
            <button class="w-full flex items-center justify-between p-6 text-left hover:bg-white/5 transition-colors" @click="openRule = openRule === i ? null : i">
              <h3 class="font-display font-semibold text-white pr-4">{{ rule.title }}</h3>
              <svg class="w-5 h-5 text-primary shrink-0 transition-transform duration-300" :class="{ 'rotate-180': openRule === i }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            <div v-if="openRule === i" class="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
              <ul class="space-y-2">
                <li v-for="(item, j) in rule.items" :key="j" class="flex items-start gap-2">
                  <span class="text-primary mt-0.5">•</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'About & Contact | The Training Yard | Des Moines, IA',
  meta: [
    { name: 'description', content: 'Contact The Training Yard in Des Moines, IA. Visit us at 2519 NW 66th Ave. Call (515) 441-0528. Indoor batting cages and turf rentals.' },
    { property: 'og:title', content: 'About & Contact | The Training Yard | Des Moines, IA' },
    { property: 'og:description', content: 'Contact The Training Yard in Des Moines, IA. Visit us at 2519 NW 66th Ave. Call (515) 441-0528. Indoor batting cages and turf rentals.' },
    { property: 'og:url', content: 'https://trainingyarddsm.com/about' },
  ],
  link: [
    { rel: 'canonical', href: 'https://trainingyarddsm.com/about' },
  ],
})

useJsonLd([
  getLocalBusinessSchema(),
  getBreadcrumbSchema([
    { name: 'Home', url: 'https://trainingyarddsm.com/' },
    { name: 'About & Contact', url: 'https://trainingyarddsm.com/about' },
  ]),
])

const openRule = ref<number | null>(null)
const formSubmitted = ref(false)
const formError = ref('')
const isSubmitting = ref(false)
const form = reactive({ name: '', email: '', phone: '', interest: '', message: '' })

const submitForm = async () => { 
  isSubmitting.value = true
  formError.value = ''
  
  try {
    await $fetch('/api/contact', {
      method: 'POST',
      body: form
    })
    formSubmitted.value = true
  } catch (error: any) {
    formError.value = error.message || 'An error occurred while sending your message. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

const rules = [
  { title: 'General Facility Rules', items: ['All participants must sign a waiver before using the facility.', 'Athletes under 14 must be accompanied by a parent or guardian.', 'No food or open beverages on the turf or in batting cages.', 'No metal cleats allowed on the synthetic turf — turf shoes or indoor shoes only.', 'All personal equipment must be removed after your session.', 'Respect other users — keep noise levels reasonable during shared sessions.'] },
  { title: 'Batting Cage Policies', items: ['Batting helmets are required for all cage users, regardless of age.', 'Maximum 3 people in a cage at one time (1 batter, 1 feeder/pitcher, 1 on-deck).', 'No soft-toss or flips outside the cage netting area.', 'Report any machine malfunctions immediately to staff.', 'Baseballs and softballs are provided — do not bring non-standard balls.'] },
  { title: 'Turf Rental Rules', items: ['Turf rentals include the reserved area only — stay within your zone.', 'Full-turf rentals have priority; other users may be asked to move.', 'Teams must provide their own coaching staff during rental periods.', 'No goals, anchoring, or equipment that could damage the turf surface.', 'Clean up all personal equipment and trash before leaving.'] },
  { title: 'Waiver & Liability', items: ['All participants must complete and sign a liability waiver prior to their first visit.', 'Parents/guardians must sign for minors under 18.', 'Waivers are valid for one calendar year and must be renewed annually.', 'The Training Yard is not responsible for lost or stolen personal items.', 'Waivers can be completed online or in-person at the front desk.'] },
]
</script>
