import type { ApiConfig, CategoryInfo, CategorySlug } from '~/types'

/** Configuration for all 4 external news APIs */
export const API_CONFIGS: ApiConfig[] = [
  {
    id: 0,
    name: 'WorldNewsAPI',
    dailyLimit: 50,
    baseUrl: 'https://api.worldnewsapi.com',
    endpoint: '/search-news',
    envKey: 'worldnewsApiKey',
  },
  {
    id: 1,
    name: 'NewsDataIO',
    dailyLimit: 200,
    baseUrl: 'https://newsdata.io/api/1',
    endpoint: '/news',
    envKey: 'newsdataApiKey',
  },
  {
    id: 2,
    name: 'NewsAPIOrg',
    dailyLimit: 1000,
    baseUrl: 'https://newsapi.org/v2',
    endpoint: '/top-headlines',
    envKey: 'newsapiOrgKey',
  },
  {
    id: 3,
    name: 'TheNewsAPI',
    dailyLimit: 100,
    baseUrl: 'https://api.thenewsapi.com/v1',
    endpoint: '/news/top',
    envKey: 'thenewsApiKey',
  },
]

/** Threshold percentage — skip an API if it exceeds this fraction of its daily limit */
export const QUOTA_THRESHOLD = 0.8

/** How many articles to fetch per API call */
export const ARTICLES_PER_FETCH = 10

/** Interval between auto-fetch cycles in milliseconds (30 minutes) */
export const FETCH_INTERVAL_MS = 30 * 60 * 1000

/** Available news categories */
export const CATEGORIES: CategoryInfo[] = [
  { slug: 'general', label: 'General', icon: '📰' },
  { slug: 'technology', label: 'Technology', icon: '💻' },
  { slug: 'business', label: 'Business', icon: '💼' },
  { slug: 'sports', label: 'Sports', icon: '⚽' },
  { slug: 'health', label: 'Health', icon: '🏥' },
  { slug: 'science', label: 'Science', icon: '🔬' },
  { slug: 'entertainment', label: 'Entertainment', icon: '🎬' },
]

/** Valid category slugs for validation */
export const VALID_CATEGORIES: CategorySlug[] = CATEGORIES.map((c) => c.slug)

/** Default number of articles per page */
export const DEFAULT_PAGE_SIZE = 12

/** Maximum number of related articles to show */
export const MAX_RELATED_ARTICLES = 5

/** Number of recent logs to show in admin dashboard */
export const RECENT_LOGS_LIMIT = 50

/** UTC+7 offset in hours for WIB timezone */
export const WIB_OFFSET_HOURS = 7
