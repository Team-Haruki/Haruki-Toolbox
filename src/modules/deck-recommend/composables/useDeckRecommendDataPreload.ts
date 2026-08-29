import type { ComputedRef, Ref } from "vue"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"
import { mergeMasterFileNames } from "../lib/recommend-form-utils"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import type { useDeckRecommendRunner, DeckRecommendExecutionMode } from "./useDeckRecommendRunner"

export const DECK_RECOMMEND_CARD_OPTION_MASTER_FILES = ["cards", "cardRarities", "gameCharacters", "gameCharacterUnits", "unitProfiles", "areaItems", "areaItemLevels", "areas", "characterRanks", "mysekaiGates", "mysekaiGateLevels"] as const

/**
 * Owns the master-data preload orchestration for DeckRecommend: region data
 * checks, card-option master data loading and parallel engine warm-up. Pure
 * state + functions — the view keeps the triggering watchers and lifecycle
 * hooks so registration order stays unchanged.
 */
export function useDeckRecommendDataPreload(input: {
  runner: ReturnType<typeof useDeckRecommendRunner>
  dataRegion: Ref<SekaiRegion>
  cardOptionMasterData: Ref<Record<string, unknown> | null>
  selectedAccountServer: ComputedRef<SekaiRegion | null>
  recommendDataReady: ComputedRef<boolean>
  executionMode: Ref<DeckRecommendExecutionMode>
  activeAlgorithms: ComputedRef<DeckRecommendAlgorithm[]>
}) {
  const sekaiDataStore = useSekaiDataStore()
  const { runner, dataRegion, cardOptionMasterData } = input
  let dataPreloadGeneration = 0
  let dataPreloadSignature = ""
  let cardOptionMasterDataSignature = ""

  function checkDeckRecommendRegionData(region: SekaiRegion) {
    void sekaiDataStore.ensureRegionData(region, {
      files: mergeMasterFileNames(SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES, DECK_RECOMMEND_CARD_OPTION_MASTER_FILES),
    })
    const accountRegion = input.selectedAccountServer.value
    if (accountRegion && accountRegion !== region) {
      void sekaiDataStore.ensureRegionData(accountRegion, {
        files: ["honors"],
      })
    }
  }

  function preloadCurrentRegionData() {
    if (!input.recommendDataReady.value) {
      return
    }

    const region = dataRegion.value
    const signature = createDataPreloadSignature()
    if (signature !== dataPreloadSignature) {
      dataPreloadSignature = signature
      dataPreloadGeneration += 1
    }
    const generation = dataPreloadGeneration
    const accountHonorRegion = input.selectedAccountServer.value ?? region
    void loadCardOptionMasterData(region, generation).catch(() => undefined)
    void runner.preloadRegionData(region, accountHonorRegion, () => generation === dataPreloadGeneration).catch(() => undefined)
    const parallelCount = input.executionMode.value === "parallel" ? input.activeAlgorithms.value.length : 0
    if (parallelCount > 0) {
      void runner.preloadParallelRegionData(region, parallelCount, accountHonorRegion, () => generation === dataPreloadGeneration).catch(() => undefined)
    }
  }

  function invalidateDataPreload() {
    dataPreloadSignature = ""
    dataPreloadGeneration += 1
  }

  function resetCardOptionMasterData() {
    cardOptionMasterData.value = null
    cardOptionMasterDataSignature = ""
  }

  function createDataPreloadSignature() {
    const regionState = sekaiDataStore.regionStates[dataRegion.value]
    return [
      dataRegion.value,
      input.selectedAccountServer.value ?? "",
      regionState.masterFetchVersion ?? "",
      regionState.musicMetasUpdatedAt ?? "",
      regionState.files.slice().sort((left, right) => left.localeCompare(right)).join(","),
      input.executionMode.value,
      input.activeAlgorithms.value.join(","),
    ].join(":")
  }

  async function loadCardOptionMasterData(region: SekaiRegion, generation: number) {
    const masterVersion = sekaiDataStore.regionStates[region].masterFetchVersion
    if (!masterVersion) {
      return
    }

    const signature = [
      region,
      masterVersion,
      DECK_RECOMMEND_CARD_OPTION_MASTER_FILES
        .map((fileName) => `${fileName}:${sekaiDataStore.regionStates[region].files.includes(fileName) ? "1" : "0"}`)
        .join(","),
    ].join(":")
    if (cardOptionMasterData.value && cardOptionMasterDataSignature === signature) {
      return
    }

    const masterData = await readSekaiMasterFiles(region, DECK_RECOMMEND_CARD_OPTION_MASTER_FILES, masterVersion)
    if (generation !== dataPreloadGeneration || dataRegion.value !== region) {
      return
    }
    if (!Array.isArray(masterData.cards)) {
      return
    }

    cardOptionMasterData.value = masterData
    cardOptionMasterDataSignature = signature
  }

  function syncParallelEngines() {
    if (runner.running.value) {
      return
    }

    const parallelCount = input.executionMode.value === "parallel" ? input.activeAlgorithms.value.length : 0
    void runner.preloadParallelEngines(parallelCount)
      .then(() => {
        if (parallelCount > 0 && input.recommendDataReady.value) {
          preloadCurrentRegionData()
        }
      })
      .catch(() => undefined)
  }

  return {
    checkDeckRecommendRegionData,
    preloadCurrentRegionData,
    invalidateDataPreload,
    resetCardOptionMasterData,
    syncParallelEngines,
  }
}
