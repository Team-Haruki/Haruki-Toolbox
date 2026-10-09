import { describe, expect, it } from "bun:test"
import type { ComposerTranslation } from "vue-i18n"
import type { DeckRecommendMasterCardOption } from "./card-options"
import { createDeckRecommendCardTags } from "./card-tags"

const t = ((key: string) => key) as ComposerTranslation

function makeOption(overrides: Partial<DeckRecommendMasterCardOption> = {}): DeckRecommendMasterCardOption {
  return {
    id: 1,
    value: "1",
    label: "Card",
    description: "",
    characterId: null,
    characterName: null,
    characterColorCode: null,
    unit: null,
    unitProfileName: null,
    unitColorCode: null,
    rarity: null,
    attr: null,
    maxLevel: 60,
    maxSkillLevel: 4,
    canSpecialTrain: true,
    thumbnailUrl: null,
    attrIconUrl: null,
    keywords: [],
    ...overrides,
  }
}

describe("createDeckRecommendCardTags", () => {
  it("skips the parts a card does not have", () => {
    expect(createDeckRecommendCardTags(makeOption(), t)).toEqual([])
  })

  it("tags rarity, attribute, character and unit in that order", () => {
    const tags = createDeckRecommendCardTags(makeOption({
      rarity: "rarity_4",
      attr: "cool",
      characterName: "Miku",
      characterColorCode: "#33ccbb",
      unit: "piapro",
      unitProfileName: "VIRTUAL SINGER",
    }), t)

    expect(tags.map((tag) => tag.label)).toEqual([
      "deckRecommend.training.rarities.rarity_4",
      "deckRecommend.cardTags.attrs.cool",
      "Miku",
      "VIRTUAL SINGER",
    ])
    expect(tags[0]?.class).toBeTruthy()
    expect(tags[2]?.style).toBeDefined()
  })
})
