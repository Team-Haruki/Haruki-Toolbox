/** Canonical display order for the tag filter; every known tag is always offered. */
export const MUSIC_TAG_ORDER = [
  "vocaloid",
  "light_music_club",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "event_box",
  "world_link",
  "other",
] as const

const KNOWN_MUSIC_TAGS = new Set<string>(MUSIC_TAG_ORDER)

/** Canonical display order for the MV-type filter (regions with `categories`). */
export const MUSIC_CATEGORY_ORDER = ["mv", "mv_2d", "image", "original"] as const

/**
 * Kept for the deck-recommend song picker; catalog pages resolve labels via
 * `resolveSekaiMusicTagLabel` from `@/shared/sekai/labels`.
 */
export function resolveMusicTagLabelKey(tag: string): string | null {
  return KNOWN_MUSIC_TAGS.has(tag) ? `musicLibrary.tags.${tag}` : null
}
