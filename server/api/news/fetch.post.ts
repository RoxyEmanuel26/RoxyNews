import { executeFetchCycle } from '../../utils/apiRotator'
import type { FetchCycleResult } from '~/types'

/**
 * POST /api/news/fetch — Triggers a manual fetch cycle from external APIs.
 * Uses the smart rotation engine to pick the next available API.
 */
export default defineEventHandler(async (_event): Promise<{ success: boolean; data: FetchCycleResult }> => {
  try {
    console.log('[API] Manual fetch cycle triggered')
    const result = await executeFetchCycle()

    return {
      success: result.success,
      data: result,
    }
  } catch (error) {
    console.error('[API] POST /api/news/fetch error:', error)
    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Fetch cycle failed',
    })
  }
})
