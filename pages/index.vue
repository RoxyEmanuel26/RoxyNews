<script setup lang="ts">
import type { CategorySlug } from '~/types'

definePageMeta({
  keepalive: true,
})

const {
  articles,
  heroArticle,
  gridArticles,
  loading,
  hasMore,
  activeCategory,
  refreshNews,
  loadMoreNews,
  changeCategory,
} = useNews()

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

// Fetch articles on mount
onMounted(async () => {
  await refreshNews()
})

async function onCategoryChange(category: CategorySlug): Promise<void> {
  await changeCategory(category)
}

async function onLoadMore(): Promise<void> {
  await loadMoreNews()
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
        :articles="gridArticles"
        :loading="loading"
        :has-more="hasMore"
        @load-more="onLoadMore"
      />
    </section>
  </div>
</template>
