import { initDatabase } from '../utils/db'
import { executeFetchCycle } from '../utils/apiRotator'
import { FETCH_INTERVAL_MS } from '../constants/apiConfig'

/**
 * Nitro server plugin that initializes the database and sets up
 * the auto-fetch cron job to run every 30 minutes.
 */
export default defineNitroPlugin(async (nitro) => {
  try {
    // Initialize database tables on server start
    await initDatabase()
    console.log('[Plugin] Database initialized successfully')

    // Set up auto-fetch interval (30 minutes)
    const interval = setInterval(async () => {
      try {
        console.log('[Cron] Starting auto-fetch cycle...')
        const result = await executeFetchCycle()
        console.log(
          `[Cron] Auto-fetch complete: ${result.articles_inserted} new articles from ${result.api_used ?? 'cache'}`
        )
      } catch (error) {
        console.error('[Cron] Auto-fetch failed:', error)
      }
    }, FETCH_INTERVAL_MS)

    // Clean up interval when the server shuts down
    nitro.hooks.hook('close', () => {
      clearInterval(interval)
      console.log('[Plugin] Cron interval cleared')
    })

    // Run an initial fetch cycle on startup
    console.log('[Plugin] Running initial fetch cycle...')
    const initialResult = await executeFetchCycle()
    console.log(
      `[Plugin] Initial fetch: ${initialResult.articles_inserted} articles from ${initialResult.api_used ?? 'cache'}`
    )
  } catch (error) {
    console.error('[Plugin] Initialization failed:', error)
  }
})
