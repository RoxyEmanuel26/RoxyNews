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

    const rawContentType = response.headers.get('content-type') || ''

    // Map of common image extensions to MIME types
    const extMimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon',
      '.bmp': 'image/bmp',
    }

    // Determine the actual content type:
    // 1. Use the server's content-type if it's an image type
    // 2. Fallback: infer from the URL file extension
    let contentType = rawContentType
    if (!contentType.startsWith('image/')) {
      const pathname = parsed.pathname.toLowerCase()
      const ext = pathname.substring(pathname.lastIndexOf('.'))
      const inferredType = extMimeMap[ext]

      if (inferredType) {
        contentType = inferredType
      } else {
        // Last resort: check if the response body looks like a JPEG/PNG by magic bytes
        const peek = Buffer.from(await response.clone().arrayBuffer())
        const isJpeg = peek[0] === 0xFF && peek[1] === 0xD8
        const isPng = peek[0] === 0x89 && peek[1] === 0x50
        const isGif = peek[0] === 0x47 && peek[1] === 0x49
        const isWebp = peek[0] === 0x52 && peek[1] === 0x49 // RIFF

        if (isJpeg) contentType = 'image/jpeg'
        else if (isPng) contentType = 'image/png'
        else if (isGif) contentType = 'image/gif'
        else if (isWebp) contentType = 'image/webp'
        else {
          throw createError({ statusCode: 415, message: `Upstream resource is not an image (content-type: ${rawContentType})` })
        }
      }
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
