/**
 * Converts an external image URL to use the server-side image proxy.
 * This avoids browser-level ORB/CORS blocks from news domains that
 * restrict cross-origin image loading (e.g. mediaindonesia.com).
 *
 * Usage:  :src="proxyImageUrl(article.image_url)"
 */
export function useImageProxy() {
  /**
   * Returns a proxied URL for the given image source.
   * Returns the original URL if it's falsy, a data: URI, or a relative path.
   */
  function proxyImageUrl(url: string | null | undefined): string | null {
    if (!url) return null

    // Don't proxy data URIs, relative paths, or blob URLs
    if (
      url.startsWith('data:') ||
      url.startsWith('blob:') ||
      url.startsWith('/') ||
      !url.startsWith('http')
    ) {
      return url
    }

    return `/api/image-proxy?url=${encodeURIComponent(url)}`
  }

  return { proxyImageUrl }
}
