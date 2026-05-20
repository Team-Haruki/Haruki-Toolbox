import type { RecommendOptions, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"

export type DeckRecommendWorkerRequest = {
  type: "recommend"
  requestId: string
  region: SekaiRegion
  masterVersion: string
  masterData: Record<string, unknown>
  musicMetas: unknown
  options: RecommendOptions
}

export type DeckRecommendWorkerEvent =
  | {
    type: "progress"
    requestId: string
    phase: "initializing" | "loading-data" | "recommending"
  }
  | {
    type: "done"
    requestId: string
    result: RecommendResult
    elapsedMs: number
  }
  | {
    type: "error"
    requestId: string
    message: string
  }
