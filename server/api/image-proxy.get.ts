/**
 * GET /api/image-proxy?url=<encoded_url>
 *
 * Server-side image proxy that fetches external news images and
 * forwards them to the client. This bypasses ORB / CORS restrictions
 * that some news sites (e.g. mediaindonesia.com) enforce, which
 * cause images to break when loaded directly from a different origin.
 *
 * Security:
 *  - Only image/* MIME types are forwarded.
 *  - Only http(s) URLs are accepted.
 *  - Timeout is capped at 8 seconds.
 *  - Response is cached on the edge for 1 hour (s-maxage) and
 *    in the browser for 10 minutes (max-age).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = query.url as string | undefined

  if (!url) {
    throw createError({ statusCode: 400, message: 'Missing "url" query parameter' })
  }

  // Basic URL validation
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw createError({ statusCode: 400, message: 'Invalid URL' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw createError({ statusCode: 400, message: 'Only HTTP(S) URLs are allowed' })
  }

  try {
    // Fetch the image from the origin server
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: parsed.origin + '/',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        message: `Upstream responded with ${response.status}`,
      })
    }

    const contentType = response.headers.get('content-type') || ''

    // Only proxy actual images
    if (!contentType.startsWith('image/')) {
      throw createError({ statusCode: 415, message: 'Upstream resource is not an image' })
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    // Set caching headers — 10 min browser, 1 hour CDN/edge
    setResponseHeaders(event, {
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=86400',
      'Access-Control-Allow-Origin': '*',
    })

    return buffer
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      throw err // re-throw createError instances
    }
    console.error('[image-proxy] Failed to fetch image:', url, err)
    throw createError({ statusCode: 502, message: 'Failed to fetch image from upstream' })
  }
})
