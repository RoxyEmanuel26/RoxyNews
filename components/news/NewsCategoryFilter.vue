<script setup lang="ts">
import type { CategorySlug } from '~/types'
import { CATEGORIES } from '~/server/constants/apiConfig'

interface Props {
  /** Currently active category */
  activeCategory: CategorySlug
}

defineProps<Props>()

const emit = defineEmits<{
  'update:activeCategory': [category: CategorySlug]
}>()

const allCategories = [
  { slug: 'general' as CategorySlug, label: 'All', icon: '🌐' },
  ...CATEGORIES.filter((c) => c.slug !== 'general'),
]

function selectCategory(slug: CategorySlug): void {
  emit('update:activeCategory', slug)
}
</script>

<template>
  <div class="relative">
    <!-- Scrollable tabs -->
    <div class="flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
      <button
        v-for="cat in allCategories"
        :key="cat.slug"
        :id="`category-filter-${cat.slug}`"
        class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300"
        :class="
          activeCategory === cat.slug
            ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/25'
            : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
        "
        @click="selectCategory(cat.slug)"
      >
        <span class="text-base">{{ cat.icon }}</span>
        <span>{{ cat.label }}</span>
      </button>
    </div>

    <!-- Fade edges for scroll indication -->
    <div class="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-surface-50 dark:from-surface-950 to-transparent pointer-events-none" />
  </div>
</template>
