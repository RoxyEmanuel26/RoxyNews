<script setup lang="ts">
import type { Article, PaginatedResponse, CategorySlug } from '~/types'

definePageMeta({
  keepalive: false,
})

const config = useRuntimeConfig()

useHead({
  title: `${config.public.appName} — Your Smart News Feed`,
  meta: [
    {
      name: 'description',
      content: 'Stay informed with curated news from 4 trusted sources, automatically aggregated and deduplicated.',
    },
  ],
})

useSeoMeta({
  title: `${config.public.appName} — Your Smart News Feed`,
  ogTitle: `${config.public.appName} — Your Smart News Feed`,
  description:
    'Stay informed with curated news from 4 trusted sources, automatically aggregated and deduplicated.',
  ogDescription:
    'Stay informed with curated news from 4 trusted sources, automatically aggregated and deduplicated.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

// Active category filter
const activeCategory = ref<CategorySlug>('general')
const isLoadingMore = ref(false)
const page = ref(1)
const extraArticles = ref<Article[]>([])

// Fetch initial articles — useAsyncData with $fetch returns serializable data for SSR
const { data: newsResponse, status, refresh } = await useAsyncData(
  'home-news',
  () => $fetch<PaginatedResponse<Article>>('/api/news', {
    params: { page: 1, limit: 12 },
  }),
)

// Derived state from the fetched data
const articles = computed<Article[]>(() => newsResponse.value?.data ?? [])
const heroArticle = computed<Article | null>(() => articles.value[0] ?? null)
const gridArticles = computed<Article[]>(() => articles.value.slice(1))
const loading = computed<boolean>(() => status.value === 'pending')
const hasMore = computed<boolean>(() => newsResponse.value?.hasMore ?? false)

const allGridArticles = computed<Article[]>(() => {
  return [...gridArticles.value, ...extraArticles.value]
})

async function onCategoryChange(category: CategorySlug): Promise<void> {
  activeCategory.value = category
  page.value = 1
  extraArticles.value = []

  // Re-fetch with new category
  newsResponse.value = await $fetch<PaginatedResponse<Article>>('/api/news', {
    params: {
      page: 1,
      limit: 12,
      ...(category !== 'general' ? { category } : {}),
    },
  })
}

async function onLoadMore(): Promise<void> {
  if (isLoadingMore.value || !hasMore.value) return
  isLoadingMore.value = true
  page.value++
  try {
    const params: Record<string, string | number> = { page: page.value, limit: 12 }
    if (activeCategory.value !== 'general') {
      params['category'] = activeCategory.value
    }
    const moreData = await $fetch<PaginatedResponse<Article>>('/api/news', { params })
    extraArticles.value = [...extraArticles.value, ...moreData.data]
  } catch (err) {
    console.error('[Home] Failed to load more:', err)
    page.value--
  } finally {
    isLoadingMore.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Hero Section -->
    <section id="hero-section">
      <NewsNewsHero :article="heroArticle" />
    </section>

    <!-- Category Filter -->
    <section id="category-filters">
      <NewsNewsCategoryFilter
        :active-category="activeCategory"
        @update:active-category="onCategoryChange"
      />
    </section>

    <!-- News Grid -->
    <section id="news-grid">
      <NewsNewsList
        :articles="allGridArticles"
        :loading="loading || isLoadingMore"
        :has-more="hasMore"
        @load-more="onLoadMore"
      />
    </section>
  </div>
</template>
