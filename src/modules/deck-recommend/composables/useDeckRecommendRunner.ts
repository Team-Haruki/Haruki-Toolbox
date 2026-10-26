import { computed, ref, shallowRef } from "vue"
import { getMissingUploadDataType } from "@/shared/sekai/user-snapshot/missing-data"
import type { ErrorDescription } from "@/lib/error-utils"
import { describeDeckRecommendError } from "../lib/engine-errors"
import { markDeckRecommendUserDataAvailable, markDeckRecommendUserDataMissing } from "../lib/user-data-availability"
import type {
  MusicRecommendOptions,
  RecommendDeck,
  RecommendMusic,
  RecommendResult,
} from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
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
  ensureDeckRecommendWorkerPool,
  getDeckRecommendWorkerPoolSize,
  growDeckRecommendWorkerPool,
  preloadDeckRecommendWorkerData,
  recommendBatchOnDeckRecommendWorker,
  recommendMusicOnDeckRecommendWorker,
  recommendOnDeckRecommendWorker,
  scheduleDeckRecommendWorkerPoolDisposal,
} from "../lib/recommend-worker-client"
import type {
  DeckRecommendWorkerDataSource,
  DeckRecommendWorkerEvent,
  DeckRecommendWorkerProgressPhase,
} from "../lib/worker-protocol"
import {
  getDeckRecommendDeviceProfile,
  partitionDeckRecommendAlgorithms,
  resolveDeckRecommendWorkerCount,
  resolveDeckRecommendWorkerIdleDisposeMs,
  type DeckRecommendExecutionMode,
} from "../lib/worker-pool-policy"
import { readDeckRecommendMainThreadMaster } from "../lib/main-thread-master"
import type { CardTrainingConfig } from "../lib/training-config"
import { normalizeDeckRecommendWorkerError } from "../lib/worker-error"
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

export type { DeckRecommendExecutionMode } from "../lib/worker-pool-policy"

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

export type DeckRecommendRunnerPhase = DeckRecommendWorkerProgressPhase | "fetching-user-data" | "preparing-data"

/**
 * The last successful run, kept at module level so leaving the page and
 * coming back (same session) restores the result instead of forcing a
 * re-run. Keyed by the serialized runner input, so any config change
 * invalidates it.
 */
type DeckRecommendLastRun = {
  key: string
  result: TaggedRecommendResult
  masterData: Record<string, unknown> | null
  elapsedMs: number | null
  dataElapsedMs: number | null
  engineDataElapsedMs: number | null
  recommendElapsedMs: number | null
  resultExecutionMode: DeckRecommendExecutionMode | null
  algorithmTimings: DeckRecommendAlgorithmTiming[]
}

let lastRun: DeckRecommendLastRun | null = null

export function createDeckRecommendRunKey(input: DeckRecommendRunnerInput): string {
  return JSON.stringify(input)
}

export function useDeckRecommendRunner() {
  const userStore = useUserStore()
  const sekaiDataStore = useSekaiDataStore()
  const deviceProfile = getDeckRecommendDeviceProfile()
  const running = ref(false)
  const phase = ref<DeckRecommendRunnerPhase | null>(null)
  /** Raw engine/transport message of the last failure (for support); render `errorDescription` instead. */
  const error = ref<string | null>(null)
  /** The last failure in user language: what happened and what to try next. */
  const errorDescription = shallowRef<ErrorDescription | null>(null)
  const userDataMissing = ref(false)
  const result = ref<TaggedRecommendResult | null>(null)
  /**
   * The page-side master tables of the last run (lite cards, characters,
   * area items…). Non-reactive on purpose: it only feeds pure builders.
   */
  const masterData = shallowRef<Record<string, unknown> | null>(null)
  const elapsedMs = ref<number | null>(null)
  const dataElapsedMs = ref<number | null>(null)
  const engineDataElapsedMs = ref<number | null>(null)
  const recommendElapsedMs = ref<number | null>(null)
  /** How the last run actually executed; the device may downgrade "parallel". */
  const resultExecutionMode = ref<DeckRecommendExecutionMode | null>(null)
  const algorithmTimings = ref<DeckRecommendAlgorithmTiming[]>([])
  const userDataRefreshing = ref(false)
  const userDataCacheHit = ref<boolean | null>(null)
  const userDataCacheUpdatedAt = ref<number | null>(null)
  const userDataRemoteUploadTime = ref<number | null>(null)

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
    errorDescription.value = null
    userDataMissing.value = false
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = null
    algorithmTimings.value = []
    lastRun = null

    try {
      const runStartedAt = performance.now()
      const algorithms = normalizeAlgorithms(input.algorithms)
      if (algorithms.length === 0) {
        throw new Error("at least one algorithm is required")
      }
      const workerCount = resolveDeckRecommendWorkerCount(input.executionMode, algorithms.length, deviceProfile)
      resultExecutionMode.value = workerCount > 1 ? "parallel" : "sequential"

      const source = await createWorkerDataSource(input.dataRegion, input.account.server)
      // The engines read and parse the master set in their own threads while
      // the page fetches user data, so neither waits for the other.
      const engineDataStartedAt = performance.now()
      let engineDataDone = false
      const enginePreload = preloadDeckRecommendWorkerData(source, workerCount, {
        onProgress: (progressPhase) => {
          if (running.value && phase.value !== "recommending") {
            phase.value = progressPhase
          }
        },
      }).finally(() => {
        engineDataDone = true
      })
      // A failure here surfaces when the run awaits it below.
      enginePreload.catch(() => undefined)

      const dataStartedAt = performance.now()
      const [pageMaster, userDataResponse, profileData] = await Promise.all([
        readDeckRecommendMainThreadMaster(input.dataRegion, source.masterVersion),
        fetchUserData(input),
        input.useCurrentDeck ? fetchUserProfile(input) : Promise.resolve(null),
      ])
      dataElapsedMs.value = createElapsedMs(dataStartedAt)
      masterData.value = pageMaster
      const currentDeckCards = input.useCurrentDeck
        ? resolveCurrentDeckCardsWithProfile(userDataResponse.userData, profileData)
        : []
      if (input.useCurrentDeck && currentDeckCards.length !== 5) {
        throw new Error("current deck requires 5 cards")
      }
      const compactUserData = prepareRecommendUserDataForWasm(userDataResponse.userData)
      const preparedUserData = createPreparedDeckRecommendUserDataString({
        userData: compactUserData,
        masterData: pageMaster,
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

      if (!engineDataDone) {
        phase.value = "initializing"
      }
      await enginePreload
      engineDataElapsedMs.value = createElapsedMs(engineDataStartedAt)

      phase.value = "recommending"
      const recommendStartedAt = performance.now()
      const buildOptions = (algorithm: DeckRecommendAlgorithm) => buildDeckRecommendOptions({
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
      })
      const handleWorkerEvent = (event: DeckRecommendWorkerEvent) => {
        if (event.type === "progress" && event.phase === "recommending") {
          phase.value = event.phase
        }
      }
      const workerResults = await runAlgorithmGroups(
        partitionDeckRecommendAlgorithms(algorithms, workerCount),
        source,
        buildOptions,
        handleWorkerEvent,
      )

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
      const mergedResult = mergeDeckRecommendResults(resultWithLiveBoost, input.mode, input.target)
      result.value = mergedResult
      algorithmTimings.value = workerResults.map(({ algorithm, elapsedMs: algorithmElapsedMs }) => ({ algorithm, elapsedMs: algorithmElapsedMs }))
      recommendElapsedMs.value = createElapsedMs(recommendStartedAt)
      elapsedMs.value = createElapsedMs(runStartedAt)
      lastRun = {
        key: createDeckRecommendRunKey(input),
        result: mergedResult,
        masterData: masterData.value,
        elapsedMs: elapsedMs.value,
        dataElapsedMs: dataElapsedMs.value,
        engineDataElapsedMs: engineDataElapsedMs.value,
        recommendElapsedMs: recommendElapsedMs.value,
        resultExecutionMode: resultExecutionMode.value,
        algorithmTimings: algorithmTimings.value,
      }
    } catch (runError) {
      const message = normalizeDeckRecommendWorkerError(runError)
      error.value = message
      errorDescription.value = describeDeckRecommendError(runError)
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
    errorDescription.value = null
    userDataMissing.value = false
    result.value = null
    masterData.value = null
    elapsedMs.value = null
    dataElapsedMs.value = null
    engineDataElapsedMs.value = null
    recommendElapsedMs.value = null
    resultExecutionMode.value = null
    algorithmTimings.value = []
  }

  /**
   * Puts the last successful run back on screen when the current config
   * matches the one it was computed with (e.g. after navigating away and
   * back). Returns true when something was restored.
   */
  function restoreLastResult(input: DeckRecommendRunnerInput): boolean {
    if (running.value || lastRun == null || lastRun.key !== createDeckRecommendRunKey(input)) {
      return false
    }
    error.value = null
    errorDescription.value = null
    userDataMissing.value = false
    result.value = lastRun.result
    masterData.value = lastRun.masterData
    elapsedMs.value = lastRun.elapsedMs
    dataElapsedMs.value = lastRun.dataElapsedMs
    engineDataElapsedMs.value = lastRun.engineDataElapsedMs
    recommendElapsedMs.value = lastRun.recommendElapsedMs
    resultExecutionMode.value = lastRun.resultExecutionMode
    algorithmTimings.value = lastRun.algorithmTimings
    return true
  }

  async function fetchUserData(input: DeckRecommendRunnerInput) {
    phase.value = "fetching-user-data"
    const server = input.account?.server ?? input.dataRegion
    const uid = input.account?.uid ?? ""
    const mode = resolveRecommendDataMode(input.mode)
    try {
      const fetched = await fetchDeckRecommendUserDataWithCache({
        toolboxUserId: userStore.userId || "",
        server,
        gameUserId: uid,
        mode,
      }, { strategy: "prefer-cache" })
      applyUserDataCacheStatus(fetched)
      markDeckRecommendUserDataAvailable(server, uid, mode)
      return fetched.data
    } catch (fetchError) {
      userDataMissing.value = getMissingUploadDataType(fetchError) != null
      if (userDataMissing.value) {
        markDeckRecommendUserDataMissing(server, uid, mode)
      }
      throw fetchError
    }
  }

  async function fetchUserProfile(input: DeckRecommendRunnerInput): Promise<unknown | null> {
    try {
      const fetched = await fetchDeckRecommendProfileWithCache({
        toolboxUserId: userStore.userId || "",
        server: input.account?.server ?? input.dataRegion,
        gameUserId: input.account?.uid ?? "",
      })
      return fetched.data
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
      const fetched = await fetchDeckRecommendUserDataWithCache({
        toolboxUserId: userStore.userId,
        server: input.account.server,
        gameUserId: input.account.uid,
        mode: resolveRecommendDataMode(input.mode),
      })
      applyUserDataCacheStatus(fetched)
      return fetched
    } finally {
      userDataRefreshing.value = false
    }
  }

  /**
   * Instantiates engine workers (WASM only, no data) so the first run does
   * not pay the module start-up. With `count` the pool is resized to exactly
   * that many engines; without it, one engine is guaranteed and any larger
   * pool is left alone.
   */
  function preloadEngine(count?: number): Promise<void> {
    return count == null ? growDeckRecommendWorkerPool(1) : ensureDeckRecommendWorkerPool(count)
  }

  /**
   * Loads the region's master set into the first `workerCount` engines (the
   * current pool when omitted). The workers read IndexedDB themselves, so
   * this costs the page nothing but the descriptor.
   */
  async function preloadRegionData(
    region: SekaiRegion,
    accountHonorRegion: SekaiRegion = region,
    isCurrent: () => boolean = () => true,
    workerCount: number = Math.max(1, getDeckRecommendWorkerPoolSize()),
  ) {
    const regionState = sekaiDataStore.regionStates[region]
    if (!regionState.masterFetchVersion || !regionState.musicMetasUpdatedAt) {
      return
    }

    const source = await createWorkerDataSource(region, accountHonorRegion)
    if (!isCurrent()) {
      return
    }
    await preloadDeckRecommendWorkerData(source, workerCount, { isCurrent })
  }

  /**
   * Releases the engines once no page needs them: immediately on memory
   * constrained devices, after an idle period elsewhere so a quick return to
   * the page finds them still loaded.
   */
  function disposeEngine(): Promise<void> {
    scheduleDeckRecommendWorkerPoolDisposal(resolveDeckRecommendWorkerIdleDisposeMs(deviceProfile))
    return Promise.resolve()
  }

  /**
   * Scores every loaded music meta for an already-recommended deck via the
   * engine's music recommend API (used for the planner's song PT ranking).
   */
  async function recommendMusicForDeck(input: {
    dataRegion: SekaiRegion
    accountServer?: SekaiRegion
    deck: RecommendDeck
    options: MusicRecommendOptions
  }): Promise<RecommendMusic[]> {
    const source = await createWorkerDataSource(input.dataRegion, input.accountServer ?? input.dataRegion)
    await preloadDeckRecommendWorkerData(source, 1)
    return recommendMusicOnDeckRecommendWorker({
      data: source,
      options: input.options,
      // Callers usually pass a deck read from the reactive result ref; Vue
      // proxies cannot be structured-cloned into the worker.
      deck: JSON.parse(JSON.stringify(input.deck)) as RecommendDeck,
    })
  }

  /**
   * Describes the region's current master set for the workers. Throws the
   * same "not ready" messages the engine errors map to user copy.
   */
  async function createWorkerDataSource(
    region: SekaiRegion,
    accountHonorRegion: SekaiRegion = region,
  ): Promise<DeckRecommendWorkerDataSource> {
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
    if (regionState.musicMetasUpdatedAt == null) {
      throw new Error("music metas are not ready")
    }
    const missingFiles = SEKAI_DATA_RECOMMEND_MASTER_FILES.filter((fileName) => !regionState.files.includes(fileName))
    if (missingFiles.length > 0) {
      throw new Error(`master data is missing: ${missingFiles.join(", ")}`)
    }
    const accountRegionState = sekaiDataStore.regionStates[accountHonorRegion]
    if (!accountRegionState.masterFetchVersion) {
      throw new Error("account server master data is not ready")
    }

    return {
      region,
      masterVersion: regionState.masterFetchVersion,
      masterFileNames: SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES.filter((fileName) => regionState.files.includes(fileName)),
      musicMetasKey: String(regionState.musicMetasUpdatedAt),
      honorRegion: accountHonorRegion,
      honorMasterVersion: accountRegionState.masterFetchVersion,
    }
  }

  function applyUserDataCacheStatus(fetched: DeckRecommendUserDataFetchResult) {
    userDataCacheHit.value = fetched.cacheable ? fetched.cacheHit : null
    userDataCacheUpdatedAt.value = fetched.cacheUpdatedAt
    userDataRemoteUploadTime.value = fetched.remoteUploadTime
  }

  return {
    running,
    phase,
    error,
    errorDescription,
    userDataMissing,
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
    deviceProfile,
    preloadEngine,
    preloadRegionData,
    disposeEngine,
    run,
    reset,
    restoreLastResult,
    refreshUserData,
    recommendMusicForDeck,
  }
}

type AlgorithmWorkerResult = {
  algorithm: DeckRecommendAlgorithm
  result: RecommendResult
  elapsedMs: number
}

/**
 * Runs each algorithm group on its own engine; a group with several
 * algorithms is one batch request so the engine shares its prepared state.
 */
async function runAlgorithmGroups(
  groups: readonly (readonly DeckRecommendAlgorithm[])[],
  source: DeckRecommendWorkerDataSource,
  buildOptions: (algorithm: DeckRecommendAlgorithm) => ReturnType<typeof buildDeckRecommendOptions>,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<AlgorithmWorkerResult[]> {
  const groupResults = await Promise.all(groups.map(async (group, index) => {
    if (group.length === 1) {
      const algorithm = group[0]
      const { result, elapsedMs } = await recommendOnDeckRecommendWorker(index, {
        data: source,
        options: buildOptions(algorithm),
      }, onEvent)
      return [{ algorithm, result, elapsedMs }]
    }

    const { results } = await recommendBatchOnDeckRecommendWorker(index, {
      data: source,
      optionsList: group.map(buildOptions),
    }, onEvent)
    return mapRecommendBatchResults(group, results)
  }))
  return groupResults.flat()
}

function normalizeAlgorithms(algorithms: readonly DeckRecommendAlgorithm[]): DeckRecommendAlgorithm[] {
  return [...new Set(algorithms)]
}

function createElapsedMs(startedAt: number): number {
  return Math.round(performance.now() - startedAt)
}
