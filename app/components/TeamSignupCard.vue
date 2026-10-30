<template>
  <!-- Team code: the link coaches share (or email) so players join at the team rate -->
  <div class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-xs font-bold uppercase tracking-widest text-amber-400">Player Membership Signup</h3>
        <p class="text-gray-300 text-sm mt-1">Share this link with your players. They get the {{ team.name }} team rate and are added to your roster automatically.</p>
      </div>
      <span class="px-3 py-1 rounded-full text-xs font-bold" :class="team.signup.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-300'">{{ team.signup.active ? (team.signup.discount || 'Active') : 'Ended' }}</span>
    </div>
    <div class="mt-4 grid sm:grid-cols-3 gap-3">
      <div class="rounded-lg bg-black/20 p-3">
        <div class="text-gray-400 text-xs uppercase tracking-wider">Team code</div>
        <div class="font-mono font-bold text-white text-lg mt-1">{{ team.signup.code }}</div>
      </div>
      <div v-for="plan in team.signup.plans" :key="plan.planId" class="rounded-lg bg-black/20 p-3">
        <div class="text-gray-400 text-xs uppercase tracking-wider">{{ plan.name.replace(' Membership', '') }}</div>
        <div class="mt-1">
          <span v-if="plan.teamCents !== plan.regularCents" class="text-gray-500 line-through text-sm mr-1">{{ money(plan.regularCents) }}</span>
          <span class="text-white text-lg font-bold">{{ money(plan.teamCents) }}</span><span class="text-gray-400 text-sm">/{{ plan.interval === 'year' ? 'yr' : 'mo' }}</span>
        </div>
      </div>
    </div>
    <template v-if="team.signup.active">
      <div class="mt-4 flex flex-col sm:flex-row gap-2">
        <label class="sr-only" :for="`signup-link-${team.id}`">Player signup link</label>
        <input :id="`signup-link-${team.id}`" :value="link" readonly class="signup-input flex-1 font-mono text-xs" @focus="($event.target as HTMLInputElement).select()">
        <button type="button" class="btn-primary text-sm whitespace-nowrap" @click="copyLink">{{ copied ? 'Copied ✓' : 'Copy Link' }}</button>
      </div>

      <!-- Email the link straight to players or parents -->
      <form class="mt-3 flex flex-col sm:flex-row gap-2" @submit.prevent="sendLink">
        <label class="sr-only" :for="`signup-email-${team.id}`">Player or parent emails</label>
        <input :id="`signup-email-${team.id}`" v-model="emails" type="text" inputmode="email" autocomplete="off" class="signup-input flex-1" placeholder="Player or parent email (separate several with commas)">
        <button type="submit" class="btn-primary text-sm whitespace-nowrap" :disabled="sending || !emails.trim()">{{ sending ? 'Sending…' : 'Email Link' }}</button>
      </form>
      <p v-if="sendNotice" class="text-xs mt-2" :class="sendError ? 'text-red-300' : 'text-green-300'" role="status">{{ sendNotice }}</p>

      <p class="text-gray-400 text-xs mt-3">
        <template v-if="!team.signup.includesTurf">Cage access only (turf benefits not included). </template>
        <template v-if="team.signup.endsOn">Team rate runs through {{ longDate(team.signup.endsOn) }}; after that, members continue at the regular rate unless {{ team.name }} renews with us.</template>
      </p>
    </template>
    <p v-else class="text-red-300 text-sm mt-4">This team rate ended<template v-if="team.signup.endsOn"> after {{ longDate(team.signup.endsOn) }}</template>. Contact us to renew it for your players.</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ team: any }>()

const siteOrigin = useRequestURL().origin
const link = computed(() => `${siteOrigin}/portal/membership?team=${encodeURIComponent(props.team.signup.code)}`)

const copied = ref(false)
async function copyLink() {
  try {
    await navigator.clipboard.writeText(link.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Clipboard blocked: select the link so it can be copied by hand
    const input = document.getElementById(`signup-link-${props.team.id}`) as HTMLInputElement | null
    input?.select()
    sendError.value = false
    sendNotice.value = 'Press Ctrl+C (or ⌘C) to copy the selected link.'
  }
}

const emails = ref('')
const sending = ref(false)
const sendNotice = ref('')
const sendError = ref(false)
async function sendLink() {
  sending.value = true
  sendNotice.value = ''
  sendError.value = false
  try {
    const result = await $fetch<{ sent: number; failed: string[] }>('/api/portal/team', {
      method: 'POST',
      body: { action: 'send-signup-link', teamId: props.team.id, emails: emails.value },
    })
    emails.value = ''
    sendNotice.value = `Signup link sent to ${result.sent} ${result.sent === 1 ? 'email' : 'emails'}.`
      + (result.failed?.length ? ` Couldn't send to: ${result.failed.join(', ')}` : '')
    sendError.value = Boolean(result.failed?.length)
  } catch (error: any) {
    sendError.value = true
    sendNotice.value = error?.data?.statusMessage || 'Unable to send the signup link.'
  } finally {
    sending.value = false
  }
}

function longDate(date: string) { return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' }) }
function money(cents: number) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}` }
</script>

<style scoped>.signup-input { @apply bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500; }</style>
