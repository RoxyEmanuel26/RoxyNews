import { ref } from 'vue'
import type { QuotaDashboardData, FetchCycleResult } from '~/types'

/**
 * Composable for interacting with the API rotation admin dashboard.
 * Provides reactive quota data and methods to fetch/trigger operations.
 */
export function useApiRotator() {
  const quotaData = ref<QuotaDashboardData | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const fetchResult = ref<FetchCycleResult | null>(null)
  const isFetching = ref<boolean>(false)

  /**
   * Fetches the current quota status from the admin endpoint.
   */
  async function fetchQuotaStatus(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data: QuotaDashboardData }>('/api/admin/quota')
      quotaData.value = response.data
    } catch (err) {
      console.error('[useApiRotator] fetchQuotaStatus error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch quota status'
    } finally {
      loading.value = false
    }
  }

  /**
   * Triggers a manual fetch cycle from the API rotation engine.
   */
  async function triggerFetch(): Promise<void> {
    isFetching.value = true
    error.value = null
    fetchResult.value = null

    try {
      const response = await $fetch<{ success: boolean; data: FetchCycleResult }>('/api/news/fetch', {
        method: 'POST',
      })
      fetchResult.value = response.data

      // Refresh quota status after fetching
      await fetchQuotaStatus()
    } catch (err) {
      console.error('[useApiRotator] triggerFetch error:', err)
      error.value = err instanceof Error ? err.message : 'Fetch cycle failed'
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Formats milliseconds into a human-readable time string.
   * @param ms - Milliseconds remaining
   * @returns Formatted time string (e.g., "28m 15s")
   */
  function formatTimeRemaining(ms: number): string {
    if (ms <= 0) return 'now'

    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  return {
    quotaData,
    loading,
    error,
    fetchResult,
    isFetching,
    fetchQuotaStatus,
    triggerFetch,
    formatTimeRemaining,
  }
}
