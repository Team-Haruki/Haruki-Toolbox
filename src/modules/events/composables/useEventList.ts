import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useNowTick } from "@/composables/useNowTick"
import { useCharactersIndex, type CharactersIndex } from "@/shared/sekai/catalog-resources"
import { useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import type { CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { useEventsIndex, type EventsIndex } from "@/modules/events/composables/useEventsIndex"
import { collectEventYears, type SekaiEventItem } from "@/modules/events/lib/event-filter"
import { filterEventList, isUpcomingHiddenByFilter, sortEventList } from "@/modules/events/lib/event-list"
import type { EventsQueryState } from "@/modules/events/lib/event-query"

const EMPTY_UNIT_MAP: ReadonlyMap<number, { gameCharacterId: number }> = new Map()

export type UseEventListResult = {
  eventsIndex: CatalogResource<EventsIndex>
  charactersIndex: CatalogResource<CharactersIndex>
  /** Filtered and sorted events for the current query (before paging). */
  events: ComputedRef<SekaiEventItem[]>
  years: ComputedRef<number[]>
  /** Shared 30 s clock for status badges and unreleased checks. */
  now: Ref<number>
  hideUnreleased: ComputedRef<boolean>
  blurUnreleased: ComputedRef<boolean>
  /** The list is empty only because `upcoming` fights the hide-unreleased setting. */
  upcomingHidden: ComputedRef<boolean>
}

/**
 * Async state of the event list: the events index (list, bonus lookups),
 * the characters index (bonus character filter) and the derived, filtered,
 * sorted list for a reactive query state.
 */
export function useEventList(region: Ref<SekaiRegion>, state: EventsQueryState): UseEventListResult {
  const eventsIndex = useEventsIndex(region)
  const charactersIndex = useCharactersIndex(region)
  const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()
  const now = useNowTick(30_000)

  const years = computed(() => collectEventYears(eventsIndex.data.value?.list ?? []))

  const filtered = computed(() => {
    const index = eventsIndex.data.value
    if (!index) {
      return []
    }
    return filterEventList(index.list, state, {
      nowMs: now.value,
      hideUnreleased: hideUnreleased.value,
      bonusAttrMap: index.bonusAttrMap,
      bonusCharacterUnitIdsByEvent: index.bonusCharacterUnitIdsByEvent,
      characterUnitById: charactersIndex.data.value?.characterUnitById ?? EMPTY_UNIT_MAP,
    })
  })

  const events = computed(() => sortEventList(filtered.value, state, now.value))

  const upcomingHidden = computed(() => isUpcomingHiddenByFilter(state, hideUnreleased.value, events.value.length))

  return {
    eventsIndex,
    charactersIndex,
    events,
    years,
    now,
    hideUnreleased,
    blurUnreleased,
    upcomingHidden,
  }
}
