import { z } from 'zod'
import { getDb } from '../../utils/db'
import { DEFAULT_PAGE_SIZE, VALID_CATEGORIES } from '../../constants/apiConfig'
import type { Article, PaginatedResponse, CategorySlug } from '~/types'

const querySchema = z.object({
  category: z
    .string()
    .optional()
    .refine((val) => !val || VALID_CATEGORIES.includes(val as CategorySlug), {
      message: 'Invalid category',
    }),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(DEFAULT_PAGE_SIZE),
  language: z.string().optional(),
  search: z.string().optional(),
})

/**
 * GET /api/news — Fetches paginated articles from the database.
 * Supports filtering by category, language, and search query.
 */
export default defineEventHandler(async (event): Promise<PaginatedResponse<Article>> => {
  try {
    const rawQuery = getQuery(event)
    const params = querySchema.parse(rawQuery)

    const db = getDb()
    const conditions: string[] = []
    const args: (string | number)[] = []

    if (params.category) {
      conditions.push('category = ?')
      args.push(params.category)
    }

    if (params.language) {
      conditions.push('language = ?')
      args.push(params.language)
    }

    if (params.search) {
      conditions.push('(title LIKE ? OR description LIKE ?)')
      args.push(`%${params.search}%`, `%${params.search}%`)
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
    const offset = (params.page - 1) * params.limit

    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM articles ${whereClause}`,
      args,
    })
    const total = Number(countResult.rows[0]?.['total'] ?? 0)

    // Get paginated results
    const dataResult = await db.execute({
      sql: `SELECT * FROM articles ${whereClause} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
      args: [...args, params.limit, offset],
    })

    const articles: Article[] = dataResult.rows.map((row) => ({
      id: String(row['id'] ?? ''),
      source_api: String(row['source_api'] ?? '') as Article['source_api'],
      title: String(row['title'] ?? ''),
      description: row['description'] ? String(row['description']) : null,
      content: row['content'] ? String(row['content']) : null,
      url: String(row['url'] ?? ''),
      image_url: row['image_url'] ? String(row['image_url']) : null,
      author: row['author'] ? String(row['author']) : null,
      source_name: String(row['source_name'] ?? ''),
      category: String(row['category'] ?? 'general') as CategorySlug,
      published_at: String(row['published_at'] ?? ''),
      fetched_at: String(row['fetched_at'] ?? ''),
      language: String(row['language'] ?? 'en'),
    }))

    return {
      data: articles,
      total,
      page: params.page,
      limit: params.limit,
      hasMore: offset + params.limit < total,
    }
  } catch (error) {
    console.error('[API] GET /api/news error:', error)

    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        message: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      })
    }

    throw createError({
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Failed to fetch articles',
    })
  }
})
