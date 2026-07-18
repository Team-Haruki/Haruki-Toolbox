import { computed, ref, watch, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { buildCatalogCharacterMap, type CatalogCharacter } from "@/shared/sekai/catalog"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import {
  buildMusicLibraryEntries,
  buildOutsideCharacterNameMap,
  findMusicDurationSeconds,
  findMusicLibraryEntry,
  listMusicEventLinks,
  listMusicVocalEntries,
  type MusicEventLink,
  type MusicLibraryEntry,
  type MusicVocalEntry,
} from "../lib/music-data"

const MUSIC_DETAIL_MASTER_FILES = [
  "musics",
  "musicDifficulties",
  "musicTags",
  "musicVocals",
  "gameCharacters",
  "outsideCharacters",
  "events",
  "eventMusics",
] as const

export function useMusicLibraryDetail(region: Ref<SekaiRegion>, musicId: Ref<number | null>) {
  const sekaiDataStore = useSekaiDataStore()
  const entry = ref<MusicLibraryEntry | null>(null)
  const vocals = ref<MusicVocalEntry[]>([])
  const characterMap = ref<Map<number, CatalogCharacter>>(new Map())
  const outsideCharacterNames = ref<Map<number, string>>(new Map())
  const eventLinks = ref<MusicEventLink[]>([])
  const durationSeconds = ref<number | null>(null)
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  const regionState = computed(() => sekaiDataStore.regionStates[region.value])
  const notFound = computed(() => loaded.value && !loading.value && !error.value && entry.value == null)

  watch(
    () => [region.value, musicId.value, regionState.value.masterFetchVersion] as const,
    () => {
      void load()
    },
    { immediate: true },
  )

  async function load() {
    const targetMusicId = musicId.value
    if (targetMusicId == null) {
      entry.value = null
      loaded.value = true
      return
    }

    loading.value = true
    error.value = null
    try {
      if (!hasRequiredFiles(regionState.value.files, MUSIC_DETAIL_MASTER_FILES)) {
        await sekaiDataStore.ensureRegionData(region.value, { files: MUSIC_DETAIL_MASTER_FILES })
      }
      const [files, musicMetas] = await Promise.all([
        readSekaiMasterFiles(region.value, MUSIC_DETAIL_MASTER_FILES),
        readSekaiMusicMetas(region.value),
      ])
      const entries = buildMusicLibraryEntries(
        files.musics,
        files.musicDifficulties,
        files.musicTags,
      )
      entry.value = findMusicLibraryEntry(entries, targetMusicId)
      vocals.value = listMusicVocalEntries(files.musicVocals, targetMusicId)
      characterMap.value = buildCatalogCharacterMap(files.gameCharacters)
      outsideCharacterNames.value = buildOutsideCharacterNameMap(files.outsideCharacters)
      eventLinks.value = listMusicEventLinks(files.eventMusics, files.events, targetMusicId)
      durationSeconds.value = findMusicDurationSeconds(musicMetas, targetMusicId)
    } catch (loadError) {
      entry.value = null
      vocals.value = []
      eventLinks.value = []
      durationSeconds.value = null
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      loading.value = false
      loaded.value = true
    }
  }

  return {
    entry,
    vocals,
    characterMap,
    outsideCharacterNames,
    eventLinks,
    durationSeconds,
    loading,
    error,
    notFound,
    regionState,
    reload: load,
  }
}

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}
