import type { SekaiRegion } from "@/types"

/**
 * Fetches a scenario JSON from "<root>/<region>-assets/<path>", trying the
 * candidate paths in order. Resolves null when none exists (404).
 */
export async function fetchScenarioJson<T>(
  assetRoot: string,
  region: SekaiRegion,
  paths: readonly string[],
  signal?: AbortSignal,
): Promise<T | null> {
  for (const path of paths) {
    const response = await fetch(`${assetRoot}/${region}-assets/${path}`, { signal })
    if (response.status === 404 || response.status === 403) continue
    if (!response.ok) throw new Error(`${region} ${path}: HTTP ${response.status}`)
    return (await response.json()) as T
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
