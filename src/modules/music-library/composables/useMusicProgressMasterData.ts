import { computed, ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

const MUSIC_PROGRESS_MASTER_FILES = ["musics", "musicDifficulties"] as const

/**
 * Loads the raw `musics` + `musicDifficulties` masterdata for the selected
 * game account's server. `region` is null while no account is selected.
 */
export function useMusicProgressMasterData(region: Ref<SekaiRegion | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const rawMusics = shallowRef<unknown>(null)
  const rawMusicDifficulties = shallowRef<unknown>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() =>
    region.value ? sekaiDataStore.regionStates[region.value] : null,
  )

  let generation = 0

  watch(
    () => [region.value, regionState.value?.masterFetchVersion] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load() {
    const target = region.value
    const currentGeneration = ++generation
    if (!target) {
      rawMusics.value = null
      rawMusicDifficulties.value = null
      loading.value = false
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const cachedFiles = sekaiDataStore.regionStates[target].files
      if (!MUSIC_PROGRESS_MASTER_FILES.every((fileName) => cachedFiles.includes(fileName))) {
        await sekaiDataStore.ensureRegionData(target, { files: MUSIC_PROGRESS_MASTER_FILES })
      }
      const files = await readSekaiMasterFiles(target, MUSIC_PROGRESS_MASTER_FILES)
      if (currentGeneration !== generation) {
        return
      }

      rawMusics.value = files.musics
      rawMusicDifficulties.value = files.musicDifficulties
    } catch (loadError) {
      if (currentGeneration !== generation) {
        return
      }

      rawMusics.value = null
      rawMusicDifficulties.value = null
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      if (currentGeneration === generation) {
        loading.value = false
      }
    }
  }

  return {
    rawMusics,
    rawMusicDifficulties,
    loading,
    error,
    regionState,
    reload: load,
  }
}
