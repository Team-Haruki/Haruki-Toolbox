import type { RecommendResult } from "haruki-sekai-deck-recommend-cpp"

export type RecommendBatchResult<TAlgorithm extends string> = {
  algorithm: TAlgorithm
  result: RecommendResult
  elapsedMs: number
}

export function mapRecommendBatchResults<TAlgorithm extends string>(
  algorithms: readonly TAlgorithm[],
  results: readonly RecommendResult[],
): RecommendBatchResult<TAlgorithm>[] {
  if (results.length !== algorithms.length) {
    throw new Error("recommendation batch result count mismatch")
  }

  return results.map((result, index) => ({
    algorithm: algorithms[index],
    result,
    elapsedMs: Math.round(result.cost_ms),
  }))
}
