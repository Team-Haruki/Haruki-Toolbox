export const MUSIC_DIFFICULTIES = [
  "easy",
  "normal",
  "hard",
  "expert",
  "master",
  "append",
] as const

export type MusicDifficulty = (typeof MUSIC_DIFFICULTIES)[number]

/**
 * Community-convention difficulty colors:
 * easy green / normal blue / hard yellow / expert red / master purple / append pink-purple.
 */
export const MUSIC_DIFFICULTY_COLORS: Record<MusicDifficulty, string> = {
  easy: "#66DD11",
  normal: "#33BBEE",
  hard: "#FFAA00",
  expert: "#EE4466",
  master: "#BB33EE",
  append: "#FF7ADB",
}

export function isMusicDifficulty(value: unknown): value is MusicDifficulty {
  return typeof value === "string" && (MUSIC_DIFFICULTIES as readonly string[]).includes(value)
}

export function normalizeMusicDifficulty(value: unknown): MusicDifficulty | null {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return isMusicDifficulty(normalized) ? normalized : null
}
