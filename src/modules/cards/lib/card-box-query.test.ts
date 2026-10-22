import { describe, expect, test } from "bun:test"
import { createDefaultCardBoxQuery, parseCardBoxQuery, serializeCardBoxQuery } from "./card-box-query"

describe("card box query codec", () => {
  test("defaults serialize to an empty query", () => {
    const record = serializeCardBoxQuery(createDefaultCardBoxQuery())
    expect(Object.values(record).every((value) => value === undefined)).toBe(true)
  })

  test("round-trips filters and pagination", () => {
    const state = parseCardBoxQuery({ chars: "1,21", units: "light_sound", attrs: "cute,cool", rar: "rarity_4", own: "missing", page: "3", size: "120" })
    expect(state).toEqual({
      characterIds: [1, 21], units: ["light_sound"], attrs: ["cute", "cool"], rarities: ["rarity_4"], ownership: "missing", page: 3, size: 120,
    })
    expect(serializeCardBoxQuery(state)).toEqual({
      chars: "1,21", units: "light_sound", attrs: "cute,cool", rar: "rarity_4", own: "missing", page: "3", size: "120",
    })
  })

  test("ignores garbage and unknown page sizes", () => {
    expect(parseCardBoxQuery({ chars: "x,0", own: "nope", page: "-2", size: "7", rar: "rarity_9" })).toEqual(createDefaultCardBoxQuery())
  })
})
