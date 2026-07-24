import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import {
  MUSIC_DIFFICULTIES,
  normalizeMusicDifficulty,
  type MusicDifficulty,
} from "./music-difficulties"

/** Per-(music, difficulty) flags merged across all play types / result rows. */
export type MusicProgressFlags = {
  cleared: boolean
  fullCombo: boolean
  allPerfect: boolean
}

export type MusicProgressStatus = "allPerfect" | "fullCombo" | "clear" | "unplayed"

/** Shared status colors for progress bars/legends (also used by the profile page). */
export const MUSIC_PROGRESS_STATUS_COLORS: Record<MusicProgressStatus, string> = {
  allPerfect: "#38BDF8",
  fullCombo: "#C084FC",
  clear: "#FCD34D",
  unplayed: "var(--muted-foreground)",
}

export type MusicProgressSong = {
  musicId: number
  title: string
  assetbundleName: string
  playLevel: number | null
  status: MusicProgressStatus
}

export type MusicProgressLevelRow = {
  playLevel: number | null
  total: number
  /** Songs with all perfect. */
  allPerfect: number
  /** Songs with full combo but not all perfect. */
  fullComboOnly: number
  /** Songs cleared but without full combo. */
  clearOnly: number
  /** Songs never cleared on this difficulty. */
  unplayed: number
  songs: MusicProgressSong[]
}

export type MusicProgressSummary = {
  total: number
  /** Cumulative: cleared or better. */
  cleared: number
  /** Cumulative: full combo or better. */
  fullCombo: number
  allPerfect: number
}

export type MusicDifficultyProgress = {
  difficulty: MusicDifficulty
  summary: MusicProgressSummary
  /** Sorted by playLevel descending; unknown levels last. */
  levels: MusicProgressLevelRow[]
}

export type MusicProgress = Record<MusicDifficulty, MusicDifficultyProgress>

/**
 * Merge `userMusicResults` rows into per-(musicId, difficulty) flags across
 * all play types (solo / multi) and entries — port of the bot's 打歌进度 rules:
 * - cleared: any `playResult === "clear"` OR any full-combo/all-perfect flag
 * - fullCombo: any `fullComboFlg` OR any `fullPerfectFlg`
 * - allPerfect: any `fullPerfectFlg`
 */
export function aggregateMusicResultFlags(
  rawUserMusicResults: unknown,
): Map<number, Partial<Record<MusicDifficulty, MusicProgressFlags>>> {
  const map = new Map<number, Partial<Record<MusicDifficulty, MusicProgressFlags>>>()

  for (const record of normalizeCatalogRecords(rawUserMusicResults)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const difficulty = normalizeMusicDifficulty(record.musicDifficultyType)
    if (!musicId || !difficulty) {
      continue
    }

    const fullPerfect = record.fullPerfectFlg === true
    const fullCombo = record.fullComboFlg === true || fullPerfect
    const cleared = record.playResult === "clear" || fullCombo

    const flagsByDifficulty = map.get(musicId) ?? {}
    const flags = flagsByDifficulty[difficulty] ?? {
      cleared: false,
      fullCombo: false,
      allPerfect: false,
    }
    flags.cleared = flags.cleared || cleared
    flags.fullCombo = flags.fullCombo || fullCombo
    flags.allPerfect = flags.allPerfect || fullPerfect
    flagsByDifficulty[difficulty] = flags
    map.set(musicId, flagsByDifficulty)
  }

  return map
}

export function resolveMusicProgressStatus(flags: MusicProgressFlags | undefined): MusicProgressStatus {
  if (!flags) {
    return "unplayed"
  }
  if (flags.allPerfect) {
    return "allPerfect"
  }
  if (flags.fullCombo) {
    return "fullCombo"
  }
  if (flags.cleared) {
    return "clear"
  }
  return "unplayed"
}

export type BuildMusicProgressOptions = {
  rawMusics: unknown
  rawMusicDifficulties: unknown
  rawUserMusicResults: unknown
  /** Reference timestamp (ms) for the release cutoff; defaults to `Date.now()`. */
  now?: number
}

/**
 * Build per-difficulty progress from masterdata + user results.
 *
 * A song counts toward a difficulty's totals only if that difficulty exists in
 * masterdata and the music is released on the server (`releasedAt <= now`,
 * falling back to `publishedAt` when `releasedAt` is missing). Result rows for
 * musics absent from masterdata are ignored.
 */
export function buildMusicProgress(options: BuildMusicProgressOptions): MusicProgress {
  const now = options.now ?? Date.now()
  const resultFlags = aggregateMusicResultFlags(options.rawUserMusicResults)
  const difficultyMap = buildPlayLevelMap(options.rawMusicDifficulties)

  const songsByDifficulty = new Map<MusicDifficulty, MusicProgressSong[]>()
  for (const difficulty of MUSIC_DIFFICULTIES) {
    songsByDifficulty.set(difficulty, [])
  }

  for (const record of normalizeCatalogRecords(options.rawMusics)) {
    const musicId = normalizeCatalogNumber(record.id)
    if (!musicId) {
      continue
    }

    const releasedAt = normalizeCatalogNumber(record.releasedAt)
      ?? normalizeCatalogNumber(record.publishedAt)
    if (releasedAt == null || releasedAt > now) {
      continue
    }

    const playLevels = difficultyMap.get(musicId)
    if (!playLevels) {
      continue
    }

    const title = normalizeCatalogString(record.title) || `#${musicId}`
    const assetbundleName = normalizeCatalogString(record.assetbundleName)
    for (const difficulty of MUSIC_DIFFICULTIES) {
      const playLevel = playLevels[difficulty]
      if (playLevel === undefined) {
        continue
      }

      songsByDifficulty.get(difficulty)?.push({
        musicId,
        title,
        assetbundleName,
        playLevel,
        status: resolveMusicProgressStatus(resultFlags.get(musicId)?.[difficulty]),
      })
    }
  }

  const progress = {} as MusicProgress
  for (const difficulty of MUSIC_DIFFICULTIES) {
    const songs = songsByDifficulty.get(difficulty) ?? []
    progress[difficulty] = {
      difficulty,
      summary: summarizeSongs(songs),
      levels: groupSongsByLevel(songs),
    }
  }

  return progress
}

function summarizeSongs(songs: readonly MusicProgressSong[]): MusicProgressSummary {
  const summary: MusicProgressSummary = { total: 0, cleared: 0, fullCombo: 0, allPerfect: 0 }
  for (const song of songs) {
    summary.total += 1
    if (song.status !== "unplayed") {
      summary.cleared += 1
    }
    if (song.status === "fullCombo" || song.status === "allPerfect") {
      summary.fullCombo += 1
    }
    if (song.status === "allPerfect") {
      summary.allPerfect += 1
    }
  }

  return summary
}

function groupSongsByLevel(songs: readonly MusicProgressSong[]): MusicProgressLevelRow[] {
  const rows = new Map<number | null, MusicProgressLevelRow>()
  for (const song of songs) {
    const key = song.playLevel
    const row = rows.get(key) ?? {
      playLevel: key,
      total: 0,
      allPerfect: 0,
      fullComboOnly: 0,
      clearOnly: 0,
      unplayed: 0,
      songs: [],
    }

    row.total += 1
    if (song.status === "allPerfect") {
      row.allPerfect += 1
    } else if (song.status === "fullCombo") {
      row.fullComboOnly += 1
    } else if (song.status === "clear") {
      row.clearOnly += 1
    } else {
      row.unplayed += 1
    }
    row.songs.push(song)
    rows.set(key, row)
  }

  const sorted = [...rows.values()].sort((a, b) => {
    if (a.playLevel == null) {
      return b.playLevel == null ? 0 : 1
    }
    if (b.playLevel == null) {
      return -1
    }
    return b.playLevel - a.playLevel
  })

  for (const row of sorted) {
    row.songs.sort((a, b) => a.musicId - b.musicId)
  }

  return sorted
}

/** playLevel per (musicId, difficulty); `null` when the level is unknown. */
function buildPlayLevelMap(
  rawMusicDifficulties: unknown,
): Map<number, Partial<Record<MusicDifficulty, number | null>>> {
  const map = new Map<number, Partial<Record<MusicDifficulty, number | null>>>()
  for (const record of normalizeCatalogRecords(rawMusicDifficulties)) {
    const musicId = normalizeCatalogNumber(record.musicId)
    const difficulty = normalizeMusicDifficulty(record.musicDifficulty)
    if (!musicId || !difficulty) {
      continue
    }

    const levels = map.get(musicId) ?? {}
    levels[difficulty] = normalizeCatalogNumber(record.playLevel)
    map.set(musicId, levels)
  }

  return map
}
