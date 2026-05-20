import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  buildMusicOptions,
  resolveMusicDifficultyOptions,
  type MusicDifficultyOption,
  type MusicOption,
  type SekaiMusic,
  type SekaiMusicDifficulty,
} from "../lib/master-options"

export function useMusicOptions(region: Ref<SekaiRegion>, selectedMusicId: Ref<string | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const options = ref<MusicOption[]>([])
  const difficultyRows = ref<SekaiMusicDifficulty[]>([])
  const loading = ref(false)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const difficultyOptions = computed<MusicDifficultyOption[]>(() =>
    resolveMusicDifficultyOptions(selectedMusicId.value, difficultyRows.value),
  )

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
      const [musics, musicDifficulties] = await Promise.all([
        readSekaiMasterFile<SekaiMusic[]>(region.value, "musics"),
        readSekaiMasterFile<SekaiMusicDifficulty[]>(region.value, "musicDifficulties"),
      ])
      options.value = buildMusicOptions(musics)
      difficultyRows.value = musicDifficulties ?? []
    } catch {
      options.value = []
      difficultyRows.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    options,
    difficultyOptions,
    loading,
  }
}
