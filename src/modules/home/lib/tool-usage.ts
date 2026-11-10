/**
 * Per-browser record of which tools the visitor opens, so the home page can
 * put the ones they actually use first. Nothing leaves the device.
 */

export const TOOL_USAGE_STORAGE_KEY = "haruki-toolbox:tool-usage:v1"

/** A visit loses half its weight after this long, so old habits fade. */
const HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000

export interface ToolUsageEntry {
  count: number
  lastUsedAt: number
}

export type ToolUsage = Record<string, ToolUsageEntry>

type UsageStorage = Pick<Storage, "getItem" | "setItem">

function resolveStorage(storage?: UsageStorage | null): UsageStorage | null {
  if (storage !== undefined) {
    return storage
  }
  try {
    return typeof localStorage === "undefined" ? null : localStorage
  } catch {
    return null
  }
}

/** The tool a path belongs to: the longest tool URL that is the path or a parent segment of it. */
export function matchToolUrl(path: string, toolUrls: readonly string[]): string | null {
  let best: string | null = null
  for (const url of toolUrls) {
    if (path !== url && !path.startsWith(`${url}/`)) {
      continue
    }
    if (best === null || url.length > best.length) {
      best = url
    }
  }
  return best
}

export function readToolUsage(storage?: UsageStorage | null): ToolUsage {
  const target = resolveStorage(storage)
  if (!target) {
    return {}
  }
  try {
    const parsed: unknown = JSON.parse(target.getItem(TOOL_USAGE_STORAGE_KEY) ?? "{}")
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {}
    }
    const usage: ToolUsage = {}
    for (const [url, entry] of Object.entries(parsed as Record<string, unknown>)) {
      const count = (entry as ToolUsageEntry | null)?.count
      const lastUsedAt = (entry as ToolUsageEntry | null)?.lastUsedAt
      if (typeof count === "number" && count > 0 && typeof lastUsedAt === "number") {
        usage[url] = { count, lastUsedAt }
      }
    }
    return usage
  } catch {
    return {}
  }
}

export function addToolVisit(usage: ToolUsage, url: string, now: number): ToolUsage {
  return { ...usage, [url]: { count: (usage[url]?.count ?? 0) + 1, lastUsedAt: now } }
}

/** Counts a visit to the tool behind `path`; paths outside the tool list are ignored. */
export function recordToolVisit(
  path: string,
  toolUrls: readonly string[],
  now: number = Date.now(),
  storage?: UsageStorage | null
): void {
  const url = matchToolUrl(path, toolUrls)
  const target = resolveStorage(storage)
  if (!url || !target) {
    return
  }
  try {
    target.setItem(TOOL_USAGE_STORAGE_KEY, JSON.stringify(addToolVisit(readToolUsage(target), url, now)))
  } catch {
    // Storage full or blocked: the home page just keeps its default order.
  }
}

/** Tool URLs ordered by recency-weighted use, most used first; unknown URLs are dropped. */
export function rankFrequentTools(
  usage: ToolUsage,
  toolUrls: readonly string[],
  limit: number,
  now: number = Date.now()
): string[] {
  const known = new Set(toolUrls)
  return Object.entries(usage)
    .filter(([url]) => known.has(url))
    .map(([url, entry]) => ({
      url,
      score: entry.count * 0.5 ** (Math.max(0, now - entry.lastUsedAt) / HALF_LIFE_MS),
      lastUsedAt: entry.lastUsedAt,
    }))
    .sort((left, right) => right.score - left.score || right.lastUsedAt - left.lastUsedAt)
    .slice(0, limit)
    .map((entry) => entry.url)
}
