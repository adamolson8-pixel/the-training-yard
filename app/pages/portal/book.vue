<template>
  <div class="p-6 md:p-10 max-w-4xl mx-auto w-full">
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-white">Book a Session</h1>
      <p class="text-gray-400 mt-1">Choose your service and reserve your slot.</p>
    </div>
    <BookingWizard />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'portal', middleware: ['customer'] })
useHead({ title: 'Book a Session — Training Yard' })
</script>
