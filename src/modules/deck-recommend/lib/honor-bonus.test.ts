import { describe, expect, it } from "bun:test"
import { readFileSync } from "node:fs"
import { createSekaiDeckRecommend } from "haruki-sekai-deck-recommend-cpp"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"
import { isMasterCacheCovering } from "@/shared/sekai/master-coverage"
import fixture from "./fixtures/honor-bonus.json"

const musicMetas = [{
  music_id: 1, difficulty: "expert", music_time: 100, event_rate: 100,
  base_score: 1, base_score_auto: 1, fever_score: 0, fever_end_time: 0, tap_count: 100,
  skill_score_solo: [0, 0, 0, 0, 0, 0], skill_score_auto: [0, 0, 0, 0, 0, 0],
  skill_score_multi: [0, 0, 0, 0, 0, 0],
}]

describe("WL finale honor bonuses", () => {
  it("requires old caches to fetch the honor bonus table", () => {
    const oldFiles = SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES.filter((name) => name !== "eventHonorBonuses")
    expect(isMasterCacheCovering(oldFiles, SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES)).toBe(false)
  })

  it("passes owned honor bonuses through the toolbox master selection into WASM", async () => {
    const engine = await createSekaiDeckRecommend({
      moduleOptions: {
        wasmBinary: readFileSync(import.meta.resolve("haruki-sekai-deck-recommend-cpp/sekai_deck_recommend.wasm").replace("file://", "")),
        printErr: () => {},
      },
    })
    try {
      const master = Object.fromEntries(SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES.map((key) => [
        key, (fixture.master as Record<string, unknown>)[key] ?? [],
      ]))
      engine.loadMasterData("jp", master)
      engine.loadMusicMetas("jp", musicMetas)
      const recommend = (owned: boolean) => engine.recommend({
        region: "jp", user_data: { ...fixture.user, userHonors: owned ? fixture.user.userHonors : [] },
        live_type: "multi", music_id: 1, music_diff: "expert", event_id: 202,
        target: "bonus", algorithm: "dfs", limit: 1, fixed_cards: [1, 2, 3, 4, 5],
      }).decks[0]!
      const withoutHonor = recommend(false)
      const withHonor = recommend(true)
      expect(withHonor.event_bonus_rate - withoutHonor.event_bonus_rate).toBe(50)
      expect(withHonor.cards[0]!.card_id).toBe(1)
      expect(withHonor.cards[0]!.event_bonus_rate - withoutHonor.cards[0]!.event_bonus_rate).toBe(50)
      expect(withHonor.honor_bonus_power).toBe(100)
      expect(withoutHonor.honor_bonus_power).toBe(0)
    } finally {
      engine.dispose()
    }
  })
})
