import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildEventDetailExtras, type EventDetailExtras } from "@/modules/events/lib/event-extras"

/**
 * Secondary tables for the event detail page. `eventStories` is optional:
 * some regional dumps ship no story outlines and the section hides itself.
 */
export const EVENT_DETAIL_EXTRAS_KEY = "events/detail-extras"
export const EVENT_DETAIL_EXTRAS_FILES = [
  "eventRarityBonusRates",
  "worldBlooms",
  "eventMusics",
  "cheerfulCarnivalTeams",
  "eventStories",
] as const
export const EVENT_DETAIL_EXTRAS_OPTIONAL = ["eventStories"] as const

export function useEventDetailExtras(region: Ref<SekaiRegion>, enabled?: Ref<boolean>): CatalogResource<EventDetailExtras> {
  return useCatalogResource(region, EVENT_DETAIL_EXTRAS_KEY, EVENT_DETAIL_EXTRAS_FILES, buildEventDetailExtras, {
    optional: EVENT_DETAIL_EXTRAS_OPTIONAL,
    enabled,
  })
}
