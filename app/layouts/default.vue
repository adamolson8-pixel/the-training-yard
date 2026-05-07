<template>
  <div class="min-h-screen flex flex-col">
    <UtilityBar />
    <AppHeader />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
