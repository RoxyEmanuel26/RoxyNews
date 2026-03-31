import { v4 as uuidv4 } from 'uuid'
import { $fetch } from 'ofetch'
import type { ApiSourceName, ApiCallLog, FetchCycleResult, ApiQuotaInfo, RotationState } from '~/types'
import { API_CONFIGS, QUOTA_THRESHOLD, WIB_OFFSET_HOURS } from '../constants/apiConfig'
import { getDb, insertArticle } from './db'
import { normalizeArticles } from './normalizer'
import { deduplicateArticles } from './deduplicator'

/**
 * Gets the current rotation index from the database.
 * @returns The current RotationState
 */
export async function getCurrentRotationIndex(): Promise<RotationState> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT current_index, updated_at FROM api_rotation WHERE id = 1`,
    args: [],
  })

  if (result.rows.length === 0) {
    return { current_index: 0, updated_at: new Date().toISOString() }
  }

  return {
    current_index: Number(result.rows[0]!['current_index'] ?? 0),
    updated_at: String(result.rows[0]!['updated_at'] ?? new Date().toISOString()),
  }
}

/**
 * Updates the rotation index in the database.
 * @param newIndex - The new API index to set
 */
async function setRotationIndex(newIndex: number): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE api_rotation SET current_index = ?, updated_at = datetime('now') WHERE id = 1`,
    args: [newIndex],
  })
}

/**
 * Gets current quota information for all APIs.
 * @returns Array of ApiQuotaInfo objects
 */
export async function getQuotaStatus(): Promise<ApiQuotaInfo[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT api_name, used_today, daily_limit, last_reset FROM api_quota_log`,
    args: [],
  })

  return result.rows.map((row) => {
    const usedToday = Number(row['used_today'] ?? 0)
    const dailyLimit = Number(row['daily_limit'] ?? 100)
    const usagePercent = dailyLimit > 0 ? (usedToday / dailyLimit) * 100 : 100

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (usagePercent >= 80) status = 'critical'
    else if (usagePercent >= 50) status = 'warning'

    return {
      api_name: String(row['api_name'] ?? '') as ApiSourceName,
      used_today: usedToday,
      daily_limit: dailyLimit,
      last_reset: String(row['last_reset'] ?? ''),
      usage_percent: Math.round(usagePercent * 100) / 100,
      status,
    }
  })
}

/**
 * Increments the daily usage counter for a specific API.
 * @param apiName - The name of the API to increment
 */
export async function incrementQuotaUsage(apiName: ApiSourceName): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `UPDATE api_quota_log SET used_today = used_today + 1 WHERE api_name = ?`,
    args: [apiName],
  })
}

/**
 * Resets daily quotas if the last reset date is not today (in UTC+7 / WIB timezone).
 * Should be called at the beginning of each fetch cycle.
 */
export async function resetDailyQuotas(): Promise<void> {
  const db = getDb()

  // Get current date in WIB (UTC+7)
  const now = new Date()
  const wibTime = new Date(now.getTime() + WIB_OFFSET_HOURS * 60 * 60 * 1000)
  const todayWIB = wibTime.toISOString().split('T')[0]!

  const result = await db.execute({
    sql: `SELECT api_name, last_reset FROM api_quota_log`,
    args: [],
  })

  for (const row of result.rows) {
    const lastReset = String(row['last_reset'] ?? '')
    if (lastReset !== todayWIB) {
      await db.execute({
        sql: `UPDATE api_quota_log SET used_today = 0, last_reset = ? WHERE api_name = ?`,
        args: [todayWIB, String(row['api_name'] ?? '')],
      })
      console.log(`[Rotator] Reset daily quota for ${row['api_name']}`)
    }
  }
}

/**
 * Logs an API call result to the api_call_logs table.
 * @param apiName - The API that was called
 * @param status - The result status
 * @param articlesFetched - Number of articles fetched (0 for failures)
 * @param errorMessage - Error message if the call failed
 */
export async function logApiCall(
  apiName: ApiSourceName,
  status: ApiCallLog['status'],
  articlesFetched: number,
  errorMessage: string | null
): Promise<void> {
  const db = getDb()
  await db.execute({
    sql: `INSERT INTO api_call_logs (id, api_name, status, articles_fetched, error_message, called_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    args: [uuidv4(), apiName, status, articlesFetched, errorMessage],
  })
}

/**
 * Gets the most recent API call logs.
 * @param limit - Maximum number of logs to return
 * @returns Array of ApiCallLog objects
 */
export async function getRecentLogs(limit: number): Promise<ApiCallLog[]> {
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT id, api_name, status, articles_fetched, error_message, called_at
          FROM api_call_logs ORDER BY called_at DESC LIMIT ?`,
    args: [limit],
  })

  return result.rows.map((row) => ({
    id: String(row['id'] ?? ''),
    api_name: String(row['api_name'] ?? '') as ApiSourceName,
    status: String(row['status'] ?? '') as ApiCallLog['status'],
    articles_fetched: Number(row['articles_fetched'] ?? 0),
    error_message: row['error_message'] ? String(row['error_message']) : null,
    called_at: String(row['called_at'] ?? ''),
  }))
}

/**
 * Finds the next available API that hasn't exceeded its quota threshold.
 * Uses round-robin starting from the current rotation index.
 * @returns The ApiConfig of the next available API, or null if all are exhausted
 */
export async function getNextAvailableApi(): Promise<{
  apiIndex: number
  apiName: ApiSourceName
} | null> {
  const quotas = await getQuotaStatus()
  const rotation = await getCurrentRotationIndex()
  const totalApis = API_CONFIGS.length

  for (let attempt = 0; attempt < totalApis; attempt++) {
    const index = (rotation.current_index + attempt) % totalApis
    const config = API_CONFIGS[index]!
    const quota = quotas.find((q) => q.api_name === config.name)

    if (!quota) continue

    const usageRatio = quota.daily_limit > 0 ? quota.used_today / quota.daily_limit : 1
    if (usageRatio < QUOTA_THRESHOLD) {
      // Move rotation to the NEXT index for future calls
      const nextIndex = (index + 1) % totalApis
      await setRotationIndex(nextIndex)

      return { apiIndex: index, apiName: config.name }
    }

    console.log(`[Rotator] Skipping ${config.name} — at ${Math.round(usageRatio * 100)}% quota`)
    await logApiCall(config.name, 'skipped', 0, `Quota at ${Math.round(usageRatio * 100)}%`)
  }

  console.log('[Rotator] All APIs at 80%+ quota — using cache only')
  return null
}

/**
 * Executes an HTTP request to the specified news API.
 * Uses correct parameters per each API's official documentation.
 * Priority: Indonesian content first, fallback to US if unavailable.
 * @param apiName - The name of the API to fetch from
 * @returns The raw response data from the API
 */
export async function fetchFromApi(apiName: ApiSourceName): Promise<unknown> {
  const config = useRuntimeConfig()
  const apiConfig = API_CONFIGS.find((c) => c.name === apiName)

  if (!apiConfig) {
    throw new Error(`Unknown API: ${apiName}`)
  }

  const url = `${apiConfig.baseUrl}${apiConfig.endpoint}`

  switch (apiName) {
    // Docs: https://worldnewsapi.com/docs/search-news/
    // Supports: language, source-countries, number
    case 'WorldNewsAPI': {
      return await $fetch(url, {
        method: 'GET',
        headers: { 'x-api-key': config.worldnewsApiKey },
        params: {
          language: 'id',
          number: 10,
          'source-countries': 'id',
        },
      })
    }

    // Docs: https://newsdata.io/documentation
    // Supports: apikey, language, country, size
    case 'NewsDataIO': {
      return await $fetch(url, {
        method: 'GET',
        params: {
          apikey: config.newsdataApiKey,
          language: 'id',
          country: 'id',
          size: 10,
        },
      })
    }

    // Docs: https://newsapi.org/docs/endpoints/everything
    // /top-headlines doesn't support country=id (Indonesia not in list)
    // /everything supports: q, language, sortBy, pageSize
    case 'NewsAPIOrg': {
      return await $fetch(url, {
        method: 'GET',
        headers: { 'X-Api-Key': config.newsapiOrgKey },
        params: {
          q: 'indonesia',
          language: 'id',
          sortBy: 'publishedAt',
          pageSize: 10,
        },
      })
    }

    // Docs: https://www.thenewsapi.com/documentation
    // /news/all supports: api_token, language, limit, sort
    // locale filter requires Standard plan, so we skip it
    case 'TheNewsAPI': {
      return await $fetch(url, {
        method: 'GET',
        params: {
          api_token: config.thenewsApiKey,
          language: 'id',
          limit: 10,
          sort: 'published_at',
        },
      })
    }

    default:
      throw new Error(`Unsupported API: ${apiName}`)
  }
}

/**
 * Fetches from a single API with error handling, normalization, dedup, and DB insert.
 * @returns Stats for this single API call
 */
async function fetchAndProcessSingleApi(apiName: ApiSourceName): Promise<{
  apiName: ApiSourceName
  fetched: number
  inserted: number
  skipped: number
  error: string | null
}> {
  try {
    // Check quota before calling
    const quotas = await getQuotaStatus()
    const quota = quotas.find((q) => q.api_name === apiName)
    if (quota) {
      const usageRatio = quota.daily_limit > 0 ? quota.used_today / quota.daily_limit : 1
      if (usageRatio >= QUOTA_THRESHOLD) {
        const msg = `Quota at ${Math.round(usageRatio * 100)}%`
        console.log(`[Rotator] Skipping ${apiName} — ${msg}`)
        await logApiCall(apiName, 'skipped', 0, msg)
        return { apiName, fetched: 0, inserted: 0, skipped: 0, error: msg }
      }
    }

    console.log(`[Rotator] Fetching from ${apiName}...`)

    // Fetch
    const rawData = await fetchFromApi(apiName)

    // Normalize
    const normalized = normalizeArticles(apiName, rawData)
    console.log(`[Rotator] Normalized ${normalized.length} articles from ${apiName}`)

    // Deduplicate
    const { inserted: uniqueArticles, skipped } = await deduplicateArticles(normalized)
    console.log(`[Rotator] ${apiName}: ${uniqueArticles.length} new, ${skipped} dupes`)

    // Insert into DB
    let insertedCount = 0
    for (const article of uniqueArticles) {
      const wasInserted = await insertArticle(article)
      if (wasInserted) insertedCount++
    }

    // Increment quota & log
    await incrementQuotaUsage(apiName)
    await logApiCall(apiName, 'success', normalized.length, null)

    console.log(`[Rotator] ${apiName} done: ${insertedCount} inserted, ${skipped} skipped`)

    return { apiName, fetched: normalized.length, inserted: insertedCount, skipped, error: null }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Rotator] ${apiName} failed: ${errorMsg}`)
    await logApiCall(apiName, 'failed', 0, errorMsg)
    return { apiName, fetched: 0, inserted: 0, skipped: 0, error: errorMsg }
  }
}

/**
 * Main orchestrator: Executes a complete fetch cycle calling ALL 4 APIs in parallel.
 * Each API is called independently — if one fails, the others still succeed.
 * 1. Resets daily quotas if needed
 * 2. Calls all 4 APIs in parallel
 * 3. Each call: fetch → normalize → deduplicate → insert → log
 * 4. Returns combined stats
 * @returns FetchCycleResult with aggregate stats
 */
export async function executeFetchCycle(): Promise<FetchCycleResult> {
  try {
    // Step 1: Reset quotas if it's a new day
    await resetDailyQuotas()

    // Step 2: Call ALL 4 APIs in parallel
    const apiNames = API_CONFIGS.map((c) => c.name)
    console.log(`[Rotator] Fetching from ALL ${apiNames.length} APIs: ${apiNames.join(', ')}`)

    const results = await Promise.allSettled(
      apiNames.map((name) => fetchAndProcessSingleApi(name))
    )

    // Step 3: Aggregate results
    let totalFetched = 0
    let totalInserted = 0
    let totalSkipped = 0
    const apisUsed: string[] = []
    const errors: string[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        const r = result.value
        totalFetched += r.fetched
        totalInserted += r.inserted
        totalSkipped += r.skipped
        if (r.fetched > 0) apisUsed.push(r.apiName)
        if (r.error) errors.push(`${r.apiName}: ${r.error}`)
      } else {
        errors.push(`Unknown: ${result.reason}`)
      }
    }

    const summary = apisUsed.length > 0
      ? `Used: ${apisUsed.join(', ')}`
      : 'No APIs returned articles'

    console.log(`[Rotator] Cycle complete: ${totalInserted} inserted, ${totalSkipped} skipped from ${apisUsed.length} APIs`)

    return {
      success: apisUsed.length > 0,
      api_used: apisUsed.join(', ') as ApiSourceName | null,
      articles_fetched: totalFetched,
      articles_inserted: totalInserted,
      articles_skipped: totalSkipped,
      error: errors.length > 0 ? `${summary}. Errors: ${errors.join('; ')}` : null,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Rotator] Fetch cycle failed: ${errorMsg}`)
    return {
      success: false,
      api_used: null,
      articles_fetched: 0,
      articles_inserted: 0,
      articles_skipped: 0,
      error: errorMsg,
    }
  }
}
