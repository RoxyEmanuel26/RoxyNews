<script setup lang="ts">
const currentYear = new Date().getFullYear()

const config = useRuntimeConfig()
const appName = config.public.appName

const footerLinks = [
  {
    title: 'Categories',
    links: [
      { label: 'Technology', to: '/category/technology' },
      { label: 'Business', to: '/category/business' },
      { label: 'Sports', to: '/category/sports' },
      { label: 'Health', to: '/category/health' },
      { label: 'Science', to: '/category/science' },
      { label: 'Entertainment', to: '/category/entertainment' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Admin Dashboard', to: '/admin/dashboard' },
    ],
  },
]
</script>

<template>
  <footer class="mt-auto border-t border-surface-200/50 dark:border-surface-800/50 bg-surface-50/50 dark:bg-surface-950/50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <!-- Brand -->
        <div>
          <div class="flex items-center gap-2.5 mb-4">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
              <span class="text-white font-bold text-sm">N</span>
            </div>
            <span class="text-lg font-bold text-surface-900 dark:text-surface-50">
              {{ appName }}
            </span>
          </div>
          <p class="text-sm text-surface-500 dark:text-surface-400 leading-relaxed max-w-xs">
            Your smart news feed, powered by multiple trusted sources with intelligent API rotation technology.
          </p>
        </div>

        <!-- Link columns -->
        <div
          v-for="section in footerLinks"
          :key="section.title"
          class="space-y-3"
        >
          <h4 class="text-sm font-semibold text-surface-900 dark:text-surface-100 uppercase tracking-wide">
            {{ section.title }}
          </h4>
          <ul class="space-y-2">
            <li
              v-for="link in section.links"
              :key="link.to"
            >
              <NuxtLink
                :to="link.to"
                class="text-sm text-surface-500 dark:text-surface-400 hover:text-accent-500 transition-colors duration-200"
              >
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom bar -->
      <div class="mt-10 pt-6 border-t border-surface-200/50 dark:border-surface-800/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p class="text-xs text-surface-400 dark:text-surface-500">
          &copy; {{ currentYear }} {{ appName }}. Aggregated with ❤️ from multiple sources.
        </p>
        <div class="flex items-center gap-4 text-xs text-surface-400 dark:text-surface-500">
          <span>Powered by 4 News APIs</span>
          <span class="text-surface-300 dark:text-surface-700">|</span>
          <span>Smart Rotation Engine</span>
        </div>
      </div>
    </div>
  </footer>
</template>
