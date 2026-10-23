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

import { preferAssetHost, resolveAssetHostTwinUrl, resolveAssetImageFallback } from "./asset-image-fallback"

const SEKAI_IMAGE_CACHE_NAMES = ["sekai-image-assets-v2", "sekai-image-assets"]

/**
 * Backoff per retry (ms): two quick retries for a flaky fetch, then two
 * long waits that outlast a WAF burst, which keeps refusing a host for
 * several seconds after a picker fires ~26 icon requests at once.
 */
export const IMAGE_RETRY_DELAYS_MS: readonly number[] = [800, 1600, 5000, 15000]

/** Delay before retry number `attempt` (1-based); null once the schedule is used up. */
export function resolveImageRetryDelayMs(attempt: number): number | null {
  return attempt >= 1 && attempt <= IMAGE_RETRY_DELAYS_MS.length ? IMAGE_RETRY_DELAYS_MS[attempt - 1] : null
}

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
 * Shared `@error` handler for sekai image elements. When the image's host
 * fails (a HEAD probe finds a network error, timeout or 5xx; see
 * asset-image-fallback.ts), the same file on the fallback host comes first.
 * Then it swaps to the fallback URL (when given), then retries the original
 * URL with backoff and a cache-busting param. A 404 never goes to the other
 * host. Per-URL state lives on the element's dataset because Vue reuses the
 * same `<img>` element across option/selection changes.
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
    delete image.dataset.triedTwin
    delete image.dataset.usedFallback
    delete image.dataset.retryCount
  }

  // the same file on the fallback host, when this host is failing
  if (!image.dataset.triedTwin && resolveAssetHostTwinUrl(sourceUrl)) {
    image.dataset.triedTwin = "1"
    const failedSrc = image.src
    const stillBound = () => image.isConnected && image.src === failedSrc && image.dataset.recoveryFor === sourceUrl
    void resolveAssetImageFallback(sourceUrl).then((twin) => {
      if (!stillBound()) {
        return
      }
      if (twin) {
        image.src = twin
      } else {
        recoverOnHost(image, sourceUrl, fallbackUrl) // first failure: always schedules a step
      }
    })
    return true
  }

  return recoverOnHost(image, sourceUrl, fallbackUrl)
}

/** The fallback URL, then cache-busted retries with backoff (on the twin host while this one is down). */
function recoverOnHost(image: HTMLImageElement, sourceUrl: string, fallbackUrl?: string | null): boolean {
  if (fallbackUrl && !image.dataset.usedFallback) {
    image.dataset.usedFallback = "1"
    const target = preferAssetHost(fallbackUrl)
    if (image.src !== target) {
      image.src = target
      return true
    }
  }

  const retries = Number(image.dataset.retryCount ?? "0")
  const delay = resolveImageRetryDelayMs(retries + 1)
  if (delay == null) {
    return false
  }
  image.dataset.retryCount = String(retries + 1)
  void purgeCachedSekaiImage(sourceUrl)

  const failedSrc = image.src
  const retryUrl = appendImageRetryParam(preferAssetHost(sourceUrl), retries + 1)
  window.setTimeout(() => {
    // Skip when the element left the DOM or was rebound to another URL
    // while the backoff was pending.
    if (image.isConnected && image.src === failedSrc && image.dataset.recoveryFor === sourceUrl) {
      image.src = retryUrl
    }
  }, delay)
  return true
}
