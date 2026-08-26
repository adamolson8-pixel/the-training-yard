<template>
  <div class="p-6 md:p-10 max-w-2xl mx-auto w-full">

    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Liability Waiver</h1>
      <p class="text-gray-400 mt-1">Required before your first training session.</p>
    </div>

    <!-- Signed State -->
    <div v-if="profile?.waiver_signed" class="rounded-2xl border border-green-500/30 bg-green-500/5 p-6 mb-6">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-2xl shrink-0">✅</div>
        <div>
          <div class="text-green-400 font-bold text-lg">Waiver Signed</div>
          <div v-if="profile?.waiver_signed_at" class="text-gray-400 text-sm mt-0.5">
            Signed on {{ formatDate(profile.waiver_signed_at) }}
          </div>
        </div>
      </div>
      <p class="text-gray-400 text-sm mt-4">
        Your liability waiver is on file. You're cleared to train at The Training Yard. If you need a copy, contact us at
        <a href="mailto:info@trainingyarddsm.com" class="text-amber-400 hover:underline">info@trainingyarddsm.com</a>.
      </p>
      <div v-if="justSigned" class="mt-4 pt-4 border-t border-green-500/20">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🎉</span>
          <div>
            <div class="text-green-400 font-bold text-sm">You're all set!</div>
            <p class="text-gray-400 text-xs mt-0.5">Your waiver has been recorded. You're cleared to book and train.</p>
          </div>
        </div>
        <NuxtLink to="/portal/dashboard" class="btn-primary inline-block text-sm mt-3">Go to Dashboard →</NuxtLink>
      </div>
    </div>

    <!-- Not Signed State -->
    <div v-else>
      <div class="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 mb-6 flex items-start gap-3">
        <span class="text-xl mt-0.5">⚠️</span>
        <div>
          <div class="text-amber-400 font-semibold text-sm">Action Required</div>
          <div class="text-gray-400 text-sm mt-1">You must sign the liability waiver before participating in any training session at our facility.</div>
        </div>
      </div>

      <!-- Zoho Sign Embed -->
      <div class="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <div class="px-5 py-4 border-b border-white/10">
          <div class="text-white font-semibold">The Training Yard — Liability Waiver</div>
          <div class="text-gray-400 text-sm mt-0.5">Please read and sign below using Zoho Sign.</div>
        </div>

        <div class="relative">
          <!-- Zoho Sign iframe — replace the src with your actual Zoho Sign signing link -->
          <iframe
            v-if="zohoSignUrl"
            :src="zohoSignUrl"
            class="w-full"
            style="height: 600px; border: none;"
            title="Liability Waiver — Zoho Sign"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />

          <!-- Placeholder when Zoho Sign is not yet configured -->
          <div v-else class="p-8 text-center">
            <div class="text-4xl mb-4">📋</div>
            <div class="text-gray-400 text-sm mb-3">Zoho Sign document will appear here.</div>
            <p class="text-gray-500 text-xs mb-6">If you prefer, you can sign in person at your first visit or email us to request a manual waiver.</p>
            <!-- Temporary manual checkbox fallback -->
            <div class="bg-white/5 border border-white/10 rounded-xl p-6 text-left max-w-2xl mx-auto">
              <div class="text-white font-bold text-lg mb-4">Manual Waiver & Release of Liability</div>
              
              <!-- Scrollable Terms -->
              <div class="h-64 overflow-y-auto bg-black/40 border border-white/10 rounded-lg p-4 mb-6 text-xs text-gray-300 leading-relaxed space-y-4 custom-scrollbar">
                <p class="font-bold text-center text-white text-sm">RELEASE OF LIABILITY, WAIVER OF CLAIMS, ASSUMPTION OF RISK, AND INDEMNITY AGREEMENT</p>
                <p class="font-semibold text-amber-400 text-center">Please read carefully. By signing this document, you choose to waive certain legal rights, including the right to sue.</p>
                
                <div>
                  <h3 class="font-bold text-white mb-1">1. ASSUMPTION OF RISK</h3>
                  <p>I am aware that participating in sports, training, batting cages, and utilizing the synthetic turf and equipment at The Training Yard (the "Facility") involves inherent risks, dangers, and hazards. These include, but are not limited to: being hit by baseballs, softballs, or other equipment; slips, trips, or falls; overexertion; injuries from turf; and contact with other participants or structures. I freely accept and fully assume all such risks, dangers, and hazards and the possibility of personal injury, death, property damage, or loss resulting therefrom.</p>
                </div>

                <div>
                  <h3 class="font-bold text-white mb-1">2. RELEASE OF LIABILITY, WAIVER OF CLAIMS, AND INDEMNITY</h3>
                  <p>In consideration of being permitted to use the Facility, I hereby agree as follows:</p>
                  <ul class="list-disc pl-5 mt-2 space-y-1">
                    <li>TO WAIVE ANY AND ALL CLAIMS that I have or may in the future have against The Training Yard, its directors, officers, employees, agents, representatives, volunteers, sponsors, and successors (collectively the "Releasees"), and TO RELEASE THE RELEASEES from any and all liability for any loss, damage, expense, or injury including death that I may suffer, or that my next of kin may suffer, as a result of my use of or presence at the Facility, DUE TO ANY CAUSE WHATSOEVER, INCLUDING NEGLIGENCE, BREACH OF CONTRACT, OR BREACH OF ANY STATUTORY OR OTHER DUTY OF CARE ON THE PART OF THE RELEASEES.</li>
                    <li>TO HOLD HARMLESS AND INDEMNIFY THE RELEASEES from any and all liability for any damage to property of or personal injury to any third party resulting from my use of or presence at the Facility.</li>
                  </ul>
                </div>

                <div>
                  <h3 class="font-bold text-white mb-1">3. MEDICAL CONDITION AND TREATMENT</h3>
                  <p>I confirm that I am in proper physical condition to participate in activities at the Facility. In the event of an emergency, I authorize the Releasees to secure any necessary medical treatment and agree to bear all costs associated with such treatment.</p>
                </div>

                <div>
                  <h3 class="font-bold text-white mb-1">4. RULES AND REGULATIONS</h3>
                  <p>I agree to abide by all facility rules, signage, and staff instructions at all times. The Training Yard reserves the right to revoke my access to the Facility without refund if I fail to comply with these rules.</p>
                </div>

                <div>
                  <h3 class="font-bold text-white mb-1">5. MINOR PARTICIPANTS</h3>
                  <p>I certify that I am the parent or legal guardian of any minor dependents listed on my account or indicated during the booking process. I agree to this release of liability on their behalf and accept full responsibility for their compliance with Facility rules.</p>
                </div>

                <p class="font-bold text-white border-t border-white/10 pt-4">I CONFIRM THAT I HAVE READ AND UNDERSTOOD THIS AGREEMENT PRIOR TO SIGNING IT, AND I AM AWARE THAT BY SIGNING THIS AGREEMENT I AM WAIVING CERTAIN LEGAL RIGHTS WHICH I OR MY HEIRS, NEXT OF KIN, EXECUTORS, ADMINISTRATORS, AND REPRESENTATIVES MAY HAVE AGAINST THE RELEASEES.</p>
              </div>

              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="manualChecked"
                  class="mt-1 w-5 h-5 rounded border-gray-600 text-amber-500 focus:ring-amber-500 bg-gray-900"
                />
                <span class="text-white text-sm font-medium pt-0.5">
                  I have read and agree to the Release of Liability and Waiver Agreement.
                </span>
              </label>
              
              <div class="mt-4 border-t border-white/10 pt-4">
                <label class="block text-gray-400 text-xs mb-1 uppercase tracking-wider">Digital Signature</label>
                <input
                  v-model="manualName"
                  type="text"
                  placeholder="Type your full legal name"
                  class="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              <button
                class="btn-primary w-full mt-4 py-3"
                :disabled="!manualChecked || !manualName.trim() || submitting"
                @click="submitManualWaiver"
              >
                {{ submitting ? 'Saving...' : 'Sign Legal Waiver' }}
              </button>
              <p v-if="submitError" class="text-red-400 text-xs mt-2 text-center">{{ submitError }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Waiver — Training Yard' })

const config = useRuntimeConfig()
const route = useRoute()
const { data: profile, refresh } = await useFetch<any>('/api/portal/me')

const justSigned = computed(() => route.query.signed === 'true' && profile.value?.waiver_signed)

// Replace with your actual Zoho Sign document signing URL when ready
// Set NUXT_PUBLIC_ZOHO_SIGN_URL in your .env file
const zohoSignUrl = computed(() => (config.public as any).zohoSignUrl || null)

const manualChecked = ref(false)
const manualName = ref('')
const submitting = ref(false)
const submitError = ref('')

async function submitManualWaiver() {
  if (!manualChecked.value || !manualName.value.trim()) return
  submitting.value = true
  submitError.value = ''
  try {
    await $fetch('/api/portal/waiver', {
      method: 'POST',
      body: { signerName: manualName.value, participantName: manualName.value, liabilityAccepted: manualChecked.value },
    })
    // Redirect to dashboard with success indicator
    await navigateTo('/portal/waiver?signed=true')
    // Force a full page reload so layout sidebar picks up the new waiver status
    if (import.meta.client) {
      window.location.href = '/portal/waiver?signed=true'
    }
  } catch (e: any) {
    submitError.value = e?.data?.statusMessage || 'Failed to save. Please try again.'
    submitting.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}
</script>
