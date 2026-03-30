<script setup lang="ts">
import type { Article } from '~/types'
import { formatDistanceToNow } from 'date-fns'

interface Props {
  /** Array of articles to display as trending */
  articles: Article[]
}

const props = defineProps<Props>()

function formatTime(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return 'recently'
  }
}
</script>

<template>
  <aside class="space-y-4">
    <h3 class="text-lg font-bold text-surface-900 dark:text-surface-100 flex items-center gap-2">
      <span class="text-xl">🔥</span>
      Trending
    </h3>

    <div class="space-y-3">
      <NuxtLink
        v-for="(article, index) in props.articles.slice(0, 5)"
        :key="article.id"
        :to="`/article/${article.id}`"
        class="group flex gap-3 p-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/50 transition-all duration-200"
      >
        <span class="flex-shrink-0 w-7 h-7 rounded-lg bg-accent-500/10 flex items-center justify-center text-sm font-bold text-accent-500">
          {{ index + 1 }}
        </span>
        <div class="min-w-0 flex-1">
          <h4 class="text-sm font-medium text-surface-800 dark:text-surface-200 line-clamp-2 group-hover:text-accent-500 transition-colors">
            {{ article.title }}
          </h4>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-[11px] text-surface-400">{{ article.source_name }}</span>
            <span class="text-surface-300 dark:text-surface-700 text-[10px]">•</span>
            <span class="text-[11px] text-surface-400">{{ formatTime(article.published_at) }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>

    <!-- Category quick links -->
    <div class="mt-6 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
      <h4 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3">Categories</h4>
      <div class="flex flex-wrap gap-2">
        <NuxtLink
          v-for="cat in [
            { slug: 'technology', label: 'Technology', icon: '💻' },
            { slug: 'business', label: 'Business', icon: '💼' },
            { slug: 'sports', label: 'Sports', icon: '⚽' },
            { slug: 'health', label: 'Health', icon: '🏥' },
            { slug: 'science', label: 'Science', icon: '🔬' },
            { slug: 'entertainment', label: 'Entertainment', icon: '🎬' },
          ]"
          :key="cat.slug"
          :to="`/category/${cat.slug}`"
          class="px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800 text-xs font-medium text-surface-600 dark:text-surface-400 hover:bg-accent-500/10 hover:text-accent-500 transition-all duration-200"
        >
          {{ cat.icon }} {{ cat.label }}
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>
