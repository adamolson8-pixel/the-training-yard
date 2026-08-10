<template>
  <div class="p-4 md:p-8">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6"><div><h1 class="text-2xl font-bold text-gray-900">Teams</h1><p class="text-sm text-gray-500 mt-1">Owners, coaches, roster waivers, hour balances, and reservations.</p></div><button class="primary" @click="openAction('create-team')">+ Create Team</button></div>
    <div class="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex gap-3"><input v-model="search" placeholder="Search teams, organizations, or coaches" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /><button class="secondary" @click="fetchTeams">Refresh</button></div>
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">{{ error }}</div>
    <div v-if="loading" class="p-12 text-center text-gray-400">Loading teams…</div>
    <div v-else-if="!filtered.length" class="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">No teams found. Create the first team and assign an owner account.</div>
    <div v-else class="space-y-4">
      <article v-for="team in filtered" :key="team.id" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button class="w-full p-5 text-left flex flex-wrap items-center gap-4" @click="expanded = expanded === team.id ? '' : team.id">
          <div class="flex-1"><h2 class="font-bold text-lg text-gray-900">{{ team.name }}</h2><div class="text-sm text-gray-500">{{ [team.organization_name, team.sport, team.age_group].filter(Boolean).join(' · ') || 'Team profile' }}</div></div>
          <div class="stat"><b>{{ team.members.length }}</b><span>staff</span></div><div class="stat"><b>{{ team.participants.length }}</b><span>players</span></div><div class="stat"><b :class="unsignedCount(team) ? 'text-red-600' : 'text-green-600'">{{ team.participants.length - unsignedCount(team) }}/{{ team.participants.length }}</b><span>waivers</span></div><div class="stat"><b>{{ totalHours(team) }}</b><span>hours</span></div><span class="text-gray-400">{{ expanded === team.id ? '▲' : '▼' }}</span>
        </button>
        <div v-if="expanded === team.id" class="border-t border-gray-100 p-5 bg-gray-50">
          <div class="flex flex-wrap gap-2 mb-5"><button class="secondary" @click="openAction('add-participant', team)">+ Participant</button><button class="secondary" @click="openAction('add-member', team)">+ Coach / Manager</button><button class="secondary" @click="openAction('adjust-hours', team)">Adjust Hours</button><NuxtLink to="/admin/waivers" class="secondary">Add Contract / Waiver</NuxtLink><button class="primary" @click="reserveTeam(team)">Reserve Time</button></div>
          <div class="grid lg:grid-cols-3 gap-4">
            <section class="panel"><h3>Team staff</h3><div v-if="!team.members.length" class="empty">No team staff.</div><div v-for="member in team.members" :key="member.id" class="row"><div><b>{{ member.full_name || member.email }}</b><small>{{ member.email }}</small></div><span class="badge">{{ member.role }}</span></div></section>
              <section class="panel"><h3>Roster & waivers</h3><div v-if="!team.participants.length" class="empty">No participants added.</div><div v-for="participant in team.participants" :key="participant.id" class="row"><div><b>{{ participant.full_name }}</b><small>{{ participant.guardian_email || 'No guardian email' }}</small></div><span class="badge" :class="participantCleared(participant) ? 'good' : 'bad'">{{ participantCleared(participant) ? 'Current' : 'Missing / expired' }}</span></div></section>
            <section class="panel"><h3>Balances & bookings</h3><div v-for="pkg in team.packages" :key="pkg.id" class="row"><div><b>{{ pkg.package_name }}</b><small>{{ pkg.package_type }}</small></div><span class="badge good">{{ pkg.hours_remaining }} hr</span></div><div v-if="!team.packages.length" class="empty">No active hour balance.</div><hr class="my-3" /><div v-for="booking in team.bookings.slice(0,5)" :key="booking.id" class="row"><div><b>{{ booking.service_label }}</b><small>{{ fmtDate(booking.start_at) }}</small></div></div><div v-if="!team.bookings.length" class="empty">No upcoming reservations.</div></section>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><form class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" @submit.prevent="submitAction"><h2 class="text-xl font-bold text-gray-900 mb-1">{{ actionTitle }}</h2><p v-if="selectedTeam" class="text-sm text-gray-500 mb-5">{{ selectedTeam.name }}</p><div class="space-y-4">
      <template v-if="action === 'create-team'"><label class="field">Team name *<input v-model="form.name" required /></label><label class="field">Owner account *<select v-model="form.owner_id" required><option value="">Select account</option><option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name || u.email }} — {{ u.email }}</option></select></label><label class="field">Organization<input v-model="form.organization_name" /></label><div class="grid grid-cols-2 gap-3"><label class="field">Sport<input v-model="form.sport" /></label><label class="field">Age group<input v-model="form.age_group" /></label></div></template>
      <template v-else-if="action === 'add-participant'"><label class="field">Participant name *<input v-model="form.full_name" required /></label><label class="field">Date of birth<input v-model="form.date_of_birth" type="date" /></label><label class="field">Guardian name<input v-model="form.guardian_name" /></label><label class="field">Guardian email<input v-model="form.guardian_email" type="email" /></label><label class="field">Relationship<input v-model="form.guardian_relationship" /></label></template>
      <template v-else-if="action === 'add-member'"><label class="field">Existing account email *<input v-model="form.email" type="email" required /></label><label class="field">Role<select v-model="form.role"><option value="coach">Coach</option><option value="manager">Manager</option></select></label><p class="text-xs text-gray-500">If the person has no account yet, create it under Users first.</p></template>
      <template v-else><label class="field">Balance type<select v-model="form.package_type"><option value="standard">Team Standard</option><option value="buyout">Full Buyout</option></select></label><label class="field">Hours to add or subtract *<input v-model.number="form.hours_delta" type="number" step="0.5" required /></label><label class="field">Reason<input v-model="form.reason" required /></label></template>
    </div><div v-if="formError" class="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{{ formError }}</div><div class="flex gap-3 mt-6"><button type="button" class="secondary flex-1" @click="showModal = false">Cancel</button><button class="primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div></form></div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Teams — Admin' })
const teams = ref<any[]>([]), users = ref<any[]>([]), loading = ref(false), error = ref(''), search = ref(''), expanded = ref('')
const showModal = ref(false), saving = ref(false), formError = ref(''), action = ref(''), selectedTeam = ref<any>(null)
const blank = () => ({ name: '', owner_id: '', organization_name: '', sport: '', age_group: '', full_name: '', date_of_birth: '', guardian_name: '', guardian_email: '', guardian_relationship: '', email: '', role: 'coach', package_type: 'standard', hours_delta: 0, reason: 'Admin adjustment' })
const form = reactive(blank())
const filtered = computed(() => teams.value.filter(team => `${team.name} ${team.organization_name || ''} ${(team.members || []).map((m:any)=>`${m.full_name} ${m.email}`).join(' ')}`.toLowerCase().includes(search.value.toLowerCase())))
const actionTitle = computed(() => ({ 'create-team': 'Create Team', 'add-participant': 'Add Participant', 'add-member': 'Add Coach or Manager', 'adjust-hours': 'Adjust Team Hours' }[action.value] || 'Team Action'))
function participantCleared(participant: any) { const signature = participant.waiver_signatures; return Boolean(participant.waiver_signature_id && signature && !signature.revoked_at && (!signature.expires_at || new Date(signature.expires_at) > new Date())) }
function unsignedCount(team: any) { return team.participants.filter((p:any) => !participantCleared(p)).length }
function totalHours(team: any) { return team.packages.reduce((sum:number,p:any)=>sum+Number(p.hours_remaining||0),0) }
function fmtDate(value:string) { return new Date(value).toLocaleString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) }
async function fetchTeams() { loading.value=true; error.value=''; try { const [teamData,userData]=await Promise.all([$fetch<any>('/api/admin/teams'),$fetch<any>('/api/admin/users',{query:{limit:1000}})]); teams.value=teamData.teams||[]; users.value=userData.users||[] } catch(e:any){error.value=e?.data?.statusMessage||'Unable to load teams.'} finally{loading.value=false} }
function openAction(next:string,team:any=null){action.value=next;selectedTeam.value=team;Object.assign(form,blank());formError.value='';showModal.value=true}
async function submitAction(){saving.value=true;formError.value='';try{await $fetch('/api/admin/teams',{method:'POST',body:{action:action.value,team_id:selectedTeam.value?.id,...form}});showModal.value=false;await fetchTeams()}catch(e:any){formError.value=e?.data?.statusMessage||'Unable to save the team change.'}finally{saving.value=false}}
function reserveTeam(team:any){navigateTo({path:'/admin/schedule',query:{team:team.id}})}
await fetchTeams()
</script>

<style scoped>
.primary { @apply bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50; }
.secondary { @apply inline-block border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-sm font-bold; }
.stat { @apply text-center min-w-14; }.stat b { @apply block text-lg text-gray-900; }.stat span { @apply block text-[10px] uppercase font-bold text-gray-400; }
.panel { @apply bg-white border border-gray-200 rounded-xl p-4; }.panel h3 { @apply font-bold text-gray-800 mb-3; }.row { @apply flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0; }.row b { @apply block text-sm text-gray-800; }.row small { @apply block text-xs text-gray-400; }.empty { @apply text-sm text-gray-400 py-3; }
.badge { @apply px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-gray-100 text-gray-600; }.badge.good { @apply bg-green-100 text-green-700; }.badge.bad { @apply bg-red-100 text-red-700; }
.field { @apply block text-xs font-bold text-gray-600; }.field input,.field select { @apply mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-normal focus:outline-none focus:ring-2 focus:ring-red-400; }
</style>
