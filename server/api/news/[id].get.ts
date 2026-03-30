import { z } from 'zod'
import { getDb } from '../../utils/db'
import { MAX_RELATED_ARTICLES } from '../../constants/apiConfig'
import type { Article, CategorySlug } from '~/types'

const paramsSchema = z.object({
  id: z.string().uuid('Invalid article ID format'),
})

/**
 * GET /api/news/:id — Fetches a single article by its UUID.
 * Also returns up to 5 related articles from the same category.
 */
export default defineEventHandler(
  async (event): Promise<{ success: true; data: { article: Article; related: Article[] } }> => {
    try {
      const params = paramsSchema.parse(getRouterParams(event))
      const db = getDb()

      // Fetch the article
      const result = await db.execute({
        sql: `SELECT * FROM articles WHERE id = ?`,
        args: [params.id],
      })

      if (result.rows.length === 0) {
        throw createError({
          statusCode: 404,
          message: 'Article not found',
        })
      }

      const row = result.rows[0]!
      const article: Article = {
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
      }

      // Fetch related articles (same category, excluding current article)
      const relatedResult = await db.execute({
        sql: `SELECT * FROM articles
              WHERE category = ? AND id != ?
              ORDER BY published_at DESC
              LIMIT ?`,
        args: [article.category, article.id, MAX_RELATED_ARTICLES],
      })

      const related: Article[] = relatedResult.rows.map((r) => ({
        id: String(r['id'] ?? ''),
        source_api: String(r['source_api'] ?? '') as Article['source_api'],
        title: String(r['title'] ?? ''),
        description: r['description'] ? String(r['description']) : null,
        content: r['content'] ? String(r['content']) : null,
        url: String(r['url'] ?? ''),
        image_url: r['image_url'] ? String(r['image_url']) : null,
        author: r['author'] ? String(r['author']) : null,
        source_name: String(r['source_name'] ?? ''),
        category: String(r['category'] ?? 'general') as CategorySlug,
        published_at: String(r['published_at'] ?? ''),
        fetched_at: String(r['fetched_at'] ?? ''),
        language: String(r['language'] ?? 'en'),
      }))

      return {
        success: true,
        data: { article, related },
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      console.error('[API] GET /api/news/[id] error:', error)
      throw createError({
        statusCode: 500,
        message: error instanceof Error ? error.message : 'Failed to fetch article',
      })
    }
  }
)
