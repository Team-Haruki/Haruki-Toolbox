import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import { normalizeMusicDifficulty, type MusicDifficulty } from "./music-difficulties"

export type MusicDifficultyStat = {
  playLevel: number | null
  totalNoteCount: number | null
}

export type MusicLibraryEntry = {
  id: number
  title: string
  pronunciation: string
  lyricist: string
  composer: string
  arranger: string
  categories: string[]
  assetbundleName: string
  publishedAt: number | null
  tags: string[]
  difficulties: Partial<Record<MusicDifficulty, MusicDifficultyStat>>
}

export type MusicVocalCharacter = {
  characterType: string
  characterId: number | null
}

export type MusicVocalEntry = {
  id: number
  musicVocalType: string
  caption: string
  seq: number | null
  characters: MusicVocalCharacter[]
}

export type MusicEventLink = {
  eventId: number
  name: string
  startAt: number | null
  aggregateAt: number | null
}

/** The catch-all `all` tag applies to every music, so it is excluded from entry tags. */
const MUSIC_TAG_ALL = "all"

export function buildMusicLibraryEntries(
  rawMusics: unknown,
  rawDifficulties: unknown,
  rawTags: unknown,
): MusicLibraryEntry[] {
  const difficultyMap = buildMusicDifficultyMap(rawDifficulties)
  const tagMap = buildMusicTagMap(rawTags)

  const entries: MusicLibraryEntry[] = []
  for (const record of normalizeCatalogRecords(rawMusics)) {
    const id = normalizeCatalogNumber(record.id)
    if (!id) {
      continue
    }

    entries.push({
      id,
      title: normalizeCatalogString(record.title) || `#${id}`,
      pronunciation: normalizeCatalogString(record.pronunciation),
      lyricist: normalizeCatalogString(record.lyricist),
      composer: normalizeCatalogString(record.composer),
      arranger: normalizeCatalogString(record.arranger),
      categories: normalizeMusicCategories(record.categories),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
      publishedAt: normalizeCatalogNumber(record.publishedAt),
      tags: tagMap.get(id) ?? [],
      difficulties: difficultyMap.get(id) ?? {},
    })
  }

  return entries
}

export function findMusicLibraryEntry(
  entries: readonly MusicLibraryEntry[],
  musicId: number,
): MusicLibraryEntry | null {
  return entries.find((entry) => entry.id === musicId) ?? null
}

/**
 * `categories` is an array of strings in some regions and an array of
 * `{ musicCategoryName }` objects in others; normalize both shapes.
 */
export function normalizeMusicCategories(rawCategories: unknown): string[] {
  if (!Array.isArray(rawCategories)) {
    return []
  }

  const categories: string[] = []
  for (const item of rawCategories) {
    const name = typeof item === "string"
      ? item.trim()
      : normalizeCatalogString((item as Record<string, unknown> | null)?.musicCategoryName)
    if (name && !categories.includes(name)) {
      categories.push(name)
    }
  }

  return categories
}

export function listMusicVocalEntries(rawVocals: unknown, musicId: number): MusicVocalEntry[] {
  const vocals: MusicVocalEntry[] = []
  for (const record of normalizeCatalogRecords(rawVocals)) {
    const id = normalizeCatalogNumber(record.id)
    const vocalMusicId = normalizeCatalogNumber(record.musicId)
    if (!id || vocalMusicId !== musicId) {
      continue
    }

    vocals.push({
      id,
      musicVocalType: normalizeCatalogString(record.musicVocalType),
      caption: normalizeCatalogString(record.caption),
      seq: normalizeCatalogNumber(record.seq),
      characters: normalizeCatalogRecords(record.characters).map((character) => ({
        characterType: normalizeCatalogString(character.characterType),
        characterId: normalizeCatalogNumber(character.characterId),
      })),
    })
  }

  return vocals.sort((a, b) => (a.seq ?? a.id) - (b.seq ?? b.id))
}

export function buildOutsideCharacterNameMap(rawOutsideCharacters: unknown): Map<number, string> {
  const map = new Map<number, string>()
  for (const record of normalizeCatalogRecords(rawOutsideCharacters)) {
    const id = normalizeCatalogNumber(record.id)
    const name = normalizeCatalogString(record.name)
    if (id && name) {
      map.set(id, name)
    }
  }

  return map
}

export function listMusicEventLinks(
  rawEventMusics: unknown,
  rawEvents: unknown,
  musicId: number,
): MusicEventLink[] {
  const eventIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawEventMusics)) {
    const eventId = normalizeCatalogNumber(record.eventId)
    const linkedMusicId = normalizeCatalogNumber(record.musicId)
    if (eventId && linkedMusicId === musicId) {
      eventIds.add(eventId)
    }
  }

  if (eventIds.size === 0) {
    return []
  }

  const links: MusicEventLink[] = []
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const eventId = normalizeCatalogNumber(record.id)
    if (!eventId || !eventIds.has(eventId)) {
      continue
    }

    links.push({
      eventId,
      name: normalizeCatalogString(record.name) || `#${eventId}`,
      startAt: normalizeCatalogNumber(record.startAt),
      aggregateAt: normalizeCatalogNumber(record.aggregateAt),
    })
  }

  return links.sort((a, b) => a.eventId - b.eventId)
}

/** `music_metas` rows are per-difficulty; `music_time` is the same across a music's rows. */
export function findMusicDurationSeconds(rawMusicMetas: unknown, musicId: number): number | null {
  for (const record of normalizeCatalogRecords(rawMusicMetas)) {
    const metaMusicId = normalizeCatalogNumber(record.music_id)
    if (metaMusicId !== musicId) {
      continue
    }

    const musicTime = normalizeCatalogNumber(record.music_time)
    if (musicTime != null && musicTime > 0) {
      return musicTime
    }
  }

  return null
}

export function formatMusicDurationLabel(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) {
    return null
  }

  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainder = totalSeconds % 60
  return `${minutes}:${String(remainder).padStart(2, "0")}`
}

function buildMusicDifficultyMap(
  rawDifficulties: unknown,
): Map<number, Partial<Record<MusicDifficulty, MusicDifficultyStat>>> {
  const map = new Map<number, Partial<Record<MusicDifficulty, MusicDifficultyStat>>>()
  for (const record of normalizeCatalogRecords(rawDifficulties)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const difficulty = normalizeMusicDifficulty(record.musicDifficulty)
    if (!musicId || !difficulty) {
      continue
    }

    const stats = map.get(musicId) ?? {}
    stats[difficulty] = {
      playLevel: normalizeCatalogNumber(record.playLevel),
      totalNoteCount: normalizeCatalogNumber(record.totalNoteCount),
    }
    map.set(musicId, stats)
  }

  return map
}

function buildMusicTagMap(rawTags: unknown): Map<number, string[]> {
  const map = new Map<number, string[]>()
  for (const record of normalizeCatalogRecords(rawTags)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const tag = normalizeCatalogString(record.musicTag)
    if (!musicId || !tag || tag === MUSIC_TAG_ALL) {
      continue
    }

    const tags = map.get(musicId) ?? []
    if (!tags.includes(tag)) {
      tags.push(tag)
    }
    map.set(musicId, tags)
  }

  return map
}
