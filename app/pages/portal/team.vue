<template>
  <div class="p-6 md:p-10 max-w-5xl mx-auto w-full">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div><h1 class="text-2xl md:text-3xl font-bold text-white">My Team</h1><p class="text-gray-400 mt-1">Coaches, roster, package balances, and booking access.</p></div>
      <NuxtLink to="/teams" class="btn-primary text-center">Request Custom Team Pricing</NuxtLink>
    </div>
    <p v-if="notice" class="mb-5 rounded-xl border p-3 text-sm" :class="noticeError ? 'border-red-500/30 bg-red-500/10 text-red-300' : 'border-green-500/30 bg-green-500/10 text-green-300'" role="status">{{ notice }}</p>
    <div v-if="pending" class="text-gray-400" role="status">Loading team account…</div>
    <div v-else-if="!data?.teams?.length" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <div class="text-4xl mb-3">🏆</div><h2 class="text-xl font-bold text-white">Create your team with your first package</h2>
      <p class="text-gray-400 mt-2 mb-5">Enter the team name on the package page. Your private team account and balance are created automatically after payment.</p>
      <NuxtLink to="/teams" class="btn-primary">Request Custom Team Pricing</NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <section v-for="team in data.teams" :key="team.id" class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="flex items-center justify-between gap-3 mb-5">
          <div><h2 class="text-xl font-bold text-white">{{ team.name }}</h2><p class="text-gray-500 text-xs uppercase tracking-wide mt-1">Your role: {{ team.currentUserRole }}</p></div>
          <NuxtLink to="/portal/book" class="border border-amber-500/50 text-amber-400 rounded-lg px-4 py-2 text-sm font-semibold">Book Practice</NuxtLink>
        </div>
        <div class="grid sm:grid-cols-2 gap-4 mb-7">
          <div v-for="pkg in team.packages" :key="pkg.id" class="rounded-xl bg-black/20 border border-white/10 p-4">
            <div class="text-gray-400 text-xs uppercase tracking-wider">{{ pkg.package_type === 'buyout' ? 'Full Facility' : 'Standard Team' }}</div>
            <div class="text-3xl font-bold text-amber-400 mt-1">{{ pkg.hours_remaining }} <span class="text-sm font-normal text-gray-400">hours left</span></div>
            <div class="text-gray-500 text-xs mt-2">{{ pkg.status }}<template v-if="pkg.expires_at"> · Expires {{ formatDate(pkg.expires_at) }}</template></div>
          </div>
          <div v-if="!team.packages.length" class="rounded-xl bg-black/20 border border-white/10 p-4 text-gray-400 text-sm">No active hours. Contact us to create a custom practice plan for your team.</div>
        </div>

        <div class="grid lg:grid-cols-2 gap-6">
          <div>
            <h3 class="font-bold text-white mb-3">Coaches & Managers</h3>
            <div class="space-y-2 mb-4"><div v-for="member in team.members" :key="member.id" class="rounded-lg bg-black/20 p-3 flex justify-between gap-3 text-sm"><span class="text-gray-200">{{ member.full_name || member.email }}</span><span class="text-gray-500 capitalize">{{ member.role }}</span></div></div>
            <form class="flex flex-col sm:flex-row gap-2" @submit.prevent="inviteCoach(team.id)">
              <label class="sr-only" :for="`coach-${team.id}`">Coach email</label><input :id="`coach-${team.id}`" v-model="coachEmails[team.id]" type="email" required class="form-input flex-1" placeholder="coach@example.com">
              <button class="btn-primary text-sm" :disabled="busy">Invite Coach</button>
            </form>
          </div>
          <div>
            <h3 class="font-bold text-white mb-3">Participant Roster</h3>
            <div class="space-y-2 mb-4"><div v-for="participant in team.participants" :key="participant.id" class="rounded-lg bg-black/20 p-3 flex items-center justify-between gap-3 text-sm"><span class="text-gray-200">{{ participant.full_name }}</span><span v-if="participant.waiver_signature_id" class="text-green-400">Waiver on file</span><button v-else class="text-amber-400 underline" :disabled="busy" @click="requestWaiver(team.id, participant.id)">{{ participant.guardian_email ? 'Email waiver' : 'Guardian email needed' }}</button></div></div>
            <form class="grid sm:grid-cols-2 gap-2" @submit.prevent="addParticipant(team.id)">
              <label class="sr-only" :for="`participant-${team.id}`">Participant name</label><input :id="`participant-${team.id}`" v-model="participantForms[team.id].fullName" required class="form-input" placeholder="Participant full name">
              <label class="sr-only" :for="`guardian-${team.id}`">Guardian email</label><input :id="`guardian-${team.id}`" v-model="participantForms[team.id].guardianEmail" type="email" class="form-input" placeholder="Guardian email (if minor)">
              <button class="btn-primary text-sm sm:col-span-2" :disabled="busy">Add Participant</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'My Team — Training Yard' })
const route = useRoute()
const { data, pending, refresh } = await useFetch<any>('/api/portal/team', { server: false })
const coachEmails = reactive<Record<string, string>>({})
const participantForms = reactive<Record<string, { fullName: string; guardianEmail: string }>>({})
const busy = ref(false)
const notice = ref('')
const noticeError = ref(false)
watch(data, value => { for (const team of value?.teams || []) participantForms[team.id] ||= { fullName: '', guardianEmail: '' } }, { immediate: true })

onMounted(async () => {
  if (typeof route.query.invite !== 'string') return
  busy.value = true
  try {
    await $fetch('/api/portal/team', { method: 'POST', body: { action: 'accept-invitation', token: route.query.invite } })
    notice.value = 'Team invitation accepted.'
    await navigateTo('/portal/team', { replace: true })
    await refresh()
  } catch (error: any) {
    noticeError.value = true; notice.value = error?.data?.statusMessage || 'Unable to accept the invitation.'
  } finally { busy.value = false }
})

async function inviteCoach(teamId: string) {
  busy.value = true; notice.value = ''; noticeError.value = false
  try {
    await $fetch('/api/portal/team', { method: 'POST', body: { action: 'invite-coach', teamId, email: coachEmails[teamId] } })
    coachEmails[teamId] = ''; notice.value = 'Coach invitation sent.'; await refresh()
  } catch (error: any) { noticeError.value = true; notice.value = error?.data?.statusMessage || 'Unable to invite the coach.' }
  finally { busy.value = false }
}
async function addParticipant(teamId: string) {
  busy.value = true; notice.value = ''; noticeError.value = false
  try {
    const form = participantForms[teamId]
    await $fetch('/api/portal/team', { method: 'POST', body: { action: 'add-participant', teamId, ...form } })
    participantForms[teamId] = { fullName: '', guardianEmail: '' }; notice.value = 'Participant added.'; await refresh()
  } catch (error: any) { noticeError.value = true; notice.value = error?.data?.statusMessage || 'Unable to add the participant.' }
  finally { busy.value = false }
}
async function requestWaiver(teamId: string, participantId: string) {
  busy.value = true; notice.value = ''; noticeError.value = false
  try {
    await $fetch('/api/portal/team', { method: 'POST', body: { action: 'request-waiver', teamId, participantId } })
    notice.value = 'Participant waiver request sent.'
  } catch (error: any) { noticeError.value = true; notice.value = error?.data?.statusMessage || 'Unable to send the waiver request.' }
  finally { busy.value = false }
}
function formatDate(value: string) { return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
</script>

<style scoped>.form-input { @apply bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500; }</style>
