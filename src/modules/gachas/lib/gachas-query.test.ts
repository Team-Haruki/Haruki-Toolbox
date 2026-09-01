import { describe, expect, it } from "bun:test"
import { serializeQueryRecord } from "@/lib/query-codec"
import {
  buildGachaActiveChips,
  gachasQueryCodec,
  removeGachaActiveChip,
  type GachaListQuery,
} from "./gachas-query"

function parse(query: Record<string, string | string[]>): GachaListQuery {
  return gachasQueryCodec.parse(query)
}

describe("gachasQueryCodec", () => {
  it("omits defaults from the URL", () => {
    const record = gachasQueryCodec.serialize(gachasQueryCodec.defaults())
    expect(serializeQueryRecord(record)).toBe("")
  })

  it("round-trips a fully populated state", () => {
    const state: GachaListQuery = {
      q: "miku",
      type: ["ceil", "gift"],
      status: ["ongoing", "upcoming"],
      year: 2024,
      chars: [1, 21],
      cards: [123, 456],
      sort: "id",
      dir: "asc",
      page: 3,
      size: 60,
    }
    const record = gachasQueryCodec.serialize(state)
    const query: Record<string, string> = {}
    for (const [key, value] of Object.entries(record)) {
      if (value != null) {
        query[key] = value
      }
    }
    expect(query).toEqual({
      q: "miku",
      type: "ceil,gift",
      status: "ongoing,upcoming",
      year: "2024",
      chars: "1,21",
      cards: "123,456",
      sort: "id",
      dir: "asc",
      page: "3",
      size: "60",
    })
    expect(parse(query)).toEqual(state)
  })

  it("tolerates garbage", () => {
    const state = parse({
      q: ["  spaced  ", "second"],
      type: "ceil,DROP TABLE,gift,,9x",
      status: "ongoing,bogus",
      year: "1999",
      chars: "1,x,-3,1",
      cards: "abc",
      sort: "bogus",
      dir: "sideways",
      page: "-4",
      size: "7",
    })
    expect(state).toEqual({
      q: "spaced",
      type: ["ceil", "gift"],
      status: ["ongoing"],
      year: null,
      chars: [1],
      cards: [],
      sort: "start",
      dir: "desc",
      page: 1,
      size: 30,
    })
  })

  it("declares filter keys without sort/page keys", () => {
    expect(gachasQueryCodec.filterKeys).toEqual(["q", "type", "status", "year", "chars", "cards"])
    expect(gachasQueryCodec.keys).toContain("sort")
    expect(gachasQueryCodec.keys).toContain("size")
  })
})

describe("buildGachaActiveChips", () => {
  const ctx = {
    characterNames: new Map([[1, "Ichika"]]),
    cardNames: new Map([[10, "Card Ten"]]),
    typeLabel: (type: string) => `type:${type}`,
    statusLabel: (status: string) => `status:${status}`,
  }
  const t = (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ""}`

  it("builds one chip per active value", () => {
    const chips = buildGachaActiveChips({
      ...gachasQueryCodec.defaults(),
      q: "fes",
      type: ["ceil"],
      status: ["ended"],
      year: 2023,
      chars: [1, 99],
      cards: [10, 11],
    }, ctx, t)
    expect(chips.map((chip) => chip.key)).toEqual([
      "q",
      "type:ceil",
      "status:ended",
      "year",
      "chars:1",
      "chars:99",
      "cards:10",
      "cards:11",
    ])
    expect(chips[1]?.label).toBe("type:ceil")
    expect(chips[4]?.label).toBe("Ichika")
    expect(chips[5]?.label).toBe("#99")
    expect(chips[6]?.label).toContain("Card Ten")
    expect(chips[7]?.label).toContain("11")
  })

  it("returns nothing at defaults", () => {
    expect(buildGachaActiveChips(gachasQueryCodec.defaults(), ctx, t)).toEqual([])
  })

  it("removes a single value or a scalar key", () => {
    const state: GachaListQuery = {
      ...gachasQueryCodec.defaults(),
      q: "x",
      type: ["ceil", "gift"],
      chars: [1, 2],
      year: 2020,
    }
    removeGachaActiveChip(state, "type:ceil")
    removeGachaActiveChip(state, "chars:2")
    removeGachaActiveChip(state, "q")
    removeGachaActiveChip(state, "year")
    removeGachaActiveChip(state, "unknown:1")
    expect(state.type).toEqual(["gift"])
    expect(state.chars).toEqual([1])
    expect(state.q).toBe("")
    expect(state.year).toBeNull()
  })
})
