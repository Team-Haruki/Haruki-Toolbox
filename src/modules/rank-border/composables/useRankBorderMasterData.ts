import { computed, shallowRef, watch, type Ref, type ShallowRef } from "vue"
import { readSekaiMasterFile } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"
import {
  buildEventOptions,
  buildWorldBloomCharacterOptions,
  type RankBorderEventOption,
  type RankBorderMasterBondsHonor,
  type RankBorderMasterBondsHonorWord,
  type RankBorderMasterCard,
  type RankBorderMasterGameCharacterUnit,
  type RankBorderMasterHonor,
  type RankBorderMasterHonorGroup,
  type RankBorderWorldBloomCharacterOption,
  type SekaiEvent,
  type SekaiGameCharacter,
  type SekaiWorldBloom,
} from "../lib/master-data-types"

const REQUIRED_FILES = ["events", "worldBlooms", "gameCharacters"] as const
const PROFILE_ASSET_FILES = ["cards", "honors", "honorGroups", "bondsHonors", "bondsHonorWords", "gameCharacterUnits"] as const

/**
 * MODULE-LEVEL master-data cache for the rank-border feature.
 *
 * The refs below outlive any component instance, so revisiting /rank-border
 * reuses the already-parsed master tables instead of replaying the
 * IndexedDB + worker + JSON.parse waterfall on every route entry. Arrays are
 * shallowRefs on purpose: the tables hold thousands of records and never
 * mutate in place, so deep reactivity would only add proxy overhead.
 */
type RegionMasterEntry = {
  events: ShallowRef<SekaiEvent[]>
  worldBlooms: ShallowRef<SekaiWorldBloom[]>
  gameCharacters: ShallowRef<SekaiGameCharacter[]>
  cards: ShallowRef<RankBorderMasterCard[]>
  honors: ShallowRef<RankBorderMasterHonor[]>
  honorGroups: ShallowRef<RankBorderMasterHonorGroup[]>
  bondsHonors: ShallowRef<RankBorderMasterBondsHonor[]>
  bondsHonorWords: ShallowRef<RankBorderMasterBondsHonorWord[]>
  gameCharacterUnits: ShallowRef<RankBorderMasterGameCharacterUnit[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  coreLoadedVersion: number | null
  assetsLoadedVersion: number | null
  corePromise: Promise<void> | null
  assetsPromise: Promise<void> | null
}

const regionEntries = new Map<SekaiRegion, RegionMasterEntry>()

function getRegionEntry(region: SekaiRegion): RegionMasterEntry {
  let entry = regionEntries.get(region)
  if (!entry) {
    entry = {
      events: shallowRef([]),
      worldBlooms: shallowRef([]),
      gameCharacters: shallowRef([]),
      cards: shallowRef([]),
      honors: shallowRef([]),
      honorGroups: shallowRef([]),
      bondsHonors: shallowRef([]),
      bondsHonorWords: shallowRef([]),
      gameCharacterUnits: shallowRef([]),
      loading: shallowRef(false),
      error: shallowRef(null),
      coreLoadedVersion: null,
      assetsLoadedVersion: null,
      corePromise: null,
      assetsPromise: null,
    }
    regionEntries.set(region, entry)
  }
  return entry
}

export function useRankBorderMasterData(region: Ref<SekaiRegion>, selectedEventId: Ref<string | null>) {
  const sekaiDataStore = useSekaiDataStore()

  const entry = computed(() => getRegionEntry(region.value))
  const regionState = computed(() => sekaiDataStore.regionStates[region.value])

  const events = computed(() => entry.value.events.value)
  const worldBlooms = computed(() => entry.value.worldBlooms.value)
  const gameCharacters = computed(() => entry.value.gameCharacters.value)
  const cards = computed(() => entry.value.cards.value)
  const honors = computed(() => entry.value.honors.value)
  const honorGroups = computed(() => entry.value.honorGroups.value)
  const bondsHonors = computed(() => entry.value.bondsHonors.value)
  const bondsHonorWords = computed(() => entry.value.bondsHonorWords.value)
  const gameCharacterUnits = computed(() => entry.value.gameCharacterUnits.value)
  const loading = computed(() => entry.value.loading.value)
  const error = computed(() => entry.value.error.value)

  const eventOptions = computed<RankBorderEventOption[]>(() =>
    buildEventOptions(events.value, worldBlooms.value),
  )
  const selectedEvent = computed(() =>
    eventOptions.value.find((option) => option.value === selectedEventId.value) ?? null,
  )
  const worldBloomCharacterOptions = computed<RankBorderWorldBloomCharacterOption[]>(() =>
    buildWorldBloomCharacterOptions(selectedEventId.value, worldBlooms.value, gameCharacters.value),
  )

  watch(
    () => [region.value, regionState.value.masterFetchVersion] as const,
    () => {
      void loadCore()
    },
    { immediate: true },
  )

  async function loadCore(force = false) {
    const target = getRegionEntry(region.value)
    const version = regionState.value.masterFetchVersion
    if (!force && target.coreLoadedVersion === version && target.events.value.length > 0) {
      return
    }
    if (!force && target.corePromise) {
      return target.corePromise
    }

    const targetRegion = region.value
    const promise = (async () => {
      target.loading.value = true
      target.error.value = null
      try {
        if (force || !hasRequiredFiles(regionState.value.files, REQUIRED_FILES)) {
          await sekaiDataStore.ensureRegionData(targetRegion, { force, files: REQUIRED_FILES })
        }

        const [eventData, worldBloomData, characterData] = await Promise.all([
          readSekaiMasterFile<SekaiEvent[]>(targetRegion, "events"),
          readSekaiMasterFile<SekaiWorldBloom[]>(targetRegion, "worldBlooms"),
          readSekaiMasterFile<SekaiGameCharacter[]>(targetRegion, "gameCharacters"),
        ])
        target.events.value = Array.isArray(eventData) ? eventData : []
        target.worldBlooms.value = Array.isArray(worldBloomData) ? worldBloomData : []
        target.gameCharacters.value = Array.isArray(characterData) ? characterData : []
        target.coreLoadedVersion = version
      } catch (loadError) {
        target.events.value = []
        target.worldBlooms.value = []
        target.gameCharacters.value = []
        target.coreLoadedVersion = null
        target.error.value = loadError instanceof Error ? loadError.message : String(loadError)
      } finally {
        target.loading.value = false
        if (target.corePromise === promise) {
          target.corePromise = null
        }
      }
    })()
    target.corePromise = promise
    return promise
  }

  async function loadProfileAssets(force = false) {
    const target = getRegionEntry(region.value)
    const version = regionState.value.masterFetchVersion
    if (!force && target.assetsLoadedVersion === version && target.cards.value.length > 0) {
      return
    }
    if (!force && target.assetsPromise) {
      return target.assetsPromise
    }

    const targetRegion = region.value
    const promise = (async () => {
      try {
        if (force || !hasRequiredFiles(regionState.value.files, PROFILE_ASSET_FILES)) {
          await sekaiDataStore.ensureRegionData(targetRegion, { force, files: PROFILE_ASSET_FILES })
        }

        const [cardData, honorData, honorGroupData, bondsHonorData, bondsHonorWordData, gameCharacterUnitData] = await Promise.all([
          readOptionalMasterFile<RankBorderMasterCard[]>(targetRegion, "cards"),
          readOptionalMasterFile<RankBorderMasterHonor[]>(targetRegion, "honors"),
          readOptionalMasterFile<RankBorderMasterHonorGroup[]>(targetRegion, "honorGroups"),
          readOptionalMasterFile<RankBorderMasterBondsHonor[]>(targetRegion, "bondsHonors"),
          readOptionalMasterFile<RankBorderMasterBondsHonorWord[]>(targetRegion, "bondsHonorWords"),
          readOptionalMasterFile<RankBorderMasterGameCharacterUnit[]>(targetRegion, "gameCharacterUnits"),
        ])
        target.cards.value = Array.isArray(cardData) ? cardData : []
        target.honors.value = Array.isArray(honorData) ? honorData : []
        target.honorGroups.value = Array.isArray(honorGroupData) ? honorGroupData : []
        target.bondsHonors.value = Array.isArray(bondsHonorData) ? bondsHonorData : []
        target.bondsHonorWords.value = Array.isArray(bondsHonorWordData) ? bondsHonorWordData : []
        target.gameCharacterUnits.value = Array.isArray(gameCharacterUnitData) ? gameCharacterUnitData : []
        target.assetsLoadedVersion = version
      } catch {
        target.assetsLoadedVersion = null
      } finally {
        if (target.assetsPromise === promise) {
          target.assetsPromise = null
        }
      }
    })()
    target.assetsPromise = promise
    return promise
  }

  return {
    eventOptions,
    selectedEvent,
    worldBloomCharacterOptions,
    cards,
    honors,
    honorGroups,
    bondsHonors,
    bondsHonorWords,
    gameCharacterUnits,
    loading,
    error,
    reload: () => loadCore(true),
    loadProfileAssets,
  }
}

export type RankBorderMasterData = ReturnType<typeof useRankBorderMasterData>

function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}

async function readOptionalMasterFile<T>(region: SekaiRegion, fileName: string): Promise<T | null> {
  try {
    return await readSekaiMasterFile<T>(region, fileName)
  } catch {
    return null
  }
}
