<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto w-full">
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">{{ profile?.is_team_account ? 'Book Team Time' : 'Book a Session' }}</h1>
      <p class="text-gray-400 mt-1">{{ profile?.is_team_account ? 'Reserve turf and cages at your team rate.' : 'Choose your service and reserve your slot.' }}</p>
    </div>
    <!-- Team accounts book at team rates; everyone else uses the regular wizard -->
    <TeamBookingWizard v-if="profile?.is_team_account" :profile="profile" />
    <BookingWizard v-else />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Book a Session — Training Yard' })
// Same profile the portal layout loads
const { data: profile } = await useFetch<any>('/api/portal/me', { key: 'portal-layout-profile' })
</script>
