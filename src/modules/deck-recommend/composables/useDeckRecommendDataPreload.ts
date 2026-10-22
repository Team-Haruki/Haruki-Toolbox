import type { ComputedRef, Ref, ShallowRef } from "vue"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import type { SekaiRegion } from "@/types"
import { mergeMasterFileNames } from "../lib/recommend-form-utils"
import { DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES, readDeckRecommendMainThreadMaster } from "../lib/main-thread-master"
import type { DeckRecommendAlgorithm } from "../lib/recommend-options"
import {
  getDeckRecommendDeviceProfile,
  resolveDeckRecommendWorkerCount,
  type DeckRecommendExecutionMode,
} from "../lib/worker-pool-policy"
import type { useDeckRecommendRunner } from "./useDeckRecommendRunner"

/**
 * Owns the master-data preload orchestration for DeckRecommend: region data
 * checks, page-side master loading and engine warm-up. Pure state +
 * functions — the view keeps the triggering watchers and lifecycle hooks so
 * registration order stays unchanged.
 *
 * The page never parses the engine's master set: the engine workers read it
 * from IndexedDB themselves, and the page keeps only the lite tables it
 * renders with (`main-thread-master`).
 */
export function useDeckRecommendDataPreload(input: {
  runner: ReturnType<typeof useDeckRecommendRunner>
  dataRegion: Ref<SekaiRegion>
  cardOptionMasterData: ShallowRef<Record<string, unknown> | null>
  selectedAccountServer: ComputedRef<SekaiRegion | null>
  recommendDataReady: ComputedRef<boolean>
  executionMode: Ref<DeckRecommendExecutionMode>
  activeAlgorithms: ComputedRef<DeckRecommendAlgorithm[]>
}) {
  const sekaiDataStore = useSekaiDataStore()
  const deviceProfile = getDeckRecommendDeviceProfile()
  const { runner, dataRegion, cardOptionMasterData } = input
  let dataPreloadGeneration = 0
  let dataPreloadSignature = ""
  let cardOptionMasterDataSignature = ""

  function workerCount(): number {
    return resolveDeckRecommendWorkerCount(input.executionMode.value, input.activeAlgorithms.value.length, deviceProfile)
  }

  function checkDeckRecommendRegionData(region: SekaiRegion) {
    void sekaiDataStore.ensureRegionData(region, {
      files: mergeMasterFileNames(SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES, DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES),
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
    void runner.preloadRegionData(region, accountHonorRegion, () => generation === dataPreloadGeneration, workerCount())
      .catch(() => undefined)
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
      String(workerCount()),
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
      DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES
        .map((fileName) => `${fileName}:${sekaiDataStore.regionStates[region].files.includes(fileName) ? "1" : "0"}`)
        .join(","),
    ].join(":")
    if (cardOptionMasterData.value && cardOptionMasterDataSignature === signature) {
      return
    }

    const masterData = await readDeckRecommendMainThreadMaster(region, masterVersion)
    if (generation !== dataPreloadGeneration || dataRegion.value !== region) {
      return
    }
    if (!Array.isArray(masterData.cards)) {
      return
    }

    cardOptionMasterData.value = masterData
    cardOptionMasterDataSignature = signature
  }

  /**
   * Sizes the engine pool to the current execution mode and algorithm
   * selection, then fills any new engine with the region data.
   */
  function syncWorkerPool() {
    if (runner.running.value) {
      return
    }

    void runner.preloadEngine(workerCount())
      .then(() => {
        if (input.recommendDataReady.value) {
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
    syncWorkerPool,
  }
}
