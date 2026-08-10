<template>
  <div class="min-h-screen bg-gray-950 text-white">
    <section class="relative overflow-hidden px-4 pb-16 pt-24 text-center bg-gradient-to-b from-black to-gray-950">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.16),transparent_48%)]" />
      <div class="relative mx-auto max-w-4xl">
        <span class="mb-5 inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-amber-400">
          Team &amp; Club Partners
        </span>
        <h1 class="font-display text-4xl font-bold leading-tight md:text-6xl">{{ TEAM_PRICING.headline }}</h1>
        <p class="mx-auto mt-5 max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">{{ TEAM_PRICING.message }}</p>
        <div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a :href="TEAM_PRICING.phoneHref" class="btn-primary w-full text-center sm:w-auto" :aria-label="`${TEAM_PRICING.callCta} at ${TEAM_PRICING.phoneDisplay}`">
            {{ TEAM_PRICING.callCta }}
          </a>
          <a href="#inquiry" class="btn-secondary w-full text-center sm:w-auto" @click.prevent="scrollToInquiry()">
            {{ TEAM_PRICING.inquiryCta }}
          </a>
        </div>
        <p class="mt-4 text-sm text-gray-400">
          Prefer to talk it through? Call <a :href="TEAM_PRICING.phoneHref" class="font-bold text-amber-400 hover:text-amber-300">{{ TEAM_PRICING.phoneDisplay }}</a>.
        </p>
      </div>
    </section>

    <section class="px-4 py-14">
      <div class="mx-auto max-w-5xl">
        <div class="mb-10 text-center">
          <h2 class="font-display text-3xl font-bold md:text-4xl">Choose the Space. We’ll Build the Plan.</h2>
          <p class="mx-auto mt-3 max-w-2xl text-gray-400">Start with the setup that fits your practice. We’ll help shape the schedule and pricing around your actual needs.</p>
        </div>

        <div class="grid gap-6 md:grid-cols-2">
          <article v-for="option in teamOptions" :key="option.value" class="flex h-full flex-col rounded-2xl border bg-white/5 p-7" :class="option.featured ? 'border-amber-500/35' : 'border-white/10'">
            <div class="mb-4 flex items-start justify-between gap-3">
              <span class="text-4xl" aria-hidden="true">{{ option.emoji }}</span>
              <span v-if="option.featured" class="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-black">Maximum Flexibility</span>
            </div>
            <h3 class="text-2xl font-bold">{{ option.name }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-400">{{ option.description }}</p>
            <ul class="my-6 flex-1 space-y-3 text-sm text-gray-300">
              <li v-for="feature in option.features" :key="feature" class="flex items-start gap-2">
                <span class="mt-0.5 text-green-400" aria-hidden="true">✓</span>
                <span>{{ feature }}</span>
              </li>
            </ul>
            <button class="btn-primary w-full" type="button" @click="scrollToInquiry(option.value)">{{ TEAM_PRICING.inquiryCta }}</button>
          </article>
        </div>
      </div>
    </section>

    <section class="border-y border-white/10 bg-white/[0.03] px-4 py-14">
      <div class="mx-auto max-w-5xl">
        <div class="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <span class="text-sm font-bold uppercase tracking-widest text-amber-400">A plan that fits</span>
            <h2 class="mt-3 font-display text-3xl font-bold">No One-Size-Fits-All Team Rate</h2>
            <p class="mt-4 leading-relaxed text-gray-400">A weekly winter practice should not be priced the same as a one-time tryout, clinic, or full-season training partnership. We’ll listen first and recommend an arrangement that works for both your team and the facility.</p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <div v-for="factor in pricingFactors" :key="factor.title" class="rounded-xl border border-white/10 bg-black/20 p-5">
              <div class="text-2xl" aria-hidden="true">{{ factor.emoji }}</div>
              <h3 class="mt-3 font-bold text-white">{{ factor.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-gray-400">{{ factor.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="inquiry" class="scroll-mt-24 px-4 py-16">
      <div class="mx-auto max-w-2xl">
        <div class="mb-10 text-center">
          <h2 class="font-display text-3xl font-bold">{{ TEAM_PRICING.inquiryCta }}</h2>
          <p class="mt-3 text-gray-400">Tell us what would make a great practice plan for your team. We’ll follow up to talk through availability and pricing.</p>
        </div>

        <form class="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8" @submit.prevent="submitInquiry">
          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="teamContactName" class="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
              <input id="teamContactName" v-model="form.name" type="text" required autocomplete="name" class="form-input" placeholder="Coach / contact name">
            </div>
            <div>
              <label for="teamContactEmail" class="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input id="teamContactEmail" v-model="form.email" type="email" required autocomplete="email" class="form-input" placeholder="you@example.com">
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="teamContactPhone" class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input id="teamContactPhone" v-model="form.phone" type="tel" autocomplete="tel" class="form-input" placeholder="515-000-0000">
            </div>
            <div>
              <label for="teamOrganization" class="block text-sm font-medium text-gray-300 mb-1">Organization / Team Name *</label>
              <input id="teamOrganization" v-model="form.orgName" type="text" required autocomplete="organization" class="form-input" placeholder="Des Moines Hawks 14U">
            </div>
          </div>

          <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label for="teamSport" class="block text-sm font-medium text-gray-300 mb-1">Sport / Activity</label>
              <input id="teamSport" v-model="form.sport" type="text" class="form-input" placeholder="Baseball, softball, soccer...">
            </div>
            <div>
              <label for="teamPlayers" class="block text-sm font-medium text-gray-300 mb-1">Number of Players</label>
              <input id="teamPlayers" v-model="form.players" type="number" min="1" class="form-input" placeholder="15">
            </div>
          </div>

          <div>
            <label for="teamSetup" class="block text-sm font-medium text-gray-300 mb-1">Preferred Team Setup</label>
            <select id="teamSetup" v-model="form.packageInterest" class="form-input">
              <option value="">Help me choose</option>
              <option value="Standard Team Setup — 2 Cages + Half Turf">Standard Team Setup — 2 Cages + Half Turf</option>
              <option value="Full Facility — 4 Cages + Full Turf">Full Facility — 4 Cages + Full Turf</option>
              <option value="Custom or rotating setup">Custom or rotating setup</option>
            </select>
          </div>

          <div>
            <label for="teamNeeds" class="block text-sm font-medium text-gray-300 mb-1">Practice Schedule &amp; Team Needs</label>
            <textarea id="teamNeeds" v-model="form.message" rows="5" class="form-input" placeholder="Preferred days and times, season dates, practice frequency, goals, and anything we should know..."></textarea>
          </div>

          <div v-if="submitStatus === 'success'" role="status" class="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center text-sm text-green-400">
            Inquiry sent! We’ll be in touch within 24 hours to discuss a plan for your team.
          </div>
          <div v-if="submitStatus === 'error'" role="alert" class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-400">
            Something went wrong. Call <a :href="TEAM_PRICING.phoneHref" class="font-bold underline">{{ TEAM_PRICING.phoneDisplay }}</a> or email <a href="mailto:info@trainingyarddsm.com" class="font-bold underline">info@trainingyarddsm.com</a>.
          </div>

          <button type="submit" class="btn-primary w-full text-lg" :disabled="submitting">
            {{ submitting ? 'Sending…' : TEAM_PRICING.inquiryCta }}
          </button>
          <p class="text-center text-xs text-gray-500">No obligation. We’ll start with a conversation about what works for your team.</p>
        </form>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { TEAM_PRICING } from '~/utils/teamPricing'

useHead({
  title: 'Custom Team Pricing & Rentals – The Training Yard',
  meta: [
    { name: 'description', content: 'Custom discounted team pricing at The Training Yard Des Moines. We work with clubs, travel teams, and school programs to build a practice plan around their schedule, roster, and budget.' },
    { property: 'og:title', content: 'Custom Team Pricing, Built Around Your Season' },
    { property: 'og:description', content: 'Tell us what your team needs, and we’ll build a discounted practice plan around your schedule, roster, and budget.' },
    { property: 'og:url', content: 'https://trainingyarddsm.com/teams' },
  ],
  link: [{ rel: 'canonical', href: 'https://trainingyarddsm.com/teams' }],
})

const teamOptions = [
  {
    name: 'Standard Team Setup',
    value: 'Standard Team Setup — 2 Cages + Half Turf',
    emoji: '👥',
    description: "Two batting cages plus 60' × 50' of open turf for organized practices, station work, and smaller team groups.",
    features: ['Room for up to 20 athletes', 'Hitting, fielding, and conditioning stations', '60, 90, and 120-minute practice options', 'Pitching machines available upon request'],
    featured: false,
  },
  {
    name: 'Full Facility',
    value: 'Full Facility — 4 Cages + Full Turf',
    emoji: '🏆',
    description: "Exclusive use of all four cages and the full 60' × 100' turf—ideal for larger rosters, clinics, tryouts, and complete team practices.",
    features: ['Room for up to 40 athletes', 'No shared space during your reservation', 'Flexible cage and open-turf configurations', 'Great for recurring practices and special events'],
    featured: true,
  },
]

const pricingFactors = [
  { emoji: '📅', title: 'Season & Frequency', description: 'One-time sessions, weekly practices, and longer partnerships each call for a different plan.' },
  { emoji: '👥', title: 'Roster & Space', description: 'We’ll match your group size and practice format to the right facility configuration.' },
  { emoji: '⏱️', title: 'Days & Times', description: 'Timing and flexibility help us find the best availability and value for your team.' },
  { emoji: '🤝', title: 'Budget & Goals', description: 'Share what you need to accomplish, and we’ll work to create pricing that makes sense.' },
]

const form = reactive({
  name: '',
  email: '',
  phone: '',
  orgName: '',
  sport: '',
  players: '',
  packageInterest: '',
  message: '',
})

const submitting = ref(false)
const submitStatus = ref<'idle' | 'success' | 'error'>('idle')

function scrollToInquiry(setup = '') {
  if (setup) form.packageInterest = setup
  document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitInquiry() {
  submitting.value = true
  submitStatus.value = 'idle'
  try {
    await $fetch('/api/team-inquiry', { method: 'POST', body: form })
    submitStatus.value = 'success'
    Object.assign(form, { name: '', email: '', phone: '', orgName: '', sport: '', players: '', packageInterest: '', message: '' })
  } catch {
    submitStatus.value = 'error'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
select option {
  background-color: #111827;
  color: white;
}
select.form-input {
  min-width: 0;
  max-width: 100%;
}
</style>
