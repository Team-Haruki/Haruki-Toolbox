import { describe, expect, it } from "bun:test"
import type { RecommendDeck } from "haruki-sekai-deck-recommend-cpp"
import { applyDeckRecommendLiveBoost, mergeDeckRecommendResults } from "./recommend-results"

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

  it("sorts bonus decks by event bonus before score", () => {
    const result = mergeDeckRecommendResults([
      {
        algorithm: "dfs",
        result: {
          decks: [
            createDeck([1, 2, 3, 4, 5], 100, { event_bonus_rate: 110 }),
            createDeck([6, 7, 8, 9, 10], 120, { event_bonus_rate: 100 }),
          ],
        },
      },
    ], "bonus")

    expect(result.decks.map((deck) => deck.event_bonus_rate)).toEqual([110, 100])
  })

  it("sorts event decks by explicit target", () => {
    const results = [
      {
        algorithm: "dfs_ga" as const,
        result: {
          decks: [
            createDeck([1, 2, 3, 4, 5], 300, {
              total_power: 1000,
              multi_live_score_up: 100,
              event_bonus_rate: 100,
            }),
            createDeck([6, 7, 8, 9, 10], 200, {
              total_power: 3000,
              multi_live_score_up: 150,
              event_bonus_rate: 90,
            }),
            createDeck([11, 12, 13, 14, 15], 100, {
              total_power: 2000,
              multi_live_score_up: 200,
              event_bonus_rate: 120,
            }),
          ],
        },
      },
    ]

    expect(mergeDeckRecommendResults(results, "event", "power").decks[0]?.total_power).toBe(3000)
    expect(mergeDeckRecommendResults(results, "event", "skill").decks[0]?.multi_live_score_up).toBe(200)
    expect(mergeDeckRecommendResults(results, "event", "bonus").decks[0]?.event_bonus_rate).toBe(120)
  })

  it("sorts max score decks by live score instead of fake event point", () => {
    const result = mergeDeckRecommendResults([
      {
        algorithm: "dfs_ga",
        result: {
          decks: [
            createDeck([1, 2, 3, 4, 5], 300, { live_score: 1000 }),
            createDeck([6, 7, 8, 9, 10], 200, { live_score: 3000 }),
          ],
        },
      },
    ], "max", "score")

    expect(result.decks[0]?.live_score).toBe(3000)
  })

  it("sorts mysekai decks by mysekai event point and support-aware bonus tie breakers", () => {
    const result = mergeDeckRecommendResults([
      {
        algorithm: "ga",
        result: {
          decks: [
            createDeck([1, 2, 3, 4, 5], 100, {
              mysekai_event_point: 1000,
              total_power: 450000,
              event_bonus_rate: 20,
              support_deck_bonus_rate: 0,
            }),
            createDeck([6, 7, 8, 9, 10], 90, {
              mysekai_event_point: 1000,
              total_power: 450000,
              event_bonus_rate: 15,
              support_deck_bonus_rate: 10,
            }),
            createDeck([11, 12, 13, 14, 15], 200, {
              mysekai_event_point: 900,
              total_power: 500000,
              event_bonus_rate: 50,
            }),
          ],
        },
      },
    ], "mysekai")

    expect(result.decks.map((deck) => deck.cards[0]?.card_id)).toEqual([6, 1, 11])
  })

  it("applies live boost multipliers to event Pt without changing live score", () => {
    const results = applyDeckRecommendLiveBoost([
      {
        algorithm: "dfs",
        result: {
          decks: [
            createDeck([1, 2, 3, 4, 5], 123, {
              live_score: 456789,
            }),
          ],
        },
      },
    ], "event", 3)

    expect(results[0]?.result.decks[0]?.score).toBe(1845)
    expect(results[0]?.result.decks[0]?.live_score).toBe(456789)
    expect(results[0]?.result.decks[0]?.live_boost_original_score).toBe(123)
    expect(results[0]?.result.decks[0]?.live_boost_multiplier).toBe(15)
  })

  it("does not apply live boost multipliers to score-only modes", () => {
    const results = applyDeckRecommendLiveBoost([
      {
        algorithm: "dfs",
        result: {
          decks: [createDeck([1, 2, 3, 4, 5], 123)],
        },
      },
    ], "challenge", 5)

    expect(results[0]?.result.decks[0]?.score).toBe(123)
  })

})

function createDeck(cardIds: number[], score: number, patch: Partial<RecommendDeck> = {}): RecommendDeck {
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
    ...patch,
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
