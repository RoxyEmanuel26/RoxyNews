<script setup lang="ts">
const colorMode = useState<string>('colorMode', () => 'dark')

// Only run on client side — localStorage and document don't exist on server
if (import.meta.client) {
  onMounted(() => {
    const saved = localStorage.getItem('color-mode')
    if (saved) {
      colorMode.value = saved
    }
    applyColorMode(colorMode.value)
  })

  watch(colorMode, (val: string) => {
    applyColorMode(val)
    localStorage.setItem('color-mode', val)
  })
}

function applyColorMode(mode: string): void {
  if (import.meta.server) return
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

provide('colorMode', colorMode)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
html {
  color-scheme: dark;
}

html.dark {
  color-scheme: dark;
}

html:not(.dark) {
  color-scheme: light;
}
</style>
