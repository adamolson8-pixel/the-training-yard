<template>
  <div class="p-4 md:p-8">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6"><div><h1 class="text-2xl font-bold text-gray-900">Teams</h1><p class="text-sm text-gray-500 mt-1">Owners, coaches, roster waivers, hour balances, and reservations.</p></div><button class="primary" @click="openAction('create-team')">+ Create Team</button></div>
    <div class="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex gap-3"><input v-model="search" placeholder="Search teams, organizations, or coaches" class="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" /><button class="secondary" @click="fetchTeams">Refresh</button></div>
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">{{ error }}</div>
    <div v-if="notice" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-4 flex justify-between gap-3"><span>{{ notice }}</span><button class="font-bold" @click="notice = ''">✕</button></div>
    <div v-if="loading" class="p-12 text-center text-gray-400">Loading teams…</div>
    <div v-else-if="!filtered.length" class="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400">No teams found. Create the first team and assign an owner account.</div>
    <div v-else class="space-y-4">
      <article v-for="team in filtered" :key="team.id" class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <button class="w-full p-5 text-left flex flex-wrap items-center gap-4" @click="expanded = expanded === team.id ? '' : team.id">
          <div class="flex-1"><h2 class="font-bold text-lg text-gray-900">{{ team.name }}</h2><div class="text-sm text-gray-500">{{ [team.organization_name, team.sport, team.age_group].filter(Boolean).join(' · ') || 'Team profile' }}</div></div>
          <div class="stat"><b>{{ team.members.length }}</b><span>staff</span></div><div class="stat"><b>{{ team.participants.length }}</b><span>players</span></div><div class="stat"><b :class="unsignedCount(team) ? 'text-red-600' : 'text-green-600'">{{ team.participants.length - unsignedCount(team) }}/{{ team.participants.length }}</b><span>waivers</span></div><div class="stat"><b>{{ totalHours(team) }}</b><span>hours</span></div><span class="text-gray-400">{{ expanded === team.id ? '▲' : '▼' }}</span>
        </button>
        <div v-if="expanded === team.id" class="border-t border-gray-100 p-5 bg-gray-50">
          <div class="flex flex-wrap gap-2 mb-5"><button class="secondary" @click="openAction('add-participant', team)">+ Participant</button><button class="secondary" @click="openAction('add-member', team)">+ Coach / Manager</button><button class="secondary" @click="openAction('adjust-hours', team)">Adjust Hours</button><button class="secondary" @click="openAction('set-membership-code', team)">Membership Code</button><NuxtLink to="/admin/waivers" class="secondary">Add Contract / Waiver</NuxtLink><button v-if="teamOwnerId(team)" class="secondary" :disabled="viewingId === teamOwnerId(team)" @click="viewPortalAs(teamOwnerId(team), '/portal/team')">{{ viewingId === teamOwnerId(team) ? 'Opening…' : '👁 View Team Portal' }}</button><button class="primary" @click="reserveTeam(team)">Reserve Time</button></div>
          <div class="grid lg:grid-cols-3 gap-4">
            <section class="panel"><h3>Team staff</h3><div v-if="!team.members.length" class="empty">No team staff.</div><div v-for="member in team.members" :key="member.id" class="row"><div><b>{{ member.full_name || member.email }}</b><small>{{ member.email }}</small></div><div class="flex items-center gap-2"><span class="badge">{{ member.role }}</span><button v-if="member.user_id" class="text-[11px] font-bold text-red-600 hover:text-red-700 disabled:opacity-50" :disabled="viewingId === member.user_id" @click="viewPortalAs(member.user_id, '/portal/team')">{{ viewingId === member.user_id ? 'Opening…' : 'View as' }}</button></div></div></section>
              <section class="panel"><h3>Roster & waivers</h3><div v-if="!team.participants.length" class="empty">No participants added.</div><div v-for="participant in team.participants" :key="participant.id" class="row"><div><b>{{ participant.full_name }}</b><small>{{ participant.guardian_email || 'No guardian email' }}</small></div><span class="badge" :class="participantCleared(participant) ? 'good' : 'bad'">{{ participantCleared(participant) ? 'Current' : 'Missing / expired' }}</span></div></section>
            <section class="panel"><h3>Hour balances</h3><div v-for="pkg in team.packages" :key="pkg.id" class="row"><div><b>{{ pkg.package_name }}</b><small>{{ pkg.package_type }}</small></div><span class="badge good">{{ pkg.hours_remaining }} hr</span></div><div v-if="!team.packages.length" class="empty">No active hour balance.</div></section>
          </div>
          <div class="grid lg:grid-cols-2 gap-4 mt-4">
            <section class="panel">
              <h3>Facility times</h3>
              <div v-if="standingTimes(team).length" class="mb-3">
                <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Standing weekly</div>
                <div v-for="slot in standingTimes(team)" :key="slot.key" class="row"><div><b>{{ slot.day }} · {{ slot.time }}</b><small>{{ slot.space }} · {{ slot.remaining }} upcoming, through {{ slot.through }}</small></div><span class="badge">weekly</span></div>
              </div>
              <div class="text-[10px] uppercase font-bold text-gray-400 mb-1">Next up</div>
              <NuxtLink v-for="item in upcomingTimes(team)" :key="item.key" :to="{ path: '/admin/schedule', query: { date: item.date } }" class="row hover:bg-gray-50 -mx-2 px-2 rounded-lg">
                <div><b>{{ item.when }}</b><small>{{ item.label }}</small></div><span class="text-xs font-bold text-red-600">Schedule →</span>
              </NuxtLink>
              <div v-if="!upcomingTimes(team).length" class="empty">No upcoming facility time.</div>
            </section>
            <section class="panel">
              <div class="flex items-center justify-between mb-3"><h3 class="!mb-0">Payments</h3><span class="text-[10px] uppercase font-bold text-gray-400">Admin only</span></div>
              <div v-for="payment in team.payments.slice(0, 8)" :key="payment.id" class="row">
                <div><b>{{ money(payment.amount_cents) }} · {{ payment.description || 'Payment' }}</b><small>{{ payment.paid_at ? fmtDate(payment.paid_at) : fmtDate(payment.created_at) }} · {{ payment.customer_name || payment.customer_email || 'Unknown payer' }}</small></div>
                <span class="badge" :class="payment.verified_at && payment.status === 'paid' ? 'good' : payment.status === 'paid' ? '' : 'bad'">{{ payment.verified_at ? `Stripe ✓ ${payment.status.replace('_', ' ')}` : payment.status }}</span>
              </div>
              <div v-if="team.payments.length" class="text-xs text-gray-500 pt-2">Total verified: {{ money(team.payments.filter((p: any) => p.verified_at).reduce((sum: number, p: any) => sum + Number(p.amount_cents || 0) - Number(p.amount_refunded_cents || 0), 0)) }}</div>
              <div v-else class="empty">No payments on record. Run "Verify with Stripe" on the Payments page.</div>
            </section>
          </div>
          <section class="panel mt-4">
            <div class="flex items-center justify-between mb-3"><h3 class="!mb-0">Team membership rate</h3><button class="text-xs font-bold text-red-600" @click="openAction('set-membership-code', team)">Edit</button></div>
            <div v-if="!team.membership_code" class="empty">No team code. Add one to give this team's players a discounted membership.</div>
            <template v-else>
              <div class="row"><div><b class="font-mono">{{ team.membership_code }}</b><small>{{ codePlanLabel(team.membership_code_plan) }} · {{ team.membership_includes_turf === false ? 'Cage only, no turf benefits' : 'All member benefits' }}</small></div><span class="badge" :class="codeEnded(team) ? 'bad' : 'good'">{{ codeEnded(team) ? 'Ended' : 'Active' }}</span></div>
              <div class="row"><div><b>{{ team.membership_discount_ends_on ? `Through ${fmtDay(team.membership_discount_ends_on)}` : 'No end date' }}</b><small>Discount is removed from members' Stripe billing after this date. Extend it when the team renews.</small></div></div>
              <div class="row"><div><b>Player signup link</b><small class="break-all">{{ signupLink(team) }}</small></div><button class="text-xs font-bold text-red-600 whitespace-nowrap" @click="copySignupLink(team)">{{ copiedLink === team.id ? 'Copied ✓' : 'Copy link' }}</button></div>
              <div class="text-[10px] uppercase font-bold text-gray-400 mt-3 mb-1">Members using {{ team.membership_code }} ({{ team.code_members.length }})</div>
              <div v-for="m in team.code_members" :key="m.id" class="row"><div><b>{{ m.full_name || m.email }}</b><small>{{ m.email }}</small></div><span class="badge" :class="m.membership_status === 'active' ? 'good' : ''">{{ m.membership_status }}</span></div>
              <div v-if="!team.code_members.length" class="empty">No members have used this code yet.</div>
            </template>
          </section>
        </div>
      </article>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><form class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg" @submit.prevent="submitAction"><h2 class="text-xl font-bold text-gray-900 mb-1">{{ actionTitle }}</h2><p v-if="selectedTeam" class="text-sm text-gray-500 mb-5">{{ selectedTeam.name }}</p><div class="space-y-4">
      <template v-if="action === 'create-team'"><label class="field">Team name *<input v-model="form.name" required /></label><label class="field">Owner account *<select v-model="form.owner_id" required><option value="">Select account</option><option v-for="u in users" :key="u.id" :value="u.id">{{ u.full_name || u.email }} — {{ u.email }}</option></select></label><label class="field">Organization<input v-model="form.organization_name" /></label><div class="grid grid-cols-2 gap-3"><label class="field">Sport<input v-model="form.sport" /></label><label class="field">Age group<input v-model="form.age_group" /></label></div></template>
      <template v-else-if="action === 'add-participant'"><label class="field">Participant name *<input v-model="form.full_name" required /></label><label class="field">Date of birth<input v-model="form.date_of_birth" type="date" /></label><label class="field">Guardian name<input v-model="form.guardian_name" /></label><label class="field">Guardian email<input v-model="form.guardian_email" type="email" /></label><label class="field">Relationship<input v-model="form.guardian_relationship" /></label></template>
      <template v-else-if="action === 'add-member'"><label class="field">Existing account email *<input v-model="form.email" type="email" required /></label><label class="field">Role<select v-model="form.role"><option value="coach">Coach</option><option value="manager">Manager</option></select></label><p class="text-xs text-gray-500">If the person has no account yet, create it under Users first.</p></template>
      <template v-else-if="action === 'set-membership-code'"><label class="field">Team code<input v-model="form.membership_code" class="uppercase font-mono" placeholder="e.g. DUCKS2627" /></label><p class="text-xs text-gray-500 -mt-2">Must match an active Stripe promotion code with the same name; that code's coupon sets the discount. Leave blank to remove.</p><label class="field">Plans<select v-model="form.membership_code_plan"><option value="individual">Individual only</option><option value="family">Family only</option><option value="any">Individual and Family</option></select></label><label class="flex items-center gap-2 text-sm text-gray-700"><input v-model="form.membership_includes_turf" type="checkbox" /> Include turf benefits (weekly turf session, walk-on turf, turf member rate)</label><label class="field">Contract end date<input v-model="form.membership_discount_ends_on" type="date" /></label><p class="text-xs text-gray-500 -mt-2">The discount ends after this date and members go to the regular rate. Leave blank for no end date.</p></template>
      <template v-else><label class="field">Balance type<select v-model="form.package_type"><option value="standard">Team Standard</option><option value="buyout">Full Buyout</option></select></label><label class="field">Hours to add or subtract *<input v-model.number="form.hours_delta" type="number" step="0.5" required /></label><label class="field">Reason<input v-model="form.reason" required /></label></template>
    </div><div v-if="formError" class="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">{{ formError }}</div><div class="flex gap-3 mt-6"><button type="button" class="secondary flex-1" @click="showModal = false">Cancel</button><button class="primary flex-1" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button></div></form></div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Teams — Admin' })
const teams = ref<any[]>([]), users = ref<any[]>([]), loading = ref(false), error = ref(''), search = ref(''), expanded = ref('')
const showModal = ref(false), saving = ref(false), formError = ref(''), action = ref(''), selectedTeam = ref<any>(null), notice = ref('')
const blank = () => ({ name: '', owner_id: '', organization_name: '', sport: '', age_group: '', full_name: '', date_of_birth: '', guardian_name: '', guardian_email: '', guardian_relationship: '', email: '', role: 'coach', package_type: 'standard', hours_delta: 0, reason: 'Admin adjustment', membership_code: '', membership_code_plan: 'individual', membership_includes_turf: true, membership_discount_ends_on: '' })
const form = reactive(blank())
const filtered = computed(() => teams.value.filter(team => `${team.name} ${team.organization_name || ''} ${(team.members || []).map((m:any)=>`${m.full_name} ${m.email}`).join(' ')}`.toLowerCase().includes(search.value.toLowerCase())))
const actionTitle = computed(() => ({ 'create-team': 'Create Team', 'add-participant': 'Add Participant', 'add-member': 'Add Coach or Manager', 'adjust-hours': 'Adjust Team Hours', 'set-membership-code': 'Team Membership Code' }[action.value] || 'Team Action'))
function participantCleared(participant: any) { const signature = participant.waiver_signatures; return Boolean(participant.waiver_signature_id && signature && !signature.revoked_at && (!signature.expires_at || new Date(signature.expires_at) > new Date())) }
function unsignedCount(team: any) { return team.participants.filter((p:any) => !participantCleared(p)).length }
function totalHours(team: any) { return team.packages.reduce((sum:number,p:any)=>sum+Number(p.hours_remaining||0),0) }
function fmtDate(value:string) { return new Date(value).toLocaleString('en-US',{timeZone:'America/Chicago',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}) }
async function fetchTeams() { loading.value=true; error.value=''; try { const [teamData,userData]=await Promise.all([$fetch<any>('/api/admin/teams'),$fetch<any>('/api/admin/users',{query:{limit:1000}})]); teams.value=teamData.teams||[]; users.value=userData.users||[] } catch(e:any){error.value=e?.data?.statusMessage||'Unable to load teams.'} finally{loading.value=false} }
function openAction(next:string,team:any=null){action.value=next;selectedTeam.value=team;Object.assign(form,blank());if(next==='set-membership-code'&&team?.membership_code)Object.assign(form,{membership_code:team.membership_code,membership_code_plan:team.membership_code_plan,membership_includes_turf:team.membership_includes_turf!==false,membership_discount_ends_on:team.membership_discount_ends_on||''});formError.value='';showModal.value=true}
async function submitAction(){saving.value=true;formError.value='';try{const result=await $fetch<any>('/api/admin/teams',{method:'POST',body:{action:action.value,team_id:selectedTeam.value?.id,...form}});notice.value=result?.warning||'';showModal.value=false;await fetchTeams()}catch(e:any){formError.value=e?.data?.statusMessage||'Unable to save the team change.'}finally{saving.value=false}}
const { viewPortalAs, viewingId } = useViewAs()
/** The account the team portal belongs to: the owner, else the first staff member with an account. */
function teamOwnerId(team: any) { const staff = (team.members || []).filter((m: any) => m.user_id); return (staff.find((m: any) => m.role === 'owner') || staff[0])?.user_id || '' }
function reserveTeam(team:any){navigateTo({path:'/admin/schedule',query:{team:team.id}})}
const route = useRoute()
const TZ = 'America/Chicago'
const codePlanLabel = (plan: string) => ({ individual: 'Individual plans only', family: 'Family plans only' } as Record<string, string>)[plan] || 'Individual and Family plans'
/** Team codes run through their end date in Central time. */
function codeEnded(team: any) { return Boolean(team.membership_discount_ends_on) && centralDate(new Date().toISOString()) > team.membership_discount_ends_on }
function fmtDay(date: string) { return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
/** Link a coach can send players: opens the membership page with the team code applied (after login/sign-up). */
const siteOrigin = useRequestURL().origin
function signupLink(team: any) { return `${siteOrigin}/portal/membership?team=${encodeURIComponent(team.membership_code)}` }
const copiedLink = ref('')
async function copySignupLink(team: any) { try { await navigator.clipboard.writeText(signupLink(team)); copiedLink.value = team.id; setTimeout(() => { if (copiedLink.value === team.id) copiedLink.value = '' }, 2000) } catch { notice.value = signupLink(team) } }
function money(cents: any) { return `$${(Number(cents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function centralDate(value: string) { const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value)).map(x => [x.type, x.value])); return `${p.year}-${p.month}-${p.day}` }
function clock(value: string) { return new Date(value).toLocaleTimeString('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }) }
function weekday(value: string) { return new Date(value).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' }) }
function shortDay(value: string) { return new Date(value).toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' }) }
function space(row: any) { return `${row.cage_units} cage${Number(row.cage_units) === 1 ? '' : 's'}${Number(row.turf_units) ? ' + turf' : ''}` }
/** Recurring blocks grouped by weekday and time window, e.g. "Tue · 5:00 PM–8:00 PM". */
function standingTimes(team: any) {
  const groups = new Map<string, any>()
  for (const block of (team.blocks || []).filter((b: any) => b.recurrence_id)) {
    const key = `${weekday(block.start_at)}|${clock(block.start_at)}|${clock(block.end_at)}|${space(block)}`
    const group = groups.get(key) || { key, day: weekday(block.start_at), time: block.all_day ? 'All day' : `${clock(block.start_at)}–${clock(block.end_at)}`, space: space(block), remaining: 0, last: block.end_at, first: block.start_at }
    group.remaining++; if (block.end_at > group.last) group.last = block.end_at
    groups.set(key, group)
  }
  const order = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return [...groups.values()].map(g => ({ ...g, through: shortDay(g.last) })).sort((a, b) => order.indexOf(a.day) - order.indexOf(b.day) || a.first.localeCompare(b.first))
}
function upcomingTimes(team: any) {
  const items = [
    ...(team.blocks || []).map((b: any) => ({ key: `b-${b.id}`, start: b.start_at, date: centralDate(b.start_at), when: `${shortDay(b.start_at)} · ${b.all_day ? 'All day' : `${clock(b.start_at)}–${clock(b.end_at)}`}`, label: `${b.reason || 'Reserved'} · ${space(b)}` })),
    ...(team.bookings || []).map((b: any) => ({ key: `k-${b.id}`, start: b.start_at, date: centralDate(b.start_at), when: `${shortDay(b.start_at)} · ${clock(b.start_at)}–${clock(b.end_at)}`, label: `${b.service_label || 'Reservation'} · ${b.status}` })),
  ]
  return items.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6)
}
await fetchTeams()
if (route.query.open) expanded.value = String(route.query.open)
</script>

<style scoped>
.primary { @apply bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50; }
.secondary { @apply inline-block border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-xl text-sm font-bold; }
.stat { @apply text-center min-w-14; }.stat b { @apply block text-lg text-gray-900; }.stat span { @apply block text-[10px] uppercase font-bold text-gray-400; }
.panel { @apply bg-white border border-gray-200 rounded-xl p-4; }.panel h3 { @apply font-bold text-gray-800 mb-3; }.row { @apply flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0; }.row b { @apply block text-sm text-gray-800; }.row small { @apply block text-xs text-gray-400; }.empty { @apply text-sm text-gray-400 py-3; }
.badge { @apply px-2 py-1 rounded-full text-[10px] uppercase font-bold bg-gray-100 text-gray-600; }.badge.good { @apply bg-green-100 text-green-700; }.badge.bad { @apply bg-red-100 text-red-700; }
.field { @apply block text-xs font-bold text-gray-600; }.field input,.field select { @apply mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-normal focus:outline-none focus:ring-2 focus:ring-red-400; }
</style>
