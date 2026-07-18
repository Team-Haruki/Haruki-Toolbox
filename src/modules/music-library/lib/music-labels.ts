const KNOWN_MUSIC_TAGS = new Set([
  "vocaloid",
  "light_music_club",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "other",
])

const KNOWN_MUSIC_CATEGORIES = new Set(["mv", "mv_2d", "image", "original"])

const KNOWN_MUSIC_VOCAL_TYPES = new Set([
  "original_song",
  "sekai",
  "virtual_singer",
  "another_vocal",
  "instrumental",
  "april_fool_2022",
])

export function resolveMusicTagLabelKey(tag: string): string | null {
  return KNOWN_MUSIC_TAGS.has(tag) ? `musicLibrary.tags.${tag}` : null
}

export function resolveMusicCategoryLabelKey(category: string): string | null {
  return KNOWN_MUSIC_CATEGORIES.has(category) ? `musicLibrary.categories.${category}` : null
}

export function resolveMusicVocalTypeLabelKey(vocalType: string): string | null {
  return KNOWN_MUSIC_VOCAL_TYPES.has(vocalType) ? `musicLibrary.vocalTypes.${vocalType}` : null
}
