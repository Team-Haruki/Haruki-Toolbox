import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildEventRewardsIndex,
  resolveEventRankingRewards,
  type EventRankingRewardRange,
  type EventRankingRewardRow,
  type EventRewardsIndex,
} from "@/modules/events/lib/event-rewards"

/**
 * Ranking-reward lookups (honors + resource boxes). Heavy on jp/en
 * (`resourceBoxes` is tens of thousands of rows) so it only loads when the
 * rewards section is opened; the box files are optional because the cn dump
 * ships neither and tw/kr/cn use the flat `resourceBoxDetails` table.
 */
export const EVENT_REWARDS_KEY = "events/rewards"
export const EVENT_REWARDS_FILES = ["honors", "honorGroups", "resourceBoxes", "resourceBoxDetails"] as const
export const EVENT_REWARDS_OPTIONAL = ["honorGroups", "resourceBoxes", "resourceBoxDetails"] as const

export type UseEventRewardsResult = CatalogResource<EventRewardsIndex> & {
  rows: ComputedRef<EventRankingRewardRow[]>
  /** The region ships no box contents at all: only the rank ranges are known. */
  unavailable: ComputedRef<boolean>
}

export function useEventRewards(
  region: Ref<SekaiRegion>,
  ranges: Ref<readonly EventRankingRewardRange[]>,
  enabled: Ref<boolean>,
): UseEventRewardsResult {
  const resource = useCatalogResource(region, EVENT_REWARDS_KEY, EVENT_REWARDS_FILES, buildEventRewardsIndex, {
    optional: EVENT_REWARDS_OPTIONAL,
    enabled,
  })

  const rows = computed(() => {
    const index = resource.data.value
    return index ? resolveEventRankingRewards(ranges.value, index) : []
  })

  return {
    ...resource,
    rows,
    unavailable: computed(() => resource.data.value != null && !resource.data.value.hasBoxData),
  }
}
