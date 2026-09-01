import { computed, type ComputedRef, type Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { CatalogCharacter, SekaiUnit } from "@/shared/sekai/catalog"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { EventBoxInfo } from "@/modules/music-library/lib/event-box"
import type { MusicLibraryEntry, MusicVocalCharacterSummary } from "@/modules/music-library/lib/music-data"
import {
  listMusicCategoryOptions,
  listMusicTagOptions,
  listMusicYearOptions,
  resolveMusicLevelBounds,
} from "@/modules/music-library/lib/music-filter"
import { MUSIC_CATEGORY_ORDER, MUSIC_TAG_ORDER } from "@/modules/music-library/lib/music-labels"
import { useMusicEventContext } from "./useMusicEventContext"
import { useMusicsIndex } from "./useMusicsIndex"
import { useMusicVocalsResource } from "./useMusicVocalsResource"

const EMPTY_ENTRIES: MusicLibraryEntry[] = []

export type MusicCatalogList = {
  /** Every song with the synthetic box / World Link tags applied. */
  entries: ComputedRef<MusicLibraryEntry[]>
  characters: ComputedRef<CatalogCharacter[]>
  characterMap: ComputedRef<Map<number, CatalogCharacter>>
  unitColorMap: ComputedRef<Map<SekaiUnit, string> | null>
  musicEventBoxes: ComputedRef<Map<number, EventBoxInfo>>
  musicVocalCharacters: ComputedRef<Map<number, MusicVocalCharacterSummary>>
  tagOptions: ComputedRef<string[]>
  categoryOptions: ComputedRef<string[]>
  yearOptions: ComputedRef<number[]>
  levelBounds: ComputedRef<{ min: number; max: number } | null>
  /** jp ships no `categories`; the MV filter hides itself when false. */
  hasCategories: ComputedRef<boolean>
  /** First load of the song index (no entries yet). */
  loading: ComputedRef<boolean>
  /** Any of the backing resources is (re)loading. */
  refreshing: ComputedRef<boolean>
  error: Ref<string | null>
  warning: Ref<string | null>
  ready: ComputedRef<boolean>
  regionState: ComputedRef<ReturnType<typeof useSekaiDataStore>["regionStates"][SekaiRegion]>
  reload: () => Promise<void>
}

/**
 * The `/music` list built on the canonical indexes. Songs render as soon as
 * the musics index is ready; box hints, World Link tags and singer filters
 * fill in when the events / cards / vocals resources arrive.
 */
export function useMusicCatalogList(region: Ref<SekaiRegion>): MusicCatalogList {
  const sekaiDataStore = useSekaiDataStore()
  const musics = useMusicsIndex(region)
  const vocals = useMusicVocalsResource(region)
  const context = useMusicEventContext(region)
  const { characters } = context

  const entries = computed(() => context.tagEntries(musics.data.value?.entries ?? EMPTY_ENTRIES))

  const resources = [musics, vocals, context.events, context.cards, characters, context.eventMusics]

  return {
    entries,
    characters: computed(() => characters.data.value?.characters ?? []),
    characterMap: computed(() => characters.data.value?.characterMap ?? new Map<number, CatalogCharacter>()),
    unitColorMap: computed(() => characters.data.value?.unitColorMap ?? null),
    musicEventBoxes: context.musicEventBoxes,
    musicVocalCharacters: computed(
      () => vocals.data.value?.characterSummaries ?? new Map<number, MusicVocalCharacterSummary>(),
    ),
    tagOptions: computed(() => listMusicTagOptions(entries.value, MUSIC_TAG_ORDER)),
    categoryOptions: computed(() => listMusicCategoryOptions(entries.value, MUSIC_CATEGORY_ORDER)),
    yearOptions: computed(() => listMusicYearOptions(entries.value)),
    levelBounds: computed(() => resolveMusicLevelBounds(entries.value)),
    hasCategories: computed(() => musics.data.value?.hasCategories ?? false),
    loading: computed(() => musics.loading.value),
    refreshing: computed(() => resources.some((resource) => resource.refreshing.value)),
    error: musics.error,
    warning: musics.warning,
    ready: musics.ready,
    regionState: computed(() => sekaiDataStore.regionStates[region.value]),
    reload: async () => {
      await Promise.all(resources.map((resource) => resource.reload()))
    },
  }
}
