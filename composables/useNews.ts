import { storeToRefs } from 'pinia'
import { useNewsStore } from '~/stores/newsStore'
import { useFilterStore } from '~/stores/filterStore'
import type { CategorySlug } from '~/types'

/**
 * Composable for working with news data.
 * Wraps newsStore and filterStore with reactive refs and convenience methods.
 */
export function useNews() {
  const newsStore = useNewsStore()
  const filterStore = useFilterStore()

  const {
    articles,
    currentArticle,
    relatedArticles,
    loading,
    error,
    heroArticle,
    gridArticles,
    isEmpty,
    hasMore,
    total,
    page,
  } = storeToRefs(newsStore)

  const { activeCategory, searchQuery } = storeToRefs(filterStore)

  /**
   * Refreshes news articles based on the current filter state.
   */
  async function refreshNews(): Promise<void> {
    await newsStore.fetchArticles({
      category: filterStore.activeCategory,
      search: filterStore.searchQuery || undefined,
    })
  }

  /**
   * Loads the next page of articles (for infinite scroll).
   */
  async function loadMoreNews(): Promise<void> {
    await newsStore.loadMore(filterStore.activeCategory)
  }

  /**
   * Changes the active category and refreshes the article list.
   * @param category - The category to filter by
   */
  async function changeCategory(category: CategorySlug): Promise<void> {
    filterStore.setCategory(category)
    await refreshNews()
  }

  /**
   * Performs a search and refreshes the article list.
   * @param query - The search query string
   */
  async function searchNews(query: string): Promise<void> {
    filterStore.setSearchQuery(query)
    await refreshNews()
  }

  /**
   * Fetches a single article and its related articles.
   * @param id - The article UUID
   */
  async function loadArticle(id: string): Promise<void> {
    await newsStore.fetchArticleById(id)
  }

  /**
   * Clears all filters and refreshes the article list.
   */
  async function clearAndRefresh(): Promise<void> {
    filterStore.clearFilters()
    await refreshNews()
  }

  return {
    // Reactive state
    articles,
    currentArticle,
    relatedArticles,
    loading,
    error,
    heroArticle,
    gridArticles,
    isEmpty,
    hasMore,
    total,
    page,
    activeCategory,
    searchQuery,
    // Actions
    refreshNews,
    loadMoreNews,
    changeCategory,
    searchNews,
    loadArticle,
    clearAndRefresh,
  }
}
