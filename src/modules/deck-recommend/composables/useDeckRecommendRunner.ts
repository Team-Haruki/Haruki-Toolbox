import { computed, ref } from "vue"
import type { RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import { readSekaiMasterFiles, readSekaiMusicMetas } from "@/shared/sekai/cache"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { useUserStore } from "@/shared/stores/user"
import { SEKAI_DATA_RECOMMEND_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { fetchDeckRecommendUserData } from "../api/recommend-data"
import {
  buildDeckRecommendOptions,
  resolveRecommendDataMode,
  type DeckRecommendAlgorithm,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
} from "../lib/recommend-options"
import {
  mergeDeckRecommendResults,
  type AlgorithmRecommendResult,
  type TaggedRecommendResult,
} from "../lib/recommend-results"
import {
  postDeckRecommendWorkerRequest,
  subscribeDeckRecommendWorker,
} from "../lib/recommend-worker-client"
import type { DeckRecommendWorkerEvent } from "../lib/worker-protocol"
import type { CardTrainingConfig } from "../lib/training-config"

export type DeckRecommendRunnerInput = {
  account: {
    server: SekaiRegion
    uid: string
  } | null
  dataRegion: SekaiRegion
  mode: DeckRecommendMode
  liveType: DeckRecommendLiveType
  algorithms: DeckRecommendAlgorithm[]
  eventId: string | null
  characterId: string | null
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
  const algorithmTimings = ref<DeckRecommendAlgorithmTiming[]>([])

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
    algorithmTimings.value = []

    try {
      await sekaiDataStore.ensureRegionData(input.dataRegion, {
        files: SEKAI_DATA_RECOMMEND_MASTER_FILES,
      })
      const regionState = sekaiDataStore.regionStates[input.dataRegion]
      if (!regionState.masterFetchVersion) {
        throw new Error("master data is not ready")
      }

      const [masterFileData, musicMetas, userDataResponse] = await Promise.all([
        readSekaiMasterFiles(input.dataRegion, SEKAI_DATA_RECOMMEND_MASTER_FILES, regionState.masterFetchVersion),
        readSekaiMusicMetas(input.dataRegion),
        fetchUserData(input),
      ])
      if (!musicMetas) {
        throw new Error("music metas are not ready")
      }

      const missingFiles = SEKAI_DATA_RECOMMEND_MASTER_FILES.filter((fileName) => masterFileData[fileName] == null)
      if (missingFiles.length > 0) {
        throw new Error(`master data is missing: ${missingFiles.join(", ")}`)
      }
      masterData.value = masterFileData
      const workerResults: AlgorithmRecommendResult[] = []
      let totalElapsedMs = 0
      const algorithms = normalizeAlgorithms(input.algorithms)
      if (algorithms.length === 0) {
        throw new Error("at least one algorithm is required")
      }

      for (const algorithm of algorithms) {
        const options = buildDeckRecommendOptions({
          region: input.dataRegion,
          mode: input.mode,
          liveType: input.liveType,
          algorithm,
          musicId: input.musicId,
          musicDifficulty: input.difficulty,
          eventId: input.eventId,
          characterId: input.characterId,
          trainingConfig: input.trainingConfig,
          userData: userDataResponse.userData,
        })

        phase.value = "initializing"
        const workerResult = await recommendWithWorker({
          region: input.dataRegion,
          masterVersion: regionState.masterFetchVersion,
          masterData: masterFileData,
          musicMetas,
          options,
        }, (event) => {
          if (event.type === "progress") {
            phase.value = event.phase
          }
        })

        workerResults.push({
          algorithm,
          result: workerResult.result,
        })
        totalElapsedMs += workerResult.elapsedMs
        algorithmTimings.value = [
          ...algorithmTimings.value,
          {
            algorithm,
            elapsedMs: workerResult.elapsedMs,
          },
        ]
      }

      result.value = mergeDeckRecommendResults(workerResults)
      elapsedMs.value = totalElapsedMs
    } catch (runError) {
      const message = runError instanceof Error ? runError.message : String(runError)
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
    algorithmTimings.value = []
  }

  async function fetchUserData(input: DeckRecommendRunnerInput) {
    phase.value = "fetching-user-data"
    return fetchDeckRecommendUserData({
      toolboxUserId: userStore.userId || "",
      server: input.account?.server ?? input.dataRegion,
      gameUserId: input.account?.uid ?? "",
      mode: resolveRecommendDataMode(input.mode),
    })
  }

  return {
    running,
    phase,
    error,
    result,
    masterData,
    elapsedMs,
    algorithmTimings,
    hasResult,
    run,
    reset,
  }
}

function normalizeAlgorithms(algorithms: readonly DeckRecommendAlgorithm[]): DeckRecommendAlgorithm[] {
  return [...new Set(algorithms)]
}

type RecommendWithWorkerInput = Parameters<typeof postDeckRecommendWorkerRequest>[0]

function recommendWithWorker(
  input: Omit<RecommendWithWorkerInput, "type" | "requestId">,
  onEvent: (event: DeckRecommendWorkerEvent) => void,
): Promise<{ result: RecommendResult; elapsedMs: number }> {
  return new Promise((resolve, reject) => {
    const requestId = createRequestId()

    const unsubscribe = subscribeDeckRecommendWorker((event) => {
      if (event.requestId !== requestId) {
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

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
