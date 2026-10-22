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
        <h2 class="text-xl font-bold text-white mb-1">{{ teamMode ? 'Your Team Membership' : 'Choose a Membership Plan' }}</h2>
        <p class="text-gray-400 text-sm">{{ teamMode ? 'Complete the details below to finish signing up.' : 'Save 25% on every session. Cancel anytime.' }}</p>
      </div>

      <!-- Team rate applied (signup link or code): one plan, discounted price, straight to checkout -->
      <div v-if="teamMode" class="mb-2 rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div class="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1">{{ teamRate.team }} team rate</div>
            <div class="text-white text-xl font-bold">{{ teamBasePlan === 'family' ? 'Family' : 'Individual' }} Membership</div>
          </div>
          <span v-if="teamRate.discount" class="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400">{{ teamRate.discount }}</span>
        </div>
        <div class="mt-3 flex flex-wrap items-baseline gap-2">
          <span v-if="teamPrice !== fullPrice" class="text-gray-500 line-through text-lg">{{ money(fullPrice) }}/{{ priceUnit }}</span>
          <span class="text-white text-4xl font-bold">{{ money(teamPrice) }}</span><span class="text-gray-400">/{{ priceUnit }}</span>
        </div>
        <p class="text-gray-400 text-xs mt-1">
          Code <span class="font-mono font-bold text-white">{{ teamRate.code }}</span> applied ·
          <button type="button" class="underline hover:text-white" @click="removeTeamCode">Remove code</button>
        </p>
        <div class="mt-4 inline-flex rounded-xl border border-white/10 bg-black/30 p-1 text-xs font-bold">
          <button type="button" class="px-3 py-1.5 rounded-lg" :class="selectedPlan?.includes('annual') ? 'text-gray-400 hover:text-white' : 'bg-amber-500 text-black'" @click="selectPlan(teamBasePlan, false)">Monthly</button>
          <button type="button" class="px-3 py-1.5 rounded-lg" :class="selectedPlan?.includes('annual') ? 'bg-amber-500 text-black' : 'text-gray-400 hover:text-white'" @click="selectPlan(teamBasePlan + '_annual', false)">Annual</button>
        </div>
        <ul class="mt-4 space-y-2 text-sm text-gray-300">
          <li v-for="benefit in teamBenefits" :key="benefit" class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> {{ benefit }}</li>
        </ul>
        <p class="text-amber-400/70 text-xs mt-4">Renews automatically each {{ selectedPlan?.includes('annual') ? 'year' : 'month' }} and charges your card until you cancel. Cancel anytime from the billing portal.</p>
      </div>

      <!-- Team code: players on a partner team start here -->
      <div v-if="!teamMode" class="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div class="text-white font-bold text-sm">Have a team code?</div>
            <p class="text-gray-400 text-xs mt-0.5">Players on a partner team: enter the code from your coach to get your team’s membership rate.</p>
          </div>
          <button
            v-if="!showCodeEntry"
            class="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-600 hover:to-red-600"
            @click="showCodeEntry = true"
          >
            Enter Team Code
          </button>
          <form v-else class="flex gap-2 w-full sm:w-auto" @submit.prevent="applyTeamCode()">
            <input
              v-model="codeEntry"
              type="text"
              autocapitalize="characters"
              placeholder="e.g. DUCKS2627"
              class="flex-1 sm:w-44 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white text-sm uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:normal-case placeholder:text-gray-600"
            />
            <button
              type="submit"
              :disabled="!codeEntry.trim() || applyingCode"
              class="px-4 py-2 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-red-500 text-white disabled:opacity-50"
            >
              {{ applyingCode ? 'Checking…' : 'Apply' }}
            </button>
          </form>
        </div>
        <p v-if="codeEntryError" class="text-red-400 text-xs mt-2">{{ codeEntryError }}</p>
      </div>

      <div v-if="!teamMode" class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
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

      <!-- Team CTA (coaches) -->
      <div v-if="!teamMode" class="rounded-2xl border border-white/10 bg-white/5 p-5">
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
          <button v-if="!teamMode" @click="selectedPlan = null" class="text-gray-500 hover:text-white text-sm">✕ Cancel</button>
        </div>

        <div v-if="!teamMode" class="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-5 flex items-center gap-3">
          <span class="text-xl">{{ selectedPlan?.includes('family') ? '👨‍👩‍👧‍👦' : '⚡' }}</span>
          <div>
            <div class="text-white font-bold text-sm">
              {{ selectedPlan?.includes('family') ? 'Family Plan' : 'Individual Plan' }}
              — 
              {{ selectedPlan?.includes('annual') ? (selectedPlan?.includes('family') ? '$1,290/yr' : '$890/yr') : (selectedPlan?.includes('family') ? '$129/mo' : '$89/mo') }}
            </div>
            <div class="text-amber-400/70 text-xs">Renews automatically each {{ selectedPlan?.includes('annual') ? 'year' : 'month' }} and charges your card until you cancel. Cancel anytime from the billing portal.</div>
          </div>
        </div>

        <div class="mb-5">
          <template v-if="!teamMode">
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
          </template>

          <!-- Team rate terms: must be accepted before payment; full text on request -->
          <div v-if="codeInfo?.valid && codeInfo.terms?.length" class="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <label class="flex items-start gap-2 text-sm text-white cursor-pointer">
              <input v-model="termsAccepted" type="checkbox" class="mt-0.5 accent-amber-500" />
              <span>I agree to the {{ codeInfo.team }} team rate terms.</span>
            </label>
            <button type="button" class="mt-2 ml-6 text-xs font-bold text-amber-400 underline hover:text-amber-300" @click="showTerms = !showTerms">
              {{ showTerms ? 'Hide terms' : 'View terms' }}
            </button>
            <ul v-if="showTerms" class="mt-2 ml-6 space-y-1.5 text-xs text-gray-300 list-disc pl-4">
              <li v-for="term in codeInfo.terms" :key="term">{{ term }}</li>
            </ul>
          </div>
          <p v-else-if="teamMode && codeChecking" class="text-gray-500 text-xs">Loading team terms…</p>
        </div>

        <div class="space-y-4">
          <!-- Who is filling this out -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Who Is Filling This Out? <span class="text-red-400">*</span></label>
            <select
              v-model="memberRelationship"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:dark]"
            >
              <option value="parent">I'm the player's parent or legal guardian</option>
              <option value="self">I'm the player (18 or older)</option>
              <option value="other">Other</option>
            </select>
            <input
              v-if="memberRelationship === 'other'"
              v-model="relationshipDetail"
              type="text"
              placeholder="Your relationship to the player (e.g. grandparent)"
              class="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>

          <!-- Player Name -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Player's Full Name <span class="text-red-400">*</span></label>
            <input
              v-model="memberName"
              type="text"
              placeholder="e.g. Jake Smith"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
            <p class="text-gray-500 text-xs mt-1">The athlete who will be using this membership.</p>
          </div>

          <!-- Player Date of Birth -->
          <div>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">Player's Date of Birth <span class="text-red-400">*</span></label>
            <input
              v-model="memberDob"
              type="date"
              :max="todayIso"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:dark]"
            />
            <p v-if="minorSigningSelf" class="text-red-400 text-xs mt-1">Players under 18 must be signed up by a parent or legal guardian. Choose “parent or legal guardian” above.</p>
            <p v-else-if="minorNeedsParent" class="text-red-400 text-xs mt-1">Players under 18 must be signed up by a parent or legal guardian.</p>
          </div>

          <!-- Parent / Guardian Name -->
          <div v-if="memberRelationship !== 'self'">
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5">{{ memberRelationship === 'parent' ? 'Parent / Guardian Full Name' : 'Your Full Name' }} <span class="text-red-400">*</span></label>
            <input
              v-model="guardianName"
              type="text"
              placeholder="e.g. Sarah Smith"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>

          <!-- Liability waiver for the player, signed before payment -->
          <div class="rounded-xl border border-white/10 bg-black/20 p-4">
            <div class="text-white font-bold text-sm mb-1">Liability Waiver <span class="text-red-400">*</span></div>
            <p class="text-gray-400 text-xs mb-3">
              Required for {{ memberName.trim() || 'the player' }}{{ memberRelationship === 'self' ? '' : ', signed by their parent or legal guardian' }}.
            </p>
            <div class="h-48 overflow-y-auto bg-black/40 border border-white/10 rounded-lg p-4 mb-3 text-xs text-gray-300 leading-relaxed custom-scrollbar">
              <WaiverText />
            </div>
            <label class="flex items-start gap-2 text-sm text-white cursor-pointer">
              <input v-model="waiverChecked" type="checkbox" class="mt-0.5 accent-amber-500" />
              <span>
                I have read and agree to the Release of Liability and Waiver Agreement{{ memberRelationship === 'self' ? '' : ` on behalf of ${memberName.trim() || 'the player'} as their parent or legal guardian` }}.
              </span>
            </label>
            <label class="block text-gray-400 text-xs font-semibold uppercase tracking-wider mt-3 mb-1.5">Signature <span class="text-red-400">*</span></label>
            <input
              v-model="waiverSignature"
              type="text"
              placeholder="Type your full legal name"
              class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-gray-600"
            />
          </div>

          <button
            class="w-full py-3 rounded-xl font-bold text-sm transition-all mt-2"
            :class="selectedPlan?.includes('family')
              ? 'bg-gradient-to-r from-amber-500 to-red-500 text-white hover:from-amber-600 hover:to-red-600 shadow-lg'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:border-white/30'"
            :disabled="checkoutLoading || !formReady"
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
const memberName = ref('')
const memberDob = ref('')
// Players are usually minors, so a parent or guardian fills this out by default
const memberRelationship = ref('parent')
const relationshipDetail = ref('') // typed relationship when "Other"
const guardianName = ref(profile.value?.full_name || '')
const waiverChecked = ref(false)
const waiverSignature = ref('')
const todayIso = new Date().toISOString().slice(0, 10)

// Player's age today, from their birth date
const playerAge = computed(() => {
  if (!memberDob.value) return null
  const dob = new Date(`${memberDob.value}T12:00:00`)
  const now = new Date()
  let age = now.getFullYear() - dob.getFullYear()
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--
  return age
})
const isMinor = computed(() => playerAge.value !== null && playerAge.value < 18)
const minorSigningSelf = computed(() => isMinor.value && memberRelationship.value === 'self')
const minorNeedsParent = computed(() => isMinor.value && !['self', 'parent'].includes(memberRelationship.value))

// The account holder is the player when signing up for themselves, otherwise the parent/guardian
watch(memberRelationship, (relationship, previous) => {
  const accountName = profile.value?.full_name || ''
  if (relationship === 'self') {
    if (!memberName.value.trim()) memberName.value = accountName
  } else {
    if (previous === 'self' && memberName.value === accountName) memberName.value = ''
    if (!guardianName.value.trim()) guardianName.value = accountName
  }
})

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
// "Have a team code?" button (or a ?team= link from the coach): the code
// picks its plan and opens that plan's signup form with the code filled in.
const showCodeEntry = ref(false)
const codeEntry = ref('')
const codeEntryError = ref('')
const applyingCode = ref(false)
async function applyTeamCode(code = codeEntry.value.trim()) {
  if (!code) return
  applyingCode.value = true
  codeEntryError.value = ''
  try {
    const result = await $fetch<any>('/api/portal/membership-code', { query: { code } })
    if (!result.valid) {
      codeEntryError.value = result.message || 'That code isn’t valid.'
      return
    }
    if (result.team) teamRate.value = result
    selectPlan(result.plan)
    teamCode.value = result.code
  } catch {
    codeEntryError.value = 'Unable to check that code right now. Please try again.'
  } finally {
    applyingCode.value = false
  }
}

// Team view: once a team code is applied (link, button, or typed in the form)
// the page shows just that team's plan at its discounted price.
const teamRate = ref<any>(null)
const teamMode = computed(() => Boolean(teamRate.value))
const showTerms = ref(false)
watch(codeInfo, (info) => { if (info?.valid && info.team) teamRate.value = { ...teamRate.value, ...info } })
function removeTeamCode() {
  teamRate.value = null
  teamCode.value = ''
  codeEntry.value = ''
  showCodeEntry.value = false
  selectedPlan.value = null
}

const PLAN_PRICE_CENTS: Record<string, number> = { individual: 8900, individual_annual: 89000, family: 12900, family_annual: 129000 }
const teamBasePlan = computed(() => (selectedPlan.value || teamRate.value?.plan || 'individual').replace('_annual', ''))
const priceUnit = computed(() => (selectedPlan.value?.includes('annual') ? 'yr' : 'mo'))
const fullPrice = computed(() => PLAN_PRICE_CENTS[selectedPlan.value || teamBasePlan.value] || 0)
const teamPrice = computed(() => {
  const rate = teamRate.value
  if (rate?.percentOff) return Math.round(fullPrice.value * (1 - rate.percentOff / 100))
  if (rate?.amountOffCents) return Math.max(0, fullPrice.value - rate.amountOffCents)
  return fullPrice.value
})
const money = (cents: number) => `${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`
const teamBenefits = computed(() => {
  const family = teamBasePlan.value === 'family'
  if (teamRate.value?.includesTurf === false) {
    return [family ? 'Shared daily 1-hour cage access' : 'Daily 1-hour cage access included', '25% off additional cage rentals', 'Parent/coach helpers are free', 'Cage access only: turf is not included']
  }
  return [family ? 'Shared daily 1-hour cage access' : 'Daily 1-hour cage access included', 'One turf session per week', 'Walk-On Access to unreserved turf', '25% off additional rentals', 'Parent/coach helpers are free']
})

const codeReady = computed(() => !teamCode.value.trim()
  || (!codeChecking.value && codeInfo.value?.valid && (!codeInfo.value.requiresAgreement || termsAccepted.value)))

// Player, birth date, parent (unless signing up themselves as an adult), waiver, and any code terms
const formReady = computed(() => Boolean(selectedPlan.value && memberName.value.trim() && memberDob.value
  && (memberRelationship.value === 'self' || guardianName.value.trim())
  && (memberRelationship.value !== 'other' || relationshipDetail.value.trim().length >= 2)
  && !minorSigningSelf.value && !minorNeedsParent.value
  && waiverChecked.value && waiverSignature.value.trim().length >= 2
  && codeReady.value))

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

  // Signup link from a coach, e.g. /portal/membership?team=DUCKS2627
  // (not ?code=, which Supabase reads as its own sign-in code)
  const linkCode = typeof route.query.team === 'string' ? route.query.team.trim() : ''
  if (linkCode && showPlanCards.value) {
    showCodeEntry.value = true
    codeEntry.value = linkCode
    await applyTeamCode(linkCode)
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

function selectPlan(planId: string, scroll = true) {
  selectedPlan.value = planId
  checkoutError.value = ''
  // Pre-fill the account holder as the player (adult signing up) or as the parent
  const accountName = profile.value?.full_name || ''
  if (memberRelationship.value === 'self' && !memberName.value) memberName.value = accountName
  if (memberRelationship.value !== 'self' && !guardianName.value) guardianName.value = accountName
  // The form opens below the plan cards, usually off-screen; bring it into view
  if (scroll) nextTick(() => memberFormEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

async function startCheckout() {
  if (!formReady.value) return
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
        guardianName: memberRelationship.value === 'self' ? '' : guardianName.value.trim(),
        relationshipDetail: memberRelationship.value === 'other' ? relationshipDetail.value.trim() : '',
        waiverAccepted: waiverChecked.value,
        waiverSignerName: waiverSignature.value.trim(),
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
