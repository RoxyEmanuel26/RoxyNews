<script setup lang="ts">
</script>

<template>
  <div class="min-h-screen flex flex-col bg-surface-50 dark:bg-surface-950 transition-colors duration-300">
    <LayoutAppHeader />

    <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <slot />
    </main>

    <LayoutAppFooter />

    <UiApiStatusIndicator />
  </div>
</template>
