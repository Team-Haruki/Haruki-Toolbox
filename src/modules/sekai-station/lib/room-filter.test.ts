import { describe, expect, it } from "bun:test"
import { buildDisplayList, highlightSegments, matchesTerms, normalizeTerms } from "./room-filter"
import type { StationRoom } from "./station-types"

function room(id: string, time: number, msg = "", name = ""): StationRoom {
  return { id, time, msg, name, source: "qq", info: { handle: "", url: "", avatar: null } }
}

const rooms = new Map<string, StationRoom>([
  ["11111-20", room("11111", 20, "sage only")],
  ["22222-10", room("22222", 10, "veteran", "Dragon fan")],
  ["33333-5", room("33333", 5, "free")],
])
const order = ["11111-20", "22222-10", "33333-5"]

describe("buildDisplayList", () => {
  it("shows only pins until the first burst is merged", () => {
    const pins = { "99999-1": { room: room("99999", 1), pinnedAt: 1 } }
    expect(buildDisplayList({ order, rooms, pins, blocks: {}, terms: [], mode: "blacklist", ready: false }).map((e) => e.key)).toEqual(["99999-1"])
  })

  it("puts pins first, most recent pin on top, without duplicating them", () => {
    const pins = {
      "22222-10": { room: room("22222", 10), pinnedAt: 1 },
      "99999-1": { room: room("99999", 1), pinnedAt: 2 },
    }
    expect(buildDisplayList({ order, rooms, pins, blocks: {}, terms: [], mode: "blacklist", ready: true }).map((e) => e.key)).toEqual([
      "99999-1",
      "22222-10",
      "11111-20",
      "33333-5",
    ])
  })

  it("blacklist hides matching rooms; whitelist keeps only matches", () => {
    const base = { order, rooms, pins: {}, blocks: {}, ready: true }
    expect(buildDisplayList({ ...base, terms: ["SAGE"], mode: "blacklist" }).map((e) => e.key)).toEqual(["22222-10", "33333-5"])
    // Names match too
    expect(buildDisplayList({ ...base, terms: ["dragon", " "], mode: "whitelist" }).map((e) => e.key)).toEqual(["22222-10"])
  })

  it("keeps pinned rooms whatever the keyword filter says", () => {
    const pins = { "11111-20": { room: room("11111", 20, "sage only"), pinnedAt: 1 } }
    const entries = buildDisplayList({ order, rooms, pins, blocks: {}, terms: ["sage"], mode: "blacklist", ready: true })
    expect(entries.map((e) => e.key)).toEqual(["11111-20", "22222-10", "33333-5"])
    expect(entries[0]?.room.msg).toBe("sage only")
  })

  it("hides blocked room numbers everywhere, pins included", () => {
    const pins = { "33333-5": { room: room("33333", 5), pinnedAt: 1 } }
    expect(buildDisplayList({ order, rooms, pins, blocks: { "33333": 9e12, "11111": 9e12 }, terms: [], mode: "blacklist", ready: true }).map((e) => e.key)).toEqual([
      "22222-10",
    ])
  })
})

describe("terms", () => {
  it("normalizes and matches case-insensitively", () => {
    expect(normalizeTerms([" Sage ", "sage", "", "虾"])).toEqual(["sage", "虾"])
    expect(matchesTerms({ msg: "🦐 run", name: "" }, ["🦐"])).toBe(true)
    expect(matchesTerms({ msg: "run", name: "" }, ["🦐"])).toBe(false)
  })
})

describe("highlightSegments", () => {
  it("marks every match, case-insensitively, preferring longer terms", () => {
    expect(highlightSegments("Dragon drags", ["drag", "dragon"])).toEqual([
      { text: "Dragon", hit: true },
      { text: " ", hit: false },
      { text: "drag", hit: true },
      { text: "s", hit: false },
    ])
  })

  it("escapes regex characters and handles no terms", () => {
    expect(highlightSegments("a+b", ["+"])).toEqual([
      { text: "a", hit: false },
      { text: "+", hit: true },
      { text: "b", hit: false },
    ])
    expect(highlightSegments("abc", [])).toEqual([{ text: "abc", hit: false }])
  })
})
