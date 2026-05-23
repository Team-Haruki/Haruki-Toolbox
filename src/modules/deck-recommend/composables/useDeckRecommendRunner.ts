import { computed, ref } from "vue"
import type { RecommendOptions, RecommendResult, WorldBloomSupportCard } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
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
  mergeDeckRecommendResults,
  type TaggedRecommendResult,
} from "../lib/recommend-results"
import {
  createDeckRecommendWorker,
  disposeDeckRecommendWorker,
  getDeckRecommendWorldBloomSupportCards,
  loadDeckRecommendWorkerData,
  postDeckRecommendWorkerRequest,
  subscribeDeckRecommendWorker,
  warmDeckRecommendWorker,
} from "../lib/recommend-worker-client"
import type {
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerLoadDataRequest,
  DeckRecommendWorkerRequest,
  DeckRecommendWorkerRecommendRequest,
} from "../lib/worker-protocol"
import type { CardTrainingConfig } from "../lib/training-config"
import {
  fetchDeckRecommendProfileWithCache,
  fetchDeckRecommendUserDataWithCache,
  type DeckRecommendUserDataFetchResult,
} from "../lib/user-data"
import { resolveWorldBloomSupportDeckCount } from "../lib/master-options"
import {
  applyChallengeScoreDelta,
  createPreparedDeckRecommendUserDataString,
  type DeckRecommendSingleCardOverride,
} from "../lib/user-data-preparation"
import { prepareRecommendUserDataForWasm } from "../lib/wasm-user-data"
import type { DeckResultSupportCard } from "../lib/card-thumbnail"

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
  resultLimit: number | null
  timeoutMs: number | null
  unitFilters: readonly DeckRecommendUnitType[]
  attrFilters: readonly DeckRecommendEventAttr[]
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
  const worldBloomSupportCards = ref<DeckResultSupportCard[]>([])
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
    worldBloomSupportCards.value = []

    try {
      const runStartedAt = performance.now()
      const dataStartedAt = performance.now()
      const [recommendData, userDataResponse, profileData] = await Promise.all([
        readRecommendCacheData(input.dataRegion),
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
        areaItemLevel: input.areaItemLevel,
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
          masterVersion: recommendData.masterVersion,
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
      result.value = mergeDeckRecommendResults(resultWithChallengeDelta, input.mode, input.target)
      worldBloomSupportCards.value = await loadWorldBloomSupportCards({
        input,
        recommendData,
        options: workerInputs[0]?.request.options,
        preparedUserDataString: preparedUserData.userDataString,
      })
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
    worldBloomSupportCards.value = []
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

  async function preloadRegionData(region: SekaiRegion, isCurrent: () => boolean = () => true) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      return
    }

    const dataKey = createRecommendDataKey(
      region,
      regionState.masterFetchVersion,
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
      const recommendData = await readRecommendCacheData(region)
      const loadedDataKey = createRecommendDataKey(
        region,
        recommendData.masterVersion,
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
    isCurrent: () => boolean = () => true,
  ) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      await ensureParallelWorkerPool(count)
      return
    }

    const recommendData = await readRecommendCacheData(region)
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
      masterVersion: recommendData.masterVersion,
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
        masterVersion: recommendData.masterVersion,
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
    worldBloomSupportCards,
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
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData: Record<string, unknown>
  musicMetas: unknown
}

async function readRecommendCacheData(region: SekaiRegion): Promise<RecommendCacheData> {
  const sekaiDataStore = useSekaiDataStore()
  if (sekaiDataStore.regionStates[region].checkedAt == null) {
    await sekaiDataStore.loadRegionCacheState(region)
  }
  const regionState = sekaiDataStore.regionStates[region]
  if (!regionState.masterFetchVersion) {
    throw new Error("master data is not ready")
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

  return {
    masterVersion: regionState.masterFetchVersion,
    musicMetasKey: createMusicMetasKey(regionState.musicMetasUpdatedAt),
    masterFileNames: [...SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES],
    masterData,
    musicMetas,
  }
}

async function loadWorldBloomSupportCards(input: {
  input: DeckRecommendRunnerInput
  recommendData: RecommendCacheData
  options: RecommendOptions | undefined
  preparedUserDataString: string
}): Promise<DeckResultSupportCard[]> {
  if (!input.options || !isWorldBloomSupportOptions(input.options)) {
    return []
  }

  const cards = await getDeckRecommendWorldBloomSupportCards({
    region: input.input.dataRegion,
    masterVersion: input.recommendData.masterVersion,
    musicMetasKey: input.recommendData.musicMetasKey,
    masterFileNames: input.recommendData.masterFileNames,
    masterData: input.recommendData.masterData,
    musicMetas: input.recommendData.musicMetas,
    options: input.options,
  }).catch(() => [])

  if (cards.length === 0) {
    return []
  }

  const userCardMap = buildPreparedUserCardMap(input.preparedUserDataString)
  const optionRecord = input.options as Record<string, unknown>
  const supportDeckCount = resolveWorldBloomSupportDeckCount(
    normalizePositiveNumber(optionRecord.event_id),
    normalizePositiveNumber(optionRecord.world_bloom_event_turn),
  )
  return cards.slice(0, supportDeckCount).map((card) =>
    createDeckResultSupportCard(card, userCardMap, input.input.supportSkillMax),
  )
}

function isWorldBloomSupportOptions(options: RecommendOptions): boolean {
  const record = options as Record<string, unknown>
  return record.event_type === "world_bloom"
    || (
      (record.world_bloom_character_id != null || record.forcedLeaderCharacterId != null)
      && (record.event_id != null || record.world_bloom_event_turn != null)
    )
}

function buildPreparedUserCardMap(userDataString: string): Map<number, Record<string, unknown>> {
  const map = new Map<number, Record<string, unknown>>()
  try {
    const parsed = JSON.parse(userDataString) as { userCards?: unknown }
    if (!Array.isArray(parsed.userCards)) {
      return map
    }

    for (const rawCard of parsed.userCards) {
      if (!rawCard || typeof rawCard !== "object") {
        continue
      }
      const card = rawCard as Record<string, unknown>
      const cardId = normalizePositiveNumber(card.cardId)
      if (cardId) {
        map.set(cardId, card)
      }
    }
  } catch {
    return map
  }

  return map
}

function createDeckResultSupportCard(
  card: WorldBloomSupportCard,
  userCardMap: Map<number, Record<string, unknown>>,
  supportSkillMax: boolean,
): DeckResultSupportCard {
  const userCard = userCardMap.get(card.card_id)
  const defaultImage = normalizeText(userCard?.defaultImage)
  const specialTrainingStatus = normalizeText(userCard?.specialTrainingStatus)
  return {
    card_id: card.card_id,
    bonus: card.bonus,
    skill_level: supportSkillMax ? 4 : normalizePositiveNumber(userCard?.skillLevel) ?? 1,
    master_rank: normalizeNonNegativeNumber(userCard?.masterRank) ?? 0,
    level: normalizePositiveNumber(userCard?.level) ?? 1,
    after_training: specialTrainingStatus === "done",
    default_image: defaultImage ?? "",
  }
}

function createMusicMetasKey(updatedAt: number | null): string | null {
  return updatedAt == null ? null : String(updatedAt)
}

function createElapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt)
}

function normalizePositiveNumber(value: unknown): number | null {
  const numberValue = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  return typeof numberValue === "number" && Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : null
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  const numberValue = typeof value === "string" && value.trim() !== "" ? Number(value) : value
  return typeof numberValue === "number" && Number.isFinite(numberValue) && numberValue >= 0
    ? numberValue
    : null
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null
}

function createRecommendDataKey(
  region: SekaiRegion,
  masterVersion: string,
  musicMetasKey: string | null,
  masterFileNames: readonly string[],
): string {
  return [
    region,
    masterVersion,
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
  const results: AlgorithmWorkerResult[] = []
  for (const { algorithm, request } of workerInputs) {
    const workerResult = await recommendWithSharedWorker(request, onEvent)
    results.push({
      algorithm,
      result: workerResult.result,
      elapsedMs: workerResult.elapsedMs,
    })
  }

  return results
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
