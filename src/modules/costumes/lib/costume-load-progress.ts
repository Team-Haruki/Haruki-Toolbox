import { markAssetHostDown, preferAssetHost, resolveAssetHostTwinUrl } from "@/shared/sekai/asset-image-fallback"
import type {
  HarukiCostumeShopContent,
  HarukiOriginalAssetBundleElement,
  HarukiOriginalBytesSource,
} from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

type Listener = () => void

/**
 * The bundle downloads of one content, in request order, so a load's progress counts only the requests made after it
 * started: a download still running from an earlier load does not advance it when it finishes.
 */
export class BundleLoadTracker {
  private readonly requests: { bytes: number; done: boolean }[] = []
  private readonly listeners = new Set<Listener>()

  /** Where a load starts: its requests are the ones made from now on. */
  mark(): number {
    return this.requests.length
  }

  /** The downloads requested since `mark`. */
  progressSince(mark: number): CostumeLoadProgress {
    let requested = 0
    let done = 0
    let bytesRequested = 0
    let bytesDone = 0
    for (const request of this.requests.slice(mark)) {
      requested += 1
      bytesRequested += request.bytes
      if (request.done) {
        done += 1
        bytesDone += request.bytes
      }
    }
    let fraction: number | null = null
    if (bytesRequested > 0) {
      fraction = bytesDone / bytesRequested
    } else if (requested > 0) {
      fraction = done / requested
    }
    return { requested, done, bytesRequested, bytesDone, fraction }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /** A download starts. -> its id, for `finish`. */
  begin(bytes: number): number {
    this.requests.push({ bytes, done: false })
    this.notify()
    return this.requests.length - 1
  }

  finish(id: number) {
    const request = this.requests[id]
    if (request && !request.done) {
      request.done = true
      this.notify()
    }
  }

  private notify() {
    for (const listener of this.listeners) {
      listener()
    }
  }
}

/** The fetch the wrapper downloads bundles with. */
export type FetchBundle = (input: string | URL, init?: RequestInit) => Promise<Response>

function isLocation(source: HarukiOriginalBytesSource): source is string | URL {
  return typeof source === "string" || source instanceof URL
}

/**
 * The content with every bundle it names by URL fetched here (the kernel accepts the bytes as well), so the tracker
 * sees each download start and end. Bundles given as bytes pass through uncounted.
 */
export function trackBundleLoads(
  content: HarukiCostumeShopContent,
  tracker: BundleLoadTracker,
  fetchBundle: FetchBundle = (input, init) => fetch(input, init),
): HarukiCostumeShopContent {
  return {
    ...content,
    async provideBundle(bundle: HarukiOriginalAssetBundleElement, context) {
      const source = await content.provideBundle(bundle, context)
      if (!isLocation(source)) {
        return source
      }
      const bytes = Math.max(0, bundle.fileSize || 0)
      const request = tracker.begin(bytes)
      try {
        const response = await fetchWithHostFallback(String(source), context.signal, fetchBundle)
        if (!response.ok) {
          throw new Error(`${response.url || String(source)}: HTTP ${response.status}`)
        }
        return await response.arrayBuffer()
      } finally {
        tracker.finish(request)
      }
    },
  }
}

/**
 * Fetches an asset-CDN file on its route, or on the fallback route (the same path on `global`, see
 * asset-image-fallback) when the route fails: a network error or a 5xx marks the host down and asks the twin; a 4xx
 * (the file is missing there) does not. A host already marked down is skipped. URLs outside the asset hosts are
 * fetched as they are.
 */
export async function fetchWithHostFallback(url: string, signal: AbortSignal | undefined, fetchImpl: FetchBundle) {
  const first = preferAssetHost(url)
  const twin = first === url ? resolveAssetHostTwinUrl(url) : null
  if (!twin) {
    return fetchImpl(first, { signal })
  }
  let response: Response
  try {
    response = await fetchImpl(first, { signal })
  } catch (error) {
    if (signal?.aborted) {
      throw error
    }
    markAssetHostDown(first)
    return fetchImpl(twin, { signal })
  }
  if (response.status < 500) {
    return response
  }
  markAssetHostDown(first)
  return fetchImpl(twin, { signal })
}

/** One load's downloads. */
export type CostumeLoadProgress = {
  requested: number
  done: number
  /** Catalog sizes (`fileSize`) of the requested / finished bundles. */
  bytesRequested: number
  bytesDone: number
  /** 0..1, by bytes when the catalog gives sizes, else by bundles; null before the first bundle is asked for. */
  fraction: number | null
}

/** Megabytes with one decimal, for the progress text. */
export function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}
