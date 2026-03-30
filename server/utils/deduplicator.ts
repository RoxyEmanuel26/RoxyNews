import type { Article, DeduplicationResult } from '~/types'
import { getDb } from './db'

/**
 * Normalizes a URL by stripping tracking parameters, hash fragments, and trailing slashes.
 * This ensures consistent URL comparison for deduplication.
 * @param url - The raw URL to normalize
 * @returns The cleaned URL string
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)

    // Remove tracking parameters
    const paramsToRemove: string[] = []
    parsed.searchParams.forEach((_value, key) => {
      if (
        key.startsWith('utm_') ||
        key.startsWith('ref') ||
        key === 'fbclid' ||
        key === 'gclid' ||
        key === 'mc_cid' ||
        key === 'mc_eid'
      ) {
        paramsToRemove.push(key)
      }
    })
    paramsToRemove.forEach((key) => parsed.searchParams.delete(key))

    // Remove hash fragment
    parsed.hash = ''

    // Remove trailing slash
    let normalized = parsed.toString()
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1)
    }

    return normalized
  } catch {
    return url.split('?')[0]?.split('#')[0] ?? url
  }
}

/**
 * Calculates the Levenshtein (edit) distance between two strings.
 * Used for fuzzy title matching during deduplication.
 * @param a - First string
 * @param b - Second string
 * @returns The edit distance as an integer
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLower = a.toLowerCase().trim()
  const bLower = b.toLowerCase().trim()

  if (aLower === bLower) return 0
  if (aLower.length === 0) return bLower.length
  if (bLower.length === 0) return aLower.length

  const matrix: number[][] = []

  for (let i = 0; i <= bLower.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= aLower.length; j++) {
    matrix[0]![j] = j
  }

  for (let i = 1; i <= bLower.length; i++) {
    for (let j = 1; j <= aLower.length; j++) {
      if (bLower.charAt(i - 1) === aLower.charAt(j - 1)) {
        matrix[i]![j] = matrix[i - 1]![j - 1]!
      } else {
        matrix[i]![j] = Math.min(
          matrix[i - 1]![j - 1]! + 1,
          matrix[i]![j - 1]! + 1,
          matrix[i - 1]![j]! + 1
        )
      }
    }
  }

  return matrix[bLower.length]![aLower.length]!
}

/**
 * Checks if two titles are similar enough to be considered duplicates.
 * Uses Levenshtein distance with a 10% threshold of the longer title's length.
 * @param titleA - First title
 * @param titleB - Second title
 * @returns true if titles are too similar (likely duplicates)
 */
export function areTitlesSimilar(titleA: string, titleB: string): boolean {
  const maxLen = Math.max(titleA.length, titleB.length)
  if (maxLen === 0) return true

  const distance = levenshteinDistance(titleA, titleB)
  const threshold = Math.floor(maxLen * 0.1)

  return distance < threshold
}

/**
 * Deduplicates an array of articles against the database.
 * Checks both URL uniqueness and title similarity within the last 24 hours.
 * @param articles - Array of normalized articles to deduplicate
 * @returns Object with inserted articles array and count of skipped articles
 */
export async function deduplicateArticles(articles: Article[]): Promise<DeduplicationResult> {
  const db = getDb()
  const inserted: Article[] = []
  let skipped = 0

  // Fetch recent titles from the last 24 hours for fuzzy matching
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const recentResult = await db.execute({
    sql: `SELECT title, url FROM articles WHERE fetched_at > ?`,
    args: [twentyFourHoursAgo],
  })

  const recentTitles: string[] = recentResult.rows.map((row) => String(row['title'] ?? ''))
  const recentUrls: Set<string> = new Set(
    recentResult.rows.map((row) => normalizeUrl(String(row['url'] ?? '')))
  )

  for (const article of articles) {
    const normalizedArticleUrl = normalizeUrl(article.url)

    // Check 1: URL already exists in recent articles (in-memory check)
    if (recentUrls.has(normalizedArticleUrl)) {
      skipped++
      continue
    }

    // Check 2: URL exists in DB (covers articles older than 24h)
    const urlExistsResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM articles WHERE url = ?`,
      args: [normalizedArticleUrl],
    })
    const urlCount = Number(urlExistsResult.rows[0]?.['cnt'] ?? 0)
    if (urlCount > 0) {
      skipped++
      continue
    }

    // Check 3: Title similarity check against recent articles
    let isTitleDuplicate = false
    for (const existingTitle of recentTitles) {
      if (areTitlesSimilar(article.title, existingTitle)) {
        isTitleDuplicate = true
        break
      }
    }

    if (isTitleDuplicate) {
      skipped++
      continue
    }

    // Update the article URL to normalized form
    const cleanArticle: Article = {
      ...article,
      url: normalizedArticleUrl,
    }

    inserted.push(cleanArticle)
    recentTitles.push(cleanArticle.title)
    recentUrls.add(normalizedArticleUrl)
  }

  return { inserted, skipped }
}
