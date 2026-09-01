import type { EventBoxInfo } from "./event-box"
import type { MusicLibraryEntry } from "./music-data"
import { MUSIC_DIFFICULTIES, MUSIC_DIFFICULTY_COLORS, type MusicDifficulty } from "./music-difficulties"

export type MusicDifficultyPill = {
  difficulty: MusicDifficulty
  color: string
  playLevel: number | null
}

export type MusicDifficultyRow = MusicDifficultyPill & {
  totalNoteCount: number | null
}

/** The song's charts in canonical difficulty order (missing charts skipped). */
export function listMusicDifficultyPills(entry: Pick<MusicLibraryEntry, "difficulties">): MusicDifficultyPill[] {
  return MUSIC_DIFFICULTIES
    .filter((difficulty) => entry.difficulties[difficulty] != null)
    .map((difficulty) => ({
      difficulty,
      color: MUSIC_DIFFICULTY_COLORS[difficulty],
      playLevel: entry.difficulties[difficulty]?.playLevel ?? null,
    }))
}

export function listMusicDifficultyRows(entry: Pick<MusicLibraryEntry, "difficulties">): MusicDifficultyRow[] {
  return listMusicDifficultyPills(entry).map((pill) => ({
    ...pill,
    totalNoteCount: entry.difficulties[pill.difficulty]?.totalNoteCount ?? null,
  }))
}

/** Localized date label for a master timestamp; null when the timestamp is unknown. */
export function formatMusicDate(
  timestamp: number | null,
  formatter: Pick<Intl.DateTimeFormat, "format">,
): string | null {
  return timestamp == null ? null : formatter.format(new Date(timestamp))
}

/** "某角色 N箱" hint rendered on tiles, rows and related-event entries. */
export type MusicEventBoxView = {
  characterId: number
  name: string
  boxNumber: number
}

/** Null when the song is no box song or its banner character is unknown on this server. */
export function resolveMusicEventBoxView(
  info: EventBoxInfo | null | undefined,
  characterMap: ReadonlyMap<number, { name: string }>,
): MusicEventBoxView | null {
  if (info == null) {
    return null
  }
  const character = characterMap.get(info.characterId)
  return character
    ? { characterId: info.characterId, name: character.name, boxNumber: info.boxNumber }
    : null
}

/** One rendered list entry (tile or row); built per page by the list view. */
export type MusicListRow = {
  entry: MusicLibraryEntry
  jacketUrl: string | null
  dateLabel: string | null
  unreleased: boolean
  eventBox: MusicEventBoxView | null
  pills: MusicDifficultyPill[]
}
