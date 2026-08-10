<template>
  <div class="min-h-screen pt-28 pb-16 px-4 bg-dark">
    <div class="max-w-2xl mx-auto glass-card p-6 md:p-10">
      <div v-if="pending" class="text-gray-300" role="status">Loading waiver…</div>
      <div v-else-if="loadError" class="text-center"><div class="text-4xl mb-3">⚠️</div><h1 class="text-2xl font-bold text-white">Waiver Link Unavailable</h1><p class="text-red-300 mt-3">{{ loadError }}</p></div>
      <div v-else-if="completed" class="text-center"><div class="text-5xl mb-3">✅</div><h1 class="text-2xl font-bold text-white">Waiver Complete</h1><p class="text-gray-300 mt-2">The signed waiver is now attached to {{ details?.participantName }}'s team roster.</p></div>
      <template v-else>
        <h1 class="text-2xl md:text-3xl font-bold text-white">Participant Liability Waiver</h1>
        <p class="text-gray-400 mt-2 mb-5">For <strong class="text-white">{{ details?.participantName }}</strong><template v-if="details?.teamName"> · {{ details.teamName }}</template></p>
        <div class="h-72 overflow-y-auto rounded-xl border border-white/10 bg-black/30 p-5 text-sm text-gray-300 leading-relaxed space-y-3 mb-5">
          <p class="font-bold text-white">TRAINING YARD DSM — LIABILITY WAIVER & RELEASE</p>
          <p>I understand that athletic training, batting cages, turf, sports equipment, and related activities involve inherent risks of injury. I voluntarily assume those risks for the participant.</p>
          <p>I release and agree not to sue The Training Yard, its owners, staff, agents, and affiliates for claims arising from participation, including claims involving ordinary negligence to the extent permitted by law.</p>
          <p>I authorize emergency medical care when reasonably necessary, accept financial responsibility for that care, and agree that the participant will follow facility rules and staff instructions.</p>
          <p>By signing, I represent that I am the participant's parent or legal guardian or otherwise have legal authority to sign on the participant's behalf.</p>
        </div>
        <form class="space-y-4" @submit.prevent="sign">
          <div><label for="signer" class="form-label">Parent / guardian full legal name</label><input id="signer" v-model="form.signerName" required class="form-input" autocomplete="name"></div>
          <div><label for="relationship" class="form-label">Relationship to participant</label><input id="relationship" v-model="form.guardianRelationship" required class="form-input" placeholder="Parent, legal guardian, self"></div>
          <label class="flex items-start gap-3 text-sm text-gray-300"><input v-model="form.liabilityAccepted" required type="checkbox" class="mt-1 accent-amber-500"><span>I have read and agree to the liability waiver and certify that I may sign for this participant.</span></label>
          <label class="flex items-start gap-3 text-sm text-gray-300"><input v-model="form.photoConsent" type="checkbox" class="mt-1 accent-amber-500"><span>I separately consent to optional photo/video use. This is not required to participate.</span></label>
          <p v-if="submitError" class="text-red-300 text-sm" role="alert">{{ submitError }}</p>
          <button class="btn-primary w-full" :disabled="submitting">{{ submitting ? 'Recording signature…' : 'Sign Participant Waiver' }}</button>
        </form>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Participant Waiver | The Training Yard', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })
const route = useRoute()
const token = String(route.query.token || '')
const { data: details, pending, error } = await useFetch<any>('/api/team-waiver', { query: { token }, server: false })
const loadError = computed(() => error.value?.data?.statusMessage || error.value?.data?.message || '')
const form = reactive({ signerName: '', guardianRelationship: '', liabilityAccepted: false, photoConsent: false })
const submitting = ref(false), completed = ref(false), submitError = ref('')
async function sign() {
  submitting.value = true; submitError.value = ''
  try { await $fetch('/api/team-waiver', { method: 'POST', body: { token, ...form } }); completed.value = true }
  catch (error: any) { submitError.value = error?.data?.statusMessage || 'Unable to record the waiver.' }
  finally { submitting.value = false }
}
</script>

<style scoped>.form-label{ @apply block text-sm font-semibold text-gray-300 mb-1; }.form-input{ @apply w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-amber-500; }</style>
