<template>
  <div class="p-4 md:p-8">
    <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div><h1 class="text-2xl font-bold text-gray-900">Documents & Compliance</h1><p class="text-sm text-gray-500 mt-1">Waiver evidence, team contracts, expirations, and private files.</p></div>
      <button class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold" @click="showForm = true">+ Record Document</button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
      <div v-for="stat in stats" :key="stat.label" class="bg-white border border-gray-200 rounded-xl p-4"><div class="text-xs uppercase font-bold text-gray-400">{{ stat.label }}</div><div class="text-2xl font-bold" :class="stat.color">{{ stat.value }}</div></div>
    </div>

    <div v-if="requirements.length" class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
      <div class="flex items-center justify-between gap-3 mb-3"><div><h2 class="font-bold text-amber-900">Missing Requirements</h2><p class="text-xs text-amber-700">These accounts, participants, or teams are not cleared for their related online activity.</p></div><span class="bg-amber-200 text-amber-900 rounded-full px-3 py-1 text-xs font-bold">{{ requirements.length }}</span></div>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-2 max-h-64 overflow-auto">
        <button v-for="item in requirements" :key="`${item.kind}-${item.entity_id}`" class="bg-white border border-amber-200 rounded-lg p-3 text-left hover:border-amber-400" @click="recordRequirement(item)"><div class="text-xs uppercase font-bold text-amber-600">{{ item.kind.replaceAll('_', ' ') }}</div><div class="font-semibold text-gray-800">{{ item.subject }}</div><div class="text-xs text-gray-500">{{ item.detail }}</div></button>
      </div>
    </div>

    <div class="bg-white border border-gray-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3">
      <input v-model="search" placeholder="Search person, team, signer, or document" class="flex-1 min-w-64 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      <select v-model="typeFilter" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">All documents</option><option value="waiver">Waivers</option><option value="contract">Contracts</option><option value="other">Other</option></select>
      <select v-model="statusFilter" class="border border-gray-200 rounded-lg px-3 py-2 text-sm"><option value="">All statuses</option><option v-for="status in ['signed','active','pending','expired','revoked']" :key="status" :value="status">{{ status }}</option></select>
      <button class="px-3 py-2 text-sm font-bold border border-gray-200 rounded-lg" @click="fetchRecords">Refresh</button>
    </div>

    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">{{ error }}</div>
    <div class="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto"><table class="w-full text-sm min-w-[900px]">
        <thead class="bg-gray-50 border-b border-gray-200"><tr><th class="th">Subject</th><th class="th">Document</th><th class="th">Signer</th><th class="th">Signed</th><th class="th">Expires</th><th class="th">Status</th><th class="th text-right">Actions</th></tr></thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-if="loading"><td colspan="7" class="p-10 text-center text-gray-400">Loading…</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="p-10 text-center text-gray-400">No compliance records match these filters.</td></tr>
          <tr v-for="record in filtered" :key="`${record.source}-${record.id}`" class="hover:bg-gray-50">
            <td class="td"><div class="font-semibold text-gray-800">{{ subjectName(record) }}</div><div class="text-xs text-gray-400">{{ record.entity_type || (record.participant_id ? 'participant' : record.team_id ? 'team' : 'account') }}</div></td>
            <td class="td"><div class="font-semibold text-gray-800">{{ record.title }}</div><div class="text-xs text-gray-400">{{ record.document_type }}<span v-if="record.document_version"> · version {{ record.document_version }}</span></div></td>
            <td class="td text-gray-600">{{ record.signer_name || '—' }}</td>
            <td class="td text-gray-600">{{ dateOnly(record.signed_at || record.created_at) }}</td>
            <td class="td" :class="record.status === 'expired' ? 'text-red-600 font-bold' : 'text-gray-600'">{{ record.expires_at ? dateOnly(record.expires_at) : 'No expiry' }}</td>
            <td class="td"><span class="px-2 py-1 rounded-full text-xs font-bold capitalize" :class="statusClass(record.status)">{{ record.status }}</span></td>
            <td class="td text-right whitespace-nowrap">
              <button v-if="record.has_file || (record.source === 'signature' && record.provider_envelope_id)" class="action" @click="download(record)">Download</button>
              <button v-if="record.source === 'upload' && record.status !== 'revoked'" class="action text-red-600" @click="setStatus(record, 'revoked')">Revoke</button>
            </td>
          </tr>
        </tbody>
      </table></div>
    </div>

    <div v-if="showForm" class="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <form class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto" @submit.prevent="submitDocument">
        <h2 class="text-xl font-bold text-gray-900">Record Waiver or Contract</h2><p class="text-sm text-gray-500 mb-5">Files are private and downloads expire after 60 seconds.</p>
        <div class="grid sm:grid-cols-2 gap-4">
          <label class="field">Document type *<select v-model="form.document_type" required><option value="waiver">Waiver</option><option value="contract">Contract</option><option value="other">Other</option></select></label>
          <label class="field">Subject type *<select v-model="form.entity_type" required><option value="user">Account</option><option value="team">Team</option><option value="participant">Team participant</option></select></label>
          <label class="field sm:col-span-2">Subject *<select v-model="form.entity_id" required><option value="">Select subject</option><option v-for="subject in subjectOptions" :key="subject.id" :value="subject.id">{{ subject.label }}</option></select></label>
          <label class="field">Title *<input v-model="form.title" required /></label>
          <label class="field">Signer name <span v-if="form.document_type === 'waiver'">*</span><input v-model="form.signer_name" :required="form.document_type === 'waiver'" /></label>
          <label class="field">Signed date *<input v-model="form.signed_at" type="date" required /></label>
          <label class="field">Expiration date<input v-model="form.expires_at" type="date" /></label>
          <label class="field">Status<select v-model="form.status"><option value="signed">Signed</option><option value="active">Active</option><option value="pending">Pending</option></select></label>
          <label class="field">Signed file<input ref="fileInput" type="file" accept="application/pdf,image/jpeg,image/png" /></label>
          <label v-if="form.document_type === 'waiver'" class="field">Guardian relationship<input v-model="form.guardian_relationship" placeholder="Parent, guardian, self" /></label>
        </div>
        <label class="field mt-4">Notes<textarea v-model="form.notes" rows="3" /></label>
        <div v-if="formError" class="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{{ formError }}</div>
        <div class="flex gap-3 mt-6"><button type="button" class="flex-1 py-2.5 border border-gray-200 rounded-xl font-bold" @click="showForm = false">Cancel</button><button :disabled="saving" class="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold disabled:opacity-50">{{ saving ? 'Saving…' : 'Save Record' }}</button></div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['admin'] })
useHead({ title: 'Documents & Compliance — Admin' })

const records = ref<any[]>([]), requirements = ref<any[]>([]), users = ref<any[]>([]), teams = ref<any[]>([])
const loading = ref(false), error = ref(''), search = ref(''), typeFilter = ref(''), statusFilter = ref('')
const showForm = ref(false), saving = ref(false), formError = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const today = new Date().toISOString().slice(0, 10)
const form = reactive({ document_type: 'waiver', entity_type: 'user', entity_id: '', title: 'Paper Liability Waiver', signer_name: '', signed_at: today, expires_at: '', status: 'signed', guardian_relationship: '', notes: '' })

watch(() => form.document_type, type => { form.title = type === 'waiver' ? 'Paper Liability Waiver' : type === 'contract' ? 'Signed Team Contract' : 'Compliance Document'; if (type === 'waiver' && form.entity_type === 'team') form.entity_type = 'participant' })
watch(() => form.entity_type, () => { form.entity_id = '' })
const participants = computed(() => teams.value.flatMap(team => (team.participants || []).map((participant: any) => ({ ...participant, teamName: team.name }))))
const subjectOptions = computed(() => form.entity_type === 'user' ? users.value.map(user => ({ id: user.id, label: `${user.full_name || user.email} — ${user.email}` })) : form.entity_type === 'team' ? teams.value.map(team => ({ id: team.id, label: team.name })) : participants.value.map(participant => ({ id: participant.id, label: `${participant.full_name} — ${participant.teamName}` })))
const filtered = computed(() => records.value.filter(record => {
  const haystack = `${subjectName(record)} ${record.title} ${record.signer_name || ''}`.toLowerCase()
  return (!search.value || haystack.includes(search.value.toLowerCase())) && (!typeFilter.value || record.document_type === typeFilter.value) && (!statusFilter.value || record.status === statusFilter.value)
}))
const stats = computed(() => [
  { label: 'Current waivers', value: records.value.filter(r => r.document_type === 'waiver' && ['signed','active'].includes(r.status)).length, color: 'text-green-600' },
  { label: 'Current contracts', value: records.value.filter(r => r.document_type === 'contract' && ['signed','active'].includes(r.status)).length, color: 'text-blue-600' },
  { label: 'Expired', value: records.value.filter(r => r.status === 'expired').length, color: 'text-red-600' },
  { label: 'Missing / pending', value: requirements.value.length + records.value.filter(r => r.status === 'pending').length, color: 'text-amber-600' },
])

async function fetchRecords() {
  loading.value = true; error.value = ''
  try { const [docData, userData, teamData] = await Promise.all([$fetch<any>('/api/admin/documents'), $fetch<any>('/api/admin/users', { query: { limit: 1000 } }), $fetch<any>('/api/admin/teams')]); records.value = docData.records || []; requirements.value = docData.requirements || []; users.value = userData.users || []; teams.value = teamData.teams || [] }
  catch (e: any) { error.value = e?.data?.statusMessage || 'Unable to load compliance records.' }
  finally { loading.value = false }
}
function subjectName(record: any) { return record.subject?.full_name || record.subject?.name || record.participant_name || record.subject?.email || 'Unknown subject' }
function dateOnly(value: string) { return value ? new Date(value).toLocaleDateString('en-US', { timeZone: 'America/Chicago', month: 'short', day: 'numeric', year: 'numeric' }) : '—' }
function statusClass(status: string) { return status === 'expired' || status === 'revoked' ? 'bg-red-100 text-red-700' : status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700' }
async function submitDocument() {
  saving.value = true; formError.value = ''
  try {
    const data = new FormData(); Object.entries(form).forEach(([key, value]) => data.append(key, String(value)))
    const file = fileInput.value?.files?.[0]; if (file) data.append('file', file)
    await $fetch('/api/admin/documents', { method: 'POST', body: data }); showForm.value = false; await fetchRecords()
  } catch (e: any) { formError.value = e?.data?.statusMessage || 'Unable to save the document.' }
  finally { saving.value = false }
}
function recordRequirement(item: any) {
  form.document_type = item.kind === 'team_contract' ? 'contract' : 'waiver'
  form.entity_type = item.entity_type
  nextTick(() => { form.entity_id = item.entity_id })
  showForm.value = true
}
async function download(record: any) { const id = record.source === 'signature' ? record.provider_envelope_id : record.id; if (!id) return; const data = await $fetch<any>(`/api/admin/documents/${id}/download`); window.open(data.url, '_blank', 'noopener') }
async function setStatus(record: any, status: string) { if (!confirm(`Mark this document ${status}?`)) return; await $fetch(`/api/admin/documents/${record.id}`, { method: 'PATCH', body: { status } }); await fetchRecords() }

await fetchRecords()
</script>

<style scoped>
.th { @apply text-left px-4 py-3 font-semibold text-gray-600; }
.td { @apply px-4 py-3; }
.action { @apply text-xs font-bold text-blue-600 hover:underline ml-3; }
.field { @apply block text-xs font-bold text-gray-600; }
.field input, .field select, .field textarea { @apply mt-1 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 font-normal focus:outline-none focus:ring-2 focus:ring-red-400; }
</style>
