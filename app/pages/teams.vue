<template>
  <div class="min-h-screen bg-gray-950 text-white">

    <!-- Hero -->
    <section class="pt-24 pb-12 px-4 text-center bg-gradient-to-b from-black to-gray-950">
      <div class="max-w-3xl mx-auto">
        <div class="text-5xl mb-4">🏆</div>
        <h1 class="font-display text-4xl md:text-5xl font-bold mb-4">Team Rentals & Packages</h1>
        <p class="text-gray-400 text-lg">Flexible hourly rates, bulk packages, and VIP season plans for clubs, travel teams, and school programs.</p>
      </div>
    </section>

    <!-- Pricing Tables -->
    <section class="py-12 px-4">
      <div class="max-w-5xl mx-auto space-y-10">

        <!-- ═══ Standard Team ═══ -->
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-white/10 flex items-center gap-3">
            <span class="text-2xl">👥</span>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-white">Standard Team</h2>
              <p class="text-gray-400 text-sm">2 Batting Cages + Half Turf (60'×50') · Up to 20 athletes</p>
            </div>
          </div>
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-white/10 text-gray-400">
                  <th class="text-left px-6 py-3 font-medium">Package</th>
                  <th class="text-right px-6 py-3 font-medium">Total Price</th>
                  <th class="text-right px-6 py-3 font-medium">Effective Rate</th>
                  <th class="text-right px-6 py-3 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                <!-- Regular rows -->
                <tr v-for="row in standardTeam" :key="row.label" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium text-white">{{ row.label }}</td>
                  <td class="px-6 py-4 text-right text-amber-400 font-bold">{{ row.price }}</td>
                  <td class="px-6 py-4 text-right text-gray-300">
                    <div>{{ row.rate }}</div>
                    <div v-if="row.comparisonRate" class="text-gray-500 text-xs line-through">{{ row.comparisonRate }}</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="btn-primary text-xs py-1.5 px-3 whitespace-nowrap" @click="buyPackage(row, 'standard')">
                      {{ loading === row.label ? 'Redirecting...' : 'Buy Package' }}
                    </button>
                  </td>
                </tr>
                <!-- VIP row — visually highlighted -->
                <tr class="bg-green-500/8 border-t-2 border-green-500/30">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-white">Annual VIP — 24 hrs</span>
                      <span class="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">⭐ VIP</span>
                      <span class="text-[10px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">Best Value</span>
                    </div>
                    <div class="text-gray-400 text-xs mt-0.5">Year-round access · First-priority scheduling · 20% off extra hrs · 10% roster discount</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="text-green-400 font-bold text-base">$2,700<span class="text-xs font-normal text-gray-400">/yr</span></div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="text-green-400 font-semibold">$112.50/hr</div>
                    <div class="text-gray-500 text-xs line-through">$150/hr</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="btn-primary bg-green-600 hover:bg-green-500 text-white border-none text-xs py-1.5 px-3 whitespace-nowrap" @click="buyPackage({ label: 'Standard VIP – 24 hrs', priceCents: 270000, hours: 24 }, 'standard')">
                      {{ loading === 'standard-vip' ? 'Redirecting...' : 'Buy VIP →' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- CTA footer -->
          <div class="px-6 py-4 border-t border-white/10 bg-white/3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p class="text-gray-400 text-xs">Book in 60, 90, or 120-min blocks. Pitching machines included upon availability.</p>
            <a href="#inquiry" class="btn-primary whitespace-nowrap text-sm" @click.prevent="setPackageAndScroll('Standard Team VIP – 24-Hour Annual ($2,700/yr)')">Get Standard VIP →</a>
          </div>
        </div>

        <!-- ═══ Full Facility Buyout ═══ -->
        <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-5 border-b border-amber-500/20 flex items-center gap-3">
            <span class="text-2xl">🏆</span>
            <div class="flex-1">
              <h2 class="text-xl font-bold text-white">Full Facility Buyout</h2>
              <p class="text-gray-400 text-sm">4 Batting Cages + Full Turf (60'×100') · Up to 40 athletes · No sharing</p>
            </div>
            <span class="text-xs bg-amber-500 text-black font-bold px-3 py-1 rounded-full whitespace-nowrap">Premium</span>
          </div>
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-amber-500/20 text-gray-400">
                  <th class="text-left px-6 py-3 font-medium">Package</th>
                  <th class="text-right px-6 py-3 font-medium">Total Price</th>
                  <th class="text-right px-6 py-3 font-medium">Effective Rate</th>
                  <th class="text-right px-6 py-3 font-medium">Savings</th>
                </tr>
              </thead>
              <tbody>
                <!-- Regular rows -->
                <tr v-for="row in fullBuyout" :key="row.label" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium text-white">{{ row.label }}</td>
                  <td class="px-6 py-4 text-right text-amber-400 font-bold">{{ row.price }}</td>
                  <td class="px-6 py-4 text-right text-gray-300">
                    <div>{{ row.rate }}</div>
                    <div v-if="row.comparisonRate" class="text-gray-500 text-xs line-through">{{ row.comparisonRate }}</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="btn-primary text-xs py-1.5 px-3 whitespace-nowrap" @click="buyPackage(row, 'buyout')">
                      {{ loading === row.label ? 'Redirecting...' : 'Buy Package' }}
                    </button>
                  </td>
                </tr>
                <!-- VIP row — visually highlighted -->
                <tr class="bg-amber-500/8 border-t-2 border-amber-500/30">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-white">Annual VIP — 24 hrs</span>
                      <span class="text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">⭐ VIP</span>
                      <span class="text-[10px] font-bold bg-amber-500 text-black px-2 py-0.5 rounded-full">Best Value</span>
                    </div>
                    <div class="text-gray-400 text-xs mt-0.5">Year-round access · First-priority, no-sharing guaranteed · 20% off extra hrs · 10% roster discount</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="text-amber-400 font-bold text-base">$4,050<span class="text-xs font-normal text-gray-400">/yr</span></div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="text-amber-400 font-semibold">$168.75/hr</div>
                    <div class="text-gray-500 text-xs line-through">$225/hr</div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="btn-primary text-xs py-1.5 px-3 whitespace-nowrap" @click="buyPackage({ label: 'Full Facility VIP – 24 hrs', priceCents: 405000, hours: 24 }, 'buyout')">
                      {{ loading === 'buyout-vip' ? 'Redirecting...' : 'Buy VIP →' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- CTA footer -->
          <div class="px-6 py-4 border-t border-amber-500/20 bg-amber-500/3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p class="text-gray-400 text-xs">Book in 60, 90, or 120-min blocks. Full facility — all cages open, no sharing ever.</p>
            <a href="#inquiry" class="btn-primary whitespace-nowrap text-sm" @click.prevent="setPackageAndScroll('Full Facility VIP – 24-Hour Annual ($4,050/yr)')">Get Full Facility VIP →</a>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-gray-400 space-y-2">
          <p>📅 <strong class="text-white">Scheduling:</strong> Book in 60, 90, or 120-minute increments. Priority advanced scheduling included with all team packages.</p>
          <p>🎯 <strong class="text-white">Includes:</strong> Pitching machines upon availability for all team rentals.</p>
          <p>👨‍👩‍👧 <strong class="text-white">Guest fee:</strong> $15/non-member actively training. Parents/coaches assisting are always free.</p>
        </div>

      </div>
    </section>




    <section id="inquiry" class="py-16 px-4">
      <div class="max-w-2xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="font-display text-3xl font-bold mb-3">Request Team Availability</h2>
          <p class="text-gray-400">Tell us about your team and we'll get back to you with availability and custom package options.</p>
        </div>

        <form @submit.prevent="submitInquiry" class="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 space-y-5">

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Your Name *</label>
              <input v-model="form.name" type="text" required class="form-input" placeholder="Coach / Contact name" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Email *</label>
              <input v-model="form.email" type="email" required class="form-input" placeholder="you@example.com" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
              <input v-model="form.phone" type="tel" class="form-input" placeholder="515-000-0000" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Organization / Team Name *</label>
              <input v-model="form.orgName" type="text" required class="form-input" placeholder="Des Moines Hawks 14U" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Sport / Activity</label>
              <input v-model="form.sport" type="text" class="form-input" placeholder="Baseball, Softball, Multi-sport..." />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Number of Players</label>
              <input v-model="form.players" type="number" min="1" class="form-input" placeholder="15" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Package Interest</label>
            <select v-model="form.packageInterest" class="form-input">
              <option value="">Not sure yet</option>
              <optgroup label="Standard Team (2 Cages + Half Turf)">
                <option value="Standard Team – Single Practice ($150/hr)">Single Practice ($150/hr)</option>
                <option value="Standard Team – 6-Hour Package ($855)">6-Hour Package ($855)</option>
                <option value="Standard Team – 12-Hour Package ($1,530)">12-Hour Package ($1,530)</option>
                <option value="Standard Team VIP – 24-Hour Annual ($2,700/yr)">⭐ VIP – 24-Hour Annual ($2,700/yr)</option>
              </optgroup>
              <optgroup label="Full Facility Buyout (4 Cages + Full Turf)">
                <option value="Full Facility Buyout – Single Practice ($225/hr)">Single Practice ($225/hr)</option>
                <option value="Full Facility Buyout – 6-Hour Package ($1,282.50)">6-Hour Package ($1,282.50)</option>
                <option value="Full Facility Buyout – 12-Hour Package ($2,295)">12-Hour Package ($2,295)</option>
                <option value="Full Facility VIP – 24-Hour Annual ($4,050/yr)">⭐ VIP – 24-Hour Annual ($4,050/yr)</option>
              </optgroup>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Anything else?</label>
            <textarea v-model="form.message" rows="4" class="form-input" placeholder="Preferred days/times, season dates, specific needs..."></textarea>
          </div>

          <!-- Status messages -->
          <div v-if="submitStatus === 'success'" class="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm text-center">
            ✅ Inquiry sent! We'll be in touch within 24 hours.
          </div>
          <div v-if="submitStatus === 'error'" class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            Something went wrong. Please email us directly at <a href="mailto:adam@trainingyarddsm.com" class="underline">adam@trainingyarddsm.com</a>
          </div>

          <button type="submit" class="btn-primary w-full text-lg" :disabled="submitting">
            {{ submitting ? 'Sending...' : 'Send Inquiry' }}
          </button>

        </form>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Team Rentals & Packages – The Training Yard' })

const user = useSupabaseUser()
const loading = ref<string | null>(null)

const standardTeam = [
  { label: 'Single Practice (1 hr)', price: '$150', rate: '$150/hr', priceCents: 15000, hours: 1 },
  { label: '6-Hour Package', price: '$855', rate: '$142.50/hr', comparisonRate: '$150/hr', priceCents: 85500, hours: 6 },
  { label: '12-Hour Package', price: '$1,530', rate: '$127.50/hr', comparisonRate: '$150/hr', priceCents: 153000, hours: 12 },
]

const fullBuyout = [
  { label: 'Single Practice (1 hr)', price: '$225', rate: '$225/hr', priceCents: 22500, hours: 1 },
  { label: '6-Hour Package', price: '$1,282.50', rate: '$213.75/hr', comparisonRate: '$225/hr', priceCents: 128250, hours: 6 },
  { label: '12-Hour Package', price: '$2,295', rate: '$191.25/hr', comparisonRate: '$225/hr', priceCents: 229500, hours: 12 },
]

async function buyPackage(pkg: any, type: 'standard' | 'buyout') {
  if (!user.value) {
    alert('Please log in or create an account to purchase a team package.')
    navigateTo('/login?redirect=/teams')
    return
  }

  loading.value = pkg.label === 'Standard VIP – 24 hrs' ? 'standard-vip' : pkg.label === 'Full Facility VIP – 24 hrs' ? 'buyout-vip' : pkg.label
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/create-team-checkout', {
      method: 'POST',
      body: {
        packageId: `${type}_${pkg.hours}`,
        packageName: `${pkg.label} (${type === 'standard' ? 'Standard Team' : 'Full Buyout'})`,
        priceCents: pkg.priceCents,
        hoursToAdd: pkg.hours,
        packageType: type,
      }
    })
    window.open(url, '_blank')
  } catch (e: any) {
    alert(e?.data?.message || 'Failed to start checkout. Please try again.')
  } finally {
    loading.value = null
  }
}

function setPackageAndScroll(pkg: string) {
  form.packageInterest = pkg
  const el = document.getElementById('inquiry')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

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
select option, select optgroup {
  background-color: #111827;
  color: white;
}
</style>
