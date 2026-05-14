<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center py-16 px-4">
    <div class="max-w-lg w-full">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-amber-500 px-8 py-8 text-center">
          <div class="text-5xl mb-3">🏆</div>
          <h1 class="text-2xl font-bold text-black mb-1">Package Purchased!</h1>
          <p class="text-amber-900">Your team's account has been successfully credited.</p>
        </div>

        <div class="p-8 text-center space-y-6">
          <p class="text-gray-600">
            You can now close this tab. Your purchased hours are available in your portal dashboard, and you can start booking them immediately.
          </p>

          <NuxtLink
            to="/portal/dashboard"
            class="inline-block bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Team Package Confirmed | Training Yard DSM',
})
</script>
