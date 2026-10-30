<template>
  <!-- Team hourly rates; booking happens online on Book a Session -->
  <div class="rounded-xl border border-white/10 bg-black/20 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 class="text-xs font-bold uppercase tracking-widest text-amber-400">Team Rates</h3>
        <p class="text-gray-300 text-sm mt-1">Book extra practice time online, up to two weeks out, at your team rate.</p>
      </div>
      <NuxtLink to="/portal/book" class="btn-primary text-sm whitespace-nowrap">Book Team Time</NuxtLink>
    </div>
    <div class="mt-4 grid sm:grid-cols-2 gap-3">
      <div v-for="rate in rates" :key="rate.id" class="rounded-lg bg-white/5 border border-white/10 p-3">
        <div class="text-white font-bold text-sm">{{ rate.label }}</div>
        <div class="mt-1"><span class="text-amber-400 text-xl font-bold">{{ money(rate.cents) }}</span><span class="text-gray-400 text-sm">/hr{{ rate.id === 'cage' ? ' per cage' : '' }}</span></div>
        <div class="text-gray-500 text-xs mt-1">{{ rate.description }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ teamId: string; rates: { id: string; label: string; description: string; cents: number }[] }>()
function money(cents: number) { return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}` }
</script>
