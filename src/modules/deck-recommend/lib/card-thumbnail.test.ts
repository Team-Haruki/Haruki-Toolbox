import { describe, expect, it } from "bun:test"
import type { RecommendCard, RecommendResult } from "haruki-sekai-deck-recommend-cpp"
import {
  buildCardThumbnailView,
  buildDeckResultViews,
  buildDeckSupportCardViews,
  resolveDeckSupportCards,
  resolveRecommendCardDisplayState,
  type DeckRecommendMasterCard,
  type DeckResultSupportCard,
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
  characterName: "Test character",
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
    expect(view.canvasIconUrl).toContain("mysekai/icon/icon_canvas.png")
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

    const views = buildDeckResultViews(result, {
      cards: [masterCard],
      gameCharacters: [{ id: 5, firstName: "白石", givenName: "杏" }],
    }, "jp")
    expect(views).toHaveLength(1)
    expect(views[0].cards[0].thumbnail.title).toBe("Test card")
    expect(views[0].cards[0].masterCard?.characterName).toBe("白石杏")
  })

  it("maps world bloom support cards with available master data", () => {
    const views = buildDeckSupportCardViews([{
      card_id: 100,
      bonus: 12.5,
      skill_level: 4,
      master_rank: 5,
      level: 60,
      after_training: true,
      default_image: "special_training",
    }], { cards: [masterCard] }, "jp")

    expect(views).toHaveLength(1)
    expect(views[0].card.bonus).toBe(12.5)
    expect(views[0].card.skill_level).toBe(4)
    expect(views[0].thumbnail.title).toBe("Test card")
    expect(views[0].thumbnail.trainRank).toBe(5)
  })

  it("maps per-deck world bloom support cards and filters main deck duplicates", () => {
    const deck = {
      ...createRecommendDeck([100, 101, 102, 103, 104]),
      support_deck_cards: [
        createSupportCard(100, 30),
        createSupportCard(200, 20),
        createSupportCard(201, 10),
      ],
    }

    expect(resolveDeckSupportCards(deck).map((card) => card.card_id)).toEqual([200, 201])
  })

  it("returns no support cards when a deck has no per-deck support data", () => {
    const deck = createRecommendDeck([100, 101, 102, 103, 104])

    expect(resolveDeckSupportCards(deck)).toEqual([])
  })
})

function createRecommendDeck(cardIds: number[]): RecommendResult["decks"][number] {
  return {
    score: 0,
    live_score: 0,
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
      ...baseRecommendCard,
      card_id: cardId,
    })),
  }
}

function createSupportCard(cardId: number, bonus: number): DeckResultSupportCard {
  return {
    card_id: cardId,
    bonus,
    skill_level: 4,
    master_rank: 5,
    level: 60,
    after_training: true,
    default_image: "special_training",
  }
}
