import { describe, expect, it } from "bun:test"
import {
  resolveCardSupplyBadgeVariant,
  resolveCardTileArtSlots,
  resolveCardTileArts,
} from "./card-display"

describe("resolveCardTileArts", () => {
  it("follows the art mode for 3★ / 4★ cards", () => {
    expect(resolveCardTileArts({ cardRarityType: "rarity_4" }, "both")).toEqual(["normal", "trained"])
    expect(resolveCardTileArts({ cardRarityType: "rarity_3" }, "normal")).toEqual(["normal"])
    expect(resolveCardTileArts({ cardRarityType: "rarity_3" }, "trained")).toEqual(["trained"])
  })

  it("only shows the normal art for rarities without special training", () => {
    for (const cardRarityType of ["rarity_1", "rarity_2", "rarity_birthday"]) {
      expect(resolveCardTileArts({ cardRarityType }, "both")).toEqual(["normal"])
      expect(resolveCardTileArts({ cardRarityType }, "trained")).toEqual(["normal"])
    }
  })

  it("only shows the trained art for cards trained by default", () => {
    expect(resolveCardTileArts({ cardRarityType: "rarity_4", trainedByDefault: true }, "normal")).toEqual(["trained"])
    expect(resolveCardTileArts({ cardRarityType: "rarity_4", trainedByDefault: true }, "both")).toEqual(["trained"])
    // The flag is meaningless without trained art.
    expect(resolveCardTileArts({ cardRarityType: "rarity_2", trainedByDefault: true }, "both")).toEqual(["normal"])
  })
})

describe("resolveCardTileArtSlots", () => {
  it("reserves two slots in `both` mode regardless of how many arts a card has", () => {
    expect(resolveCardTileArtSlots("both")).toBe(2)
    expect(resolveCardTileArtSlots("normal")).toBe(1)
    expect(resolveCardTileArtSlots("trained")).toBe(1)
  })

  it("keeps a single-art card on a half-width slot in `both` mode", () => {
    // The pairing that used to render at double size: one art, two slots.
    expect(resolveCardTileArts({ cardRarityType: "rarity_2" }, "both")).toHaveLength(1)
    expect(resolveCardTileArtSlots("both")).toBe(2)
  })
})

describe("resolveCardSupplyBadgeVariant", () => {
  it("highlights limited, festival, birthday and collab cards only", () => {
    expect(resolveCardSupplyBadgeVariant("term_limited")).toBe("amber")
    expect(resolveCardSupplyBadgeVariant("bloom_festival_limited")).toBe("rose")
    expect(resolveCardSupplyBadgeVariant("birthday")).toBe("sky")
    expect(resolveCardSupplyBadgeVariant("normal")).toBeNull()
    expect(resolveCardSupplyBadgeVariant(null)).toBeNull()
    expect(resolveCardSupplyBadgeVariant("future_type")).toBeNull()
  })
})
