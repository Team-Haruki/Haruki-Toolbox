import { SEARCH_ENTRY_TYPES, type SearchEntryType, type SearchIndexEntry, type SearchResultEntry } from "./search-index"

/** Entries the viewer opened from the search, newest first, kept per browser. */
export const SEARCH_RECENTS_STORAGE_KEY = "haruki:global-search:recents"
export const SEARCH_RECENTS_LIMIT = 8

/** A stored entry: everything a row needs, with the text it was matched on left empty. */
export type SearchRecentEntry = SearchIndexEntry

export function toSearchRecentEntry(entry: SearchResultEntry): SearchRecentEntry {
  const stored: SearchResultEntry = { ...entry, parts: [] }
  delete stored.viaAlias
  return stored
}

/** Puts `entry` first, drops its older copy and anything past the limit. */
export function pushSearchRecent(
  recents: readonly SearchRecentEntry[],
  entry: SearchResultEntry,
  limit = SEARCH_RECENTS_LIMIT,
): SearchRecentEntry[] {
  return [toSearchRecentEntry(entry), ...recents.filter((item) => item.key !== entry.key)].slice(0, limit)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isTarget(value: unknown): boolean {
  if (typeof value === "string") {
    return value.startsWith("/")
  }
  if (!isRecord(value)) {
    return false
  }
  const hasPlace = (typeof value.path === "string" && value.path.startsWith("/")) || typeof value.name === "string"
  const query = value.query
  const queryOk = query === undefined
    || (isRecord(query) && Object.values(query).every((item) => typeof item === "string"))
  return hasPlace && queryOk
}

/**
 * Reads what `localStorage` gave back. It is only as trustworthy as any
 * stored value: anything that is not a well-formed entry is dropped, so an
 * old or hand-edited value cannot break the dialog.
 */
export function parseSearchRecents(value: unknown, limit = SEARCH_RECENTS_LIMIT): SearchRecentEntry[] {
  if (!Array.isArray(value)) {
    return []
  }
  const recents: SearchRecentEntry[] = []
  const seen = new Set<string>()
  for (const item of value) {
    if (!isRecord(item)) {
      continue
    }
    const { type, id, key, title, to } = item
    if (
      typeof type !== "string"
      || !(SEARCH_ENTRY_TYPES as readonly string[]).includes(type)
      || (typeof id !== "number" && typeof id !== "string")
      || key !== `${type}-${id}`
      || typeof title !== "string"
      || title === ""
      || !isTarget(to)
      || !isRecord(item[type as SearchEntryType])
      || seen.has(key)
    ) {
      continue
    }
    seen.add(key)
    recents.push({
      ...item,
      parts: [],
      releaseAt: typeof item.releaseAt === "number" ? item.releaseAt : null,
    } as unknown as SearchRecentEntry)
    if (recents.length >= limit) {
      break
    }
  }
  return recents
}
