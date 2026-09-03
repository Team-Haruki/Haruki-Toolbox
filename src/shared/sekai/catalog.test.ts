import { describe, expect, it } from "bun:test"
import {
  appendCatalogRecords,
  buildCatalogCardThumbnail,
  pushCatalogGroup,
  buildCatalogCharacterMap,
  buildCatalogUnitColorMap,
  cardRarityHasTrainedArt,
  normalizeCatalogMasterCard,
  resolveCardRareCount,
  resolveSekaiCharacterColor,
} from "./catalog"

describe("buildCatalogCharacterMap", () => {
  it("joins localized first/given names and resolves unit", () => {
    const map = buildCatalogCharacterMap([
      { id: 1, firstName: "星乃", givenName: "一歌", unit: "light_sound" },
      { id: 21, givenNameEnglish: "MIKU", firstNameEnglish: "HATSUNE", unit: "piapro" },
      { id: 0, firstName: "invalid" },
      null,
    ])

    expect(map.get(1)?.name).toBe("星乃一歌")
    expect(map.get(1)?.unit).toBe("light_sound")
    expect(map.get(21)?.name).toBe("MIKU HATSUNE")
    expect(map.get(21)?.iconUrl).toContain("miku")
    expect(map.has(0)).toBe(false)
  })

  it("trims whitespace inside name parts", () => {
    const map = buildCatalogCharacterMap([
      { id: 2, firstName: "호시노", givenName: " 이치카", unit: "light_sound" },
    ])

    expect(map.get(2)?.name).toBe("호시노이치카")
  })
})

describe("buildCatalogUnitColorMap", () => {
  it("keeps the first color per unit", () => {
    const map = buildCatalogUnitColorMap([
      { unit: "light_sound", colorCode: "#33aaee" },
      { unit: "light_sound", colorCode: "#ffffff" },
      { unit: "unknown_unit", colorCode: "#000000" },
    ])

    expect(map.get("light_sound")).toBe("#33aaee")
    expect(map.size).toBe(1)
  })
})

describe("resolveSekaiCharacterColor", () => {
  it("returns the fixed representative color for known characters", () => {
    expect(resolveSekaiCharacterColor(1)).toBe("#33AAEE")
    expect(resolveSekaiCharacterColor(21)).toBe("#33CCBB")
    expect(resolveSekaiCharacterColor(26)).toBe("#3366CC")
  })

  it("returns null for unknown or missing character ids", () => {
    expect(resolveSekaiCharacterColor(0)).toBeNull()
    expect(resolveSekaiCharacterColor(27)).toBeNull()
    expect(resolveSekaiCharacterColor(null)).toBeNull()
  })

  it("covers all 26 characters with hex colors", () => {
    for (let characterId = 1; characterId <= 26; characterId += 1) {
      expect(resolveSekaiCharacterColor(characterId)).toMatch(/^#[0-9A-F]{6}$/)
    }
  })
})

describe("normalizeCatalogMasterCard", () => {
  it("normalizes raw master card records", () => {
    const card = normalizeCatalogMasterCard({
      id: 423,
      characterId: 5,
      cardRarityType: "rarity_4",
      attr: "Cool",
      supportUnit: "none",
      prefix: "  title  ",
      assetbundleName: "res005_no015",
      releaseAt: 1688353200000,
      skillId: 7,
      cardSupplyId: 3,
    })

    expect(card).not.toBeNull()
    expect(card?.attr).toBe("cool")
    expect(card?.prefix).toBe("title")
    expect(card?.releaseAt).toBe(1688353200000)
  })

  it("rejects records without a valid id", () => {
    expect(normalizeCatalogMasterCard({ attr: "cool" })).toBeNull()
    expect(normalizeCatalogMasterCard(null)).toBeNull()
  })
})

describe("card rarity helpers", () => {
  it("detects trained art availability", () => {
    expect(cardRarityHasTrainedArt("rarity_3")).toBe(true)
    expect(cardRarityHasTrainedArt("rarity_4")).toBe(true)
    expect(cardRarityHasTrainedArt("rarity_2")).toBe(false)
    expect(cardRarityHasTrainedArt("rarity_birthday")).toBe(false)
  })

  it("resolves rare star counts", () => {
    expect(resolveCardRareCount("rarity_4")).toBe(4)
    expect(resolveCardRareCount("rarity_birthday")).toBe(1)
    expect(resolveCardRareCount("")).toBe(0)
  })
})

describe("buildCatalogCardThumbnail", () => {
  it("builds urls for trained-capable cards", () => {
    const card = normalizeCatalogMasterCard({
      id: 423,
      characterId: 5,
      cardRarityType: "rarity_4",
      attr: "cool",
      assetbundleName: "res005_no015",
    })
    expect(card).not.toBeNull()
    const thumbnail = buildCatalogCardThumbnail(card!, "jp")

    expect(thumbnail.thumbnailUrl).toContain("res005_no015_normal.png")
    expect(thumbnail.trainedThumbnailUrl).toContain("res005_no015_after_training.png")
    expect(thumbnail.rareIconUrl).toContain("rare_star_normal.png")
    expect(thumbnail.trainedRareIconUrl).toContain("rare_star_after_training.png")
    expect(thumbnail.rareCount).toBe(4)
    expect(thumbnail.hasTrainedArt).toBe(true)
  })

  it("uses the trained art for the untrained slot of trained-by-default cards", () => {
    // Touhou collab 4★ (card 1167): `initialSpecialTrainingStatus: done`,
    // the `_normal` thumbnail does not exist on the asset server.
    const card = normalizeCatalogMasterCard({
      id: 1167,
      characterId: 21,
      cardRarityType: "rarity_4",
      attr: "happy",
      assetbundleName: "res021_no054",
      initialSpecialTrainingStatus: "done",
    })
    const thumbnail = buildCatalogCardThumbnail(card!, "jp")

    expect(thumbnail.thumbnailUrl).toContain("res021_no054_after_training.png")
    expect(thumbnail.trainedThumbnailUrl).toContain("res021_no054_after_training.png")
    expect(thumbnail.rareIconUrl).toContain("rare_star_after_training.png")
    expect(thumbnail.hasTrainedArt).toBe(true)
  })

  it("omits trained art for birthday cards", () => {
    const card = normalizeCatalogMasterCard({
      id: 1,
      cardRarityType: "rarity_birthday",
      attr: "cool",
      assetbundleName: "res001_no001",
    })
    const thumbnail = buildCatalogCardThumbnail(card!, "jp")

    expect(thumbnail.trainedThumbnailUrl).toBeNull()
    expect(thumbnail.rareIconUrl).toContain("rare_birthday")
    expect(thumbnail.trainedRareIconUrl).toContain("rare_birthday")
  })
})

describe("pushCatalogGroup", () => {
  it("creates the list on first use and appends afterwards", () => {
    const groups = new Map<number, string[]>()
    pushCatalogGroup(groups, 1, "a")
    pushCatalogGroup(groups, 1, "b")
    pushCatalogGroup(groups, 2, "c")
    expect(groups.get(1)).toEqual(["a", "b"])
    expect(groups.get(2)).toEqual(["c"])
  })
})

describe("appendCatalogRecords", () => {
  it("merges flat detail arrays far beyond the engine argument-spread limit", () => {
    // tw/kr/cn ship resourceBoxDetails as one flat array with 100k+ rows;
    // push(...rows) at that size overflows mobile-browser stacks.
    const rows = Array.from({ length: 200_000 }, (_, index) => ({ resourceBoxId: index }))
    const target: Record<string, unknown>[] = []
    appendCatalogRecords(target, rows)
    appendCatalogRecords(target, [{ resourceBoxId: -1 }, null, "skip", { resourceBoxId: -2 }])
    appendCatalogRecords(target, undefined)

    expect(target.length).toBe(200_002)
    expect(target[0]?.resourceBoxId).toBe(0)
    expect(target[200_001]?.resourceBoxId).toBe(-2)
  })
})
