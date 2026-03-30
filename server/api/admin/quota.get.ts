import { getQuotaStatus, getCurrentRotationIndex, getRecentLogs } from '../../utils/apiRotator'
import { RECENT_LOGS_LIMIT, FETCH_INTERVAL_MS } from '../../constants/apiConfig'
import type { QuotaDashboardData } from '~/types'

/**
 * GET /api/admin/quota — Returns API usage statistics for the admin dashboard.
 * Includes quota info for all APIs, current rotation state, and recent logs.
 */
export default defineEventHandler(async (_event): Promise<{ success: true; data: QuotaDashboardData }> => {
  try {
    const [quotas, rotation, logs] = await Promise.all([
      getQuotaStatus(),
      getCurrentRotationIndex(),
      getRecentLogs(RECENT_LOGS_LIMIT),
    ])

    // Calculate time until next refresh
    const lastFetch = logs.length > 0 ? new Date(logs[0]!.called_at).getTime() : 0
    const nextRefreshAt = lastFetch + FETCH_INTERVAL_MS
    const nextRefreshIn = Math.max(0, nextRefreshAt - Date.now())

    return {
      success: true,
      data: {
        quotas,
        rotation,
        logs,
        nextRefreshIn,
      },
    }
  } catch (error) {
    console.error('[API] GET /api/admin/quota error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch quota data',
    })
  }
})
