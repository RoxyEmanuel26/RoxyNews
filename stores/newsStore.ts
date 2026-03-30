import { defineStore } from 'pinia'
import { shallowRef, ref, computed } from 'vue'
import type { Article, PaginatedResponse, CategorySlug } from '~/types'

/**
 * Pinia store for managing news articles state.
 * Uses shallowRef for the articles array to optimize reactivity performance.
 */
export const useNewsStore = defineStore('news', () => {
  // State
  const articles = shallowRef<Article[]>([])
  const currentArticle = ref<Article | null>(null)
  const relatedArticles = shallowRef<Article[]>([])
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const page = ref<number>(1)
  const limit = ref<number>(12)
  const total = ref<number>(0)
  const hasMore = ref<boolean>(false)

  // Getters
  const heroArticle = computed<Article | null>(() => articles.value[0] ?? null)

  const gridArticles = computed<Article[]>(() => articles.value.slice(1))

  const isEmpty = computed<boolean>(() => articles.value.length === 0 && !loading.value)

  // Actions

  /**
   * Fetches articles from the API with optional filters.
   * Replaces current articles (used for initial load & filter changes).
   */
  async function fetchArticles(params: {
    category?: CategorySlug
    search?: string
    language?: string
  } = {}): Promise<void> {
    loading.value = true
    error.value = null
    page.value = 1

    try {
      const query: Record<string, string | number> = {
        page: 1,
        limit: limit.value,
      }

      if (params.category && params.category !== 'general') {
        query['category'] = params.category
      }
      if (params.search) {
        query['search'] = params.search
      }
      if (params.language) {
        query['language'] = params.language
      }

      const response = await $fetch<PaginatedResponse<Article>>('/api/news', {
        params: query,
      })

      articles.value = response.data
      total.value = response.total
      hasMore.value = response.hasMore
    } catch (err) {
      console.error('[NewsStore] fetchArticles error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch articles'
      articles.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Loads more articles (next page) and appends to existing list.
   * Used for infinite scroll.
   */
  async function loadMore(category?: CategorySlug): Promise<void> {
    if (loading.value || !hasMore.value) return

    loading.value = true
    error.value = null
    page.value++

    try {
      const query: Record<string, string | number> = {
        page: page.value,
        limit: limit.value,
      }

      if (category && category !== 'general') {
        query['category'] = category
      }

      const response = await $fetch<PaginatedResponse<Article>>('/api/news', {
        params: query,
      })

      articles.value = [...articles.value, ...response.data]
      total.value = response.total
      hasMore.value = response.hasMore
    } catch (err) {
      console.error('[NewsStore] loadMore error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to load more articles'
      page.value--
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches a single article by ID, along with related articles.
   */
  async function fetchArticleById(id: string): Promise<void> {
    loading.value = true
    error.value = null
    currentArticle.value = null
    relatedArticles.value = []

    try {
      const response = await $fetch<{
        success: boolean
        data: { article: Article; related: Article[] }
      }>(`/api/news/${id}`)

      currentArticle.value = response.data.article
      relatedArticles.value = response.data.related
    } catch (err) {
      console.error('[NewsStore] fetchArticleById error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch article'
    } finally {
      loading.value = false
    }
  }

  /**
   * Resets the store to its initial state.
   */
  function reset(): void {
    articles.value = []
    currentArticle.value = null
    relatedArticles.value = []
    loading.value = false
    error.value = null
    page.value = 1
    total.value = 0
    hasMore.value = false
  }

  return {
    // State
    articles,
    currentArticle,
    relatedArticles,
    loading,
    error,
    page,
    limit,
    total,
    hasMore,
    // Getters
    heroArticle,
    gridArticles,
    isEmpty,
    // Actions
    fetchArticles,
    loadMore,
    fetchArticleById,
    reset,
  }
})
