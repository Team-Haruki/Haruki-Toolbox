import { computed, ref, shallowRef, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { isMasterCacheCovering } from "@/shared/sekai/master-coverage"
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

function missingMusicProgressFiles(files: Record<string, unknown>): string[] {
  return MUSIC_PROGRESS_MASTER_FILES.filter(
    (fileName) => !Object.prototype.hasOwnProperty.call(files, fileName),
  )
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

  // Element-wise sources: a getter returning a fresh array would re-run
  // `load()` on every progress patch of the region state.
  watch(
    [() => region.value, () => regionState.value?.masterFetchVersion ?? null],
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
      if (!isMasterCacheCovering(cachedFiles, requiredFiles)) {
        await sekaiDataStore.ensureRegionData(target, {
          files: requiredFiles,
          musicMetas: false,
        })
      }
      let files = await readSekaiMasterFiles(target, requiredFiles)

      // Mobile browsers may evict individual IndexedDB records while leaving
      // the cache metadata intact. Recover once instead of treating an
      // incomplete read as successfully loaded and rendering an empty page.
      if (missingMusicProgressFiles(files).length > 0) {
        await sekaiDataStore.ensureRegionData(target, {
          force: true,
          files: requiredFiles,
          musicMetas: false,
        })
        files = await readSekaiMasterFiles(target, requiredFiles)
      }

      const missingFiles = missingMusicProgressFiles(files)
      if (missingFiles.length > 0) {
        throw new Error(`Incomplete music master data: ${missingFiles.join(", ")}`)
      }
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
