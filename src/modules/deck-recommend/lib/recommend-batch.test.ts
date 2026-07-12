import { describe, expect, it } from "vitest"
import type { RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import { mapRecommendBatchResults } from "./recommend-batch"

describe("mapRecommendBatchResults", () => {
  it("keeps input order and uses each engine search cost", () => {
    const results = [
      { decks: [], cost_ms: 10.4 },
      { decks: [], cost_ms: 25.6 },
    ] satisfies RecommendResult[]

    expect(mapRecommendBatchResults(["dfs", "rl"], results)).toEqual([
      { algorithm: "dfs", result: results[0], elapsedMs: 10 },
      { algorithm: "rl", result: results[1], elapsedMs: 26 },
    ])
  })

  it("rejects a result count mismatch", () => {
    expect(() => mapRecommendBatchResults(["dfs", "rl"], [{ decks: [], cost_ms: 10 }]))
      .toThrow("recommendation batch result count mismatch")
  })
})
