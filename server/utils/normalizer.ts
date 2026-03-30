import { v4 as uuidv4 } from 'uuid'
import type {
  Article,
  ApiSourceName,
  CategorySlug,
  WorldNewsApiResponse,
  NewsDataIOResponse,
  NewsAPIorgResponse,
  TheNewsAPIResponse,
} from '~/types'

/**
 * Maps a raw category string from any API to our normalized category slug.
 * Falls back to 'general' for unknown categories.
 * @param rawCategory - The raw category string from the API
 * @returns The normalized CategorySlug
 */
function mapCategory(rawCategory: string | undefined | null): CategorySlug {
  if (!rawCategory) return 'general'

  const lower = rawCategory.toLowerCase().trim()

  const categoryMap: Record<string, CategorySlug> = {
    technology: 'technology',
    tech: 'technology',
    computing: 'technology',
    science: 'science',
    sports: 'sports',
    sport: 'sports',
    business: 'business',
    finance: 'business',
    economy: 'business',
    economics: 'business',
    health: 'health',
    medical: 'health',
    healthcare: 'health',
    entertainment: 'entertainment',
    lifestyle: 'entertainment',
    culture: 'entertainment',
    arts: 'entertainment',
    general: 'general',
    top: 'general',
    world: 'general',
    politics: 'general',
    national: 'general',
    breaking: 'general',
  }

  return categoryMap[lower] ?? 'general'
}

/**
 * Returns the current timestamp in ISO 8601 format.
 * @returns ISO 8601 string of the current time
 */
function nowISO(): string {
  return new Date().toISOString()
}

/**
 * Normalizes articles from WorldNewsAPI to our Article schema.
 * @param response - Raw WorldNewsAPI response
 * @returns Array of normalized Article objects
 */
export function normalizeWorldNewsAPI(response: WorldNewsApiResponse): Article[] {
  if (!response.news || !Array.isArray(response.news)) return []

  return response.news
    .filter((item) => item.title && item.url)
    .map((item) => ({
      id: uuidv4(),
      source_api: 'WorldNewsAPI' as ApiSourceName,
      title: item.title.trim(),
      description: item.summary ?? null,
      content: item.text ?? null,
      url: item.url,
      image_url: item.image ?? null,
      author: item.authors?.join(', ') ?? item.author ?? null,
      source_name: extractDomain(item.url),
      category: mapCategory(item.category),
      published_at: new Date(item.publish_date).toISOString(),
      fetched_at: nowISO(),
      language: item.language ?? 'en',
    }))
}

/**
 * Normalizes articles from NewsData.io to our Article schema.
 * @param response - Raw NewsData.io response
 * @returns Array of normalized Article objects
 */
export function normalizeNewsDataIO(response: NewsDataIOResponse): Article[] {
  if (!response.results || !Array.isArray(response.results)) return []

  return response.results
    .filter((item) => item.title && item.link)
    .map((item) => ({
      id: uuidv4(),
      source_api: 'NewsDataIO' as ApiSourceName,
      title: item.title.trim(),
      description: item.description ?? null,
      content: item.content ?? null,
      url: item.link,
      image_url: item.image_url ?? null,
      author: item.creator?.join(', ') ?? null,
      source_name: item.source_name ?? item.source_id ?? extractDomain(item.link),
      category: mapCategory(item.category?.[0]),
      published_at: new Date(item.pubDate).toISOString(),
      fetched_at: nowISO(),
      language: item.language ?? 'en',
    }))
}

/**
 * Normalizes articles from NewsAPI.org to our Article schema.
 * @param response - Raw NewsAPI.org response
 * @returns Array of normalized Article objects
 */
export function normalizeNewsAPIOrg(response: NewsAPIorgResponse): Article[] {
  if (!response.articles || !Array.isArray(response.articles)) return []

  return response.articles
    .filter((item) => item.title && item.url && item.title !== '[Removed]')
    .map((item) => ({
      id: uuidv4(),
      source_api: 'NewsAPIOrg' as ApiSourceName,
      title: item.title.trim(),
      description: item.description ?? null,
      content: item.content ?? null,
      url: item.url,
      image_url: item.urlToImage ?? null,
      author: item.author ?? null,
      source_name: item.source?.name ?? extractDomain(item.url),
      category: 'general' as CategorySlug,
      published_at: new Date(item.publishedAt).toISOString(),
      fetched_at: nowISO(),
      language: 'en',
    }))
}

/**
 * Normalizes articles from TheNewsAPI to our Article schema.
 * @param response - Raw TheNewsAPI response
 * @returns Array of normalized Article objects
 */
export function normalizeTheNewsAPI(response: TheNewsAPIResponse): Article[] {
  if (!response.data || !Array.isArray(response.data)) return []

  return response.data
    .filter((item) => item.title && item.url)
    .map((item) => ({
      id: uuidv4(),
      source_api: 'TheNewsAPI' as ApiSourceName,
      title: item.title.trim(),
      description: item.description ?? item.snippet ?? null,
      content: item.snippet ?? null,
      url: item.url,
      image_url: item.image_url ?? null,
      author: null,
      source_name: item.source ?? extractDomain(item.url),
      category: mapCategory(item.categories?.[0]),
      published_at: new Date(item.published_at).toISOString(),
      fetched_at: nowISO(),
      language: item.language ?? 'en',
    }))
}

/**
 * Routes raw API data to the appropriate normalizer based on source name.
 * @param source - The API source name
 * @param rawData - The raw response data from the API
 * @returns Array of normalized Article objects
 */
export function normalizeArticles(source: ApiSourceName, rawData: unknown): Article[] {
  switch (source) {
    case 'WorldNewsAPI':
      return normalizeWorldNewsAPI(rawData as WorldNewsApiResponse)
    case 'NewsDataIO':
      return normalizeNewsDataIO(rawData as NewsDataIOResponse)
    case 'NewsAPIOrg':
      return normalizeNewsAPIOrg(rawData as NewsAPIorgResponse)
    case 'TheNewsAPI':
      return normalizeTheNewsAPI(rawData as TheNewsAPIResponse)
    default:
      console.warn(`[Normalizer] Unknown source: ${source}`)
      return []
  }
}

/**
 * Extracts the domain name from a URL for use as source_name fallback.
 * @param url - The full URL
 * @returns The domain name (e.g., "cnn.com")
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return 'Unknown'
  }
}
