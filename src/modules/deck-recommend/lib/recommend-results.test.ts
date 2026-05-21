import { describe, expect, it } from "bun:test"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import { mergeDeckRecommendResults } from "./recommend-results"

describe("deck recommend result helpers", () => {
  it("deduplicates decks by card set and keeps results sorted by score", () => {
    const result = mergeDeckRecommendResults([
      {
        algorithm: "dfs_ga",
        result: { decks: [createDeck([1, 2, 3, 4, 5], 100), createDeck([6, 7, 8, 9, 10], 90)] },
      },
      {
        algorithm: "ga",
        result: { decks: [createDeck([5, 4, 3, 2, 1], 120), createDeck([11, 12, 13, 14, 15], 110)] },
      },
    ])

    expect(result.decks.map((deck) => deck.score)).toEqual([120, 110, 90])
    expect(result.decks.map((deck) => deck.cards.map((card) => card.card_id))).toEqual([
      [5, 4, 3, 2, 1],
      [11, 12, 13, 14, 15],
      [6, 7, 8, 9, 10],
    ])
    expect(result.decks[0]?.source_algorithms).toEqual(["dfs_ga", "ga"])
    expect(result.decks[1]?.source_algorithms).toEqual(["ga"])
  })
})

function createDeck(cardIds: number[], score: number): RecommendDeck {
  return {
    score,
    live_score: score,
    mysekai_event_point: 0,
    total_power: 0,
    base_power: 0,
    area_item_bonus_power: 0,
    character_bonus_power: 0,
    honor_bonus_power: 0,
    fixture_bonus_power: 0,
    gate_bonus_power: 0,
    event_bonus_rate: 0,
    support_deck_bonus_rate: 0,
    multi_live_score_up: 0,
    cards: cardIds.map((cardId) => ({
      card_id: cardId,
      total_power: 0,
      base_power: 0,
      event_bonus_rate: 0,
      master_rank: 0,
      level: 0,
      skill_level: 0,
      skill_score_up: 0,
      skill_life_recovery: 0,
      episode1_read: false,
      episode2_read: false,
      after_training: false,
      default_image: "",
      has_canvas_bonus: false,
    })),
  }
}
