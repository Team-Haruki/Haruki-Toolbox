import type {
  HarukiCostumeShopContent,
  HarukiOriginalAssetBundleElement,
  HarukiOriginalBytesSource,
} from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

/** Bundle downloads of one content since it was created; counts only grow. */
export type CostumeLoadCounts = {
  requested: number
  done: number
  /** Catalog sizes (`fileSize`) of the requested / finished bundles. */
  bytesRequested: number
  bytesDone: number
}

type Listener = (counts: CostumeLoadCounts) => void

/** Counts the bundles a content downloads, for a load's progress bar. */
export class BundleLoadTracker {
  private counts: CostumeLoadCounts = { requested: 0, done: 0, bytesRequested: 0, bytesDone: 0 }
  private readonly listeners = new Set<Listener>()

  snapshot(): CostumeLoadCounts {
    return { ...this.counts }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  begin(bytes: number) {
    this.update({ requested: this.counts.requested + 1, bytesRequested: this.counts.bytesRequested + bytes })
  }

  finish(bytes: number) {
    this.update({ done: this.counts.done + 1, bytesDone: this.counts.bytesDone + bytes })
  }

  private update(change: Partial<CostumeLoadCounts>) {
    this.counts = { ...this.counts, ...change }
    const counts = this.snapshot()
    for (const listener of this.listeners) {
      listener(counts)
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
      tracker.begin(bytes)
      try {
        const response = await fetchBundle(source, { signal: context.signal })
        if (!response.ok) {
          throw new Error(`${String(source)}: HTTP ${response.status}`)
        }
        return await response.arrayBuffer()
      } finally {
        tracker.finish(bytes)
      }
    },
  }
}

/** One load's share of the downloads: what was requested and finished since `start`. */
export type CostumeLoadProgress = {
  requested: number
  done: number
  bytesRequested: number
  bytesDone: number
  /** 0..1, by bytes when the catalog gives sizes, else by bundles; null before the first bundle is asked for. */
  fraction: number | null
}

export function loadProgressSince(start: CostumeLoadCounts, now: CostumeLoadCounts): CostumeLoadProgress {
  const requested = now.requested - start.requested
  const done = Math.min(requested, now.done - start.done)
  const bytesRequested = now.bytesRequested - start.bytesRequested
  const bytesDone = Math.min(bytesRequested, now.bytesDone - start.bytesDone)
  let fraction: number | null = null
  if (bytesRequested > 0) {
    fraction = bytesDone / bytesRequested
  } else if (requested > 0) {
    fraction = done / requested
  }
  return { requested, done, bytesRequested, bytesDone, fraction }
}

/** Megabytes with one decimal, for the progress text. */
export function formatMegabytes(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1)
}
