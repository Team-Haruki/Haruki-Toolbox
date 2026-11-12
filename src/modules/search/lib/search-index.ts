import { buildCommandSearchEntries, matchesCommandSearchEntries } from "@/lib/search-match"

/**
 * The global search index: what can be found, how a query ranks it, and how
 * the hits are grouped. Pure — the composable feeds it the catalog indexes
 * the list pages already build, so nothing here reads master files.
 */

export const SEARCH_ENTRY_TYPES = ["page", "character", "music", "card", "event", "gacha", "story"] as const

export type SearchEntryType = (typeof SEARCH_ENTRY_TYPES)[number]

export type SearchScope = "all" | SearchEntryType

export const SEARCH_SCOPES: readonly SearchScope[] = ["all", ...SEARCH_ENTRY_TYPES]

/** Rows per type while every type is listed together. */
export const SEARCH_RESULTS_PER_TYPE = 5
/** Rows when one type has the list to itself. */
export const SEARCH_RESULTS_SCOPED = 40
/** Rows of a type shown before anything is typed. */
export const SEARCH_BROWSE_LIMIT = 12

/** A route the entry opens; plain data so a recent entry can be stored. */
export type SearchEntryTarget =
  | string
  | { path: string; query?: Record<string, string> }
  | { name: string; query?: Record<string, string> }

type SearchEntryBase = {
  /** `${type}-${id}`: unique in the index. */
  key: string
  title: string
  /** Text the query is matched against besides the title. */
  parts: string[]
  /** When the content goes live (ms); orders hits newest first and hides unreleased ones. */
  releaseAt: number | null
  to: SearchEntryTarget
}

export type SearchMusicEntry = SearchEntryBase & {
  type: "music"
  id: number
  music: {
    composer: string
    assetbundleName: string
    /** Play level per difficulty, for the ones the song has. */
    levels: Record<string, number>
  }
}

export type SearchCardEntry = SearchEntryBase & {
  type: "card"
  id: number
  card: {
    characterId: number | null
    characterName: string
    rarity: string
    attr: string
    assetbundleName: string
    trainedByDefault: boolean
  }
}

export type SearchEventEntry = SearchEntryBase & {
  type: "event"
  id: number
  event: {
    eventType: string | null
    assetbundleName: string | null
    startAt: number | null
    aggregateAt: number | null
  }
}

export type SearchGachaEntry = SearchEntryBase & {
  type: "gacha"
  id: number
  gacha: {
    seq: number | null
    assetbundleName: string
    startAt: number | null
    endAt: number | null
    /** A rerun's original gacha, whose banner it reuses. */
    aliasId: number | null
  }
}

export type SearchCharacterEntry = SearchEntryBase & {
  type: "character"
  id: number
  character: {
    unit: string | null
    iconUrl: string
    cardCount: number
  }
}

export type SearchStoryEntry = SearchEntryBase & {
  type: "story"
  /** The series key, e.g. `event:150`. */
  id: string
  story: {
    kind: string
    episodeCount: number
    /** Asset paths inside `jp-assets/`. */
    logo: string | null
    thumb: string | null
  }
}

export type SearchPageEntry = SearchEntryBase & {
  type: "page"
  /** The route path. */
  id: string
  page: {
    path: string
    /** The sidebar section the page sits under, when it has one. */
    section: string
  }
}

export type SearchIndexEntry =
  | SearchMusicEntry
  | SearchCardEntry
  | SearchEventEntry
  | SearchGachaEntry
  | SearchCharacterEntry
  | SearchStoryEntry
  | SearchPageEntry

/** A hit as shown: `viaAlias` marks one found only through a community alias. */
export type SearchResultEntry = SearchIndexEntry & { viaAlias?: boolean }

export type SearchResultGroup = {
  type: SearchEntryType
  items: SearchResultEntry[]
  /** Every hit of this type, of which `items` is the visible part. */
  total: number
}

export type SearchResults = {
  groups: SearchResultGroup[]
  /** Hits per type whatever the scope, for the scope switcher. */
  counts: Record<SearchEntryType, number>
  total: number
}

/**
 * An alias resolves to a catalog entry directly, or to a game character
 * (which also brings that character's cards).
 */
export type SearchAliasMatchType = "music" | "card" | "event" | "character"

export type SearchAliasMatch = {
  type: SearchAliasMatchType
  id: number
}

/** Resolves free-form community aliases (nicknames, abbreviations) to catalog entries. */
export interface SearchAliasProvider {
  lookup(query: string): Promise<SearchAliasMatch[]>
}

export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase().trim()
}

function entryKey(type: SearchEntryType, id: number | string): string {
  return `${type}-${id}`
}

function compact(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value !== ""))]
}

// ---------------------------------------------------------------------------
// Builders: one per source, each taking only the fields it reads.
// ---------------------------------------------------------------------------

export type SearchMusicSource = {
  id: number
  title: string
  pronunciation: string
  composer: string
  arranger: string
  lyricist: string
  assetbundleName: string
  publishedAt: number | null
  difficulties: Record<string, { playLevel: number | null } | undefined>
}

export function buildMusicSearchEntries(musics: readonly SearchMusicSource[]): SearchMusicEntry[] {
  return musics.map((music) => {
    const levels: Record<string, number> = {}
    for (const [difficulty, stat] of Object.entries(music.difficulties)) {
      if (stat?.playLevel != null) {
        levels[difficulty] = stat.playLevel
      }
    }
    return {
      type: "music",
      id: music.id,
      key: entryKey("music", music.id),
      title: music.title,
      parts: compact([music.pronunciation, music.composer, music.arranger, music.lyricist]),
      releaseAt: music.publishedAt,
      to: `/music/${music.id}`,
      music: {
        composer: music.composer || music.arranger,
        assetbundleName: music.assetbundleName,
        levels,
      },
    }
  })
}

export type SearchCardSource = {
  id: number
  characterId: number | null
  cardRarityType: string
  attr: string
  prefix: string | null
  assetbundleName: string
  releaseAt: number | null
  skillName?: string | null
  trainedByDefault?: boolean
}

export function buildCardSearchEntries(
  cards: readonly SearchCardSource[],
  characterNames: ReadonlyMap<number, string>,
): SearchCardEntry[] {
  const entries: SearchCardEntry[] = []
  for (const card of cards) {
    if (!card.prefix) {
      continue
    }
    const characterName = card.characterId != null ? characterNames.get(card.characterId) ?? "" : ""
    entries.push({
      type: "card",
      id: card.id,
      key: entryKey("card", card.id),
      title: card.prefix,
      parts: compact([characterName, card.skillName]),
      releaseAt: card.releaseAt,
      to: `/cards/${card.id}`,
      card: {
        characterId: card.characterId,
        characterName,
        rarity: card.cardRarityType,
        attr: card.attr,
        assetbundleName: card.assetbundleName,
        trainedByDefault: card.trainedByDefault === true,
      },
    })
  }
  return entries
}

export type SearchEventSource = {
  id: number
  name: string
  eventType: string | null
  assetbundleName: string | null
  startAt: number | null
  aggregateAt: number | null
}

export function buildEventSearchEntries(events: readonly SearchEventSource[]): SearchEventEntry[] {
  return events.map((event) => ({
    type: "event",
    id: event.id,
    key: entryKey("event", event.id),
    title: event.name,
    parts: [],
    releaseAt: event.startAt,
    to: `/events/${event.id}`,
    event: {
      eventType: event.eventType,
      assetbundleName: event.assetbundleName,
      startAt: event.startAt,
      aggregateAt: event.aggregateAt,
    },
  }))
}

export type SearchGachaSource = {
  id: number
  name: string
  seq: number | null
  assetbundleName: string
  startAt: number | null
  endAt: number | null
}

export function buildGachaSearchEntries(
  gachas: readonly SearchGachaSource[],
  bannerAliasMap: ReadonlyMap<number, number> = new Map(),
): SearchGachaEntry[] {
  return gachas.map((gacha) => ({
    type: "gacha",
    id: gacha.id,
    key: entryKey("gacha", gacha.id),
    title: gacha.name,
    parts: [],
    releaseAt: gacha.startAt,
    to: `/gachas/${gacha.id}`,
    gacha: {
      seq: gacha.seq,
      assetbundleName: gacha.assetbundleName,
      startAt: gacha.startAt,
      endAt: gacha.endAt,
      aliasId: bannerAliasMap.get(gacha.id) ?? null,
    },
  }))
}

export type SearchCharacterSource = {
  id: number
  name: string
  unit: string | null
  iconUrl: string
}

/** A character opens the card list filtered to that character. */
export function buildCharacterSearchEntries(
  characters: readonly SearchCharacterSource[],
  cardCounts: ReadonlyMap<number, number> = new Map(),
): SearchCharacterEntry[] {
  return characters.map((character) => ({
    type: "character",
    id: character.id,
    key: entryKey("character", character.id),
    title: character.name,
    parts: [],
    releaseAt: null,
    to: { path: "/cards", query: { chars: String(character.id) } },
    character: {
      unit: character.unit,
      iconUrl: character.iconUrl,
      cardCount: cardCounts.get(character.id) ?? 0,
    },
  }))
}

export type SearchStorySource = {
  key: string
  kind: string
  title: string
  at?: number
  logo?: string
  thumb?: string
  episodes: readonly { sid: string; thumb?: string }[]
}

/** A story series opens the player on its first episode. */
export function buildStorySearchEntries(series: readonly SearchStorySource[]): SearchStoryEntry[] {
  const entries: SearchStoryEntry[] = []
  for (const item of series) {
    const first = item.episodes[0]
    if (!first || !item.title) {
      continue
    }
    entries.push({
      type: "story",
      id: item.key,
      key: entryKey("story", item.key),
      title: item.title,
      parts: [],
      releaseAt: item.at ?? null,
      to: { name: "story.player", query: { scenario: first.sid } },
      story: {
        kind: item.kind,
        episodeCount: item.episodes.length,
        logo: item.logo ?? null,
        thumb: item.thumb ?? first.thumb ?? null,
      },
    })
  }
  return entries
}

export type SearchPageSource = {
  path: string
  title: string
  /** The sidebar section the page sits under; shown beside it and searchable. */
  section?: string | null
}

export function buildPageSearchEntries(pages: readonly SearchPageSource[]): SearchPageEntry[] {
  const entries: SearchPageEntry[] = []
  const seen = new Set<string>()
  for (const page of pages) {
    if (!page.title || seen.has(page.path)) {
      continue
    }
    seen.add(page.path)
    entries.push({
      type: "page",
      id: page.path,
      key: entryKey("page", page.path),
      title: page.title,
      // The path's own words ("deck-recommend") find a page whatever the interface language.
      parts: compact([page.section, page.path.replace(/[/_-]+/g, " ").trim()]),
      releaseAt: null,
      to: page.path,
      page: { path: page.path, section: page.section ?? "" },
    })
  }
  return entries
}

// ---------------------------------------------------------------------------
// Searching
// ---------------------------------------------------------------------------

const HAN_PATTERN = /\p{Script=Han}/u

/** `225`, `#225`, `id225`, `no.225`: a query that names a record by its id. */
const ID_QUERY_PATTERN = /^(?:#|id|no\.?)?\s*(\d{1,9})$/i

export function parseSearchIdQuery(query: string): number | null {
  const match = ID_QUERY_PATTERN.exec(normalizeSearchText(query))
  return match ? Number(match[1]) : null
}

/**
 * How well an entry answers the query; lower is better, null is no match.
 * 0 the id itself, 1 the exact title, 2 the title's start, 3 inside the
 * title, 4 anywhere else (other fields, romaji, pinyin, several words).
 */
export const SEARCH_RANK_ALIAS = 5

/**
 * The index plus each entry's searchable variants, built on first use and
 * kept until `invalidate()` (the pinyin dictionary arriving changes them).
 */
export type SearchIndex = {
  readonly entries: readonly SearchIndexEntry[]
  readonly byKey: ReadonlyMap<string, SearchIndexEntry>
  haystackOf(entry: SearchIndexEntry): readonly string[]
  invalidate(): void
}

export function createSearchIndex(entries: readonly SearchIndexEntry[]): SearchIndex {
  const byKey = new Map<string, SearchIndexEntry>()
  for (const entry of entries) {
    byKey.set(entry.key, entry)
  }
  let haystacks = new Map<string, readonly string[]>()
  return {
    entries,
    byKey,
    haystackOf(entry) {
      let haystack = haystacks.get(entry.key)
      if (!haystack) {
        haystack = buildCommandSearchEntries([entry.title, ...entry.parts])
        haystacks.set(entry.key, haystack)
      }
      return haystack
    },
    invalidate() {
      haystacks = new Map()
    },
  }
}

function rankEntry(
  index: SearchIndex,
  entry: SearchIndexEntry,
  query: string,
  normalizedQuery: string,
  idQuery: number | null,
): number | null {
  if (idQuery != null && typeof entry.id === "number" && entry.id === idQuery) {
    return 0
  }
  const title = normalizeSearchText(entry.title)
  if (title === normalizedQuery) {
    return 1
  }
  if (title.startsWith(normalizedQuery)) {
    return 2
  }
  if (title.includes(normalizedQuery)) {
    return 3
  }
  const haystack = index.haystackOf(entry)
  if (HAN_PATTERN.test(normalizedQuery)) {
    // A query written in Han characters is matched as written. Run through
    // the shared matcher it would also be reduced to its pinyin initials
    // ("初音" → "cy"), which then turn up inside unrelated titles.
    const words = normalizedQuery.split(/\s+/)
    return words.every((word) => haystack.some((part) => part.includes(word))) ? 4 : null
  }
  return matchesCommandSearchEntries(haystack, query) ? 4 : null
}

type RankedEntry = { entry: SearchResultEntry; rank: number; order: number }

/** Better rank first; then newest first; then the index order (ids ascending, pages in menu order). */
function compareRanked(a: RankedEntry, b: RankedEntry): number {
  if (a.rank !== b.rank) {
    return a.rank - b.rank
  }
  const aAt = a.entry.releaseAt
  const bAt = b.entry.releaseAt
  if (aAt !== bAt) {
    if (aAt == null) return 1
    if (bAt == null) return -1
    return bAt - aAt
  }
  return a.order - b.order
}

function emptyCounts(): Record<SearchEntryType, number> {
  return { page: 0, character: 0, music: 0, card: 0, event: 0, gacha: 0, story: 0 }
}

export type SearchOptions = {
  scope?: SearchScope
  /** Entries a community alias resolved to; they rank after every text match. */
  aliasEntries?: readonly SearchIndexEntry[]
  /** Drops an entry from the results (unreleased content the viewer has hidden). */
  exclude?: (entry: SearchIndexEntry) => boolean
  perTypeLimit?: number
  scopedLimit?: number
}

export function searchEntries(index: SearchIndex, query: string, options: SearchOptions = {}): SearchResults {
  const scope = options.scope ?? "all"
  const counts = emptyCounts()
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return { groups: [], counts, total: 0 }
  }

  const idQuery = parseSearchIdQuery(query)
  const ranked = new Map<SearchEntryType, RankedEntry[]>()
  const matched = new Set<string>()
  const push = (entry: SearchResultEntry, rank: number, order: number) => {
    const bucket = ranked.get(entry.type)
    if (bucket) {
      bucket.push({ entry, rank, order })
    } else {
      ranked.set(entry.type, [{ entry, rank, order }])
    }
    matched.add(entry.key)
    counts[entry.type] += 1
  }

  index.entries.forEach((entry, order) => {
    if (options.exclude?.(entry)) {
      return
    }
    const rank = rankEntry(index, entry, query, normalizedQuery, idQuery)
    if (rank != null) {
      push(entry, rank, order)
    }
  })

  ;(options.aliasEntries ?? []).forEach((entry, order) => {
    if (matched.has(entry.key) || options.exclude?.(entry)) {
      return
    }
    push({ ...entry, viaAlias: true }, SEARCH_RANK_ALIAS, order)
  })

  const groups: SearchResultGroup[] = []
  let total = 0
  for (const type of SEARCH_ENTRY_TYPES) {
    const bucket = ranked.get(type)
    if (!bucket) {
      continue
    }
    total += bucket.length
    if (scope !== "all" && scope !== type) {
      continue
    }
    bucket.sort(compareRanked)
    const limit = scope === "all"
      ? options.perTypeLimit ?? SEARCH_RESULTS_PER_TYPE
      : options.scopedLimit ?? SEARCH_RESULTS_SCOPED
    groups.push({ type, items: bucket.slice(0, limit).map((item) => item.entry), total: bucket.length })
  }

  return { groups, counts, total }
}

/**
 * What a scope shows before anything is typed: every page or character, or
 * the newest of a dated type.
 */
export function browseEntries(
  index: SearchIndex,
  type: SearchEntryType,
  options: Pick<SearchOptions, "exclude"> & { limit?: number } = {},
): SearchResultGroup {
  const all = index.entries.filter((entry) => entry.type === type && !options.exclude?.(entry))
  const dated = all.some((entry) => entry.releaseAt != null)
  const ordered = dated
    ? all
        .map((entry, order) => ({ entry, rank: 0, order }))
        .sort(compareRanked)
        .map((item) => item.entry)
    : all
  const limit = dated ? options.limit ?? SEARCH_BROWSE_LIMIT : ordered.length
  return { type, items: ordered.slice(0, limit), total: ordered.length }
}

/**
 * Turns alias matches into index entries: a direct match by (type, id); a
 * character as itself followed by its cards, newest first. Unknown ids are
 * dropped and duplicates removed, keeping the match order.
 */
export function resolveAliasMatches(
  index: SearchIndex,
  matches: readonly SearchAliasMatch[],
): SearchIndexEntry[] {
  if (matches.length === 0) {
    return []
  }

  let cardsByCharacter: Map<number, SearchCardEntry[]> | null = null
  const cardsOf = (characterId: number) => {
    if (!cardsByCharacter) {
      cardsByCharacter = new Map()
      for (const entry of index.entries) {
        if (entry.type !== "card" || entry.card.characterId == null) {
          continue
        }
        const cards = cardsByCharacter.get(entry.card.characterId)
        if (cards) {
          cards.push(entry)
        } else {
          cardsByCharacter.set(entry.card.characterId, [entry])
        }
      }
    }
    return cardsByCharacter.get(characterId) ?? []
  }

  const resolved: SearchIndexEntry[] = []
  const seen = new Set<string>()
  const add = (entry: SearchIndexEntry | undefined) => {
    if (entry && !seen.has(entry.key)) {
      seen.add(entry.key)
      resolved.push(entry)
    }
  }

  for (const match of matches) {
    add(index.byKey.get(entryKey(match.type, match.id)))
    if (match.type === "character") {
      for (const card of cardsOf(match.id)) {
        add(card)
      }
    }
  }

  return resolved
}

/** The list page that shows every hit of a type for a query, when the type has one. */
const LIST_PATHS: Partial<Record<SearchEntryType, string>> = {
  music: "/music",
  card: "/cards",
  event: "/events",
  gacha: "/gachas",
}

export function resolveSearchListTarget(type: SearchEntryType, query: string): SearchEntryTarget | null {
  const path = LIST_PATHS[type]
  const q = query.trim()
  return path && q ? { path, query: { q } } : null
}
