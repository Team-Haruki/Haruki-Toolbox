import { describe, expect, it } from "bun:test"
import { resolveCardSupplyBadgeVariant, resolveCardTileArts } from "./card-display"

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
