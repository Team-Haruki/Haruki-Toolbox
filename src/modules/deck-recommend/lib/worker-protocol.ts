import type {
  RecommendOptions,
  RecommendResult,
  WorldBloomSupportCard,
  WorldBloomSupportOptions,
} from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"

export type DeckRecommendWorkerRecommendRequest = {
  type: "recommend"
  requestId: string
  region: SekaiRegion
  masterVersion: string
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData?: Record<string, unknown>
  musicMetas?: unknown
  options: RecommendOptions
}

export type DeckRecommendWorkerWorldBloomSupportRequest = {
  type: "world-bloom-support"
  requestId: string
  region: SekaiRegion
  masterVersion: string
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData?: Record<string, unknown>
  musicMetas?: unknown
  options: WorldBloomSupportOptions
}

export type DeckRecommendWorkerLoadDataRequest = {
  type: "load-data"
  requestId: string
  region: SekaiRegion
  masterVersion: string
  musicMetasKey: string | null
  masterFileNames: string[]
  masterData: Record<string, unknown>
  musicMetas: unknown
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
  | DeckRecommendWorkerWorldBloomSupportRequest
  | DeckRecommendWorkerLoadDataRequest
  | DeckRecommendWorkerPreloadRequest
  | DeckRecommendWorkerDisposeRequest

export type DeckRecommendWorkerRequestWithoutId =
  | Omit<DeckRecommendWorkerRecommendRequest, "requestId">
  | Omit<DeckRecommendWorkerLoadDataRequest, "requestId">
  | Omit<DeckRecommendWorkerPreloadRequest, "requestId">
  | Omit<DeckRecommendWorkerDisposeRequest, "requestId">

export type DeckRecommendWorkerEvent =
  | {
    type: "progress"
    requestId: string
    phase: "initializing" | "loading-data" | "recommending"
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
    type: "world-bloom-support-done"
    requestId: string
    cards: WorldBloomSupportCard[]
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
