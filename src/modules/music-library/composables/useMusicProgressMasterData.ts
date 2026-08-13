import { computed, ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"

const MUSIC_PROGRESS_MASTER_FILES = ["musics", "musicDifficulties"] as const

// Reward statistics additionally need the achievement table and its resource
// boxes (resourceBoxDetails only exists on tw/kr/cn and is optional).
const MUSIC_ACHIEVEMENT_MASTER_FILES = [
  "musicAchievements",
  "resourceBoxes",
  "resourceBoxDetails",
] as const

export type UseMusicProgressMasterDataOptions = {
  /** Also load the music achievement + resource box masters. */
  withAchievements?: boolean
}

/**
 * Loads the raw `musics` + `musicDifficulties` masterdata for the selected
 * game account's server. `region` is null while no account is selected.
 */
export function useMusicProgressMasterData(
  region: Ref<SekaiRegion | null>,
  options: UseMusicProgressMasterDataOptions = {},
) {
  const withAchievements = options.withAchievements === true
  const requiredFiles = withAchievements
    ? [...MUSIC_PROGRESS_MASTER_FILES, ...MUSIC_ACHIEVEMENT_MASTER_FILES]
    : [...MUSIC_PROGRESS_MASTER_FILES]

  const sekaiDataStore = useSekaiDataStore()
  const rawMusics = shallowRef<unknown>(null)
  const rawMusicDifficulties = shallowRef<unknown>(null)
  const rawMusicAchievements = shallowRef<unknown>(null)
  const rawResourceBoxes = shallowRef<unknown>(null)
  const rawResourceBoxDetails = shallowRef<unknown>(null)
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

  function resetData() {
    rawMusics.value = null
    rawMusicDifficulties.value = null
    rawMusicAchievements.value = null
    rawResourceBoxes.value = null
    rawResourceBoxDetails.value = null
  }

  async function load() {
    const target = region.value
    const currentGeneration = ++generation
    if (!target) {
      resetData()
      loading.value = false
      error.value = null
      return
    }

    loading.value = true
    error.value = null
    try {
      const cachedFiles = sekaiDataStore.regionStates[target].files
      if (!requiredFiles.every((fileName) => cachedFiles.includes(fileName))) {
        await sekaiDataStore.ensureRegionData(target, { files: requiredFiles })
      }
      const files = await readSekaiMasterFiles(target, requiredFiles)
      if (currentGeneration !== generation) {
        return
      }

      rawMusics.value = files.musics
      rawMusicDifficulties.value = files.musicDifficulties
      if (withAchievements) {
        rawMusicAchievements.value = files.musicAchievements
        rawResourceBoxes.value = files.resourceBoxes
        rawResourceBoxDetails.value = files.resourceBoxDetails
      }
    } catch (loadError) {
      if (currentGeneration !== generation) {
        return
      }

      resetData()
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
    rawMusicAchievements,
    rawResourceBoxes,
    rawResourceBoxDetails,
    loading,
    error,
    regionState,
    reload: load,
  }
}
