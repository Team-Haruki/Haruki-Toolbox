/**
 * Pure planning logic behind the Service Worker asset warmup: what a build's
 * asset manifest is allowed to look like, which of its files still need
 * fetching, and how many of them may be in flight at once. The browser
 * plumbing that acts on this lives in `src/pwa-asset-warmup.ts`.
 */

export type AssetManifestEntry = {
  url: string
  bytes: number
}

export type AssetManifest = {
  gitCommit?: string
  files: AssetManifestEntry[]
}

export type WarmupLimits = {
  maxFileBytes: number
  maxTotalBytes: number
}

export type ConnectionHint = {
  saveData?: boolean
  effectiveType?: string
}

/** Larger files are niche heavyweights that stay a pay-on-use download. */
export const WARMUP_MAX_FILE_BYTES = 600 * 1024
export const WARMUP_MAX_TOTAL_BYTES = 6 * 1024 * 1024
export const WARMUP_CONCURRENCY = 6

const CONSTRAINED_EFFECTIVE_TYPES = new Set(["slow-2g", "2g"])

/**
 * The manifest is fetched from the network, so treat it as untrusted: keep the
 * entries that are usable and drop the rest rather than failing the warmup.
 * Returns null only when the payload is not a manifest at all.
 */
export function normalizeAssetManifest(value: unknown): AssetManifest | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as { gitCommit?: unknown, files?: unknown }
  if (!Array.isArray(candidate.files)) {
    return null
  }

  const files: AssetManifestEntry[] = []
  for (const entry of candidate.files) {
    if (!entry || typeof entry !== "object") {
      continue
    }

    const { url, bytes } = entry as { url?: unknown, bytes?: unknown }
    if (
      typeof url !== "string"
      || !url.startsWith("/")
      || typeof bytes !== "number"
      || !Number.isFinite(bytes)
      || bytes < 0
    ) {
      continue
    }

    files.push({ url, bytes })
  }

  return {
    gitCommit: typeof candidate.gitCommit === "string" ? candidate.gitCommit : undefined,
    files,
  }
}

/**
 * Picks the files worth fetching: skip whatever the runtime cache already
 * holds, skip anything oversized, and stop once the session budget is spent.
 * Stopping (rather than skipping ahead to smaller files) keeps the warmup a
 * predictable prefix of the manifest instead of a scattered subset.
 */
export function selectAssetsToWarm(
  files: readonly AssetManifestEntry[],
  cached: ReadonlySet<string>,
  limits: WarmupLimits = { maxFileBytes: WARMUP_MAX_FILE_BYTES, maxTotalBytes: WARMUP_MAX_TOTAL_BYTES },
): string[] {
  const pending: string[] = []
  let budget = limits.maxTotalBytes

  for (const file of files) {
    if (cached.has(file.url) || file.bytes > limits.maxFileBytes) {
      continue
    }
    if (file.bytes > budget) {
      break
    }

    budget -= file.bytes
    pending.push(file.url)
  }

  return pending
}

/** Data saver and 2G connections opt out of speculative downloads entirely. */
export function isConstrainedConnection(connection: ConnectionHint | undefined | null) {
  if (!connection) {
    return false
  }

  return Boolean(
    connection.saveData
    || (connection.effectiveType && CONSTRAINED_EFFECTIVE_TYPES.has(connection.effectiveType)),
  )
}

/**
 * Runs `worker` over `items` with at most `limit` in flight. A failing item is
 * reported and skipped: one unreachable chunk must not abandon the rest of the
 * warmup.
 */
export async function mapWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
  onError?: (item: T, error: unknown) => void,
): Promise<void> {
  const runnerCount = Math.min(Math.max(Math.trunc(limit), 1), items.length)
  if (runnerCount <= 0) {
    return
  }

  let cursor = 0
  const runners = Array.from({ length: runnerCount }, async () => {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      try {
        await worker(item)
      } catch (error) {
        onError?.(item, error)
      }
    }
  })

  await Promise.all(runners)
}
