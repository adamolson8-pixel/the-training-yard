<template>
  <div class="p-6 md:p-10 max-w-3xl mx-auto w-full">

    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Membership</h1>
      <p class="text-gray-400 mt-1">Your current plan and billing information.</p>
    </div>

    <!-- Current status card -->
    <div class="rounded-2xl border p-6 mb-6" :class="statusCardClass">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div class="text-xs font-bold uppercase tracking-widest mb-1" :class="statusTextClass">Current Plan</div>
          <div class="text-white text-2xl font-bold">{{ planLabel }}</div>
          <div class="text-gray-400 text-sm mt-1" v-if="profile?.membership_type">{{ membershipTypeLabel }}</div>
        </div>
        <span class="px-4 py-1.5 rounded-full text-sm font-bold" :class="statusBadgeClass">{{ statusLabel }}</span>
      </div>

      <div v-if="profile?.membership_expires" class="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-sm">
        <span class="text-gray-400">Renews / Expires:</span>
        <span class="text-white font-semibold">{{ formatDate(profile.membership_expires) }}</span>
      </div>
    </div>

    <!-- Member benefits -->
    <div v-if="profile?.membership_status === 'active'" class="rounded-2xl border border-green-500/20 bg-green-500/5 p-5 mb-6">
      <div class="text-green-400 font-bold text-sm mb-3">Your Member Benefits</div>
      <div v-if="profile?.membership_discount_code" class="text-gray-400 text-xs mb-3">
        Team rate: <span class="font-mono font-bold text-white">{{ profile.membership_discount_code }}</span>
        <span v-if="cageOnly"> · cage-only membership (turf not included)</span>
      </div>
      <ul class="space-y-2 text-sm text-gray-300">
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Up to 1 hour of single cage time per day</li>
        <template v-if="!cageOnly">
          <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 1 booking of Open Turf (Half Facility) per week</li>
          <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Walk-On Access to unreserved turf</li>
        </template>
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 25% off all additional {{ cageOnly ? 'cage ' : '' }}rentals</li>
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 14-day advance booking priority</li>
        <li v-if="profile?.membership_type?.includes('family')" class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Covers all immediate family members</li>
      </ul>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Membership Plans (shown when user has NO active membership)       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div v-if="showPlanCards">
      <div class="mb-6">
        <h2 class="text-xl font-bold text-white mb-1">Choose a Membership Plan</h2>
        <p class="text-gray-400 text-sm">Save 25% on every session. Cancel anytime.</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <!-- Individual Plan -->
        <div class="relative rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col hover:border-white/20 transition-all">
          <div class="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Individual</div>
          <div class="text-white text-3xl font-bold mb-1">$89<span class="text-base font-normal text-gray-400">/mo</span></div>
          <p class="text-gray-400 text-sm mb-5">One athlete. All the perks.</p>
          <ul class="space-y-2 text-sm text-gray-300 mb-6 flex-1">
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Daily 1-hour cage access included</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> One turf session per week</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Walk-On Access to unreserved turf</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 25% off additional rentals</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Parent/coach helpers are free</li>
          </ul>
          <div class="flex gap-2">
            <button
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/30"
              @click="selectPlan('individual')"
              :class="{ 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black': selectedPlan === 'individual' }"
            >
              Monthly ($89)
            </button>
            <button
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/30 relative overflow-hidden"
              @click="selectPlan('individual_annual')"
              :class="{ 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black': selectedPlan === 'individual_annual' }"
            >
              Annual ($890)
              <div class="absolute -top-1 -right-4 bg-green-500 text-[9px] font-bold px-4 py-0.5 rotate-45">SAVE $178</div>
            </button>
          </div>
        </div>

        <!-- Family Plan -->
        <div class="relative rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6 flex flex-col transition-all">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-amber-500 to-red-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-lg">Most Popular</div>
          <div class="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Family</div>
          <div class="text-white text-3xl font-bold mb-1">$129<span class="text-base font-normal text-gray-400">/mo</span></div>
          <p class="text-gray-400 text-sm mb-5">All household members included.</p>
          <ul class="space-y-2 text-sm text-gray-300 mb-6 flex-1">
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Shared daily 1-hour cage access</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> One turf session per week</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Walk-On Access to unreserved turf</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 25% off additional rentals</li>
            <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Covers all immediate family members</li>
          </ul>
          <div class="flex gap-2">
            <button
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-600 hover:to-red-600 shadow-lg"
              @click="selectPlan('family')"
              :class="{ 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black': selectedPlan === 'family' }"
            >
              Monthly ($129)
            </button>
            <button
              class="flex-1 py-3 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-600 hover:to-red-600 shadow-lg relative overflow-hidden"
              @click="selectPlan('family_annual')"
              :class="{ 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black': selectedPlan === 'family_annual' }"
            >
              Annual ($1,290)
              <div class="absolute -top-1 -right-4 bg-green-500 text-[9px] font-bold px-4 py-0.5 rotate-45">SAVE $258</div>
            </button>
          </div>
        </div>
      </div>

      <!-- Team CTA -->
      <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div class="text-white font-bold text-sm">Training with a Team?</div>
            <p class="text-gray-400 text-xs mt-0.5">We’ll build custom discounted pricing around your team’s season.</p>
          </div>
          <NuxtLink to="/teams" class="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">Request Team Pricing →</NuxtLink>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- Member Info Form (shown after selecting a plan)                    -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <Transition name="slide-down">
      <div v-if="selectedPlan && showPlanCards" ref="memberFormEl" class="mt-6 scroll-mt-6 rounded-2xl border border-amber-500/30 bg-white/5 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-lg font-bold text-white">Member Information</h3>
            <p class="text-gray-400 text-sm mt-0.5">Who is this membership for?</p>
          </div>
          <button @click="selectedPlan = null" class="text-gray-500 hover:text-white text-sm">✕ Cancel</button>
        </div>

        <div class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-5 flex items-center gap-3">
          <span class="text-xl">{{ selectedPlan?.includes('family') ? '👨‍👩‍👧‍👦' : '⚡' }}</span>
          <div>
            <div class="text-white font-bold text-sm">
              {{ selectedPlan?.includes('family') ? 'Family Plan' : 'Individual Plan' }}
              — 
              {{ selectedPlan?.includes('annual') ? (selectedPlan?.includes('family') ? '$1,290/yr' : '$890/yr') : (selectedPlan?.includes('family') ? '$129/mo' : '$89/mo') }}
            </div>
            <div class="text-amber-400/70 text-xs">You can cancel anytime from the billing portal.</div>
          </div>
        </div>

        <div class="mb-5">
          <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Team or Promo Code</label>
          <input
            v-model="teamCode"
            type="text"
            autocapitalize="characters"
            placeholder="Optional"
            class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:normal-case placeholder:text-gray-600"
          />
          <p v-if="!teamCode.trim()" class="text-gray-500 text-xs mt-1">Playing for a partner team? Enter your team’s code for its discounted rate.</p>
          <p v-else-if="codeChecking" class="text-gray-500 text-xs mt-1">Checking code…</p>
          <p v-else-if="codeInfo && !codeInfo.valid" class="text-red-400 text-xs mt-1">{{ codeInfo.message || 'That code isn’t valid.' }}</p>
          <p v-else-if="codeInfo?.valid && !codeInfo.terms?.length" class="text-green-400 text-xs mt-1">✓ {{ codeInfo.discount || 'Discount' }} applied at checkout.</p>

          <!-- Team rate terms: shown before payment, must be accepted -->
          <div v-if="codeInfo?.valid && codeInfo.terms?.length" class="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div class="text-white font-bold text-sm mb-2">{{ codeInfo.team }} team rate — please read</div>
            <ul class="space-y-1.5 text-xs text-gray-300 list-disc pl-4">
              <li v-for="term in codeInfo.terms" :key="term">{{ term }}</li>
            </ul>
            <label v-if="codeInfo.requiresAgreement" class="mt-3 flex items-start gap-2 text-sm text-white cursor-pointer">
              <input v-model="termsAccepted" type="checkbox" class="mt-0.5 accent-amber-500" />
              <span>I’ve read and agree to the {{ codeInfo.team }} team rate terms above.</span>
            </label>
          </div>
        </div>

        <div class="space-y-4">
          <!-- Member Name -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Member's Full Name <span class="text-red-400">*</span></label>
            <input
              v-model="memberName"
              type="text"
              placeholder="e.g. Jake Smith"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
            <p class="text-gray-500 text-xs mt-1">The athlete who will be using this membership.</p>
          </div>

          <!-- Date of Birth -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Member's Date of Birth</label>
            <input
              v-model="memberDob"
              type="date"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:dark]"
            />
          </div>

          <!-- Relationship -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Your Relationship to Member</label>
            <select
              v-model="memberRelationship"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:dark]"
            >
              <option value="self">This is for myself</option>
              <option value="parent">I'm their parent/guardian</option>
              <option value="spouse">I'm their spouse</option>
              <option value="coach">I'm their coach</option>
              <option value="other">Other</option>
            </select>
          </div>

          <button
            class="w-full py-3 rounded-xl font-bold text-sm transition-all mt-2"
            :class="selectedPlan?.includes('family')
              ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-600 hover:to-red-600 shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/30'"
            :disabled="!memberName.trim() || checkoutLoading || !codeReady"
            @click="startCheckout"
          >
            <span v-if="checkoutLoading" class="flex items-center justify-center gap-2">
              <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Redirecting to payment…
            </span>
            <span v-else>Continue to Payment →</span>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Checkout success message -->
    <div v-if="checkoutSuccess" class="rounded-2xl border border-green-500/30 bg-green-500/10 p-5 mb-6">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🎉</span>
        <div>
          <div class="text-green-400 font-bold text-sm">Welcome to the team!</div>
          <p class="text-gray-300 text-xs mt-0.5">Your membership is now active. Refresh the page if your status hasn't updated yet.</p>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="checkoutError" class="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 mb-6 text-red-400 text-sm">
      {{ checkoutError }}
    </div>

    <!-- Stripe Customer Portal link (for active/past-due subscribers) -->
    <div v-if="hasStripeSubscription" class="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div class="text-white font-semibold text-sm mb-1">Billing & Subscription</div>
      <p class="text-gray-400 text-xs mb-4">Manage your payment method, update billing info, or cancel your subscription through the secure Stripe billing portal.</p>
      <button
        class="btn-primary text-sm"
        :disabled="loadingPortal"
        @click="openStripePortal"
      >
        {{ loadingPortal ? 'Opening...' : '🔒 Open Billing Portal' }}
      </button>
      <p class="text-gray-600 text-xs mt-2">You'll be redirected to Stripe's secure customer portal.</p>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Membership — Training Yard' })

const route = useRoute()
const { data: profile, refresh: refreshProfile } = await useFetch<any>('/api/portal/me')
const loadingPortal = ref(false)
const checkoutLoading = ref(false)
const checkoutError = ref('')
const checkoutSuccess = ref(false)

// Plan selection & member info
const selectedPlan = ref<string | null>(null)
const memberName = ref(profile.value?.full_name || '')
const memberDob = ref('')
const memberRelationship = ref('self')

// Team or promo code: checked as it's typed so team rate terms show before payment
const teamCode = ref('')
const codeInfo = ref<any>(null)
const codeChecking = ref(false)
const termsAccepted = ref(false)
let codeTimer: ReturnType<typeof setTimeout> | undefined
watch([teamCode, selectedPlan], () => {
  clearTimeout(codeTimer)
  codeInfo.value = null
  termsAccepted.value = false
  const code = teamCode.value.trim()
  if (!code || !selectedPlan.value) { codeChecking.value = false; return }
  codeChecking.value = true
  codeTimer = setTimeout(async () => {
    try {
      const result = await $fetch<any>('/api/portal/membership-code', { query: { code, plan: selectedPlan.value } })
      if (code === teamCode.value.trim()) codeInfo.value = result
    } catch {
      codeInfo.value = { valid: false, message: 'Unable to check that code right now.' }
    } finally {
      if (code === teamCode.value.trim()) codeChecking.value = false
    }
  }, 400)
})
const codeReady = computed(() => !teamCode.value.trim()
  || (!codeChecking.value && codeInfo.value?.valid && (!codeInfo.value.requiresAgreement || termsAccepted.value)))

// Always sync membership status on page load (catches webhook misses, dev mode, etc.)
onMounted(async () => {
  if (route.query.checkout === 'success') {
    checkoutSuccess.value = true
  }

  // Sync from Stripe when there is no membership on file or its renewal date has passed
  const expires = profile.value?.membership_expires
  if (!profile.value?.membership_status || profile.value.membership_status === 'none' || (expires && new Date(expires) < new Date())) {
    try {
      const result = await $fetch<any>('/api/stripe/sync-membership', { method: 'POST' })
      if (result.synced) {
        await refreshProfile()
      }
    } catch (e: any) {
      console.warn('Membership sync failed:', e)
    }
  }
})

const showPlanCards = computed(() => {
  const s = profile.value?.membership_status
  return !s || s === 'none' || s === 'canceled'
})

// Cage-only team membership: the team's code excludes turf benefits
const cageOnly = computed(() => profile.value?.membership_includes_turf === false)

const hasStripeSubscription = computed(() =>
  profile.value?.stripe_subscription_id &&
  ['active', 'past_due'].includes(profile.value?.membership_status)
)

const planLabel = computed(() => {
  if (!profile.value?.membership_status || profile.value?.membership_status === 'none') return 'No Membership'
  if (profile.value?.membership_status === 'canceled') return 'Membership Canceled'
  return profile.value?.membership_type
    ? membershipTypeLabel.value
    : 'Member'
})

const membershipTypeLabel = computed(() => {
  const t = profile.value?.membership_type
  const map: Record<string, string> = {
    individual: 'Individual Plan — $89/mo',
    individual_annual: 'Individual Plan — $890/yr',
    family: 'Family Plan — $129/mo',
    family_annual: 'Family Plan — $1,290/yr',
    team_vip_standard: 'Team Partnership — Standard Setup',
    team_vip_full: 'Team Partnership — Full Facility',
  }
  return t ? (map[t] ?? t) : ''
})

const statusLabel = computed(() => {
  const s = profile.value?.membership_status
  if (s === 'active') return 'Active'
  if (s === 'past_due') return 'Past Due'
  if (s === 'canceled') return 'Canceled'
  return 'Inactive'
})

const statusCardClass = computed(() => {
  const s = profile.value?.membership_status
  if (s === 'active') return 'border-green-500/30 bg-green-500/5'
  if (s === 'past_due') return 'border-red-500/30 bg-red-500/5'
  return 'border-white/10 bg-white/5'
})

const statusTextClass = computed(() => {
  const s = profile.value?.membership_status
  if (s === 'active') return 'text-green-400'
  if (s === 'past_due') return 'text-red-400'
  return 'text-gray-500'
})

const statusBadgeClass = computed(() => {
  const s = profile.value?.membership_status
  if (s === 'active') return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (s === 'past_due') return 'bg-red-500/20 text-red-400 border border-red-500/30'
  return 'bg-white/10 text-gray-400'
})

const memberFormEl = ref<HTMLElement | null>(null)

function selectPlan(planId: string) {
  selectedPlan.value = planId
  checkoutError.value = ''
  // Pre-fill member name with account holder name
  if (!memberName.value) {
    memberName.value = profile.value?.full_name || ''
  }
  // The form opens below the plan cards, usually off-screen; bring it into view
  nextTick(() => memberFormEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

async function startCheckout() {
  if (!selectedPlan.value || !memberName.value.trim()) return
  checkoutLoading.value = true
  checkoutError.value = ''
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/create-membership-checkout', {
      method: 'POST',
      body: {
        planId: selectedPlan.value,
        memberName: memberName.value.trim(),
        memberDob: memberDob.value,
        memberRelationship: memberRelationship.value,
        teamCode: teamCode.value.trim(),
        teamTermsAccepted: termsAccepted.value,
      },
    })
    if (url) {
      window.open(url, '_blank')
    } else {
      throw new Error('No checkout URL returned.')
    }
  } catch (e: any) {
    checkoutError.value = e?.data?.message || e?.message || 'Failed to start checkout. Please try again.'
    checkoutLoading.value = false
  }
}

async function openStripePortal() {
  loadingPortal.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/customer-portal', { method: 'POST' })
    window.open(url, '_blank')
  } catch {
    alert('Unable to open billing portal. Please contact us at info@trainingyarddsm.com')
  } finally {
    loadingPortal.value = false
  }
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
