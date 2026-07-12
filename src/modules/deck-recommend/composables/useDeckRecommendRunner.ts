import { computed, ref } from "vue"
import type { RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFile, readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useUserStore } from "@/shared/stores/user"
import {
  SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES,
  SEKAI_DATA_RECOMMEND_MASTER_FILES,
} from "@/shared/sekai/worker-protocol"
import {
  buildDeckRecommendOptions,
  resolveRecommendDataMode,
  resolveCurrentDeckCardsWithProfile,
  type DeckRecommendAlgorithm,
  type DeckRecommendEventAttr,
  type DeckRecommendEventSimulationInput,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
  type DeckRecommendTarget,
  type DeckRecommendSkillOrderStrategy,
  type DeckRecommendSkillReferenceStrategy,
  type DeckRecommendSupportUnitType,
  type DeckRecommendUnitType,
} from "../lib/recommend-options"
import {
  applyDeckRecommendLiveBoost,
  mergeDeckRecommendResults,
  type TaggedRecommendResult,
} from "../lib/recommend-results"
import { mapRecommendBatchResults } from "../lib/recommend-batch"
import {
  createDeckRecommendWorker,
  disposeDeckRecommendWorker,
  loadDeckRecommendWorkerData,
  postDeckRecommendWorkerRequest,
  subscribeDeckRecommendWorker,
  warmDeckRecommendWorker,
} from "../lib/recommend-worker-client"
import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerRequest,
  DeckRecommendWorkerRecommendBatchRequest,
  DeckRecommendWorkerRecommendRequest,
} from "../lib/worker-protocol"
import type { CardTrainingConfig } from "../lib/training-config"
import {
  fetchDeckRecommendProfileWithCache,
  fetchDeckRecommendUserDataWithCache,
  type DeckRecommendUserDataFetchResult,
} from "../lib/user-data"
import {
  applyChallengeScoreDelta,
  createPreparedDeckRecommendUserDataString,
  type DeckRecommendAreaItemLevelOverride,
  type DeckRecommendCharacterRankOverride,
  type DeckRecommendMysekaiFixtureBonusRateOverride,
  type DeckRecommendMysekaiGateLevelOverride,
  type DeckRecommendSingleCardOverride,
} from "../lib/user-data-preparation"
import { prepareRecommendUserDataForWasm } from "../lib/wasm-user-data"

export type DeckRecommendExecutionMode = "sequential" | "parallel"

export type DeckRecommendRunnerAccount = {
  server: SekaiRegion
  uid: string
}

export type DeckRecommendRunnerInput = {
  account: DeckRecommendRunnerAccount | null
  dataRegion: SekaiRegion
  mode: DeckRecommendMode
  target: DeckRecommendTarget
  liveType: DeckRecommendLiveType
  algorithms: DeckRecommendAlgorithm[]
  executionMode: DeckRecommendExecutionMode
  eventId: string | null
  characterId: string | null
  forcedLeaderCharacterId: string | null
  eventSimulation: DeckRecommendEventSimulationInput
  targetBonuses: readonly number[]
  customBonusAttr: DeckRecommendEventAttr | null
  customBonusCharacterIds: readonly number[]
  customBonusCharacterSupportUnits: Readonly<Record<string, DeckRecommendSupportUnitType>>
  filterOtherUnit: boolean
  multiLiveTeammatePower: number | null
  multiLiveTeammateScoreUp: number | null
  multiLiveScoreUpLowerBound: number | null
  boost: number | null
  areaItemLevel: number | null
  areaItemLevelOverrides: readonly DeckRecommendAreaItemLevelOverride[]
  characterRank: number | null
  characterRankOverrides: readonly DeckRecommendCharacterRankOverride[]
  mysekaiGateLevel: number | null
  mysekaiGateLevelOverrides: readonly DeckRecommendMysekaiGateLevelOverride[]
  mysekaiFixtureBonusRate: number | null
  mysekaiFixtureBonusRateOverrides: readonly DeckRecommendMysekaiFixtureBonusRateOverride[]
  resultLimit: number | null
  timeoutMs: number | null
  unitFilters: readonly DeckRecommendUnitType[]
  attrFilters: readonly DeckRecommendEventAttr[]
  characterFilters: readonly number[]
  fixedCards: readonly number[]
  useCurrentDeck: boolean
  fixedCharacters: readonly number[]
  excludedCards: readonly number[]
  singleCardOverrides: readonly DeckRecommendSingleCardOverride[]
  skillOrderStrategy: DeckRecommendSkillOrderStrategy
  skillReferenceStrategy: DeckRecommendSkillReferenceStrategy
  specificSkillOrder: readonly number[]
  keepAfterTrainingState: boolean
  supportMasterMax: boolean
  supportSkillMax: boolean
  musicId: string | null
  difficulty: string | null
  trainingConfig: CardTrainingConfig[]
}

export type DeckRecommendAlgorithmTiming = {
  algorithm: DeckRecommendAlgorithm
  elapsedMs: number
}

export function useDeckRecommendRunner() {
  const userStore = useUserStore()
  const sekaiDataStore = useSekaiDataStore()
  const running = ref(false)
  const phase = ref<Extract<DeckRecommendWorkerEvent, { type: "progress" }>["phase"] | "fetching-user-data" | "preparing-data" | null>(null)
  const error = ref<string | null>(null)
  const result = ref<TaggedRecommendResult | null>(null)
  const masterData = ref<Record<string, unknown> | null>(null)
  const elapsedMs = ref<number | null>(null)
  const dataElapsedMs = ref<number | null>(null)
  const engineDataElapsedMs = ref<number | null>(null)
  const recommendElapsedMs = ref<number | null>(null)
  const resultExecutionMode = ref<DeckRecommendExecutionMode | null>(null)
  const algorithmTimings = ref<DeckRecommendAlgorithmTiming[]>([])
  const userDataRefreshing = ref(false)
  const userDataCacheHit = ref<boolean | null>(null)
  const userDataCacheUpdatedAt = ref<number | null>(null)
  const userDataRemoteUploadTime = ref<number | null>(null)
  const preloadedDataKeys = new Set<string>()
  const dataPreloadPromises = new Map<string, Promise<void>>()
  const parallelWorkers: ParallelWorkerEntry[] = []

  const hasResult = computed(() => Boolean(result.value?.decks?.length))

  async function run(input: DeckRecommendRunnerInput) {
    if (!userStore.userId) {
      throw new Error("toolbox user is required")
    }
    if (!input.account) {
      throw new Error("game account is required")
    }
    running.value = true
    phase.value = "preparing-data"
    error.value = null
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = input.executionMode
    algorithmTimings.value = []

    try {
      const runStartedAt = performance.now()
      const dataStartedAt = performance.now()
      const [recommendData, userDataResponse, profileData] = await Promise.all([
        readRecommendCacheData(input.dataRegion, input.account.server),
        fetchUserData(input),
        input.useCurrentDeck ? fetchUserProfile(input) : Promise.resolve(null),
      ])
      dataElapsedMs.value = createElapsedMs(dataStartedAt)
      masterData.value = recommendData.masterData
      const algorithms = normalizeAlgorithms(input.algorithms)
      if (algorithms.length === 0) {
        throw new Error("at least one algorithm is required")
      }
      const currentDeckCards = input.useCurrentDeck
        ? resolveCurrentDeckCardsWithProfile(userDataResponse.userData, profileData)
        : []
      if (input.useCurrentDeck && currentDeckCards.length !== 5) {
        throw new Error("current deck requires 5 cards")
      }
      const compactUserData = prepareRecommendUserDataForWasm(userDataResponse.userData)
      const preparedUserData = createPreparedDeckRecommendUserDataString({
        userData: compactUserData,
        masterData: recommendData.masterData,
        unitFilters: input.unitFilters,
        attrFilters: input.attrFilters,
        characterFilters: input.characterFilters,
        areaItemLevel: input.areaItemLevel,
        areaItemLevelOverrides: input.areaItemLevelOverrides,
        characterRank: input.characterRank,
        characterRankOverrides: input.characterRankOverrides,
        mysekaiGateLevel: input.mysekaiGateLevel,
        mysekaiGateLevelOverrides: input.mysekaiGateLevelOverrides,
        mysekaiFixtureBonusRate: input.mysekaiFixtureBonusRate,
        mysekaiFixtureBonusRateOverrides: input.mysekaiFixtureBonusRateOverrides,
        singleCardOverrides: input.singleCardOverrides,
        trainingConfig: input.trainingConfig,
      })

      phase.value = "initializing"
      const shouldRunInParallel = input.executionMode === "parallel"
      const engineDataStartedAt = performance.now()
      if (shouldRunInParallel) {
        await ensureParallelRegionDataPreloaded(input.dataRegion, recommendData, algorithms.length)
      } else {
        await ensureRegionDataPreloaded(input.dataRegion, recommendData)
      }
      engineDataElapsedMs.value = createElapsedMs(engineDataStartedAt)

      const recommendStartedAt = performance.now()
      const workerInputs = algorithms.map((algorithm) => ({
        algorithm,
        request: {
          region: input.dataRegion,
          masterVersion: recommendData.engineMasterVersion,
          musicMetasKey: recommendData.musicMetasKey,
          masterFileNames: recommendData.masterFileNames,
          options: buildDeckRecommendOptions({
            region: input.dataRegion,
            mode: input.mode,
            target: input.target,
            liveType: input.liveType,
            algorithm,
            musicId: input.musicId,
            musicDifficulty: input.difficulty,
            eventId: input.eventId,
            characterId: input.characterId,
            forcedLeaderCharacterId: input.forcedLeaderCharacterId,
            eventSimulation: input.eventSimulation,
            targetBonuses: input.targetBonuses,
            customBonusAttr: input.customBonusAttr,
            customBonusCharacterIds: input.customBonusCharacterIds,
            customBonusCharacterSupportUnits: input.customBonusCharacterSupportUnits,
            filterOtherUnit: input.filterOtherUnit,
            multiLiveTeammatePower: input.multiLiveTeammatePower,
            multiLiveTeammateScoreUp: input.multiLiveTeammateScoreUp,
            multiLiveScoreUpLowerBound: input.multiLiveScoreUpLowerBound,
            boost: input.boost,
            areaItemLevel: input.areaItemLevel,
            limit: input.resultLimit ?? undefined,
            timeoutMs: input.timeoutMs ?? undefined,
            fixedCards: input.fixedCards,
            currentDeckCards,
            useCurrentDeck: input.useCurrentDeck,
            fixedCharacters: input.fixedCharacters,
            excludedCards: input.excludedCards,
            singleCardConfigs: preparedUserData.singleCardConfigs,
            skillOrderStrategy: input.skillOrderStrategy,
            skillReferenceStrategy: input.skillReferenceStrategy,
            specificSkillOrder: input.specificSkillOrder,
            keepAfterTrainingState: input.keepAfterTrainingState,
            supportMasterMax: input.supportMasterMax,
            supportSkillMax: input.supportSkillMax,
            trainingConfig: input.trainingConfig,
            userData: preparedUserData.userDataString,
          }),
        },
      }))
      const handleWorkerEvent = (event: DeckRecommendWorkerEvent) => {
        if (event.type === "progress") {
          phase.value = event.phase
        }
      }
      const workerResults = shouldRunInParallel
        ? await runAlgorithmsInParallel(workerInputs, handleWorkerEvent, parallelWorkers)
        : await runAlgorithmsSequentially(workerInputs, handleWorkerEvent)

      const resultWithChallengeDelta = input.mode === "challenge"
        ? workerResults.map((workerResult) => ({
            ...workerResult,
            result: {
              ...workerResult.result,
              decks: applyChallengeScoreDelta(workerResult.result.decks, compactUserData, input.characterId),
            },
          }))
        : workerResults
      const resultWithLiveBoost = applyDeckRecommendLiveBoost(resultWithChallengeDelta, input.mode, input.boost)
      result.value = mergeDeckRecommendResults(resultWithLiveBoost, input.mode, input.target)
      algorithmTimings.value = workerResults.map(({ algorithm, elapsedMs }) => ({ algorithm, elapsedMs }))
      recommendElapsedMs.value = createElapsedMs(recommendStartedAt)
      elapsedMs.value = createElapsedMs(runStartedAt)
    } catch (runError) {
      const message = normalizeErrorMessage(runError)
      error.value = message
      throw runError
    } finally {
      running.value = false
      phase.value = null
    }
  }

  function reset() {
    if (running.value) {
      return
    }

    phase.value = null
    error.value = null
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = null
    algorithmTimings.value = []
  }

  async function fetchUserData(input: DeckRecommendRunnerInput) {
    phase.value = "fetching-user-data"
    const result = await fetchDeckRecommendUserDataWithCache({
      toolboxUserId: userStore.userId || "",
      server: input.account?.server ?? input.dataRegion,
      gameUserId: input.account?.uid ?? "",
      mode: resolveRecommendDataMode(input.mode),
    }, { strategy: "prefer-cache" })
    applyUserDataCacheStatus(result)
    return result.data
  }

  async function fetchUserProfile(input: DeckRecommendRunnerInput): Promise<unknown | null> {
    try {
      const result = await fetchDeckRecommendProfileWithCache({
        toolboxUserId: userStore.userId || "",
        server: input.account?.server ?? input.dataRegion,
        gameUserId: input.account?.uid ?? "",
      })
      return result.data
    } catch {
      return null
    }
  }

  async function refreshUserData(input: { account: DeckRecommendRunnerAccount | null; mode: DeckRecommendMode }) {
    if (!userStore.userId) {
      throw new Error("toolbox user is required")
    }
    if (!input.account) {
      throw new Error("game account is required")
    }

    userDataRefreshing.value = true
    try {
      const result = await fetchDeckRecommendUserDataWithCache({
        toolboxUserId: userStore.userId,
        server: input.account.server,
        gameUserId: input.account.uid,
        mode: resolveRecommendDataMode(input.mode),
      })
      applyUserDataCacheStatus(result)
      return result
    } finally {
      userDataRefreshing.value = false
    }
  }

  async function preloadRegionData(
    region: SekaiRegion,
    accountHonorRegion: SekaiRegion = region,
    isCurrent: () => boolean = () => true,
  ) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      return
    }

    const dataKey = createRecommendDataKey(
      region,
      regionState.masterFetchVersion,
      accountHonorRegion,
      sekaiDataStore.regionStates[accountHonorRegion].masterFetchVersion ?? "unknown-honors",
      createMusicMetasKey(regionState.musicMetasUpdatedAt),
      SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES,
    )
    if (preloadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = dataPreloadPromises.get(dataKey)
    if (runningPreload) {
      return runningPreload
    }

    const preloadPromise = (async () => {
      const recommendData = await readRecommendCacheData(region, accountHonorRegion)
      const loadedDataKey = createRecommendDataKey(
        region,
        recommendData.masterVersion,
        recommendData.accountHonorRegion,
        recommendData.accountHonorMasterVersion ?? "unknown-honors",
        recommendData.musicMetasKey,
        recommendData.masterFileNames,
      )
      if (loadedDataKey !== dataKey || !isCurrent()) {
        return
      }

      await loadRecommendDataIntoWorker(region, recommendData, dataKey, isCurrent)
    })().finally(() => {
      dataPreloadPromises.delete(dataKey)
    })

    dataPreloadPromises.set(dataKey, preloadPromise)
    return preloadPromise
  }

  async function preloadParallelEngines(count: number) {
    await ensureParallelWorkerPool(count)
  }

  async function preloadParallelRegionData(
    region: SekaiRegion,
    count: number,
    accountHonorRegion: SekaiRegion = region,
    isCurrent: () => boolean = () => true,
  ) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      await ensureParallelWorkerPool(count)
      return
    }

    const recommendData = await readRecommendCacheData(region, accountHonorRegion)
    await ensureParallelRegionDataPreloaded(region, recommendData, count, isCurrent)
  }

  async function ensureParallelRegionDataPreloaded(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    count: number,
    isCurrent: () => boolean = () => true,
  ) {
    await ensureParallelWorkerPool(count)
    const dataKey = createRecommendDataKey(
      region,
      recommendData.masterVersion,
      recommendData.accountHonorRegion,
      recommendData.accountHonorMasterVersion ?? "unknown-honors",
      recommendData.musicMetasKey,
      recommendData.masterFileNames,
    )
    if (!isCurrent()) {
      return
    }

    await Promise.all(parallelWorkers.slice(0, normalizeParallelWorkerCount(count)).map((entry) =>
      loadRecommendDataIntoParallelWorker(entry, region, recommendData, dataKey, isCurrent),
    ))
  }

  async function ensureRegionDataPreloaded(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    isCurrent: () => boolean = () => true,
  ) {
    const dataKey = createRecommendDataKey(
      region,
      recommendData.masterVersion,
      recommendData.accountHonorRegion,
      recommendData.accountHonorMasterVersion ?? "unknown-honors",
      recommendData.musicMetasKey,
      recommendData.masterFileNames,
    )
    if (preloadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = dataPreloadPromises.get(dataKey)
    if (runningPreload) {
      await runningPreload
      return
    }

    const preloadPromise = loadRecommendDataIntoWorker(region, recommendData, dataKey, isCurrent).finally(() => {
      dataPreloadPromises.delete(dataKey)
    })

    dataPreloadPromises.set(dataKey, preloadPromise)
    await preloadPromise
  }

  async function loadRecommendDataIntoWorker(
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    dataKey: string,
    isCurrent: () => boolean,
  ) {
    if (!isCurrent()) {
      return
    }

    await loadDeckRecommendWorkerData({
      region,
      masterVersion: recommendData.engineMasterVersion,
      musicMetasKey: recommendData.musicMetasKey,
      masterFileNames: recommendData.masterFileNames,
      masterData: recommendData.masterData,
      musicMetas: recommendData.musicMetas,
    })
    if (isCurrent()) {
      preloadedDataKeys.add(dataKey)
    }
  }

  async function loadRecommendDataIntoParallelWorker(
    entry: ParallelWorkerEntry,
    region: SekaiRegion,
    recommendData: RecommendCacheData,
    dataKey: string,
    isCurrent: () => boolean,
  ) {
    if (entry.loadedDataKeys.has(dataKey)) {
      return
    }

    const runningPreload = entry.dataLoadPromises.get(dataKey)
    if (runningPreload) {
      await runningPreload
      return
    }

    const preloadPromise = (async () => {
      await entry.warmPromise
      if (!isCurrent()) {
        return
      }

      await loadDataOnDedicatedWorker(entry.worker, {
        region,
        masterVersion: recommendData.engineMasterVersion,
        musicMetasKey: recommendData.musicMetasKey,
        masterFileNames: recommendData.masterFileNames,
        masterData: recommendData.masterData,
        musicMetas: recommendData.musicMetas,
      })
      if (isCurrent()) {
        entry.loadedDataKeys.add(dataKey)
      }
    })().finally(() => {
      entry.dataLoadPromises.delete(dataKey)
    })

    entry.dataLoadPromises.set(dataKey, preloadPromise)
    await preloadPromise
  }

  async function ensureParallelWorkerPool(count: number) {
    const targetCount = normalizeParallelWorkerCount(count)
    while (parallelWorkers.length < targetCount) {
      parallelWorkers.push(createParallelWorkerEntry())
    }

    const extraWorkers = parallelWorkers.splice(targetCount)
    await Promise.allSettled(extraWorkers.map(disposeParallelWorkerEntry))
    await Promise.all(parallelWorkers.slice(0, targetCount).map((entry) => entry.warmPromise))
  }

  async function disposeParallelEngines() {
    const workers = parallelWorkers.splice(0)
    await Promise.allSettled(workers.map(disposeParallelWorkerEntry))
  }

  async function disposeEngines() {
    await Promise.allSettled([
      disposeDeckRecommendWorker(),
      disposeParallelEngines(),
    ])
  }

  function applyUserDataCacheStatus(result: DeckRecommendUserDataFetchResult) {
    userDataCacheHit.value = result.cacheable ? result.cacheHit : null
    userDataCacheUpdatedAt.value = result.cacheUpdatedAt
    userDataRemoteUploadTime.value = result.remoteUploadTime
  }

  return {
    running,
    phase,
    error,
    result,
    masterData,
    elapsedMs,
    dataElapsedMs,
    engineDataElapsedMs,
    recommendElapsedMs,
    resultExecutionMode,
    algorithmTimings,
    userDataRefreshing,
    userDataCacheHit,
    userDataCacheUpdatedAt,
    userDataRemoteUploadTime,
    hasResult,
    preloadEngine: warmDeckRecommendWorker,
    preloadRegionData,
    preloadParallelEngines,
    preloadParallelRegionData,
    disposeEngine: disposeEngines,
    run,
    reset,
    refreshUserData,
  }
}

type RecommendCacheData = {
  masterVersion: string
  engineMasterVersion: string
  accountHonorRegion: SekaiRegion
  accountHonorMasterVersion: string | null
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData: Record<string, unknown>
  musicMetas: unknown
}

async function readRecommendCacheData(
  region: SekaiRegion,
  accountHonorRegion: SekaiRegion = region,
): Promise<RecommendCacheData> {
  const sekaiDataStore = useSekaiDataStore()
  if (sekaiDataStore.regionStates[region].checkedAt == null) {
    await sekaiDataStore.loadRegionCacheState(region)
  }
  if (sekaiDataStore.regionStates[accountHonorRegion].checkedAt == null) {
    await sekaiDataStore.loadRegionCacheState(accountHonorRegion)
  }
  const regionState = sekaiDataStore.regionStates[region]
  if (!regionState.masterFetchVersion) {
    throw new Error("master data is not ready")
  }
  const accountRegionState = sekaiDataStore.regionStates[accountHonorRegion]
  if (!accountRegionState.masterFetchVersion) {
    throw new Error("account server master data is not ready")
  }

  const [masterData, musicMetas] = await Promise.all([
    readSekaiMasterFiles(region, SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES, regionState.masterFetchVersion),
    readSekaiMusicMetas(region),
  ])
  if (!musicMetas) {
    throw new Error("music metas are not ready")
  }

  const missingFiles = SEKAI_DATA_RECOMMEND_MASTER_FILES.filter((fileName) => masterData[fileName] == null)
  if (missingFiles.length > 0) {
    throw new Error(`master data is missing: ${missingFiles.join(", ")}`)
  }
  if (accountHonorRegion !== region) {
    const honors = await readSekaiMasterFile(accountHonorRegion, "honors", accountRegionState.masterFetchVersion)
    if (!honors) {
      throw new Error("account server honors master data is not ready")
    }
    masterData.honors = honors
  }

  return {
    masterVersion: regionState.masterFetchVersion,
    engineMasterVersion: createEngineMasterVersion(regionState.masterFetchVersion, accountHonorRegion, accountRegionState.masterFetchVersion),
    accountHonorRegion,
    accountHonorMasterVersion: accountRegionState.masterFetchVersion,
    musicMetasKey: createMusicMetasKey(regionState.musicMetasUpdatedAt),
    masterFileNames: [...SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES],
    masterData,
    musicMetas,
  }
}

function createMusicMetasKey(updatedAt: number | null): string | null {
  return updatedAt == null ? null : String(updatedAt)
}

function createEngineMasterVersion(
  masterVersion: string,
  accountHonorRegion: SekaiRegion,
  accountHonorMasterVersion: string | null,
): string {
  return [
    masterVersion,
    `honors:${accountHonorRegion}:${accountHonorMasterVersion ?? "unknown-honors"}`,
  ].join("|")
}

function createElapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt)
}

function createRecommendDataKey(
  region: SekaiRegion,
  masterVersion: string,
  accountHonorRegion: SekaiRegion,
  accountHonorMasterVersion: string,
  musicMetasKey: string | null,
  masterFileNames: readonly string[],
): string {
  return [
    region,
    masterVersion,
    `honors:${accountHonorRegion}:${accountHonorMasterVersion}`,
    musicMetasKey ?? "unknown-music-metas",
    masterFileNames.slice().sort().join(","),
  ].join(":")
}

type AlgorithmWorkerInput = {
  algorithm: DeckRecommendAlgorithm
  request: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">
}

type AlgorithmWorkerResult = {
  algorithm: DeckRecommendAlgorithm
  result: RecommendResult
  elapsedMs: number
}

async function runAlgorithmsSequentially(
  workerInputs: readonly AlgorithmWorkerInput[],
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<AlgorithmWorkerResult[]> {
  if (workerInputs.length === 1) {
    const { algorithm, request } = workerInputs[0]
    const workerResult = await recommendWithSharedWorker(request, onEvent)
    return [{
      algorithm,
      result: workerResult.result,
      elapsedMs: workerResult.elapsedMs,
    }]
  }

  const batchResults = await recommendBatchWithSharedWorker(workerInputs.map(({ request }) => request), onEvent)
  return mapRecommendBatchResults(workerInputs.map(({ algorithm }) => algorithm), batchResults)
}

function runAlgorithmsInParallel(
  workerInputs: readonly AlgorithmWorkerInput[],
  onEvent: (event: DeckRecommendWorkerEvent) => void,
  parallelWorkers: readonly ParallelWorkerEntry[],
): Promise<AlgorithmWorkerResult[]> {
  return Promise.all(workerInputs.map(async ({ algorithm, request }, index) => {
    const worker = parallelWorkers[index]
    if (!worker) {
      throw new Error("parallel recommend worker is not ready")
    }

    const workerResult = await recommendWithPooledWorker(worker, request, onEvent)
    return {
      algorithm,
      result: workerResult.result,
      elapsedMs: workerResult.elapsedMs,
    }
  }))
}

function normalizeAlgorithms(algorithms: readonly DeckRecommendAlgorithm[]): DeckRecommendAlgorithm[] {
  return [...new Set(algorithms)]
}

function recommendWithSharedWorker(
  input: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()

    const unsubscribe = subscribeDeckRecommendWorker((event) => {
      if (event.requestId !== requestId) {
        if (event.requestId === "worker" && event.type === "error") {
          unsubscribe?.()
          reject(new Error(event.message))
        }
        return
      }

      onEvent(event)
      if (event.type === "done") {
        unsubscribe?.()
        resolve({
          result: event.result,
          elapsedMs: event.elapsedMs,
        })
        return
      }

      if (event.type === "error") {
        unsubscribe?.()
        reject(new Error(event.message))
      }
    })

    postDeckRecommendWorkerRequest({
      type: "recommend",
      requestId,
      ...input,
    })
  })
}

function recommendBatchWithSharedWorker(
  inputs: readonly Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">[],
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<RecommendResult[]> {
  const [firstInput] = inputs
  if (!firstInput) {
    return Promise.resolve([])
  }

  return new Promise((resolve, reject) => {
    const requestId = createRequestId()

    const unsubscribe = subscribeDeckRecommendWorker((event) => {
      if (event.requestId !== requestId) {
        if (event.requestId === "worker" && event.type === "error") {
          unsubscribe?.()
          reject(new Error(event.message))
        }
        return
      }

      onEvent(event)
      if (event.type === "batch-done") {
        unsubscribe?.()
        resolve(event.results)
        return
      }

      if (event.type === "error") {
        unsubscribe?.()
        reject(new Error(event.message))
      }
    })

    postDeckRecommendWorkerRequest({
      type: "recommend-batch",
      requestId,
      region: firstInput.region,
      masterVersion: firstInput.masterVersion,
      musicMetasKey: firstInput.musicMetasKey,
      masterFileNames: firstInput.masterFileNames,
      masterData: firstInput.masterData,
      musicMetas: firstInput.musicMetas,
      optionsList: inputs.map(({ options }) => options),
    } satisfies DeckRecommendWorkerRecommendBatchRequest)
  })
}

function recommendWithPooledWorker(
  entry: ParallelWorkerEntry,
  input: Omit<DeckRecommendWorkerRecommendRequest, "type" | "requestId">,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    const worker = entry.worker

    let cleanup = () => {}
    const handleMessage = (messageEvent: MessageEvent<DeckRecommendWorkerEvent>) => {
      const event = messageEvent.data
      if (event.requestId !== requestId) {
        return
      }

      onEvent(event)
      if (event.type === "done") {
        cleanup()
        resolve({
          result: event.result,
          elapsedMs: event.elapsedMs,
        })
        return
      }

      if (event.type === "error") {
        cleanup()
        reject(new Error(event.message))
      }
    }

    const handleError = (event: ErrorEvent) => {
      cleanup()
      reject(new Error(event.message || "Deck recommend worker failed"))
    }

    cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)

    entry.warmPromise
      .then(() => {
        worker.postMessage({
          type: "recommend",
          requestId,
          ...input,
        } satisfies DeckRecommendWorkerRecommendRequest)
      })
      .catch((error) => {
        cleanup()
        reject(error instanceof Error ? error : new Error(normalizeErrorMessage(error)))
      })
  })
}

type ParallelWorkerEntry = {
  worker: Worker
  warmPromise: Promise<void>
  loadedDataKeys: Set<string>
  dataLoadPromises: Map<string, Promise<void>>
}

function createParallelWorkerEntry(): ParallelWorkerEntry {
  const worker = createDeckRecommendWorker()
  return {
    worker,
    warmPromise: runDedicatedWorkerLifecycleRequest(worker, { type: "preload" }, "ready"),
    loadedDataKeys: new Set<string>(),
    dataLoadPromises: new Map<string, Promise<void>>(),
  }
}

async function disposeParallelWorkerEntry(entry: ParallelWorkerEntry): Promise<void> {
  try {
    await runDedicatedWorkerLifecycleRequest(entry.worker, { type: "dispose" }, "disposed", 1000)
  } finally {
    entry.worker.terminate()
  }
}

function loadDataOnDedicatedWorker(
  worker: Worker,
  input: Omit<DeckRecommendWorkerLoadDataRequest, "type" | "requestId">,
) {
  return runDedicatedWorkerLifecycleRequest(worker, { type: "load-data", ...input }, "data-loaded")
}

function runDedicatedWorkerLifecycleRequest(
  worker: Worker,
  request: Omit<DeckRecommendWorkerRequest, "requestId">,
  successType: Extract<DeckRecommendWorkerEvent["type"], "ready" | "data-loaded" | "disposed">,
  timeoutMs = 30000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let finished = false

    const cleanup = () => {
      worker.removeEventListener("message", handleMessage)
      worker.removeEventListener("error", handleError)
      if (timeoutId != null) {
        clearTimeout(timeoutId)
      }
    }
    const finish = (error?: Error) => {
      if (finished) {
        return
      }

      finished = true
      cleanup()
      if (error) {
        reject(error)
        return
      }

      resolve()
    }
    const handleMessage = (messageEvent: MessageEvent<DeckRecommendWorkerEvent>) => {
      const event = messageEvent.data
      if (event.requestId !== requestId) {
        return
      }

      if (event.type === successType) {
        finish()
        return
      }

      if (event.type === "error") {
        finish(new Error(event.message))
      }
    }
    const handleError = (event: ErrorEvent) => {
      finish(new Error(event.message || "Deck recommend worker failed"))
    }

    worker.addEventListener("message", handleMessage)
    worker.addEventListener("error", handleError)
    timeoutId = setTimeout(() => {
      if (successType === "disposed") {
        finish()
        return
      }

      finish(new Error(`Deck recommend worker ${request.type} timed out`))
    }, timeoutMs)
    worker.postMessage({
      ...request,
      requestId,
    } satisfies DeckRecommendWorkerRequest)
  })
}

function normalizeParallelWorkerCount(count: number): number {
  return Math.max(0, Math.floor(count))
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === "object" && error !== null) {
    const message = "message" in error && typeof error.message === "string" ? error.message : ""
    const name = error.constructor?.name
    if (message) {
      return name && name !== "Object" ? `${name}: ${message}` : message
    }
    if (name === "Exception") {
      return "wasm engine failed to execute recommendation"
    }
    if (name && name !== "Object") {
      return name
    }
  }

  return String(error)
}
