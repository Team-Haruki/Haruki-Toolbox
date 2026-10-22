import { describe, expect, test } from "bun:test"
import { toBreakdownItems } from "./dashboard-breakdown"

describe("toBreakdownItems", () => {
  test("sorts by count, drops blanks and zeros, computes shares", () => {
    const items = toBreakdownItems(
      [
        { server: "jp", count: 30 },
        { server: "en", count: 10 },
        { server: "", count: 5 },
        { server: "kr", count: 0 },
        { server: "tw", count: 60 },
      ],
      (entry) => ({ key: entry.server, count: entry.count }),
      (key) => key.toUpperCase(),
    )
    expect(items.map((item) => item.key)).toEqual(["tw", "jp", "en"])
    expect(items[0]).toEqual({ key: "tw", label: "TW", count: 60, share: 0.6 })
    expect(items[2]?.share).toBeCloseTo(0.1)
  })

  test("tolerates a missing payload and non-numeric counts", () => {
    expect(toBreakdownItems(undefined, () => ({ key: "x", count: 1 }), (key) => key)).toEqual([])
    const items = toBreakdownItems(
      [{ method: "manual", count: Number.NaN }, { method: "inherit", count: 2 }],
      (entry) => ({ key: entry.method, count: entry.count }),
      (key) => key,
    )
    expect(items).toEqual([{ key: "inherit", label: "inherit", count: 2, share: 1 }])
  })
})
