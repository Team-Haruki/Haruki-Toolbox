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

/**
 * Tinted chip per difficulty: the hue at 15% as the fill with a dark text of
 * the same hue in the light theme and a light one in the dark theme (the
 * `badgeVariants` recipe), so the level stays readable (≥ 4.5:1) while the
 * community colour stays recognisable. White-on-hue chips measured 1.8–3.7:1;
 * the two light hues (lime, amber) need `-800` text to clear 4.5:1 on white.
 */
export const MUSIC_DIFFICULTY_CHIP_CLASSES: Record<MusicDifficulty, string> = {
  easy: "bg-lime-500/15 text-lime-800 dark:text-lime-300",
  normal: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  hard: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  expert: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  master: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  append: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
}

/** Shape and type shared by every difficulty chip; consumers add width and padding. */
export const MUSIC_DIFFICULTY_CHIP_BASE_CLASS =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded text-xs font-semibold leading-none tabular-nums"

/**
 * The full class list of a difficulty chip (`MUSIC_DIFFICULTY_CHIP_BASE_CLASS`
 * + the hue). Every difficulty chip in the app renders through this so the
 * music list, progress, profile and the deck song picker look the same.
 */
export function resolveMusicDifficultyChipClass(difficulty: MusicDifficulty): string {
  return `${MUSIC_DIFFICULTY_CHIP_BASE_CLASS} ${MUSIC_DIFFICULTY_CHIP_CLASSES[difficulty]}`
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
