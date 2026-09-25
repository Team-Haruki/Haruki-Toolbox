import { describe, expect, it } from "bun:test"
import { resolveExpandedRank, resolveRowExpansionKey } from "./row-expansion"

describe("row expansion", () => {
  const rows = [
    { rank: 1, detail: { userId: "a" } },
    { rank: 2, detail: { userId: "b" } },
    { rank: 3, detail: null },
  ]

  it("keys seats by player and follows the player to a new rank", () => {
    const key = resolveRowExpansionKey(2, rows)
    expect(key).toBe("user:b")
    const shuffled = [{ rank: 1, detail: { userId: "b" } }, { rank: 2, detail: { userId: "a" } }]
    expect(resolveExpandedRank(key, shuffled)).toBe(1)
    expect(resolveExpandedRank(key, [{ rank: 1, detail: { userId: "c" } }])).toBeNull()
  })

  it("keys empty seats and border lines by rank", () => {
    expect(resolveRowExpansionKey(3, rows)).toBe("rank:3")
    expect(resolveRowExpansionKey(500, rows)).toBe("rank:500")
    expect(resolveExpandedRank("rank:500", rows)).toBe(500)
    expect(resolveExpandedRank(null, rows)).toBeNull()
  })
})
