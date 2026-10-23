<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto w-full">
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Book a Session</h1>
      <p class="text-gray-400 mt-1">Choose your service and reserve your slot.</p>
    </div>
    <!-- Team accounts: online booking waits on custom team pricing -->
    <div v-if="profile?.team_booking_soon" class="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
      <div class="text-4xl mb-3">🗓️</div>
      <h2 class="text-xl font-bold text-white">Online team booking is coming soon</h2>
      <p class="text-gray-400 mt-2">We're setting up custom team pricing. Your team's reserved practice times are on My Bookings, and we can add or change times for you in the meantime.</p>
      <NuxtLink to="/portal/bookings" class="btn-primary mt-5 inline-block text-sm">View My Bookings</NuxtLink>
    </div>
    <BookingWizard v-else />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Book a Session — Training Yard' })
// Same profile the portal layout loads
const { data: profile } = await useFetch<any>('/api/portal/me', { key: 'portal-layout-profile' })
</script>
