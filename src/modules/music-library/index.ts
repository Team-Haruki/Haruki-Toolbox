export * from "./routes"

export { default as MusicJacket } from "./components/MusicJacket.vue"
export { useMusicLibraryList } from "./composables/useMusicLibraryList"
export { resolveMusicJacketUrl } from "./lib/music-assets"
export {
  MUSIC_DIFFICULTIES,
  MUSIC_DIFFICULTY_COLORS,
  isMusicDifficulty,
  normalizeMusicDifficulty,
  type MusicDifficulty,
} from "./lib/music-difficulties"
export { resolveMusicTagLabelKey } from "./lib/music-labels"
export type { MusicLibraryEntry } from "./lib/music-data"
export {
  MUSIC_CHARACTER_FILTER_SCOPES,
  MUSIC_SORT_KEYS,
  createDefaultMusicLibraryFilter,
  excludeUnreleasedMusicEntries,
  filterMusicEntries,
  isMusicEntryUnreleased,
  matchesMusicSearch,
  sortMusicEntries,
  type MusicCharacterFilterScope,
  type MusicFilterContext,
  type MusicLibraryFilter,
  type MusicSortDirection,
  type MusicSortKey,
} from "./lib/music-filter"

export {
  MUSICS_INDEX_FILES,
  MUSICS_INDEX_KEY,
  buildMusicsIndex,
  useMusicsIndex,
  type MusicsIndex,
} from "./composables/useMusicsIndex"
