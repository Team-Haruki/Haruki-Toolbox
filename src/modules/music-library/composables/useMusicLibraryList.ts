import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { buildMusicLibraryEntries, type MusicLibraryEntry } from "../lib/music-data"
import { listMusicTagOptions, listMusicYearOptions } from "../lib/music-filter"

const MUSIC_LIST_MASTER_FILES = ["musics", "musicDifficulties", "musicTags"] as const

export function useMusicLibraryList(region: Ref<SekaiRegion>) {
  const sekaiDataStore = useSekaiDataStore()
  const entries = ref<MusicLibraryEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const tagOptions = computed(() => listMusicTagOptions(entries.value))
  const yearOptions = computed(() => listMusicYearOptions(entries.value))

  watch(
    () => [region.value, regionState.value.masterFetchVersion] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load() {
    loading.value = true
    error.value = null
    try {
      if (!hasRequiredFiles(regionState.value.files, MUSIC_LIST_MASTER_FILES)) {
        await sekaiDataStore.ensureRegionData(region.value, { files: MUSIC_LIST_MASTER_FILES })
      }
      const files = await readSekaiMasterFiles(region.value, MUSIC_LIST_MASTER_FILES)
      entries.value = buildMusicLibraryEntries(
        files.musics,
        files.musicDifficulties,
        files.musicTags,
      )
    } catch (loadError) {
      entries.value = []
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    tagOptions,
    yearOptions,
    loading,
    error,
    regionState,
    reload: load,
  }
}

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}
