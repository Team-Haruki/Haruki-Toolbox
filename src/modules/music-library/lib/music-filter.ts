import { isUnreleasedContent } from "@/shared/sekai/unreleased"
import type { MusicDifficulty } from "./music-difficulties"
import type { MusicDifficultyStat, MusicLibraryEntry } from "./music-data"

export const MUSIC_SORT_KEYS = ["publishedAt", "level", "noteCount", "title"] as const

export type MusicSortKey = (typeof MUSIC_SORT_KEYS)[number]

export type MusicSortDirection = "asc" | "desc"

export const MUSIC_NOTE_COUNT_FILTER_MODES = ["exact", "range"] as const

export type MusicNoteCountFilterMode = (typeof MUSIC_NOTE_COUNT_FILTER_MODES)[number]

export const MUSIC_SORT_FALLBACK_DIFFICULTY: MusicDifficulty = "master"

export type MusicLibraryFilter = {
  search: string
  difficulty: MusicDifficulty | null
  levelMin: number | null
  levelMax: number | null
  noteCountMode: MusicNoteCountFilterMode
  noteCountExact: number | null
  noteCountMin: number | null
  noteCountMax: number | null
  tag: string | null
  year: number | null
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
    tag: null,
    year: null,
  }
}

export function matchesMusicSearch(entry: MusicLibraryEntry, search: string): boolean {
  const query = search.trim().toLowerCase()
  if (!query) {
    return true
  }

  return entry.title.toLowerCase().includes(query)
    || entry.pronunciation.toLowerCase().includes(query)
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
): MusicLibraryEntry[] {
  return entries.filter((entry) => {
    if (!matchesMusicSearch(entry, filter.search)) {
      return false
    }

    if (filter.tag && !entry.tags.includes(filter.tag)) {
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

export function listMusicTagOptions(entries: readonly MusicLibraryEntry[]): string[] {
  const tags = new Set<string>()
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tags.add(tag)
    }
  }

  return [...tags].sort()
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
