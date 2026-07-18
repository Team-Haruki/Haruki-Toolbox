import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { buildEventBonusAttrMap } from "../lib/event-bonus"
import { normalizeEventItems, sortEventsByStartAtDesc, type SekaiEventItem } from "../lib/event-filter"

const LIST_FILES = ["events", "eventDeckBonuses"] as const

export function useEventCatalog(region: Ref<SekaiRegion>) {
  const sekaiDataStore = useSekaiDataStore()
  const events = ref<SekaiEventItem[]>([])
  const bonusAttrMap = ref<Map<number, Set<string>>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])

  watch(
    () => [region.value, regionState.value.masterFetchVersion],
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load(force = false) {
    loading.value = true
    error.value = null
    try {
      if (force || !LIST_FILES.every((file) => regionState.value.files.includes(file))) {
        await sekaiDataStore.ensureRegionData(region.value, { force, files: LIST_FILES })
      }

      const files = await readSekaiMasterFiles(region.value, LIST_FILES)
      events.value = sortEventsByStartAtDesc(normalizeEventItems(files.events))
      bonusAttrMap.value = buildEventBonusAttrMap(files.eventDeckBonuses)
    } catch (loadError) {
      events.value = []
      bonusAttrMap.value = new Map()
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    bonusAttrMap,
    loading,
    error,
    reload: () => load(true),
  }
}
