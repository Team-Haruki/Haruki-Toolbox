import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildMusicDetailExtras, type MusicDetailExtras } from "@/modules/music-library/lib/music-extras"

/**
 * Detail-only lookups: outside singers, unlock sentences and original MV
 * links. Every file is optional (tw/kr/cn ship none or empty ones).
 *
 * This is also the only music resource that asks for the region's
 * `music_metas` (`musicMetas: true`): song durations are read from that
 * side table once this resource is ready (see `useMusicDuration`).
 */
export const MUSIC_DETAIL_EXTRAS_KEY = "music-library/detail-extras"
export const MUSIC_DETAIL_EXTRAS_FILES = ["outsideCharacters", "releaseConditions", "musicOriginals"] as const

export function useMusicDetailExtras(
  region: Ref<SekaiRegion>,
  enabled: Ref<boolean>,
): CatalogResource<MusicDetailExtras> {
  return useCatalogResource(region, MUSIC_DETAIL_EXTRAS_KEY, MUSIC_DETAIL_EXTRAS_FILES, buildMusicDetailExtras, {
    optional: MUSIC_DETAIL_EXTRAS_FILES,
    musicMetas: true,
    enabled,
  })
}
