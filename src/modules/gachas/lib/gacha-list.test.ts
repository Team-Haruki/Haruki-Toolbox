import { describe, expect, it } from "bun:test"
import {
  buildGachaPickupCharacterMap,
  buildGachaSearchParts,
  collectGachaListYears,
  filterGachaList,
  resolveGachaListStatus,
  resolveGachaStatusUntil,
  sortGachaList,
  type GachaListItem,
} from "./gacha-list"
import { gachasQueryCodec } from "./gachas-query"

function item(overrides: Partial<GachaListItem> & { id: number }): GachaListItem {
  return {
    gachaType: "ceil",
    name: `Gacha ${overrides.id}`,
    startAt: Date.UTC(2023, 0, overrides.id),
    endAt: Date.UTC(2023, 0, overrides.id + 5),
    pickupCardIds: [],
    ...overrides,
  }
}

const gachas: GachaListItem[] = [
  item({ id: 1, name: "Alpha Fes", gachaType: "ceil", pickupCardIds: [10, 11] }),
  item({ id: 2, name: "Beta", gachaType: "normal", pickupCardIds: [12], startAt: Date.UTC(2022, 5, 1), endAt: Date.UTC(2022, 5, 9) }),
  item({ id: 3, name: "Gamma", gachaType: "gift", pickupCardIds: [], startAt: null, endAt: null }),
  item({ id: 4, name: "Delta", gachaType: "ceil", pickupCardIds: [11], startAt: Date.UTC(2030, 0, 1), endAt: Date.UTC(2030, 0, 9) }),
]

const cardCharacterById = new Map<number, number | null>([[10, 1], [11, 2], [12, null]])
const ctx = {
  pickupCharacterIdsByGacha: buildGachaPickupCharacterMap(gachas, cardCharacterById),
  searchPartsByGacha: new Map(gachas.map((gacha) => [gacha.id, buildGachaSearchParts(gacha, gacha.id === 1 ? ["Ichika"] : [])])),
  nowMs: Date.UTC(2023, 0, 3),
}

function query(overrides: Partial<ReturnType<typeof gachasQueryCodec.defaults>> = {}) {
  return { ...gachasQueryCodec.defaults(), ...overrides }
}

describe("buildGachaPickupCharacterMap", () => {
  it("maps gachas to the characters of their pickup cards", () => {
    expect([...ctx.pickupCharacterIdsByGacha.get(1) ?? []]).toEqual([1, 2])
    expect(ctx.pickupCharacterIdsByGacha.get(2)?.size).toBe(0)
  })
})

describe("filterGachaList", () => {
  it("matches name, id and pickup character names", () => {
    expect(filterGachaList(gachas, query({ q: "alpha" }), ctx).map((g) => g.id)).toEqual([1])
    expect(filterGachaList(gachas, query({ q: "#2" }), ctx).map((g) => g.id)).toEqual([2])
    expect(filterGachaList(gachas, query({ q: "ichika" }), ctx).map((g) => g.id)).toEqual([1])
  })

  it("filters by type, status and year", () => {
    expect(filterGachaList(gachas, query({ type: ["ceil"] }), ctx).map((g) => g.id)).toEqual([1, 4])
    expect(filterGachaList(gachas, query({ status: ["ongoing"] }), ctx).map((g) => g.id)).toEqual([1, 3])
    expect(filterGachaList(gachas, query({ status: ["upcoming"] }), ctx).map((g) => g.id)).toEqual([4])
    expect(filterGachaList(gachas, query({ status: ["ended", "upcoming"] }), ctx).map((g) => g.id)).toEqual([2, 4])
    expect(filterGachaList(gachas, query({ year: 2022 }), ctx).map((g) => g.id)).toEqual([2])
  })

  it("filters by pickup characters (any) and pickup cards (all)", () => {
    expect(filterGachaList(gachas, query({ chars: [2] }), ctx).map((g) => g.id)).toEqual([1, 4])
    expect(filterGachaList(gachas, query({ chars: [1, 2] }), ctx).map((g) => g.id)).toEqual([1, 4])
    expect(filterGachaList(gachas, query({ cards: [11] }), ctx).map((g) => g.id)).toEqual([1, 4])
    expect(filterGachaList(gachas, query({ cards: [10, 11] }), ctx).map((g) => g.id)).toEqual([1])
    expect(filterGachaList(gachas, query({ cards: [999] }), ctx)).toEqual([])
  })
})

describe("sortGachaList", () => {
  it("sorts by start with null dates last in both directions", () => {
    expect(sortGachaList(gachas, "start", "desc").map((g) => g.id)).toEqual([4, 1, 2, 3])
    expect(sortGachaList(gachas, "start", "asc").map((g) => g.id)).toEqual([2, 1, 4, 3])
  })

  it("sorts by id", () => {
    expect(sortGachaList(gachas, "id", "asc").map((g) => g.id)).toEqual([1, 2, 3, 4])
    expect(sortGachaList(gachas, "id", "desc").map((g) => g.id)).toEqual([4, 3, 2, 1])
  })
})

describe("status helpers", () => {
  it("resolves status and the badge target", () => {
    const upcoming = gachas[3]!
    const ongoing = gachas[0]!
    const ended = gachas[1]!
    expect(resolveGachaListStatus(upcoming, ctx.nowMs)).toBe("upcoming")
    expect(resolveGachaStatusUntil(upcoming, "upcoming")).toBe(upcoming.startAt)
    expect(resolveGachaStatusUntil(ongoing, "ongoing")).toBe(ongoing.endAt)
    expect(resolveGachaStatusUntil(ended, "ended")).toBeNull()
  })

  it("collects years descending", () => {
    expect(collectGachaListYears(gachas)).toEqual([2030, 2023, 2022])
  })
})
