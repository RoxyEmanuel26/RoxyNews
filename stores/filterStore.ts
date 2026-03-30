import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CategorySlug } from '~/types'
import { CATEGORIES } from '~/server/constants/apiConfig'

/**
 * Pinia store for managing filter and UI state.
 */
export const useFilterStore = defineStore('filter', () => {
  // State
  const activeCategory = ref<CategorySlug>('general')
  const searchQuery = ref<string>('')
  const sortBy = ref<'published_at' | 'fetched_at'>('published_at')

  // Getters
  const activeCategoryLabel = computed<string>(() => {
    const cat = CATEGORIES.find((c) => c.slug === activeCategory.value)
    return cat?.label ?? 'General'
  })

  const hasActiveFilters = computed<boolean>(
    () => activeCategory.value !== 'general' || searchQuery.value.length > 0
  )

  // Actions

  /**
   * Sets the active category filter.
   * @param category - The category slug to filter by
   */
  function setCategory(category: CategorySlug): void {
    activeCategory.value = category
  }

  /**
   * Sets the search query.
   * @param query - The search string
   */
  function setSearchQuery(query: string): void {
    searchQuery.value = query
  }

  /**
   * Clears all active filters back to defaults.
   */
  function clearFilters(): void {
    activeCategory.value = 'general'
    searchQuery.value = ''
    sortBy.value = 'published_at'
  }

  return {
    // State
    activeCategory,
    searchQuery,
    sortBy,
    // Getters
    activeCategoryLabel,
    hasActiveFilters,
    // Actions
    setCategory,
    setSearchQuery,
    clearFilters,
  }
})
