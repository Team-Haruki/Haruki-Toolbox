import { describe, expect, it } from "bun:test"
import {
  isDeckRecommendMode,
  isDeckRecommendSimulatedEventUnit,
  isLegacyDefaultAlgorithmSelection,
  normalizeDeckRecommendSavedConfig,
  normalizePersistedAlgorithms,
  resolveInitialAlgorithmSelectionIsManual,
} from "./saved-config"

describe("validators", () => {
  it("accepts only known modes", () => {
    expect(isDeckRecommendMode("event")).toBe(true)
    expect(isDeckRecommendMode("max")).toBe(true)
    expect(isDeckRecommendMode("max-power")).toBe(false)
  })

  it("accepts units and the custom simulated unit", () => {
    expect(isDeckRecommendSimulatedEventUnit("street")).toBe(true)
    expect(isDeckRecommendSimulatedEventUnit("custom_bonus_characters")).toBe(true)
    expect(isDeckRecommendSimulatedEventUnit("vocaloid")).toBe(false)
  })
})

describe("normalizeDeckRecommendSavedConfig", () => {
  it("keeps valid fields and drops unknown values", () => {
    const config = normalizeDeckRecommendSavedConfig({
      dataRegion: "jp",
      recommendMode: "challenge",
      recommendTarget: "nonsense",
      liveType: "multi",
      selectedAlgorithms: ["ga", "bogus", "dfs"],
      unitFilters: ["street", "invalid", "street"],
      characterFilters: [1, 1, -2, "3"],
      customBonusSupportUnits: { 21: "light_sound", 22: "piapro", x: "street" },
      filterOtherUnit: true,
      keepAfterTrainingState: "yes",
    })
    expect(config.dataRegion).toBe("jp")
    expect(config.recommendMode).toBe("challenge")
    expect(config.recommendTarget).toBeUndefined()
    expect(config.liveType).toBe("multi")
    expect(config.selectedAlgorithms).toEqual(["dfs", "ga"])
    expect(config.unitFilters).toEqual(["street"])
    expect(config.characterFilters).toEqual([1, 3])
    expect(config.customBonusSupportUnits).toEqual({ "21": "light_sound" })
    expect(config.filterOtherUnit).toBe(true)
    expect(config.keepAfterTrainingState).toBeUndefined()
  })

  it("normalizes single card overrides", () => {
    const config = normalizeDeckRecommendSavedConfig({
      singleCardOverrides: [
        { cardId: 12, disabled: false, level: 50, skillLevel: "2", masterRank: null, episodeState: "first", canvas: true },
        { cardId: "not-a-card" },
      ],
    })
    expect(config.singleCardOverrides).toEqual([
      { cardId: 12, disabled: false, level: 50, skillLevel: 2, masterRank: null, episodeState: "first", canvas: true },
    ])
  })
})

describe("algorithm selection migration", () => {
  it("treats the legacy default trio as not customized", () => {
    expect(isLegacyDefaultAlgorithmSelection(["dfs_ga", "ga", "rl"])).toBe(true)
    expect(isLegacyDefaultAlgorithmSelection(["dfs_ga", "dfs"])).toBe(false)
  })

  it("resolves manual selection from saved config first, then preferences", () => {
    expect(resolveInitialAlgorithmSelectionIsManual({ algorithmSelectionMode: "manual" }, {})).toBe(true)
    expect(resolveInitialAlgorithmSelectionIsManual({ selectedAlgorithms: ["dfs_ga", "ga", "rl"] }, {})).toBe(false)
    expect(resolveInitialAlgorithmSelectionIsManual({ selectedAlgorithms: ["dfs"] }, {})).toBe(true)
    expect(resolveInitialAlgorithmSelectionIsManual({}, { algorithms: ["dfs"] })).toBe(true)
    expect(resolveInitialAlgorithmSelectionIsManual({}, {})).toBe(false)
  })

  it("filters persisted algorithms to the known set in canonical order", () => {
    expect(normalizePersistedAlgorithms(["rl", "dfs_ga", "nope"])).toEqual(["dfs_ga", "rl"])
    expect(normalizePersistedAlgorithms("junk")).toBeUndefined()
  })
})
