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
  /** Leading silence (seconds) baked into the long audio assets. */
  fillerSec: number | null
  /** `releaseConditions.id` describing how the song is unlocked (null when absent). */
  releaseConditionId: number | null
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
  assetbundleName: string
  characters: MusicVocalCharacter[]
}

/** The catch-all `all` tag applies to every music, so it is excluded from entry tags. */
const MUSIC_TAG_ALL = "all"

/** Synthetic tag for songs linked to a World Link (world_bloom) event. */
export const MUSIC_TAG_WORLD_LINK = "world_link"

/** Synthetic tag for songs that are a character's box event song. */
export const MUSIC_TAG_EVENT_BOX = "event_box"

const MUSIC_VOCAL_TYPE_ANOTHER_VOCAL = "another_vocal"
const MUSIC_VOCAL_CHARACTER_TYPE_GAME = "game_character"

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
      fillerSec: normalizeCatalogNumber(record.fillerSec),
      releaseConditionId: normalizeCatalogNumber(record.releaseConditionId),
      tags: tagMap.get(id) ?? [],
      difficulties: difficultyMap.get(id) ?? {},
    })
  }

  return entries
}

/** Appends a synthetic tag to the entries whose id is in `musicIds`. */
export function applyMusicTagByIds(
  entries: readonly MusicLibraryEntry[],
  musicIds: { has(musicId: number): boolean },
  tag: string,
): MusicLibraryEntry[] {
  return entries.map((entry) =>
    musicIds.has(entry.id) && !entry.tags.includes(tag)
      ? { ...entry, tags: [...entry.tags, tag] }
      : entry,
  )
}

export type MusicVocalCharacterSummary = {
  /** Game character ids singing any non-Another-Vocal version. */
  vocalCharacterIds: Set<number>
  /** Game character ids singing an Another Vocal version. */
  anotherVocalCharacterIds: Set<number>
}

function getGameCharacterId(character: Record<string, unknown>): number | null {
  if (normalizeCatalogString(character.characterType) !== MUSIC_VOCAL_CHARACTER_TYPE_GAME) {
    return null
  }
  return normalizeCatalogNumber(character.characterId)
}

function getOrCreateVocalCharacterSummary(
  map: Map<number, MusicVocalCharacterSummary>,
  musicId: number,
): MusicVocalCharacterSummary {
  const existing = map.get(musicId)
  if (existing) {
    return existing
  }

  const summary = { vocalCharacterIds: new Set<number>(), anotherVocalCharacterIds: new Set<number>() }
  map.set(musicId, summary)
  return summary
}

export function buildMusicVocalCharacterMap(
  rawVocals: unknown,
): Map<number, MusicVocalCharacterSummary> {
  const map = new Map<number, MusicVocalCharacterSummary>()
  for (const record of normalizeCatalogRecords(rawVocals)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    if (!musicId) {
      continue
    }

    const isAnotherVocal =
      normalizeCatalogString(record.musicVocalType) === MUSIC_VOCAL_TYPE_ANOTHER_VOCAL
    for (const character of normalizeCatalogRecords(record.characters)) {
      const characterId = getGameCharacterId(character)
      if (!characterId) {
        continue
      }

      const summary = getOrCreateVocalCharacterSummary(map, musicId)
      ;(isAnotherVocal ? summary.anotherVocalCharacterIds : summary.vocalCharacterIds).add(characterId)
    }
  }

  return map
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

/** One `musicVocals` row, or null when it has no usable id. */
function normalizeMusicVocalEntry(record: Record<string, unknown>): MusicVocalEntry | null {
  const id = normalizeCatalogNumber(record.id)
  if (!id) {
    return null
  }

  return {
    id,
    musicVocalType: normalizeCatalogString(record.musicVocalType),
    caption: normalizeCatalogString(record.caption),
    seq: normalizeCatalogNumber(record.seq),
    assetbundleName: normalizeCatalogString(record.assetbundleName),
    characters: normalizeCatalogRecords(record.characters).map((character) => ({
      characterType: normalizeCatalogString(character.characterType),
      characterId: normalizeCatalogNumber(character.characterId),
    })),
  }
}

/** Every vocal version grouped by music id, each group in `seq` order. */
export function buildMusicVocalsByMusic(rawVocals: unknown): Map<number, MusicVocalEntry[]> {
  const map = new Map<number, MusicVocalEntry[]>()
  for (const record of normalizeCatalogRecords(rawVocals)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const vocal = musicId ? normalizeMusicVocalEntry(record) : null
    if (!musicId || !vocal) {
      continue
    }
    const group = map.get(musicId)
    if (group) {
      group.push(vocal)
    } else {
      map.set(musicId, [vocal])
    }
  }
  for (const group of map.values()) {
    group.sort((a, b) => (a.seq ?? a.id) - (b.seq ?? b.id))
  }
  return map
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

/** musicId → `music_time` seconds, from the per-difficulty `music_metas` rows. */
export function buildMusicDurationMap(rawMusicMetas: unknown): Map<number, number> {
  const map = new Map<number, number>()
  for (const record of normalizeCatalogRecords(rawMusicMetas)) {
    const musicId = normalizeCatalogNumber(record.music_id)
    const musicTime = normalizeCatalogNumber(record.music_time)
    if (musicId && musicTime != null && musicTime > 0 && !map.has(musicId)) {
      map.set(musicId, musicTime)
    }
  }
  return map
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
