import { describe, expect, it } from "bun:test"
import { isSelfComparisonTarget, resolveComparisonSelfIdentity } from "./comparison-target"

describe("resolveComparisonSelfIdentity", () => {
  it("uses the line rank for border-line pages", () => {
    expect(resolveComparisonSelfIdentity({ kind: "line", rank: 500 }, { rank: 500, userId: "1" }))
      .toEqual({ rank: 500, userId: null })
  })

  it("pairs a seat page with the player currently holding it", () => {
    expect(resolveComparisonSelfIdentity({ kind: "rank", rank: 5 }, { rank: 5, userId: "42" }))
      .toEqual({ rank: 5, userId: "42" })
    expect(resolveComparisonSelfIdentity({ kind: "rank", rank: 5 }, null))
      .toEqual({ rank: 5, userId: null })
  })

  it("pairs a player page with the rank they currently hold", () => {
    expect(resolveComparisonSelfIdentity({ kind: "user", userId: "42" }, { rank: 17, userId: "42" }))
      .toEqual({ rank: 17, userId: "42" })
    expect(resolveComparisonSelfIdentity({ kind: "user", userId: "42" }, null))
      .toEqual({ rank: null, userId: "42" })
  })

  it("is empty without a target", () => {
    expect(resolveComparisonSelfIdentity(null, { rank: 1, userId: "1" })).toEqual({ rank: null, userId: null })
  })
})

describe("isSelfComparisonTarget", () => {
  const self = { rank: 17, userId: "42" }

  it("rejects the same seat, line or player", () => {
    expect(isSelfComparisonTarget(self, "rank", "17")).toBe(true)
    expect(isSelfComparisonTarget(self, "line", " 17 ")).toBe(true)
    expect(isSelfComparisonTarget(self, "user", "42")).toBe(true)
  })

  it("accepts other targets and blank input", () => {
    expect(isSelfComparisonTarget(self, "rank", "18")).toBe(false)
    expect(isSelfComparisonTarget(self, "user", "43")).toBe(false)
    expect(isSelfComparisonTarget(self, "user", "")).toBe(false)
    expect(isSelfComparisonTarget({ rank: null, userId: null }, "rank", "17")).toBe(false)
  })
})
