<template>
  <div class="min-h-screen bg-dark flex items-center justify-center">
    <div class="text-center">
      <div class="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p class="text-gray-400">Confirming your account...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Supabase handles the token exchange automatically via @nuxtjs/supabase.
// This page is just a visual placeholder during the redirect.
// The module will read the #access_token from the URL fragment and
// redirect to the homepage once the session is established.
</script>
