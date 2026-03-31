<script setup lang="ts">
import type { Article, PaginatedResponse, CategorySlug } from '~/types'
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

const isLoadingMore = ref(false)
const page = ref(1)
const extraArticles = ref<Article[]>([])

// Fetch articles — useAsyncData with $fetch for proper SSR
const { data: newsResponse, status } = await useAsyncData(
  `category-${slug.value}`,
  () => {
    const params: Record<string, string | number> = { page: 1, limit: 12 }
    if (slug.value && slug.value !== 'general') {
      params['category'] = slug.value
    }
    return $fetch<PaginatedResponse<Article>>('/api/news', { params })
  },
)

// Derived state
const articles = computed<Article[]>(() => newsResponse.value?.data ?? [])
const loading = computed<boolean>(() => status.value === 'pending')
const hasMore = computed<boolean>(() => newsResponse.value?.hasMore ?? false)

const allArticles = computed<Article[]>(() => {
  return [...articles.value, ...extraArticles.value]
})

// Reload when slug changes
watch(slug, async (newSlug) => {
  page.value = 1
  extraArticles.value = []
  const params: Record<string, string | number> = { page: 1, limit: 12 }
  if (newSlug && newSlug !== 'general') {
    params['category'] = newSlug
  }
  newsResponse.value = await $fetch<PaginatedResponse<Article>>('/api/news', { params })
})

async function onCategoryChange(category: CategorySlug): Promise<void> {
  await navigateTo(`/category/${category}`)
}

async function onLoadMore(): Promise<void> {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  page.value++
  try {
    const params: Record<string, string | number> = { page: page.value, limit: 12 }
    if (slug.value && slug.value !== 'general') {
      params['category'] = slug.value
    }
    const moreData = await $fetch<PaginatedResponse<Article>>('/api/news', { params })
    extraArticles.value = [...extraArticles.value, ...moreData.data]
  } catch (err) {
    console.error('[Category] Failed to load more:', err)
    page.value--
  } finally {
    isLoadingMore.value = false
  }
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
    <NewsCategoryFilter
      :active-category="slug"
      @update:active-category="onCategoryChange"
    />

    <!-- News Grid -->
    <NewsList
      :articles="allArticles"
      :loading="loading || isLoadingMore"
      :has-more="hasMore"
      @load-more="onLoadMore"
    />
  </div>
</template>
