import { describe, expect, it } from "bun:test"
import {
  countSharing,
  hasPublicApiSharing,
  normalizeGameBindingStats,
  summarizePageSharing,
  unverifiedBindingCount,
} from "./binding-stats"

describe("normalizeGameBindingStats", () => {
  it("reads the bindings member and ranks the servers", () => {
    expect(normalizeGameBindingStats({
      users: { total: 9 },
      bindings: {
        total: 100,
        verified: 90,
        byServer: [{ key: "cn", count: 30 }, { key: "JP", count: 60 }, { server: "tw", count: 10 }],
      },
    })).toEqual({
      total: 100,
      verified: 90,
      byServer: [{ server: "jp", count: 60 }, { server: "cn", count: 30 }, { server: "tw", count: 10 }],
    })
  })

  it("drops entries without a server or a count and tolerates a missing list", () => {
    expect(normalizeGameBindingStats({
      bindings: { total: 3, verified: 1, byServer: [{ key: "", count: 2 }, { key: "en" }, null, { key: "kr", count: 1 }] },
    })?.byServer).toEqual([{ server: "kr", count: 1 }])
    expect(normalizeGameBindingStats({ bindings: { total: 3, verified: 1 } })?.byServer).toEqual([])
  })

  it("is null when the figures are not there", () => {
    expect(normalizeGameBindingStats(null)).toBeNull()
    expect(normalizeGameBindingStats({})).toBeNull()
    expect(normalizeGameBindingStats({ bindings: { total: "3", verified: 1 } })).toBeNull()
    expect(normalizeGameBindingStats({ bindings: { total: 3, verified: -1 } })).toBeNull()
  })
})

describe("unverifiedBindingCount", () => {
  it("is the rest of the total and never negative", () => {
    expect(unverifiedBindingCount({ total: 10, verified: 7 })).toBe(3)
    expect(unverifiedBindingCount({ total: 5, verified: 6 })).toBe(0)
  })
})

describe("countSharing", () => {
  it("counts the switches that are on", () => {
    expect(countSharing({ allowPublicApi: true, allowSakura: false, allow8823: true })).toEqual({ on: 2, total: 3 })
    expect(countSharing({})).toEqual({ on: 0, total: 0 })
  })

  it("is null for a binding without settings", () => {
    expect(countSharing(null)).toBeNull()
    expect(countSharing(undefined)).toBeNull()
  })
})

describe("sharing summaries", () => {
  const open = {
    suite: { allowPublicApi: true, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false },
    mysekai: { allowPublicApi: false, allowFixtureApi: true, allow8823: false, allowResona: true, allowLuna: false },
  }
  const bots = {
    suite: { allowPublicApi: false, allowSakura: true, allow8823: true, allowResona: false, allowLuna: false },
    mysekai: null,
  }
  const closed = {
    suite: { allowPublicApi: false, allowSakura: false, allow8823: false, allowResona: false, allowLuna: false },
  }

  it("flags a binding with a public API switch on", () => {
    expect(hasPublicApiSharing(open)).toBe(true)
    expect(hasPublicApiSharing({ mysekai: { allowPublicApi: true } })).toBe(true)
    expect(hasPublicApiSharing(bots)).toBe(false)
    expect(hasPublicApiSharing({})).toBe(false)
  })

  it("counts bindings, not switches, per kind of sharing", () => {
    expect(summarizePageSharing([open, bots, closed])).toEqual({
      suitePublicApi: 1,
      suiteBots: 1,
      mysekaiPublicApi: 0,
      mysekaiFixtureApi: 1,
      mysekaiBots: 1,
    })
    expect(summarizePageSharing([])).toEqual({
      suitePublicApi: 0,
      suiteBots: 0,
      mysekaiPublicApi: 0,
      mysekaiFixtureApi: 0,
      mysekaiBots: 0,
    })
  })
})
