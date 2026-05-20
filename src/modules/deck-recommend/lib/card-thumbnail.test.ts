import { describe, expect, it } from "bun:test"
import type { RecommendCard, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import {
  buildCardThumbnailView,
  buildDeckResultViews,
  resolveRecommendCardDisplayState,
  type DeckRecommendMasterCard,
} from "./card-thumbnail"

const baseRecommendCard: RecommendCard = {
  card_id: 100,
  total_power: 30_000,
  base_power: 28_000,
  event_bonus_rate: 110,
  master_rank: 2,
  level: 60,
  skill_level: 4,
  skill_score_up: 100,
  skill_life_recovery: 0,
  episode1_read: true,
  episode2_read: true,
  after_training: false,
  default_image: "",
  has_canvas_bonus: false,
}

const masterCard: DeckRecommendMasterCard = {
  id: 100,
  characterId: 5,
  cardRarityType: "rarity_4",
  attr: "cute",
  prefix: "Test card",
  assetbundleName: "res005_no001",
}

describe("deck recommend card thumbnail helpers", () => {
  it("uses default_image to choose display art before owned training state", () => {
    expect(resolveRecommendCardDisplayState({
      after_training: false,
      default_image: "special_training",
    })).toEqual({
      displayAfterTraining: true,
      trainedArt: true,
    })

    expect(resolveRecommendCardDisplayState({
      after_training: true,
      default_image: "original",
    })).toEqual({
      displayAfterTraining: false,
      trainedArt: false,
    })
  })

  it("builds thumbnail URLs and overlays from master card metadata", () => {
    const view = buildCardThumbnailView({
      ...baseRecommendCard,
      after_training: true,
      default_image: "original",
      has_canvas_bonus: true,
    }, masterCard, "jp")

    expect(view.thumbnailUrl).toContain("/jp-assets/startapp/thumbnail/chara/res005_no001_normal.png")
    expect(view.frameUrl).toContain("frame_rarity_4.png")
    expect(view.attrIconUrl).toContain("attr_cute.png")
    expect(view.rareIconUrl).toContain("rare_star_normal.png")
    expect(view.rareCount).toBe(4)
    expect(view.trainRankUrl).toContain("train_rank_2.png")
    expect(view.canvasIconUrl).toContain("icon_canvas.png")
  })

  it("maps deck result cards with available master data", () => {
    const result: RecommendResult = {
      decks: [{
        score: 1,
        live_score: 2,
        mysekai_event_point: 0,
        total_power: 3,
        base_power: 4,
        area_item_bonus_power: 0,
        character_bonus_power: 0,
        honor_bonus_power: 0,
        fixture_bonus_power: 0,
        gate_bonus_power: 0,
        event_bonus_rate: 5,
        support_deck_bonus_rate: 0,
        multi_live_score_up: 0,
        cards: [baseRecommendCard],
      }],
    }

    const views = buildDeckResultViews(result, { cards: [masterCard] }, "jp")
    expect(views).toHaveLength(1)
    expect(views[0].cards[0].thumbnail.title).toBe("Test card")
  })
})
