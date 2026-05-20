import { describe, expect, it } from "bun:test"
import { buildDeckRecommendOptions, resolveRecommendDataMode, resolveWasmLiveType } from "./recommend-options"
import { createDefaultCardTrainingConfig } from "./training-config"

describe("deck recommend wasm option helpers", () => {
  it("maps carnival UI live type to wasm cheerful", () => {
    expect(resolveWasmLiveType("event", "carnival")).toBe("cheerful")
  })

  it("maps challenge auto live type to challenge_auto and other challenge types to challenge", () => {
    expect(resolveWasmLiveType("challenge", "auto")).toBe("challenge_auto")
    expect(resolveWasmLiveType("challenge", "multi")).toBe("challenge")
  })

  it("forces mysekai mode to mysekai live type", () => {
    expect(resolveWasmLiveType("mysekai", "multi")).toBe("mysekai")
  })

  it("builds wasm recommend options from form state", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.region).toBe("jp")
    expect(options.live_type).toBe("multi")
    expect(options.algorithm).toBe("dfs_ga")
    expect(options.event_id).toBe(205)
    expect(options.multi_live_teammate_power).toBe(250000)
    expect(options.rarity_1_config?.master_max).toBe(true)
    expect(options.rarity_4_config?.skill_max).toBe(false)
  })

  it("uses mysekai recommend-data mode only for mysekai deck mode", () => {
    expect(resolveRecommendDataMode("mysekai")).toBe("mysekai")
    expect(resolveRecommendDataMode("event")).toBe("suite")
  })
})
