import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildEventMusicsIndex, type EventMusicsIndex } from "@/modules/music-library/lib/event-musics"

/**
 * The only music-library resource that reads `eventMusics.json`. Feeds the
 * synthetic box / World Link tags on the list and the related events on the
 * detail page. Optional story metadata supplies the explicit banner character;
 * event-card order is only a fallback when a regional dump lacks that metadata.
 */
export const EVENT_MUSICS_KEY = "music-library/event-musics"
export const EVENT_MUSICS_FILES = ["eventMusics", "eventStories"] as const
export const EVENT_MUSICS_OPTIONAL = ["eventStories"] as const

export function useEventMusicsResource(region: Ref<SekaiRegion>): CatalogResource<EventMusicsIndex> {
  return useCatalogResource(region, EVENT_MUSICS_KEY, EVENT_MUSICS_FILES, buildEventMusicsIndex, {
    optional: EVENT_MUSICS_OPTIONAL,
  })
}
