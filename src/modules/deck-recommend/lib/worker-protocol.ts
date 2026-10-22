import type {
  MusicRecommendOptions,
  RecommendDeck,
  RecommendMusic,
  RecommendOptions,
  RecommendResult,
} from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"

/**
 * Where an engine worker gets its master data from. Workers read the tables
 * straight from the shared IndexedDB cache so the page never has to parse
 * the ~50 MB master set or clone it into every worker; `masterData` /
 * `musicMetas` are only for callers that already hold the tables (tests).
 */
export type DeckRecommendWorkerDataSource = {
  region: SekaiRegion
  masterVersion: string
  masterFileNames: string[]
  musicMetasKey: string | null
  /** The honors table comes from the account's server, which may differ from the data region. */
  honorRegion: SekaiRegion
  honorMasterVersion: string | null
  masterData?: Record<string, unknown>
  musicMetas?: unknown
}

export function createDeckRecommendDataKey(source: DeckRecommendWorkerDataSource): string {
  return [
    source.region,
    source.masterVersion,
    `honors:${source.honorRegion}:${source.honorMasterVersion ?? "unknown-honors"}`,
    source.musicMetasKey ?? "unknown-music-metas",
    source.masterFileNames.slice().sort((left, right) => left.localeCompare(right)).join(","),
  ].join(":")
}

export type DeckRecommendWorkerRecommendRequest = {
  type: "recommend"
  requestId: string
  data: DeckRecommendWorkerDataSource
  options: RecommendOptions
}

export type DeckRecommendWorkerRecommendBatchRequest = {
  type: "recommend-batch"
  requestId: string
  data: DeckRecommendWorkerDataSource
  optionsList: RecommendOptions[]
}

export type DeckRecommendWorkerMusicRequest = {
  type: "recommend-music"
  requestId: string
  data: DeckRecommendWorkerDataSource
  options: MusicRecommendOptions
  deck: RecommendDeck
}

export type DeckRecommendWorkerLoadDataRequest = {
  type: "load-data"
  requestId: string
  data: DeckRecommendWorkerDataSource
}

export type DeckRecommendWorkerPreloadRequest = {
  type: "preload"
  requestId: string
}

export type DeckRecommendWorkerDisposeRequest = {
  type: "dispose"
  requestId: string
}

export type DeckRecommendWorkerRequest =
  | DeckRecommendWorkerRecommendRequest
  | DeckRecommendWorkerRecommendBatchRequest
  | DeckRecommendWorkerMusicRequest
  | DeckRecommendWorkerLoadDataRequest
  | DeckRecommendWorkerPreloadRequest
  | DeckRecommendWorkerDisposeRequest

export type DeckRecommendWorkerRequestWithoutId =
  | Omit<DeckRecommendWorkerRecommendRequest, "requestId">
  | Omit<DeckRecommendWorkerRecommendBatchRequest, "requestId">
  | Omit<DeckRecommendWorkerMusicRequest, "requestId">
  | Omit<DeckRecommendWorkerLoadDataRequest, "requestId">
  | Omit<DeckRecommendWorkerPreloadRequest, "requestId">
  | Omit<DeckRecommendWorkerDisposeRequest, "requestId">

export type DeckRecommendWorkerProgressPhase = "initializing" | "loading-data" | "recommending"

export type DeckRecommendWorkerEvent =
  | {
    type: "progress"
    requestId: string
    phase: DeckRecommendWorkerProgressPhase
  }
  | {
    type: "ready"
    requestId: string
    elapsedMs: number
  }
  | {
    type: "data-loaded"
    requestId: string
    elapsedMs: number
    cacheHit: boolean
  }
  | {
    type: "done"
    requestId: string
    result: RecommendResult
    elapsedMs: number
  }
  | {
    type: "batch-done"
    requestId: string
    results: RecommendResult[]
    elapsedMs: number
  }
  | {
    type: "music-done"
    requestId: string
    results: RecommendMusic[]
    elapsedMs: number
  }
  | {
    type: "disposed"
    requestId: string
  }
  | {
    type: "error"
    requestId: string
    message: string
  }
