import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildMusicLibraryEntries, type MusicLibraryEntry } from "@/modules/music-library/lib/music-data"

/**
 * The only resource that reads `musics.json`, `musicDifficulties.json`,
 * `musicTags.json` and `musicCategories.json`. Event-box / World Link tags
 * are derived by the music list composable from the events index.
 */
export const MUSICS_INDEX_KEY = "music-library/index"
export const MUSICS_INDEX_FILES = ["musics", "musicDifficulties", "musicTags", "musicCategories"] as const
/**
 * `musicTags` is absent on some regions, and `musicCategories` only exists on
 * jp so far — the other four still carry `musics.categories` inline.
 */
export const MUSICS_INDEX_OPTIONAL = ["musicTags", "musicCategories"] as const

export type MusicsIndex = {
  /** Every song, in id order. */
  entries: MusicLibraryEntry[]
  byId: Map<number, MusicLibraryEntry>
  /** False on a region shipping neither shape; MV-type filters hide themselves. */
  hasCategories: boolean
}

export function buildMusicsIndex(files: Record<string, unknown>): MusicsIndex {
  const entries = buildMusicLibraryEntries(
    files.musics,
    files.musicDifficulties,
    files.musicTags,
    files.musicCategories,
  )
  entries.sort((a, b) => a.id - b.id)
  const byId = new Map<number, MusicLibraryEntry>()
  let hasCategories = false
  for (const entry of entries) {
    byId.set(entry.id, entry)
    if (entry.categories.length > 0) {
      hasCategories = true
    }
  }
  return { entries, byId, hasCategories }
}

export function useMusicsIndex(region: Ref<SekaiRegion>): CatalogResource<MusicsIndex> {
  return useCatalogResource(region, MUSICS_INDEX_KEY, MUSICS_INDEX_FILES, buildMusicsIndex, {
    optional: MUSICS_INDEX_OPTIONAL,
  })
}
