import {
  buildCatalogCharacterMap,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export type SearchEntryType = "music" | "card" | "event"

export const SEARCH_ENTRY_TYPES: readonly SearchEntryType[] = ["music", "card", "event"]

export const SEARCH_RESULTS_PER_TYPE = 8

export type SearchIndexEntry = {
  type: SearchEntryType
  id: number
  title: string
  subtitle: string
  keywords: string[]
  /** Owning game character id — only present on card entries. */
  characterId?: number
}

/** A result entry as surfaced to the UI; `viaAlias` marks alias-only hits. */
export type SearchResultEntry = SearchIndexEntry & { viaAlias?: boolean }

export type SearchMasterInput = {
  musics?: unknown
  cards?: unknown
  events?: unknown
  gameCharacters?: unknown
}

/**
 * Alias matches may point at a catalog entry directly or at a game character
 * ("character" resolves to that character's card entries at merge time).
 */
export type SearchAliasMatchType = SearchEntryType | "character"

export type SearchAliasMatch = {
  type: SearchAliasMatchType
  id: number
}

/**
 * Plug point for the upcoming public alias API: a provider resolves free-form
 * aliases (community nicknames, abbreviations) to catalog entries. The
 * network-backed implementation will be registered by the alias API when it
 * lands — nothing in this module performs network calls today.
 */
export interface SearchAliasProvider {
  lookup(query: string): Promise<SearchAliasMatch[]>
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim()
}

export function buildSearchIndex(input: SearchMasterInput): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = []

  for (const record of normalizeCatalogRecords(input.musics)) {
    const id = normalizeCatalogNumber(record.id)
    const title = normalizeCatalogString(record.title)
    if (!id || !title) {
      continue
    }

    const pronunciation = normalizeCatalogString(record.pronunciation)
    const composer = normalizeCatalogString(record.composer)
    const arranger = normalizeCatalogString(record.arranger)
    entries.push({
      type: "music",
      id,
      title,
      subtitle: composer || arranger,
      keywords: dedupeKeywords([pronunciation, composer, arranger]),
    })
  }

  const characterMap = buildCatalogCharacterMap(input.gameCharacters)
  for (const record of normalizeCatalogRecords(input.cards)) {
    const id = normalizeCatalogNumber(record.id)
    const prefix = normalizeCatalogString(record.prefix)
    if (!id || !prefix) {
      continue
    }

    const characterId = normalizeCatalogNumber(record.characterId)
    const characterName = characterId ? characterMap.get(characterId)?.name ?? "" : ""
    entries.push({
      type: "card",
      id,
      title: prefix,
      subtitle: characterName,
      keywords: dedupeKeywords([characterName]),
      ...(characterId ? { characterId } : {}),
    })
  }

  for (const record of normalizeCatalogRecords(input.events)) {
    const id = normalizeCatalogNumber(record.id)
    const name = normalizeCatalogString(record.name)
    if (!id || !name) {
      continue
    }

    entries.push({
      type: "event",
      id,
      title: name,
      subtitle: "",
      keywords: [],
    })
  }

  return entries
}

export function searchIndexEntries(
  entries: readonly SearchIndexEntry[],
  query: string,
  perTypeLimit = SEARCH_RESULTS_PER_TYPE,
): SearchIndexEntry[] {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return []
  }

  const prefixMatches = new Map<SearchEntryType, SearchIndexEntry[]>()
  const substringMatches = new Map<SearchEntryType, SearchIndexEntry[]>()
  for (const entry of entries) {
    const haystack = [entry.title, ...entry.keywords]
      .map(normalizeSearchText)
      .filter(Boolean)
    if (haystack.some((part) => part.startsWith(normalizedQuery))) {
      appendMatch(prefixMatches, entry)
    } else if (haystack.some((part) => part.includes(normalizedQuery))) {
      appendMatch(substringMatches, entry)
    }
  }

  const results: SearchIndexEntry[] = []
  for (const type of SEARCH_ENTRY_TYPES) {
    results.push(
      ...[...(prefixMatches.get(type) ?? []), ...(substringMatches.get(type) ?? [])].slice(0, perTypeLimit),
    )
  }

  return results
}

/**
 * Resolves raw alias matches to concrete index entries. Direct matches
 * ("music" | "card" | "event") map by (type, id); "character" matches expand
 * to every card entry owned by that character. Unknown ids are dropped and
 * duplicates are removed while preserving match order.
 */
export function resolveAliasMatches(
  entries: readonly SearchIndexEntry[],
  matches: readonly SearchAliasMatch[],
): SearchIndexEntry[] {
  if (matches.length === 0) {
    return []
  }

  const byKey = new Map<string, SearchIndexEntry>()
  const cardsByCharacter = new Map<number, SearchIndexEntry[]>()
  for (const entry of entries) {
    byKey.set(`${entry.type}-${entry.id}`, entry)
    if (entry.type === "card" && entry.characterId) {
      const bucket = cardsByCharacter.get(entry.characterId)
      if (bucket) {
        bucket.push(entry)
      } else {
        cardsByCharacter.set(entry.characterId, [entry])
      }
    }
  }

  const resolved: SearchIndexEntry[] = []
  const seen = new Set<string>()
  const append = (entry: SearchIndexEntry) => {
    const key = `${entry.type}-${entry.id}`
    if (!seen.has(key)) {
      seen.add(key)
      resolved.push(entry)
    }
  }

  for (const match of matches) {
    if (match.type === "character") {
      for (const card of cardsByCharacter.get(match.id) ?? []) {
        append(card)
      }
    } else {
      const entry = byKey.get(`${match.type}-${match.id}`)
      if (entry) {
        append(entry)
      }
    }
  }

  return resolved
}

/**
 * Merges alias-resolved entries into the local result list. Local results keep
 * their position; alias-only hits (deduped by type + id) are appended to their
 * type group within `perTypeLimit` and flagged with `viaAlias`.
 */
export function mergeAliasResults(
  localResults: readonly SearchIndexEntry[],
  aliasEntries: readonly SearchIndexEntry[],
  perTypeLimit = SEARCH_RESULTS_PER_TYPE,
): SearchResultEntry[] {
  if (aliasEntries.length === 0) {
    return [...localResults]
  }

  const merged: SearchResultEntry[] = []
  for (const type of SEARCH_ENTRY_TYPES) {
    const group: SearchResultEntry[] = localResults.filter((entry) => entry.type === type)
    const seenIds = new Set(group.map((entry) => entry.id))
    for (const entry of aliasEntries) {
      if (entry.type !== type || group.length >= perTypeLimit || seenIds.has(entry.id)) {
        continue
      }

      seenIds.add(entry.id)
      group.push({ ...entry, viaAlias: true })
    }

    merged.push(...group)
  }

  return merged
}

function appendMatch(matches: Map<SearchEntryType, SearchIndexEntry[]>, entry: SearchIndexEntry) {
  const bucket = matches.get(entry.type)
  if (bucket) {
    bucket.push(entry)
  } else {
    matches.set(entry.type, [entry])
  }
}

function dedupeKeywords(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}
