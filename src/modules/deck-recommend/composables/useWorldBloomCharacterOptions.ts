import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  resolveWorldBloomDefaultGameCharacterId,
  resolveWorldBloomGameCharacterIds,
  type SekaiEvent,
  type SekaiWorldBloom,
} from "../lib/master-options"

export function useWorldBloomCharacterOptions(
  region: Ref<SekaiRegion>,
  selectedEventId: Ref<string | null>,
) {
  const sekaiDataStore = useSekaiDataStore()
  const characterIds = ref<number[]>([])
  const defaultCharacterId = ref<number | null>(null)
  const loading = ref(false)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const hasCharacters = computed(() => characterIds.value.length > 0)

  watch(
    () => [region.value, regionState.value.masterFetchVersion, selectedEventId.value],
    () => {
      void loadCharacterIds()
    },
    { immediate: true },
  )

  async function loadCharacterIds() {
    if (!selectedEventId.value) {
      characterIds.value = []
      defaultCharacterId.value = null
      return
    }

    loading.value = true
    try {
      const requiredFiles = ["events", "worldBlooms", "gameCharacters"]
      if (!hasRequiredFiles(regionState.value.files, requiredFiles)) {
        await sekaiDataStore.ensureRegionData(region.value, { files: requiredFiles })
      }
      const [events, worldBlooms] = await Promise.all([
        readSekaiMasterFile<SekaiEvent[]>(region.value, "events"),
        readSekaiMasterFile<SekaiWorldBloom[]>(region.value, "worldBlooms"),
      ])
      characterIds.value = resolveWorldBloomGameCharacterIds(selectedEventId.value, events, worldBlooms)
      defaultCharacterId.value = resolveWorldBloomDefaultGameCharacterId(selectedEventId.value, events, worldBlooms)
    } catch {
      characterIds.value = []
      defaultCharacterId.value = null
    } finally {
      loading.value = false
    }
  }

  return {
    characterIds,
    defaultCharacterId,
    hasCharacters,
    loading,
  }
}

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}
