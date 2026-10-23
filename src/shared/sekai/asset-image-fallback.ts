// Game-asset images (card art, costume thumbnails, event banners …) on the
// China CDN host have a twin on the fallback host (`global`, see
// resolveSekaiAssetFallbackRootUrl): the same path on another host. An <img>
// does not say why it failed, so a failure is classified with a HEAD probe:
// a network error, a timeout or a 5xx means the host is failing and the twin
// is tried; a 4xx means the file is missing there and the twin is not (the
// usual retries and candidates carry on). A 2xx means the host answers but the
// image still broke (cut short), which counts as the host failing. Once a host
// failed, images go to the twin first for a while instead of each waiting for
// its own failure.

import type { SekaiAssetEndpointPreference } from "./types"
import { SEKAI_ASSET_ENDPOINT_ROOTS, resolveSekaiAssetFallbackRootUrl } from "./data-sources"

/** How long a failed host stays behind its twin. */
export const ASSET_HOST_DOWN_MS = 60_000
/** A probe that has not answered by then counts as the host failing. */
export const ASSET_HOST_PROBE_TIMEOUT_MS = 5_000

/** [root, fallback root] for every route with a fallback. */
const TWIN_ROOTS: readonly (readonly [string, string])[] = (
  Object.keys(SEKAI_ASSET_ENDPOINT_ROOTS) as SekaiAssetEndpointPreference[]
).flatMap((preference) => {
  const root = SEKAI_ASSET_ENDPOINT_ROOTS[preference]
  const fallback = resolveSekaiAssetFallbackRootUrl(preference)
  return fallback && fallback !== root ? [[root, fallback] as const] : []
})

const downUntil = new Map<string, number>()
/** URLs a probe found missing (4xx): asked once per page. */
const missing = new Set<string>()
/** root → a probe running against that host */
const probing = new Map<string, Promise<unknown>>()

function rootOf(url: string): readonly [string, string] | undefined {
  return TWIN_ROOTS.find(([root]) => url.startsWith(`${root}/`))
}

/** The same file on the fallback host, or null (not an asset host with a fallback). */
export function resolveAssetHostTwinUrl(url: string | null | undefined): string | null {
  if (!url) {
    return null
  }
  const pair = rootOf(url)
  return pair ? `${pair[1]}${url.slice(pair[0].length)}` : null
}

/** `url`'s host failed: images on it go to their twin first for ASSET_HOST_DOWN_MS. */
export function markAssetHostDown(url: string, now = Date.now()): void {
  const pair = rootOf(url)
  if (pair) {
    downUntil.set(pair[0], now + ASSET_HOST_DOWN_MS)
  }
}

export function isAssetHostDown(url: string | null | undefined, now = Date.now()): boolean {
  const pair = url ? rootOf(url) : undefined
  if (!pair) {
    return false
  }
  const until = downUntil.get(pair[0])
  if (until === undefined) {
    return false
  }
  if (until > now) {
    return true
  }
  downUntil.delete(pair[0])
  return false
}

/** Forget every failed host (tests). */
export function resetAssetHostState(): void {
  downUntil.clear()
  missing.clear()
  probing.clear()
}

/** `url`, or its twin while `url`'s host is down. */
export function preferAssetHost(url: string, now = Date.now()): string {
  return isAssetHostDown(url, now) ? resolveAssetHostTwinUrl(url) ?? url : url
}

/**
 * After an image failed to load `url`: is its host failing (try the twin)
 * rather than the file missing? Asks the host with a HEAD request, which the
 * Service Worker does not intercept (it caches GETs only).
 */
export async function probeAssetHostFailure(
  url: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs = ASSET_HOST_PROBE_TIMEOUT_MS,
): Promise<boolean> {
  try {
    const response = await fetchImpl(url, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    })
    return response.status >= 500 || response.ok
  } catch {
    return true // network error or timeout
  }
}

/**
 * The image at `url` failed: resolves the twin to load instead when its host
 * is failing (marking the host down), or null when the file is missing there
 * or there is no twin. A burst of failures on one host shares the first
 * probe: once it found the host down, the others go straight to their twins.
 */
export async function resolveAssetImageFallback(
  url: string,
  probe: (url: string) => Promise<boolean> = (u) => probeAssetHostFailure(u),
): Promise<string | null> {
  const twin = resolveAssetHostTwinUrl(url)
  const pair = rootOf(url)
  if (!twin || !pair || missing.has(url)) {
    return null
  }
  const running = probing.get(pair[0])
  if (running && !isAssetHostDown(url)) {
    await running
  }
  if (isAssetHostDown(url)) {
    return twin
  }
  const verdict = probe(url)
  const settled = verdict.then(() => {}, () => {})
  probing.set(pair[0], settled)
  void settled.then(() => {
    if (probing.get(pair[0]) === settled) {
      probing.delete(pair[0])
    }
  })
  if (await verdict) {
    markAssetHostDown(url)
    return twin
  }
  missing.add(url)
  return null
}
