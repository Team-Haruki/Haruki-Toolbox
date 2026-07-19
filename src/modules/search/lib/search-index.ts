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
}

export type SearchMasterInput = {
  musics?: unknown
  cards?: unknown
  events?: unknown
  gameCharacters?: unknown
}

export type SearchAliasMatch = {
  type: SearchEntryType
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
