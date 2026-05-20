import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  buildCharacterOptions,
  type CharacterOption,
  type SekaiGameCharacter,
} from "../lib/master-options"

export function useCharacterOptions(region: Ref<SekaiRegion>) {
  const sekaiDataStore = useSekaiDataStore()
  const options = ref<CharacterOption[]>([])
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
      await sekaiDataStore.ensureRegionData(region.value)
      const characters = await readSekaiMasterFile<SekaiGameCharacter[]>(region.value, "gameCharacters")
      options.value = buildCharacterOptions(characters)
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
