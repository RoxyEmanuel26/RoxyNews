<script setup lang="ts">
import type { Article } from '~/types'

interface Props {
  /** Array of articles to display in the grid */
  articles: Article[]
  /** Whether data is currently loading */
  loading: boolean
  /** Whether more data is available for infinite scroll */
  hasMore: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'load-more': []
}>()

const { sentinelRef } = useInfiniteScroll(
  async () => {
    emit('load-more')
  },
  {
    hasMore: toRef(props, 'hasMore'),
    isLoading: toRef(props, 'loading'),
    rootMargin: '300px',
  }
)
</script>

<template>
  <div>
    <NuxtErrorBoundary>
      <!-- Articles grid -->
      <div class="card-grid">
        <div class="contents">
          <NewsCard
            v-for="(article, index) in articles"
            :key="article.id"
            :article="article"
            :featured="index === 0"
          />
        </div>
      </div>

      <!-- Error fallback -->
      <template #error="{ error: boundaryError }">
        <div class="text-center py-12">
          <p class="text-surface-500 dark:text-surface-400">
            Something went wrong loading articles.
          </p>
          <p class="text-xs text-surface-400 dark:text-surface-500 mt-1">
            {{ boundaryError?.message ?? 'Unknown error' }}
          </p>
        </div>
      </template>
    </NuxtErrorBoundary>

    <!-- Loading skeletons - initial load -->
    <div
      v-if="loading && articles.length === 0"
      class="card-grid"
    >
      <NewsCardSkeleton v-for="n in 12" :key="`skeleton-${n}`" />
    </div>

    <!-- Loading indicator for "load more" -->
    <div
      v-if="loading && articles.length > 0"
      class="flex justify-center py-8"
    >
      <UiSpinner :size="28" />
    </div>

    <!-- Infinite scroll sentinel -->
    <div
      ref="sentinelRef"
      v-if="hasMore && !loading"
      class="h-4"
      aria-hidden="true"
    />

    <!-- Empty state -->
    <div
      v-if="!loading && articles.length === 0"
      class="text-center py-16"
    >
      <div class="text-5xl mb-4">📭</div>
      <h3 class="text-lg font-semibold text-surface-700 dark:text-surface-300">
        No articles found
      </h3>
      <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
        Try changing your filters or check back later.
      </p>
    </div>

    <!-- End of results -->
    <div
      v-if="!hasMore && articles.length > 0 && !loading"
      class="text-center py-8"
    >
      <p class="text-xs text-surface-400 dark:text-surface-500">
        You've reached the end • {{ articles.length }} articles loaded
      </p>
    </div>
  </div>
</template>

<style scoped>
.card-enter-active {
  transition: all 0.4s ease-out;
}

.card-leave-active {
  transition: all 0.3s ease-in;
}

.card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.card-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
