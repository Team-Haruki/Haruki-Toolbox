import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildMusicVocalCharacterMap,
  buildMusicVocalsByMusic,
  type MusicVocalCharacterSummary,
  type MusicVocalEntry,
} from "@/modules/music-library/lib/music-data"

/**
 * The only resource that reads `musicVocals.json`: singer summaries for the
 * list's character filter plus every vocal version grouped by song for the
 * detail page's player.
 */
export const MUSIC_VOCALS_KEY = "music-library/vocals"
export const MUSIC_VOCALS_FILES = ["musicVocals"] as const

export type MusicVocalsIndex = {
  byMusic: Map<number, MusicVocalEntry[]>
  characterSummaries: Map<number, MusicVocalCharacterSummary>
}

export function buildMusicVocalsIndex(files: Record<string, unknown>): MusicVocalsIndex {
  return {
    byMusic: buildMusicVocalsByMusic(files.musicVocals),
    characterSummaries: buildMusicVocalCharacterMap(files.musicVocals),
  }
}

export function useMusicVocalsResource(region: Ref<SekaiRegion>): CatalogResource<MusicVocalsIndex> {
  return useCatalogResource(region, MUSIC_VOCALS_KEY, MUSIC_VOCALS_FILES, buildMusicVocalsIndex)
}
