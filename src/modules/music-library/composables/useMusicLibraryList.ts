import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { buildCatalogCharacterMap, type CatalogCharacter } from "@/shared/sekai/catalog"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  MUSIC_TAG_EVENT_BOX,
  MUSIC_TAG_WORLD_LINK,
  applyMusicTagByIds,
  buildMusicLibraryEntries,
  buildMusicVocalCharacterMap,
  listWorldLinkMusicIds,
  type MusicLibraryEntry,
  type MusicVocalCharacterSummary,
} from "../lib/music-data"
import { buildEventBoxMap, buildMusicEventBoxMap, type EventBoxInfo } from "../lib/event-box"
import { listMusicTagOptions, listMusicYearOptions } from "../lib/music-filter"
import { MUSIC_TAG_ORDER } from "../lib/music-labels"

const MUSIC_LIST_MASTER_FILES = [
  "musics",
  "musicDifficulties",
  "musicTags",
  "musicVocals",
  "gameCharacters",
  "events",
  "eventMusics",
  "eventCards",
  "cards",
] as const

export function useMusicLibraryList(region: Ref<SekaiRegion>) {
  const sekaiDataStore = useSekaiDataStore()
  const entries = ref<MusicLibraryEntry[]>([])
  const characterMap = ref<Map<number, CatalogCharacter>>(new Map())
  const musicEventBoxes = ref<Map<number, EventBoxInfo>>(new Map())
  const musicVocalCharacters = ref<Map<number, MusicVocalCharacterSummary>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const tagOptions = computed(() => listMusicTagOptions(entries.value, MUSIC_TAG_ORDER))
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
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      musicEventBoxes.value = buildMusicEventBoxMap(
        files.eventMusics,
        buildEventBoxMap(files.events, files.eventCards, files.cards, files.gameCharacters),
      )
      musicVocalCharacters.value = buildMusicVocalCharacterMap(files.musicVocals)
      entries.value = applyMusicTagByIds(
        applyMusicTagByIds(
          buildMusicLibraryEntries(
            files.musics,
            files.musicDifficulties,
            files.musicTags,
          ),
          musicEventBoxes.value,
          MUSIC_TAG_EVENT_BOX,
        ),
        listWorldLinkMusicIds(files.events, files.eventMusics),
        MUSIC_TAG_WORLD_LINK,
      )
    } catch (loadError) {
      entries.value = []
      characterMap.value = new Map()
      musicEventBoxes.value = new Map()
      musicVocalCharacters.value = new Map()
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
    }
  }

  return {
    entries,
    characterMap,
    musicEventBoxes,
    musicVocalCharacters,
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
