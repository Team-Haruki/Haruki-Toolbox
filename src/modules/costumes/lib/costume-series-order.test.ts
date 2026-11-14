import { describe, expect, it } from "bun:test"
import { costumeSeriesKey, costumeSeriesSortValue, isSameSetCell, orderBySeries, type SeriesContext } from "./costume-series-order"

const cell = (representativeId: number, costume3dGroupId: number | null, ids: number[] = [representativeId]) => ({
  representativeId,
  costume3dGroupId,
  ids,
})

// The worn parts of a series-84 outfit (groups 84001 body / 84161 hair / 84002 head share 84 by thousands).
const context = (overrides: Partial<SeriesContext> = {}): SeriesContext => ({
  body: { id: 84001, costume3dGroupId: 84001 },
  head: { id: 84002, costume3dGroupId: 84002 },
  hair: { id: 84161, costume3dGroupId: 84161 },
  notAvailable: new Set(),
  ...overrides,
})

describe("costumeSeriesKey", () => {
  it("names a large group by its thousands and a small non-head group at +100", () => {
    expect(costumeSeriesKey(84161, "hair")).toEqual({ digit: 5, groupId: 84 })
    expect(costumeSeriesKey(21, "body")).toEqual({ digit: 3, groupId: 121 })
    // A head keeps its small group as it is.
    expect(costumeSeriesKey(21, "head")).toEqual({ digit: 2, groupId: 21 })
    expect(costumeSeriesKey(121, "head")).toEqual({ digit: 3, groupId: 121 })
  })
})

describe("costumeSeriesSortValue", () => {
  it("puts the worn costume first, then the series of both other parts, then one of them", () => {
    expect(costumeSeriesSortValue("body", cell(84001, 84001), context())).toBe(1)
    expect(costumeSeriesSortValue("body", cell(84003, 84003), context())).toBe(2)
    expect(costumeSeriesSortValue("body", cell(90001, 90001), context({ head: { id: 90002, costume3dGroupId: 90002 } }))).toBe(4)
    expect(costumeSeriesSortValue("body", cell(90001, 90001), context({ hair: { id: 90161, costume3dGroupId: 90161 } }))).toBe(5)
    expect(costumeSeriesSortValue("body", cell(90001, 90001), context())).toBe(13)
  })

  it("counts a cell as worn when any of its colours is worn", () => {
    expect(costumeSeriesSortValue("body", cell(84003, 84003, [84003, 84001]), context())).toBe(1)
  })

  it("ranks a hair of the body's series after the head's only when it suits the worn accessory", () => {
    const head = { id: 7, costume3dGroupId: 7 }
    expect(costumeSeriesSortValue("hair", cell(84162, 84162), context({ head }))).toBe(3)
    expect(costumeSeriesSortValue("hair", cell(84162, 84162), context({ head, notAvailable: new Set(["7|84162"]) }))).toBe(6)
    expect(costumeSeriesSortValue("hair", cell(99161, 99161), context({ head, notAvailable: new Set(["7|99161"]) }))).toBe(13)
    expect(costumeSeriesSortValue("hair", cell(99161, 99161), context({ head }))).toBe(12)
  })

  it("puts the unset head before everything, the worn head next", () => {
    expect(costumeSeriesSortValue("head", cell(41, 21), context())).toBe(0)
    expect(costumeSeriesSortValue("head", cell(84002, 84002), context())).toBe(1)
    expect(costumeSeriesSortValue("head", cell(84004, 84004), context())).toBe(2)
    expect(costumeSeriesSortValue("head", cell(90002, 90002), context({ hair: { id: 90161, costume3dGroupId: 90161 } }))).toBe(5)
    expect(costumeSeriesSortValue("head", cell(90002, 90002), context({ notAvailable: new Set(["90002|84161"]) }))).toBe(13)
  })
})

describe("isSameSetCell", () => {
  it("labels the cells of a series another worn part belongs to, the worn cell too", () => {
    // Hair of series 90 worn: the series-90 body and accessory complete it.
    const worn = context({ hair: { id: 90161, costume3dGroupId: 90161 } })
    expect(isSameSetCell("body", cell(90001, 90001), worn)).toBe(true)
    expect(isSameSetCell("head", cell(90002, 90002), worn)).toBe(true)
    // The worn body (any colour of it) is labelled with the worn accessory's series; a body of no worn series is not.
    expect(isSameSetCell("body", cell(84003, 84003, [84003, 84001]), worn)).toBe(true)
    // An exclusive head (group 88001) worn with its outfit's body (88001): SET, as is the outfit's shared head (88021).
    const cherry = context({ body: { id: 88002, costume3dGroupId: 88001 }, head: { id: 88001, costume3dGroupId: 88001 } })
    expect(isSameSetCell("head", cell(88001, 88001), cherry)).toBe(true)
    expect(isSameSetCell("head", cell(88161, 88021), cherry)).toBe(true)
    expect(isSameSetCell("body", cell(77001, 77001), worn)).toBe(false)
    // The series of the slot's own worn part does not count: only the other two parts.
    expect(isSameSetCell("body", cell(84005, 84005), context({ head: null, hair: null }))).toBe(false)
  })

  it("never labels the unset head", () => {
    expect(isSameSetCell("head", cell(41, 84001), context())).toBe(false)
  })
})

describe("orderBySeries", () => {
  it("sorts by value and keeps the list order among equals", () => {
    const cells = [cell(90001, 90001), cell(91001, 91001), cell(84003, 84003), cell(84001, 84001)]
    expect(orderBySeries(cells, "body", context(), (c) => c).map((c) => c.representativeId)).toEqual([84001, 84003, 90001, 91001])
  })
})
