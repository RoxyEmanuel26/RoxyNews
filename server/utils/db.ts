import { createClient, type Client } from '@libsql/client'

let dbClient: Client | null = null

/**
 * Returns a singleton Turso database client.
 * Creates the client on first call using runtime config credentials.
 * @returns The LibSQL/Turso database client instance
 */
export function getDb(): Client {
  if (!dbClient) {
    const config = useRuntimeConfig()
    dbClient = createClient({
      url: config.tursoDatabaseUrl,
      authToken: config.tursoAuthToken,
    })
  }
  return dbClient
}

/**
 * Initializes the database by creating all required tables and indexes.
 * Safe to call multiple times — uses IF NOT EXISTS clauses.
 * Called during server startup via Nitro plugin.
 */
export async function initDatabase(): Promise<void> {
  const db = getDb()

  await db.executeMultiple(`
    -- Main articles table
    CREATE TABLE IF NOT EXISTS articles (
      id            TEXT PRIMARY KEY,
      source_api    TEXT NOT NULL,
      title         TEXT NOT NULL,
      description   TEXT,
      content       TEXT,
      url           TEXT UNIQUE NOT NULL,
      image_url     TEXT,
      author        TEXT,
      source_name   TEXT,
      category      TEXT DEFAULT 'general',
      published_at  TEXT NOT NULL,
      fetched_at    TEXT NOT NULL,
      language      TEXT DEFAULT 'en'
    );
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_fetched ON articles(fetched_at DESC);

    -- API Rotation state
    CREATE TABLE IF NOT EXISTS api_rotation (
      id            INTEGER PRIMARY KEY DEFAULT 1,
      current_index INTEGER DEFAULT 0,
      updated_at    TEXT NOT NULL
    );
    INSERT OR IGNORE INTO api_rotation (id, current_index, updated_at)
    VALUES (1, 0, datetime('now'));

    -- API Quota tracking
    CREATE TABLE IF NOT EXISTS api_quota_log (
      api_name      TEXT PRIMARY KEY,
      used_today    INTEGER DEFAULT 0,
      daily_limit   INTEGER NOT NULL,
      last_reset    TEXT NOT NULL
    );
    INSERT OR IGNORE INTO api_quota_log VALUES ('WorldNewsAPI', 0, 50,   date('now'));
    INSERT OR IGNORE INTO api_quota_log VALUES ('NewsDataIO',   0, 200,  date('now'));
    INSERT OR IGNORE INTO api_quota_log VALUES ('NewsAPIOrg',   0, 1000, date('now'));
    INSERT OR IGNORE INTO api_quota_log VALUES ('TheNewsAPI',   0, 100,  date('now'));

    -- Sync daily_limit values with apiConfig.ts (fixes any stale DB rows)
    UPDATE api_quota_log SET daily_limit = 50   WHERE api_name = 'WorldNewsAPI';
    UPDATE api_quota_log SET daily_limit = 200  WHERE api_name = 'NewsDataIO';
    UPDATE api_quota_log SET daily_limit = 1000 WHERE api_name = 'NewsAPIOrg';
    UPDATE api_quota_log SET daily_limit = 100  WHERE api_name = 'TheNewsAPI';

    -- API call history logs
    CREATE TABLE IF NOT EXISTS api_call_logs (
      id                TEXT PRIMARY KEY,
      api_name          TEXT NOT NULL,
      status            TEXT NOT NULL,
      articles_fetched  INTEGER DEFAULT 0,
      error_message     TEXT,
      called_at         TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_logs_called ON api_call_logs(called_at DESC);
  `)

  console.log('[DB] Database initialized successfully')
}

/**
 * Inserts a single article into the database.
 * Uses INSERT OR IGNORE to skip duplicates (based on URL uniqueness).
 * @param article - The normalized article to insert
 * @returns true if the article was inserted, false if it was skipped
 */
export async function insertArticle(article: {
  id: string
  source_api: string
  title: string
  description: string | null
  content: string | null
  url: string
  image_url: string | null
  author: string | null
  source_name: string
  category: string
  published_at: string
  fetched_at: string
  language: string
}): Promise<boolean> {
  const db = getDb()

  try {
    const result = await db.execute({
      sql: `INSERT OR IGNORE INTO articles
            (id, source_api, title, description, content, url, image_url, author, source_name, category, published_at, fetched_at, language)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        article.id,
        article.source_api,
        article.title,
        article.description,
        article.content,
        article.url,
        article.image_url,
        article.author,
        article.source_name,
        article.category,
        article.published_at,
        article.fetched_at,
        article.language,
      ],
    })
    return result.rowsAffected > 0
  } catch (error) {
    console.error(`[DB] Failed to insert article: ${article.title}`, error)
    return false
  }
}
