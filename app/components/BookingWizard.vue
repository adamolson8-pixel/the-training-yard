<template>
  <div class="glass-card overflow-hidden">
    <!-- Progress Bar -->
    <div class="px-6 py-4 border-b border-white/10">
      <div class="flex items-center justify-between mb-3">
        <span class="text-white font-semibold text-sm">Step {{ store.step }} of 5</span>
        <span class="text-amber-400 text-sm font-medium">{{ stepLabels[store.step - 1] }}</span>
      </div>
      <div class="w-full bg-white/10 rounded-full h-1.5">
        <div
          class="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
          :style="{ width: `${(store.step / 5) * 100}%` }"
        />
      </div>
    </div>

    <div class="p-6 md:p-8">
      <!-- Step 1: Service Selection -->
      <div v-if="store.step === 1">
        <h2 class="text-2xl font-bold text-white mb-2">Choose Your Session</h2>
        <p class="text-gray-400 mb-4">Pick the rental option that fits your training needs.</p>

        <!-- Membership upsell banner -->
        <a
          href="#membership"
          class="flex items-center gap-3 p-3 mb-6 rounded-xl border border-green-500/40 bg-green-500/10 hover:bg-green-500/20 transition-colors group"
        >
          <span class="text-2xl">🌟</span>
          <div class="flex-1 min-w-0">
            <p class="text-green-400 font-semibold text-sm leading-tight">Members save up to 25% on every session</p>
            <p class="text-gray-400 text-xs mt-0.5">Individual $89/mo · Family $129/mo — member prices shown below</p>
          </div>
          <span class="text-green-400 text-xs font-semibold whitespace-nowrap group-hover:underline">Learn more →</span>
        </a>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            v-for="service in SERVICES"
            :key="service.id"
            class="text-left p-4 rounded-xl border-2 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500"
            :class="store.service?.id === service.id
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'"
            @click="store.setService(service)"
          >
            <div class="text-3xl mb-2">{{ service.emoji }}</div>
            <div class="font-bold text-white text-sm mb-1">{{ service.label }}</div>
            <!-- Price row: regular + member side by side -->
            <div class="flex items-baseline gap-2 mb-2">
              <span class="text-amber-400 font-bold text-xl">{{ formatPrice(service.priceCents) }}</span>
              <span class="text-gray-500 text-xs line-through"></span>
              <span class="flex items-center gap-1 text-green-400 text-xs font-semibold">
                <span>🌟</span>{{ formatPrice(service.memberPriceCents) }}
              </span>
            </div>
            <div class="text-gray-400 text-xs mb-3">{{ service.description }}</div>
            <div class="flex gap-3 text-xs text-gray-500">
              <span>⏱ {{ service.durationMinutes }} min</span>
              <span>👥 Up to {{ service.maxPlayers }}</span>
            </div>
          </button>
        </div>
        <div class="mt-8">
          <button
            class="btn-primary w-full"
            :disabled="!store.service"
            @click="store.nextStep()"
          >
            Continue →
          </button>
        </div>
      </div>

      <!-- Step 2: Date & Time -->
      <div v-if="store.step === 2">
        <h2 class="text-2xl font-bold text-white mb-2">Pick a Date & Time</h2>
        <p class="text-gray-400 mb-6">We're open Monday–Saturday. Select your preferred session.</p>

        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-300 mb-2">Date</label>
          <input
            v-model="selectedDate"
            type="date"
            :min="minDate"
            :max="maxDate"
            class="form-input max-w-xs"
            @change="onDateChange"
          />
          <p v-if="selectedDate && !isOpenDaySelected" class="text-red-400 text-sm mt-2">
            Sorry, we're closed on Sundays. Please pick another day.
          </p>
        </div>

        <div v-if="availableSlots.length > 0">
          <label class="block text-sm font-semibold text-gray-300 mb-3">Available Times</label>
          <div class="grid grid-cols-3 sm:grid-cols-4 gap-2">
            <button
              v-for="slot in availableSlots"
              :key="slot"
              class="py-2 px-3 text-sm rounded-lg border-2 transition-all font-medium"
              :class="selectedTime === slot
                ? 'bg-amber-500 text-black border-amber-500 font-bold'
                : 'border-white/10 text-gray-300 hover:border-amber-500/50 hover:text-white bg-white/5'"
              @click="selectedTime = slot"
            >
              {{ slot }}
            </button>
          </div>
        </div>
        <p v-else-if="selectedDate && isOpenDaySelected" class="text-gray-400 text-sm">
          No slots available for this date. Please select a future date.
        </p>

        <div class="flex gap-3 mt-8">
          <button class="btn-back" @click="store.prevStep()">← Back</button>
          <button
            class="btn-primary flex-1"
            :disabled="!selectedDate || !selectedTime || !isOpenDaySelected"
            @click="confirmDateTime"
          >
            Continue →
          </button>
        </div>
      </div>

      <!-- Step 3: Customer Info -->
      <div v-if="store.step === 3">
        <h2 class="text-2xl font-bold text-white mb-2">Your Information</h2>
        <p class="text-gray-400 mb-6">Tell us who's coming to train.</p>

        <form class="space-y-4" @submit.prevent="submitCustomerInfo">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="form-label">Full Name <span class="text-red-400">*</span></label>
              <input v-model="form.customerName" type="text" required class="form-input" placeholder="Jane Smith" />
            </div>
            <div>
              <label class="form-label">Email <span class="text-red-400">*</span></label>
              <input v-model="form.customerEmail" type="email" required class="form-input" placeholder="jane@example.com" />
            </div>
            <div>
              <label class="form-label">Phone <span class="text-red-400">*</span></label>
              <input v-model="form.customerPhone" type="tel" required class="form-input" placeholder="(515) 555-0100" />
            </div>
            <div>
              <label class="form-label">Player Name</label>
              <input v-model="form.playerName" type="text" class="form-input" placeholder="If different from above" />
            </div>
            <div>
              <label class="form-label">Player Age</label>
              <input v-model="form.playerAge" type="number" min="4" max="99" class="form-input" placeholder="e.g. 14" />
            </div>
            <div>
              <label class="form-label">Primary Sport</label>
              <select v-model="form.sport" class="form-input">
                <option value="">Select sport...</option>
                <option value="baseball">Baseball</option>
                <option value="softball">Softball</option>
                <option value="soccer">Soccer</option>
                <option value="football">Football</option>
                <option value="lacrosse">Lacrosse</option>
                <option value="multi-sport">Multi-Sport</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label">Additional Notes</label>
            <textarea v-model="form.notes" class="form-input" rows="3" placeholder="Equipment requests, accessibility needs, etc." />
          </div>

          <div class="flex gap-3 mt-4">
            <button type="button" class="btn-back" @click="store.prevStep()">← Back</button>
            <button type="submit" class="btn-primary flex-1">Continue →</button>
          </div>
        </form>
      </div>

      <!-- Step 4: Waiver -->
      <div v-if="store.step === 4">
        <h2 class="text-2xl font-bold text-white mb-2">Liability Waiver</h2>
        <p class="text-gray-400 mb-4">Please read and sign the waiver before proceeding.</p>

        <div class="border border-white/10 rounded-xl p-5 h-64 overflow-y-auto text-sm text-gray-300 leading-relaxed mb-6 bg-white/5">
          <p class="font-bold text-white mb-3">TRAINING YARD DSM — LIABILITY WAIVER & RELEASE</p>

          <p class="font-semibold text-gray-200 mb-1">1. ASSUMPTION OF RISK</p>
          <p class="mb-3">I understand and acknowledge that participation in athletic activities at Training Yard DSM ("Facility"), including but not limited to use of batting cages, pitching machines, synthetic turf, agility equipment, and any other equipment or spaces within the Facility, involves inherent risks of injury or death. These risks include, but are not limited to, sprains, strains, fractures, contusions, concussions, eye injuries, and other serious bodily harm. I voluntarily assume all such risks.</p>

          <p class="font-semibold text-gray-200 mb-1">2. RELEASE OF LIABILITY</p>
          <p class="mb-3">In consideration for being permitted to use the Facility, I, on behalf of myself, my heirs, executors, administrators, legal representatives, and assigns, hereby RELEASE, WAIVE, DISCHARGE, AND COVENANT NOT TO SUE Training Yard DSM, its owners, operators, employees, agents, volunteers, and affiliates (collectively "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising from any loss, damage, or injury — including death — that may be sustained by me or any participant I accompany, whether caused by the negligence of the Released Parties or otherwise.</p>

          <p class="font-semibold text-gray-200 mb-1">3. MEDICAL AUTHORIZATION</p>
          <p class="mb-3">I authorize the Released Parties to obtain emergency medical treatment if I or the participant I am accompanying becomes injured or incapacitated and I am unable to consent to treatment. I accept full financial responsibility for any medical care rendered.</p>

          <p class="font-semibold text-gray-200 mb-1">4. FACILITY RULES ACKNOWLEDGMENT</p>
          <p class="mb-3">I agree to comply with all Facility rules and safety guidelines, including: wearing appropriate athletic footwear; following staff instructions at all times; not using equipment without proper authorization; not bringing food, beverages, or outside equipment without permission; and immediately reporting any injury or unsafe condition to Facility staff.</p>

          <p class="font-semibold text-gray-200 mb-1">5. PHOTO & VIDEO CONSENT</p>
          <p class="mb-3">I grant Training Yard DSM permission to photograph or video-record sessions for promotional, marketing, or instructional purposes. Images or footage may be shared on social media, the Facility website, or other marketing materials. I waive any right to compensation or approval over such use.</p>

          <p class="font-semibold text-gray-200 mb-1">6. MINOR PARTICIPANT</p>
          <p class="mb-3">If I am signing on behalf of a minor participant, I represent that I am the parent or legal guardian of said minor and I consent on their behalf to all terms above. I accept full responsibility for the minor's compliance with Facility rules and for any injury or damage they may cause or sustain.</p>

          <p class="text-gray-500 text-xs mt-4">By signing below, I acknowledge that I have read this waiver, understand its contents, and agree to be bound by its terms.</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="form-label">Signature (Type Full Name) <span class="text-red-400">*</span></label>
            <input
              v-model="waiverName"
              type="text"
              class="form-input max-w-sm"
              placeholder="Type your full name"
              required
            />
          </div>
          <label class="flex items-start gap-3 cursor-pointer">
            <input v-model="waiverChecked" type="checkbox" class="mt-0.5 w-5 h-5 rounded accent-amber-500 flex-shrink-0" />
            <span class="text-sm text-gray-300">
              I have read and agree to the Liability Waiver & Release above. I understand this is a binding legal agreement.
            </span>
          </label>
        </div>

        <div class="flex gap-3 mt-6">
          <button class="btn-back" @click="store.prevStep()">← Back</button>
          <button
            class="btn-primary flex-1"
            :disabled="!waiverChecked || !waiverName.trim()"
            @click="submitWaiver"
          >
            Continue →
          </button>
        </div>
      </div>

      <!-- Step 5: Review & Pay -->
      <div v-if="store.step === 5">
        <h2 class="text-2xl font-bold text-white mb-2">Review & Pay</h2>
        <p class="text-gray-400 mb-6">Double-check your booking, then proceed to secure checkout.</p>

        <div class="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400">Service</span>
            <span class="font-semibold text-white">{{ store.service?.label }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Date & Time</span>
            <span class="font-semibold text-white">{{ formatBookingDate(store.date) }} at {{ store.time }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Duration</span>
            <span class="font-semibold text-white">{{ store.service?.durationMinutes }} minutes</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Name</span>
            <span class="font-semibold text-white">{{ store.customerName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Email</span>
            <span class="font-semibold text-white">{{ store.customerEmail }}</span>
          </div>
          <div v-if="store.playerName" class="flex justify-between">
            <span class="text-gray-400">Player</span>
            <span class="font-semibold text-white">{{ store.playerName }}</span>
          </div>
          <div class="border-t border-white/10 pt-3 flex justify-between items-center">
            <span class="font-bold text-white text-base">Total Due</span>
            <span class="text-3xl font-bold text-amber-400">{{ formatPrice(store.service?.priceCents ?? 0) }}</span>
          </div>
        </div>

        <p v-if="checkoutError" class="text-red-400 text-sm mb-4 bg-red-900/20 border border-red-500/20 rounded-lg px-4 py-3">
          {{ checkoutError }}
        </p>

        <div class="flex gap-3">
          <button class="btn-back" @click="store.prevStep()">← Back</button>
          <button
            class="btn-primary flex-1"
            :disabled="isCheckingOut"
            @click="startCheckout"
          >
            <span v-if="isCheckingOut" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Processing...
            </span>
            <span v-else>🔒 Secure Checkout — {{ formatPrice(store.service?.priceCents ?? 0) }}</span>
          </button>
        </div>
        <p class="text-xs text-gray-500 mt-3 text-center">Payments processed securely by Stripe. You'll be redirected to complete payment.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { SERVICES, formatPrice } from '~/utils/services'
import { isOpenDay, getAvailableTimeSlots } from '~/utils/timeSlots'
import { useBookingStore } from '~/stores/booking'

const store = useBookingStore()

const stepLabels = ['Select Service', 'Date & Time', 'Your Info', 'Sign Waiver', 'Review & Pay']

// Step 2
const selectedDate = ref('')
const selectedTime = ref('')
const minDate = computed(() => new Date().toISOString().split('T')[0])
const maxDate = computed(() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 3)
  return d.toISOString().split('T')[0]
})
const isOpenDaySelected = computed(() => {
  if (!selectedDate.value) return true
  return isOpenDay(new Date(selectedDate.value + 'T12:00:00'))
})
const availableSlots = computed(() => {
  if (!selectedDate.value || !isOpenDaySelected.value) return []
  return getAvailableTimeSlots(new Date(selectedDate.value + 'T12:00:00'))
})
function onDateChange() {
  selectedTime.value = ''
}
function confirmDateTime() {
  if (!selectedDate.value || !selectedTime.value) return
  store.setDateTime(selectedDate.value, selectedTime.value)
  store.nextStep()
}

// Step 3
const form = reactive({
  customerName: store.customerName,
  customerEmail: store.customerEmail,
  customerPhone: store.customerPhone,
  playerName: store.playerName,
  playerAge: store.playerAge,
  sport: store.sport,
  notes: store.notes,
})
function submitCustomerInfo() {
  if (!form.customerName || !form.customerEmail || !form.customerPhone) return
  store.setCustomerInfo(form)
  store.nextStep()
}

// Step 4
const waiverName = ref(store.waiverSignerName)
const waiverChecked = ref(store.waiverAccepted)
function submitWaiver() {
  if (!waiverChecked.value || !waiverName.value.trim()) return
  store.setWaiver(true, waiverName.value.trim())
  store.nextStep()
}

// Step 5
const isCheckingOut = ref(false)
const checkoutError = ref('')
async function startCheckout() {
  if (!store.service) return
  isCheckingOut.value = true
  checkoutError.value = ''
  try {
    const res = await $fetch<{ url: string }>('/api/stripe/create-checkout', {
      method: 'POST',
      body: {
        serviceId: store.service.id,
        date: store.date,
        time: store.time,
        customerName: store.customerName,
        customerEmail: store.customerEmail,
        customerPhone: store.customerPhone,
        playerName: store.playerName,
        playerAge: store.playerAge,
        sport: store.sport,
        notes: store.notes,
        waiverAccepted: store.waiverAccepted,
        waiverSignerName: store.waiverSignerName,
      },
    })
    window.location.href = res.url
  } catch (err: unknown) {
    const e = err as { data?: { message?: string } }
    checkoutError.value = e?.data?.message || 'Something went wrong. Please try again.'
    isCheckingOut.value = false
  }
}

function formatBookingDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.form-label {
  @apply block text-sm font-semibold text-gray-300 mb-1;
}
.form-input {
  @apply w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors;
}
.form-input option {
  @apply bg-gray-900 text-white;
}
.btn-back {
  @apply border border-white/20 text-gray-300 font-medium px-5 py-2.5 rounded-lg hover:bg-white/5 transition-colors;
}
</style>
