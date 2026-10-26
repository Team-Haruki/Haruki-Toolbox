import type { SekaiRegion } from "@/types"
import type { StoryAssetIndex } from "@/modules/story/engine/urls"
import { AssetHttpError, loadWithAssetFallback } from "@/shared/sekai/asset-fallback"

/** Per request: headers and body together (a stalled body counts as a failure). */
const STORY_FETCH_TIMEOUT_MS = 15_000

/**
 * GET JSON with a timeout. Resolves `{ status }` for a non-OK answer and
 * `{ status, body }` otherwise; throws on a network error, a timeout, a body
 * that is not JSON (cut short) or the caller's abort.
 */
async function getJson(url: string, signal?: AbortSignal): Promise<{ status: number; body?: unknown }> {
  const controller = new AbortController()
  const timer = setTimeout(
    () => controller.abort(new DOMException(`${url}: timed out`, "TimeoutError")),
    STORY_FETCH_TIMEOUT_MS,
  )
  const onAbort = () => controller.abort(signal?.reason)
  if (signal?.aborted) onAbort()
  else signal?.addEventListener("abort", onAbort, { once: true })
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return { status: response.status }
    return { status: response.status, body: await response.json() }
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener("abort", onAbort)
  }
}

/**
 * The JP asset index (Live2D costumes, motion libraries, movies, SEs). The
 * asset host rebuilds it next to the tree every hour; the hour in the query
 * keeps CDN copies from going stale for longer. When the host fails (network,
 * timeout, 5xx) it is read from `fallbackJpRoot` instead, and `jpRoot` in the
 * result says which host answered: the page then plays the session from there.
 */
export async function fetchStoryAssetIndex(
  jpRoot: string,
  now = Date.now(),
  fallbackJpRoot: string | null = null,
): Promise<{ index: StoryAssetIndex; jpRoot: string }> {
  const hour = Math.floor(now / 3_600_000)
  const { value, root } = await loadWithAssetFallback(jpRoot, fallbackJpRoot, async (base) => {
    const url = `${base}/story-player/index.json?h=${hour}`
    const { status, body } = await getJson(url)
    if (body === undefined) throw new AssetHttpError(url, status)
    return body as Partial<StoryAssetIndex>
  })
  return {
    index: { version: value.version ?? "", models: value.models ?? {}, movies: value.movies ?? {}, se: value.se ?? {} },
    jpRoot: root,
  }
}

/**
 * Fetches a scenario JSON from "<root>/<region>-assets/<path>", trying the
 * candidate paths in order. Resolves null when none exists (404). A path the
 * host fails on (network, timeout, 5xx) is tried once on `fallbackRoot`.
 */
export async function fetchScenarioJson<T>(
  assetRoot: string,
  region: SekaiRegion,
  paths: readonly string[],
  signal?: AbortSignal,
  fallbackRoot: string | null = null,
): Promise<T | null> {
  for (const path of paths) {
    const { value } = await loadWithAssetFallback(assetRoot, fallbackRoot, async (root) => {
      const url = `${root}/${region}-assets/${path}`
      const { status, body } = await getJson(url, signal)
      if (status === 404 || status === 403) return null
      if (body === undefined) throw new AssetHttpError(url, status)
      return body as T
    })
    if (value !== null) return value
  }
  return null
}

/** Small LRU so switching languages or episodes back and forth does not refetch. */
export class ScenarioCache<T> {
  private entries = new Map<string, Promise<T | null>>()
  private readonly limit: number

  constructor(limit = 12) {
    this.limit = limit
  }

  get(key: string, load: () => Promise<T | null>): Promise<T | null> {
    const hit = this.entries.get(key)
    if (hit) {
      this.entries.delete(key)
      this.entries.set(key, hit)
      return hit
    }
    const pending = load().catch((error: unknown) => {
      this.entries.delete(key)
      throw error
    })
    this.entries.set(key, pending)
    while (this.entries.size > this.limit) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
    return pending
  }
}
