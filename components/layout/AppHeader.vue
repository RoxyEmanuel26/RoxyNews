<script setup lang="ts">
const colorMode = inject<Ref<string>>('colorMode')!
const isMobileMenuOpen = ref<boolean>(false)

function toggleColorMode(): void {
  colorMode.value = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navLinks = [
  { label: 'Home', to: '/', icon: '🏠' },
  { label: 'Technology', to: '/category/technology', icon: '💻' },
  { label: 'Business', to: '/category/business', icon: '💼' },
  { label: 'Sports', to: '/category/sports', icon: '⚽' },
  { label: 'Dashboard', to: '/admin/dashboard', icon: '📊' },
]

const route = useRoute()

const isActiveRoute = (path: string): boolean => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <header class="sticky top-0 z-40 glass-header">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <NuxtLink
          to="/"
          class="flex items-center gap-2.5 group"
          id="header-logo"
        >
          <div
            class="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center shadow-lg shadow-accent-500/25 group-hover:shadow-accent-500/40 transition-shadow"
          >
            <span class="text-white font-bold text-sm">N</span>
          </div>
          <span class="text-lg font-bold text-surface-900 dark:text-surface-50 hidden sm:block">
            News<span class="gradient-text">Aggregator</span>
          </span>
        </NuxtLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-1">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            :class="
              isActiveRoute(link.to)
                ? 'bg-accent-500/10 text-accent-500'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800'
            "
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Right side actions -->
        <div class="flex items-center gap-2">
          <!-- Color mode toggle -->
          <button
            id="color-mode-toggle"
            class="p-2 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
            @click="toggleColorMode"
            :aria-label="colorMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            <svg
              v-if="colorMode === 'dark'"
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            <svg
              v-else
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>

          <!-- Mobile menu button -->
          <button
            id="mobile-menu-toggle"
            class="md:hidden p-2 rounded-lg text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-all duration-200"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <template v-if="!isMobileMenuOpen">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </template>
              <template v-else>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </template>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile menu -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <nav
          v-if="isMobileMenuOpen"
          class="md:hidden pb-4 border-t border-surface-200/50 dark:border-surface-800/50 mt-2 pt-3"
        >
          <div class="flex flex-col gap-1">
            <NuxtLink
              v-for="link in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              :class="
                isActiveRoute(link.to)
                  ? 'bg-accent-500/10 text-accent-500'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              "
              @click="isMobileMenuOpen = false"
            >
              <span>{{ link.icon }}</span>
              <span>{{ link.label }}</span>
            </NuxtLink>
          </div>
        </nav>
      </Transition>
    </div>
  </header>
</template>
