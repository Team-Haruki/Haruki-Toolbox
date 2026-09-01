/**
 * Recovery helpers for sekai asset `<img>` loads.
 *
 * The asset hosts sit behind a WAF that answers part of burst loads (a
 * picker opening ~26 character icons at once) with transient 403s, and the
 * app's Service Worker caches those cross-origin responses as opaque
 * entries it cannot tell apart from real images — so a transient error can
 * be served from cache indefinitely. These helpers purge the cached entry
 * and retry with a cache-busting param so broken images heal in place.
 */

const SEKAI_IMAGE_CACHE_NAMES = ["sekai-image-assets-v2", "sekai-image-assets"]
const IMAGE_RETRY_LIMIT = 2
const IMAGE_RETRY_DELAY_MS = 800

/** Drop a possibly-poisoned Service Worker cache entry for one image URL. */
export async function purgeCachedSekaiImage(url: string): Promise<void> {
  if (typeof caches === "undefined") {
    return
  }
  try {
    const names = await caches.keys()
    for (const name of names) {
      if (!SEKAI_IMAGE_CACHE_NAMES.includes(name)) {
        continue
      }
      const cache = await caches.open(name)
      await cache.delete(url)
    }
  } catch {
    // Cache Storage unavailable (private mode, storage pressure) — the
    // retry below still bypasses the cache via its query param.
  }
}

/** Append a cache-busting retry marker, tolerating URLs with a query. */
export function appendImageRetryParam(url: string, attempt: number): string {
  return `${url}${url.includes("?") ? "&" : "?"}_retry=${attempt}`
}

/**
 * Shared `@error` handler for sekai image elements. Swaps to the fallback
 * URL first (when given), then retries the original URL with backoff and a
 * cache-busting param. Per-URL state lives on the element's dataset because
 * Vue reuses the same `<img>` element across option/selection changes.
 *
 * Returns `true` while a fallback or retry has been scheduled and `false`
 * once recovery is exhausted, so callers can switch to a placeholder only
 * when the image is really gone.
 */
export function handleSekaiImageError(
  event: Event,
  sourceUrl: string | null | undefined,
  fallbackUrl?: string | null,
): boolean {
  const image = event.target as HTMLImageElement | null
  if (!image || !sourceUrl) {
    return false
  }

  if (image.dataset.recoveryFor !== sourceUrl) {
    image.dataset.recoveryFor = sourceUrl
    delete image.dataset.usedFallback
    delete image.dataset.retryCount
  }

  if (fallbackUrl && !image.dataset.usedFallback) {
    image.dataset.usedFallback = "1"
    if (image.src !== fallbackUrl) {
      image.src = fallbackUrl
      return true
    }
  }

  const retries = Number(image.dataset.retryCount ?? "0")
  if (retries >= IMAGE_RETRY_LIMIT) {
    return false
  }
  image.dataset.retryCount = String(retries + 1)
  void purgeCachedSekaiImage(sourceUrl)

  const failedSrc = image.src
  const retryUrl = appendImageRetryParam(sourceUrl, retries + 1)
  window.setTimeout(() => {
    // Skip when the element left the DOM or was rebound to another URL
    // while the backoff was pending.
    if (image.isConnected && image.src === failedSrc && image.dataset.recoveryFor === sourceUrl) {
      image.src = retryUrl
    }
  }, IMAGE_RETRY_DELAY_MS * (retries + 1))
  return true
}
