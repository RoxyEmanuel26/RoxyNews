import { ref, onMounted, onUnmounted, type Ref } from 'vue'

/**
 * Composable for implementing infinite scroll using IntersectionObserver.
 * Triggers a callback when the sentinel element enters the viewport.
 * @param onLoadMore - Async callback to load more data
 * @param options - Configuration options for the infinite scroll behavior
 */
export function useInfiniteScroll(
  onLoadMore: () => Promise<void>,
  options: {
    /** Ref that indicates if more data is available */
    hasMore: Ref<boolean>
    /** Ref that indicates if data is currently loading */
    isLoading: Ref<boolean>
    /** Root margin for IntersectionObserver (default: '200px') */
    rootMargin?: string
    /** Intersection threshold (default: 0.1) */
    threshold?: number
  }
) {
  const sentinelRef = ref<HTMLElement | null>(null)
  let observer: IntersectionObserver | null = null

  /**
   * Sets up the IntersectionObserver on the sentinel element.
   */
  function setupObserver(): void {
    if (!sentinelRef.value) return

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (
          entry?.isIntersecting &&
          options.hasMore.value &&
          !options.isLoading.value
        ) {
          onLoadMore()
        }
      },
      {
        rootMargin: options.rootMargin ?? '200px',
        threshold: options.threshold ?? 0.1,
      }
    )

    observer.observe(sentinelRef.value)
  }

  /**
   * Tears down the IntersectionObserver.
   */
  function teardownObserver(): void {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onMounted(() => {
    // Use nextTick to ensure the sentinel element is rendered
    nextTick(() => {
      setupObserver()
    })
  })

  onUnmounted(() => {
    teardownObserver()
  })

  return {
    /** Template ref to bind to the sentinel element */
    sentinelRef,
    /** Manually re-setup the observer (useful after dynamic content changes) */
    setupObserver,
    /** Manually teardown the observer */
    teardownObserver,
  }
}
