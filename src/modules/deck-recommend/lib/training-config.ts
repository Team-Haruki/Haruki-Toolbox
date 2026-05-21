export type DeckRecommendRarity =
  | "rarity_1"
  | "rarity_2"
  | "rarity_3"
  | "rarity_4"
  | "rarity_birthday"

export type CardTrainingConfig = {
  rarity: DeckRecommendRarity
  disabled: boolean
  maxLevel: boolean
  episodesRead: boolean
  maxMasterRank: boolean
  maxSkillLevel: boolean
  mySekaiCanvas: boolean
}

export const DECK_RECOMMEND_RARITIES: readonly DeckRecommendRarity[] = [
  "rarity_1",
  "rarity_2",
  "rarity_3",
  "rarity_4",
  "rarity_birthday",
]

const DEFAULT_MAXED_RARITIES = new Set<DeckRecommendRarity>(["rarity_1", "rarity_2", "rarity_3"])

export function createDefaultCardTrainingConfig(): CardTrainingConfig[] {
  return DECK_RECOMMEND_RARITIES.map((rarity) => {
    const lowRarity = DEFAULT_MAXED_RARITIES.has(rarity)
    return {
      rarity,
      disabled: false,
      maxLevel: true,
      episodesRead: true,
      maxMasterRank: lowRarity,
      maxSkillLevel: lowRarity,
      mySekaiCanvas: true,
    }
  })
}

export function resolveRarityStarCount(rarity: DeckRecommendRarity): number {
  if (rarity === "rarity_birthday") {
    return 0
  }

  return Number(rarity.replace("rarity_", ""))
}
