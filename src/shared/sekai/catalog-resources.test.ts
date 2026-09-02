import { describe, expect, test } from "bun:test"
import { buildCharactersIndex } from "./catalog-resources"

const files: Record<string, unknown> = {
  gameCharacters: [
    { id: 21, firstName: "初音", givenName: "ミク", unit: "piapro" },
    { id: 1, firstName: "星乃", givenName: "一歌", unit: "light_sound" },
    { id: 2, givenNameEnglish: "Saki", firstNameEnglish: "Tenma", unit: "not_a_unit" },
    // Skipped: no name at all / non-numeric id.
    { id: 99, unit: "idol" },
    { id: "x", firstName: "Ghost" },
  ],
  gameCharacterUnits: [
    { id: 1, gameCharacterId: 1, unit: "light_sound", colorCode: "#33AAEE" },
    { id: 21, gameCharacterId: 21, unit: "piapro", colorCode: "#33CCBB" },
    { id: 22, gameCharacterId: 21, unit: "light_sound", colorCode: "#000000" },
    { id: 23, gameCharacterId: 21, unit: "mystery", colorCode: "" },
    // Skipped rows: non-numeric id, missing character.
    { id: "x", gameCharacterId: 1, unit: "idol" },
    { id: 5, gameCharacterId: 0, unit: "idol" },
  ],
}

describe("buildCharactersIndex", () => {
  const index = buildCharactersIndex(files)

  test("lists named characters in id order with a guarded unit", () => {
    expect(index.characters.map((character) => character.id)).toEqual([1, 2, 21])
    expect(index.characters.map((character) => character.name)).toEqual(["星乃一歌", "Saki Tenma", "初音ミク"])
    expect(index.characters.map((character) => character.unit)).toEqual(["light_sound", null, "piapro"])
    expect(index.characters.every((character) => character.iconUrl.length > 0)).toBe(true)
    expect(index.characterMap.size).toBe(3)
    expect(index.characterMap.get(21)).toBe(index.characters[2]!)
  })

  test("keeps the first color per unit and ignores unknown units", () => {
    expect(index.unitColorMap).toEqual(new Map([
      ["light_sound", "#33AAEE"],
      ["piapro", "#33CCBB"],
    ]))
  })

  test("indexes gameCharacterUnits rows by id with guarded unit and color", () => {
    expect(index.characterUnitById.size).toBe(4)
    expect(index.characterUnitById.get(1)).toEqual({
      id: 1,
      gameCharacterId: 1,
      unit: "light_sound",
      colorCode: "#33AAEE",
    })
    expect(index.characterUnitById.get(23)).toEqual({
      id: 23,
      gameCharacterId: 21,
      unit: null,
      colorCode: null,
    })
  })

  test("groups gameCharacterUnits row ids per character in file order", () => {
    expect(index.characterUnitIdsByCharacter.get(21)).toEqual([21, 22, 23])
    expect(index.characterUnitIdsByCharacter.get(1)).toEqual([1])
    expect(index.characterUnitIdsByCharacter.has(0)).toBe(false)
    expect(index.characterUnitIdsByCharacter.size).toBe(2)
  })

  test("tolerates missing files", () => {
    const empty = buildCharactersIndex({})
    expect(empty.characters).toEqual([])
    expect(empty.characterMap.size).toBe(0)
    expect(empty.unitColorMap.size).toBe(0)
    expect(empty.characterUnitById.size).toBe(0)
    expect(empty.characterUnitIdsByCharacter.size).toBe(0)
  })
})
