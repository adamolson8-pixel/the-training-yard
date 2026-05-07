<template>
  <div class="p-6 md:p-10 max-w-2xl mx-auto w-full">

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
      <ul class="space-y-2 text-sm text-gray-300">
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> 25% off all single-session rentals</li>
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Priority booking access</li>
        <li class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Pitching machines included (upon availability)</li>
        <li v-if="profile?.membership_type?.includes('family')" class="flex items-start gap-2"><span class="text-green-400 mt-0.5">✓</span> Covers all immediate family members</li>
      </ul>
    </div>

    <!-- No membership CTA -->
    <div v-if="!profile?.membership_status || profile?.membership_status === 'none' || profile?.membership_status === 'canceled'" class="rounded-2xl border border-white/10 bg-white/5 p-5 mb-6">
      <div class="text-white font-bold mb-2">Join as a Member</div>
      <p class="text-gray-400 text-sm mb-4">Save 25% on every session. Plans starting at $89/mo for individuals and $129/mo for families.</p>
      <NuxtLink to="/training#membership" class="btn-primary inline-block text-sm">View Membership Plans</NuxtLink>
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

const { data: profile } = await useFetch<any>('/api/portal/me')
const loadingPortal = ref(false)

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
    family: 'Family Plan — $129/mo',
    team_vip_standard: 'Team VIP Standard — $2,700/yr',
    team_vip_full: 'Team VIP Full Facility — $4,050/yr',
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

async function openStripePortal() {
  loadingPortal.value = true
  try {
    const { url } = await $fetch<{ url: string }>('/api/stripe/customer-portal', { method: 'POST' })
    window.location.href = url
  } catch {
    alert('Unable to open billing portal. Please contact us at adam@trainingyarddsm.com')
  } finally {
    loadingPortal.value = false
  }
}

function formatDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>
