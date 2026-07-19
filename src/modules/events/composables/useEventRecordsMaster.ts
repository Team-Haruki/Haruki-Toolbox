import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { buildCatalogCharacterMap, type CatalogCharacter } from "@/shared/sekai/catalog"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { normalizeEventItems, type SekaiEventItem } from "../lib/event-filter"
import { buildEventsById, buildWorldBloomChapterNoIndex } from "../lib/event-records"

const RECORD_FILES = ["events", "gameCharacters", "worldBlooms"] as const

/**
 * Masterdata needed by the event records page, driven by the selected game
 * account's server (not the catalog region). Reloads whenever the account —
 * and therefore the region — changes.
 */
export function useEventRecordsMaster(region: Ref<SekaiRegion | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const eventsById = ref<Map<number, SekaiEventItem>>(new Map())
  const characterMap = ref<Map<number, CatalogCharacter>>(new Map())
  const chapterNoIndex = ref<Map<string, number>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() =>
    region.value ? sekaiDataStore.regionStates[region.value] : null,
  )

  watch(
    () => [region.value, regionState.value?.masterFetchVersion],
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load(force = false) {
    const currentRegion = region.value
    if (!currentRegion) {
      eventsById.value = new Map()
      characterMap.value = new Map()
      chapterNoIndex.value = new Map()
      error.value = null
      loading.value = false
      return
    }

    loading.value = true
    error.value = null
    try {
      const state = sekaiDataStore.regionStates[currentRegion]
      if (force || !RECORD_FILES.every((file) => state.files.includes(file))) {
        await sekaiDataStore.ensureRegionData(currentRegion, { force, files: RECORD_FILES })
      }

      const files = await readSekaiMasterFiles(currentRegion, RECORD_FILES)
      if (region.value !== currentRegion) {
        // The selected account changed while loading; the new watch run owns the state.
        return
      }

      eventsById.value = buildEventsById(normalizeEventItems(files.events))
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      chapterNoIndex.value = buildWorldBloomChapterNoIndex(files.worldBlooms)
    } catch (loadError) {
      if (region.value !== currentRegion) {
        return
      }

      eventsById.value = new Map()
      characterMap.value = new Map()
      chapterNoIndex.value = new Map()
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      if (region.value === currentRegion || !region.value) {
        loading.value = false
      }
    }
  }

  return {
    eventsById,
    characterMap,
    chapterNoIndex,
    loading,
    error,
    reload: () => load(true),
  }
}
