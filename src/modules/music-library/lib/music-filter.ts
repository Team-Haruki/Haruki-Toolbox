import { matchesCommandSearch } from "@/lib/search-match"
import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import type { EventBoxInfo } from "./event-box"
import type { MusicDifficulty } from "./music-difficulties"
import type { MusicDifficultyStat, MusicLibraryEntry, MusicVocalCharacterSummary } from "./music-data"

export const MUSIC_SORT_KEYS = ["publishedAt", "level", "noteCount", "title"] as const

export type MusicSortKey = (typeof MUSIC_SORT_KEYS)[number]

export type MusicSortDirection = "asc" | "desc"

export const MUSIC_NOTE_COUNT_FILTER_MODES = ["exact", "range"] as const

export type MusicNoteCountFilterMode = (typeof MUSIC_NOTE_COUNT_FILTER_MODES)[number]

export const MUSIC_SORT_FALLBACK_DIFFICULTY: MusicDifficulty = "master"

export const MUSIC_CHARACTER_FILTER_SCOPES = ["any", "box", "vocal", "anotherVocal"] as const

export type MusicCharacterFilterScope = (typeof MUSIC_CHARACTER_FILTER_SCOPES)[number]

export type MusicLibraryFilter = {
  search: string
  difficulty: MusicDifficulty | null
  levelMin: number | null
  levelMax: number | null
  noteCountMode: MusicNoteCountFilterMode
  noteCountExact: number | null
  noteCountMin: number | null
  noteCountMax: number | null
  /** Selected tags; an entry matches when it has any of them (empty = no tag filter). */
  tags: string[]
  /** Selected MV categories; an entry matches when it has any of them (empty = no filter). */
  categories: string[]
  year: number | null
  /** Empty means any; several characters match as a union. */
  characterIds: number[]
  characterScope: MusicCharacterFilterScope
  /** Only songs with an APPEND chart. */
  hasAppend: boolean
}

/** Lookup maps the character filter matches against; missing maps match nothing. */
export type MusicFilterContext = {
  eventBoxes?: ReadonlyMap<number, EventBoxInfo>
  vocalCharacters?: ReadonlyMap<number, MusicVocalCharacterSummary>
  /** Music ids whose community alias matches the current search query. */
  aliasMatchedIds?: ReadonlySet<number>
}

export function createDefaultMusicLibraryFilter(): MusicLibraryFilter {
  return {
    search: "",
    difficulty: null,
    levelMin: null,
    levelMax: null,
    noteCountMode: "exact",
    noteCountExact: null,
    noteCountMin: null,
    noteCountMax: null,
    tags: [],
    categories: [],
    year: null,
    characterIds: [],
    characterScope: "any",
    hasAppend: false,
  }
}

/**
 * Title, pronunciation and `#id` go through the shared command-search matcher
 * (NFKC folding, kana → romaji, pinyin, `#123` / `123` ids); community
 * aliases resolved by the alias API are merged in by id.
 */
export function matchesMusicSearch(
  entry: MusicLibraryEntry,
  search: string,
  aliasMatchedIds?: ReadonlySet<number>,
): boolean {
  const query = search.trim()
  if (!query) {
    return true
  }

  return (aliasMatchedIds?.has(entry.id) ?? false)
    || matchesCommandSearch([`#${entry.id}`, entry.title, entry.pronunciation], query)
}

/** A music counts as unreleased while its publish timestamp is in the future. */
export function isMusicEntryUnreleased(entry: MusicLibraryEntry, nowMs = Date.now()): boolean {
  return isUnreleasedContent(entry.publishedAt, nowMs)
}

export function excludeUnreleasedMusicEntries(
  entries: readonly MusicLibraryEntry[],
  nowMs = Date.now(),
): MusicLibraryEntry[] {
  return entries.filter((entry) => !isMusicEntryUnreleased(entry, nowMs))
}

export function getMusicPublishedYear(publishedAt: number | null): number | null {
  if (publishedAt == null || !Number.isFinite(publishedAt)) {
    return null
  }

  return new Date(publishedAt).getUTCFullYear()
}

export function filterMusicEntries(
  entries: readonly MusicLibraryEntry[],
  filter: MusicLibraryFilter,
  context: MusicFilterContext = {},
): MusicLibraryEntry[] {
  return entries.filter((entry) => {
    if (!matchesMusicSearch(entry, filter.search, context.aliasMatchedIds)) {
      return false
    }

    if (filter.tags.length > 0 && !filter.tags.some((tag) => entry.tags.includes(tag))) {
      return false
    }

    if (filter.categories.length > 0 && !filter.categories.some((category) => entry.categories.includes(category))) {
      return false
    }

    if (filter.hasAppend && entry.difficulties.append == null) {
      return false
    }

    if (!matchesCharacter(entry, filter, context)) {
      return false
    }

    if (filter.year != null && getMusicPublishedYear(entry.publishedAt) !== filter.year) {
      return false
    }

    const candidateStats = resolveCandidateStats(entry, filter.difficulty)
    if (filter.difficulty && candidateStats.length === 0) {
      return false
    }

    if (!matchesLevelRange(candidateStats, filter.levelMin, filter.levelMax)) {
      return false
    }

    return matchesNoteCount(candidateStats, filter)
  })
}

export function sortMusicEntries(
  entries: readonly MusicLibraryEntry[],
  sortKey: MusicSortKey,
  direction: MusicSortDirection,
  difficulty: MusicDifficulty | null,
): MusicLibraryEntry[] {
  const directionFactor = direction === "desc" ? -1 : 1
  const sortDifficulty = difficulty ?? MUSIC_SORT_FALLBACK_DIFFICULTY

  return [...entries].sort((a, b) => {
    if (sortKey === "title") {
      return a.title.localeCompare(b.title) * directionFactor || a.id - b.id
    }

    const valueA = resolveSortValue(a, sortKey, sortDifficulty)
    const valueB = resolveSortValue(b, sortKey, sortDifficulty)
    if (valueA == null && valueB == null) {
      return a.id - b.id
    }
    if (valueA == null) {
      return 1
    }
    if (valueB == null) {
      return -1
    }

    return (valueA - valueB) * directionFactor || a.id - b.id
  })
}

/** Known tags in their canonical order, followed by any extra tags found in the data. */
export function listMusicTagOptions(
  entries: readonly MusicLibraryEntry[],
  knownTags: readonly string[] = [],
): string[] {
  const tags = new Set<string>()
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tags.add(tag)
    }
  }

  const extraTags = [...tags]
    .filter((tag) => !knownTags.includes(tag))
    .sort((left, right) => left.localeCompare(right))
  return [...knownTags, ...extraTags]
}

/** Known MV categories in canonical order (only those present), then extras found in the data. */
export function listMusicCategoryOptions(
  entries: readonly MusicLibraryEntry[],
  knownCategories: readonly string[] = [],
): string[] {
  const categories = new Set<string>()
  for (const entry of entries) {
    for (const category of entry.categories) {
      categories.add(category)
    }
  }

  const known = knownCategories.filter((category) => categories.has(category))
  const extras = [...categories]
    .filter((category) => !knownCategories.includes(category))
    .sort((left, right) => left.localeCompare(right))
  return [...known, ...extras]
}

export function listMusicYearOptions(entries: readonly MusicLibraryEntry[]): number[] {
  const years = new Set<number>()
  for (const entry of entries) {
    const year = getMusicPublishedYear(entry.publishedAt)
    if (year != null) {
      years.add(year)
    }
  }

  return [...years].sort((a, b) => b - a)
}

/** Lowest and highest `playLevel` across every chart (slider bounds); null when no level is known. */
export function resolveMusicLevelBounds(entries: readonly MusicLibraryEntry[]): { min: number; max: number } | null {
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  for (const entry of entries) {
    for (const stat of Object.values(entry.difficulties)) {
      const level = stat?.playLevel
      if (level == null || !Number.isFinite(level)) {
        continue
      }
      min = Math.min(min, level)
      max = Math.max(max, level)
    }
  }
  return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null
}

function matchesCharacter(
  entry: MusicLibraryEntry,
  filter: MusicLibraryFilter,
  context: MusicFilterContext,
): boolean {
  const ids = filter.characterIds
  if (ids.length === 0) {
    return true
  }

  // A union, like every other multi-select filter: the scope narrows *how* a
  // character has to relate to the track, not how many must.
  return ids.some((characterId) => {
    const boxMatch = context.eventBoxes?.get(entry.id)?.characterId === characterId
    const summary = context.vocalCharacters?.get(entry.id)
    const vocalMatch = summary?.vocalCharacterIds.has(characterId) ?? false
    const anotherVocalMatch = summary?.anotherVocalCharacterIds.has(characterId) ?? false

    switch (filter.characterScope) {
      case "box":
        return boxMatch
      case "vocal":
        return vocalMatch
      case "anotherVocal":
        return anotherVocalMatch
      default:
        return boxMatch || vocalMatch || anotherVocalMatch
    }
  })
}

function resolveCandidateStats(
  entry: MusicLibraryEntry,
  difficulty: MusicDifficulty | null,
): MusicDifficultyStat[] {
  if (difficulty) {
    const stat = entry.difficulties[difficulty]
    return stat ? [stat] : []
  }

  return Object.values(entry.difficulties).filter((stat): stat is MusicDifficultyStat => stat != null)
}

function matchesLevelRange(
  candidateStats: readonly MusicDifficultyStat[],
  levelMin: number | null,
  levelMax: number | null,
): boolean {
  if (levelMin == null && levelMax == null) {
    return true
  }

  return candidateStats.some((stat) => {
    if (stat.playLevel == null) {
      return false
    }

    return (levelMin == null || stat.playLevel >= levelMin)
      && (levelMax == null || stat.playLevel <= levelMax)
  })
}

function matchesNoteCount(
  candidateStats: readonly MusicDifficultyStat[],
  filter: MusicLibraryFilter,
): boolean {
  if (filter.noteCountMode === "exact") {
    if (filter.noteCountExact == null) {
      return true
    }

    return candidateStats.some((stat) => stat.totalNoteCount === filter.noteCountExact)
  }

  if (filter.noteCountMin == null && filter.noteCountMax == null) {
    return true
  }

  return candidateStats.some((stat) => {
    if (stat.totalNoteCount == null) {
      return false
    }

    return (filter.noteCountMin == null || stat.totalNoteCount >= filter.noteCountMin)
      && (filter.noteCountMax == null || stat.totalNoteCount <= filter.noteCountMax)
  })
}

function resolveSortValue(
  entry: MusicLibraryEntry,
  sortKey: Exclude<MusicSortKey, "title">,
  difficulty: MusicDifficulty,
): number | null {
  if (sortKey === "publishedAt") {
    return entry.publishedAt
  }

  const stat = entry.difficulties[difficulty]
  if (!stat) {
    return null
  }

  return sortKey === "level" ? stat.playLevel : stat.totalNoteCount
}
