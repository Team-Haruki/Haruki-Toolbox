import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  buildEventOptions,
  type EventOption,
  type SekaiEvent,
} from "../lib/master-options"

export function useEventOptions(region: Ref<SekaiRegion>) {
  const sekaiDataStore = useSekaiDataStore()
  const options = ref<EventOption[]>([])
  const loading = ref(false)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])

  watch(
    () => [region.value, regionState.value.masterFetchVersion],
    () => {
      void loadOptions()
    },
    { immediate: true },
  )

  async function loadOptions() {
    loading.value = true
    try {
      if (!regionState.value.masterFetchVersion || !regionState.value.files.includes("events")) {
        await sekaiDataStore.ensureRegionData(region.value, { files: ["events"] })
      }
      const events = await readSekaiMasterFile<SekaiEvent[]>(region.value, "events")
      options.value = buildEventOptions(events)
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    options,
    loading,
  }
}
