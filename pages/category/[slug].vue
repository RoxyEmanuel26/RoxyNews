<script setup lang="ts">
import type { CategorySlug } from '~/types'
import { CATEGORIES } from '~/server/constants/apiConfig'

const route = useRoute()

const slug = computed<CategorySlug>(() => {
  const raw = route.params.slug as string
  const validSlugs: CategorySlug[] = ['general', 'technology', 'sports', 'business', 'health', 'entertainment', 'science']
  return validSlugs.includes(raw as CategorySlug) ? (raw as CategorySlug) : 'general'
})

const categoryInfo = computed(() => {
  return CATEGORIES.find((c) => c.slug === slug.value) ?? { slug: 'general', label: 'General', icon: '📰' }
})

const {
  articles,
  loading,
  hasMore,
  activeCategory,
  changeCategory,
  loadMoreNews,
} = useNews()

const config = useRuntimeConfig()

useHead({
  title: () => `${categoryInfo.value.label} News — ${config.public.appName}`,
  meta: [
    {
      name: 'description',
      content: () => `Latest ${categoryInfo.value.label.toLowerCase()} news from multiple trusted sources.`,
    },
  ],
})

useSeoMeta({
  title: () => `${categoryInfo.value.label} News — ${config.public.appName}`,
  ogTitle: () => `${categoryInfo.value.label} News — ${config.public.appName}`,
  description: () => `Latest ${categoryInfo.value.label.toLowerCase()} news from multiple trusted sources.`,
  ogDescription: () =>
    `Latest ${categoryInfo.value.label.toLowerCase()} news from multiple trusted sources.`,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Fetch on mount and when slug changes
await useAsyncData(`category-${slug.value}`, async () => {
  await changeCategory(slug.value)
  return true
})

watch(slug, async (newSlug) => {
  await changeCategory(newSlug)
})

async function onCategoryChange(category: CategorySlug): Promise<void> {
  await navigateTo(`/category/${category}`)
}

async function onLoadMore(): Promise<void> {
  await loadMoreNews()
}
</script>

<template>
  <div class="space-y-8">
    <!-- Category header -->
    <div class="flex items-center gap-3">
      <span class="text-3xl">{{ categoryInfo.icon }}</span>
      <div>
        <h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
          {{ categoryInfo.label }} News
        </h1>
        <p class="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
          Latest {{ categoryInfo.label.toLowerCase() }} articles from trusted sources
        </p>
      </div>
    </div>

    <!-- Category Filter -->
    <NewsNewsCategoryFilter
      :active-category="activeCategory"
      @update:active-category="onCategoryChange"
    />

    <!-- News Grid -->
    <NewsNewsList
      :articles="articles"
      :loading="loading"
      :has-more="hasMore"
      @load-more="onLoadMore"
    />
  </div>
</template>
