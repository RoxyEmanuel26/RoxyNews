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

// Fetch articles directly — useFetch properly serializes data for SSR hydration
const { data: newsResponse, status, refresh } = await useFetch<PaginatedResponse<Article>>('/api/news', {
  query: computed(() => {
    const q: Record<string, string | number> = { page: 1, limit: 12 }
    if (activeCategory.value && activeCategory.value !== 'general') {
      q['category'] = activeCategory.value
    }
    return q
  }),
  watch: false,
})

// Derived state from the fetched data
const articles = computed<Article[]>(() => newsResponse.value?.data ?? [])
const heroArticle = computed<Article | null>(() => articles.value[0] ?? null)
const gridArticles = computed<Article[]>(() => articles.value.slice(1))
const loading = computed<boolean>(() => status.value === 'pending')
const hasMore = computed<boolean>(() => newsResponse.value?.hasMore ?? false)

// Load more articles (append)
const page = ref<number>(1)
const extraArticles = ref<Article[]>([])

const allGridArticles = computed<Article[]>(() => {
  const base = gridArticles.value
  return [...base, ...extraArticles.value]
})

async function onCategoryChange(category: CategorySlug): Promise<void> {
  activeCategory.value = category
  page.value = 1
  extraArticles.value = []
  await refresh()
}

async function onLoadMore(): Promise<void> {
  if (loading.value || !hasMore.value) return
  page.value++
  try {
    const q: Record<string, string | number> = { page: page.value, limit: 12 }
    if (activeCategory.value && activeCategory.value !== 'general') {
      q['category'] = activeCategory.value
    }
    const moreData = await $fetch<PaginatedResponse<Article>>('/api/news', { params: q })
    extraArticles.value = [...extraArticles.value, ...moreData.data]
  } catch (err) {
    console.error('[Home] Failed to load more:', err)
    page.value--
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
        :loading="loading"
        :has-more="hasMore"
        @load-more="onLoadMore"
      />
    </section>
  </div>
</template>
