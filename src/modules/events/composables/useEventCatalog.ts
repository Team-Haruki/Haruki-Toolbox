import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { SekaiEventItem } from "@/modules/events/lib/event-filter"
import { useEventsIndex } from "@/modules/events/composables/useEventsIndex"

const EMPTY_ATTR_MAP: ReadonlyMap<number, Set<string>> = new Map()

export type UseEventCatalogResult = {
  /** Every event of the region, newest first. */
  events: ComputedRef<SekaiEventItem[]>
  /** eventId → bonus card attributes. */
  bonusAttrMap: ComputedRef<ReadonlyMap<number, Set<string>>>
  loading: Ref<boolean>
  error: Ref<string | null>
  reload: () => Promise<void>
}

/**
 * Lightweight event catalog for pickers outside the events module (deck
 * recommend). A thin view over the shared events index, so the picker and
 * the catalog pages share one build of `events.json`.
 */
export function useEventCatalog(region: Ref<SekaiRegion>): UseEventCatalogResult {
  const index = useEventsIndex(region)

  return {
    events: computed(() => index.data.value?.list ?? []),
    bonusAttrMap: computed(() => index.data.value?.bonusAttrMap ?? EMPTY_ATTR_MAP),
    loading: index.loading,
    error: index.error,
    reload: index.reload,
  }
}
