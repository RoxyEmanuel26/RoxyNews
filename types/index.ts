/** All TypeScript interfaces and types for NewsAggregator */

/** Normalized article schema — all API responses are mapped to this */
export interface Article {
  id: string
  source_api: ApiSourceName
  title: string
  description: string | null
  content: string | null
  url: string
  image_url: string | null
  author: string | null
  source_name: string
  category: CategorySlug
  published_at: string
  fetched_at: string
  language: string
}

/** Supported API source names */
export type ApiSourceName = 'WorldNewsAPI' | 'NewsDataIO' | 'NewsAPIOrg' | 'TheNewsAPI'

/** Category slug union type */
export type CategorySlug =
  | 'general'
  | 'technology'
  | 'sports'
  | 'business'
  | 'health'
  | 'entertainment'
  | 'science'

/** Category label mapping for display */
export interface CategoryInfo {
  slug: CategorySlug
  label: string
  icon: string
}

/** Configuration for an external news API */
export interface ApiConfig {
  id: number
  name: ApiSourceName
  dailyLimit: number
  baseUrl: string
  endpoint: string
  envKey: string
}

/** Rotation state from DB */
export interface RotationState {
  current_index: number
  updated_at: string
}

/** Quota info from DB */
export interface ApiQuotaInfo {
  api_name: ApiSourceName
  used_today: number
  daily_limit: number
  last_reset: string
  usage_percent: number
  status: 'healthy' | 'warning' | 'critical'
}

/** API call log entry */
export interface ApiCallLog {
  id: string
  api_name: ApiSourceName
  status: ApiCallStatus
  articles_fetched: number
  error_message: string | null
  called_at: string
}

/** Possible API call statuses */
export type ApiCallStatus = 'success' | 'failed' | 'skipped' | 'quota_exceeded'

/** Result of a fetch cycle */
export interface FetchCycleResult {
  success: boolean
  api_used: ApiSourceName | null
  articles_fetched: number
  articles_inserted: number
  articles_skipped: number
  error: string | null
}

/** Deduplication result */
export interface DeduplicationResult {
  inserted: Article[]
  skipped: number
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/** API error response structure */
export interface ApiErrorResponse {
  success: false
  error: string
  statusCode: number
}

/** API success response structure */
export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

/** Admin quota dashboard data */
export interface QuotaDashboardData {
  quotas: ApiQuotaInfo[]
  rotation: RotationState
  logs: ApiCallLog[]
  nextRefreshIn: number
}

/** News query params for fetching articles */
export interface NewsQueryParams {
  category?: CategorySlug
  page?: number
  limit?: number
  language?: string
  search?: string
}

/** WorldNewsAPI response shape */
export interface WorldNewsApiResponse {
  news: Array<{
    id: number
    title: string
    text: string
    summary: string | null
    url: string
    image: string | null
    publish_date: string
    author: string | null
    source_country: string
    language: string
    authors: string[]
    category?: string
  }>
  available: number
}

/** NewsData.io response shape */
export interface NewsDataIOResponse {
  status: string
  totalResults: number
  results: Array<{
    article_id: string
    title: string
    link: string
    description: string | null
    content: string | null
    pubDate: string
    image_url: string | null
    source_id: string
    source_name?: string
    source_url?: string
    creator: string[] | null
    category: string[]
    language: string
    country: string[]
  }>
  nextPage?: string
}

/** NewsAPI.org response shape */
export interface NewsAPIorgResponse {
  status: string
  totalResults: number
  articles: Array<{
    source: { id: string | null; name: string }
    author: string | null
    title: string
    description: string | null
    url: string
    urlToImage: string | null
    publishedAt: string
    content: string | null
  }>
}

/** TheNewsAPI response shape */
export interface TheNewsAPIResponse {
  meta: { found: number; returned: number; limit: number; page: number }
  data: Array<{
    uuid: string
    title: string
    description: string
    url: string
    image_url: string | null
    published_at: string
    source: string
    categories: string[]
    locale: string
    language: string
    snippet: string
  }>
}
