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

        <!-- Standard Team -->
        <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <div class="px-6 py-5 border-b border-white/10 flex items-center gap-3">
            <span class="text-2xl">👥</span>
            <div>
              <h2 class="text-xl font-bold text-white">Standard Team</h2>
              <p class="text-gray-400 text-sm">2 Batting Cages + Half Turf (50'×60') · Up to 20 athletes</p>
            </div>
          </div>
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
                <tr v-for="row in standardTeam" :key="row.label" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium text-white">{{ row.label }}</td>
                  <td class="px-6 py-4 text-right text-amber-400 font-bold">{{ row.price }}</td>
                  <td class="px-6 py-4 text-right text-gray-300">{{ row.rate }}</td>
                  <td class="px-6 py-4 text-right">
                    <span v-if="row.savings" class="text-green-400 font-semibold">{{ row.savings }}</span>
                    <span v-else class="text-gray-500">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Full Facility Buyout -->
        <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div class="px-6 py-5 border-b border-amber-500/20 flex items-center gap-3">
            <span class="text-2xl">🏟️</span>
            <div>
              <h2 class="text-xl font-bold text-white">Full Facility Buyout</h2>
              <p class="text-gray-400 text-sm">4 Batting Cages + Full Turf (100'×60') · Up to 40 athletes · No sharing</p>
            </div>
            <span class="ml-auto text-xs bg-amber-500 text-black font-bold px-3 py-1 rounded-full">Premium</span>
          </div>
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
                <tr v-for="row in fullBuyout" :key="row.label" class="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td class="px-6 py-4 font-medium text-white">{{ row.label }}</td>
                  <td class="px-6 py-4 text-right text-amber-400 font-bold">{{ row.price }}</td>
                  <td class="px-6 py-4 text-right text-gray-300">{{ row.rate }}</td>
                  <td class="px-6 py-4 text-right">
                    <span v-if="row.savings" class="text-green-400 font-semibold">{{ row.savings }}</span>
                    <span v-else class="text-gray-500">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Annual VIP callout -->
        <div class="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div class="text-3xl">⭐</div>
          <div class="flex-1">
            <h3 class="text-lg font-bold text-white mb-1">Annual Team VIP — $2,700/yr</h3>
            <p class="text-gray-400 text-sm">24 hours of Standard Team time, usable year-round. First-priority scheduling, 20% off additional hours, and 10% roster discount on player memberships.</p>
            <p class="text-green-400 text-sm font-semibold mt-1">Effective rate: $112.50/hr — lowest available</p>
          </div>
          <a href="#inquiry" class="btn-primary whitespace-nowrap">Get VIP Info</a>
        </div>

        <!-- Notes -->
        <div class="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-gray-400 space-y-2">
          <p>📅 <strong class="text-white">Scheduling:</strong> Book in 60, 90, or 120-minute increments. Priority advanced scheduling included with all team packages.</p>
          <p>🎯 <strong class="text-white">Includes:</strong> Pitching machines upon availability for all team rentals.</p>
          <p>👨‍👩‍👧 <strong class="text-white">Guest fee:</strong> $15/non-member actively training. Parents/coaches assisting are always free.</p>
        </div>

      </div>
    </section>

    <!-- Inquiry Form -->
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
              <option value="Standard Team – Single Practice ($150/hr)">Standard Team – Single Practice ($150/hr)</option>
              <option value="Standard Team – 6-Hour Package ($855)">Standard Team – 6-Hour Package ($855)</option>
              <option value="Standard Team – 12-Hour Package ($1,530)">Standard Team – 12-Hour Package ($1,530)</option>
              <option value="Standard Team – 24-Hour Package ($2,700)">Standard Team – 24-Hour Package ($2,700)</option>
              <option value="Full Facility Buyout – Single Practice ($225/hr)">Full Facility Buyout – Single Practice ($225/hr)</option>
              <option value="Full Facility Buyout – 6-Hour Package ($1,282.50)">Full Facility Buyout – 6-Hour Package ($1,282.50)</option>
              <option value="Full Facility Buyout – 12-Hour Package ($2,295)">Full Facility Buyout – 12-Hour Package ($2,295)</option>
              <option value="Full Facility Buyout – 24-Hour Package ($4,050)">Full Facility Buyout – 24-Hour Package ($4,050)</option>
              <option value="Annual Team VIP ($2,700/yr)">Annual Team VIP ($2,700/yr)</option>
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

const standardTeam = [
  { label: 'Single Practice (1 hr)', price: '$150', rate: '$150/hr', savings: null },
  { label: '6-Hour Package (5% off)', price: '$855', rate: '$142.50/hr', savings: 'Save $45' },
  { label: '12-Hour Package (15% off)', price: '$1,530', rate: '$127.50/hr', savings: 'Save $270' },
  { label: '24-Hour Package (25% off)', price: '$2,700', rate: '$112.50/hr', savings: 'Save $900' },
]

const fullBuyout = [
  { label: 'Single Practice (1 hr)', price: '$225', rate: '$225/hr', savings: null },
  { label: '6-Hour Package (5% off)', price: '$1,282.50', rate: '$213.75/hr', savings: 'Save $67.50' },
  { label: '12-Hour Package (15% off)', price: '$2,295', rate: '$191.25/hr', savings: 'Save $405' },
  { label: '24-Hour Package (25% off)', price: '$4,050', rate: '$168.75/hr', savings: 'Save $1,350' },
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
