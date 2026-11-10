import { describe, expect, it } from "bun:test"
import type { AdminSponsorProfile } from "@/types/admin"
import {
  bucketSponsorExpiries,
  countSponsorsByPlan,
  countSponsorsBySource,
  filterSponsors,
  formatSponsorAmount,
  monthlyNewSponsors,
  pageCount,
  pageSlice,
  summarizeSponsors,
} from "./sponsor-stats"

const NOW = Date.parse("2026-11-10T00:00:00Z")
const DAY = 86_400_000

function sponsor(overrides: Partial<AdminSponsorProfile> = {}): AdminSponsorProfile {
  return {
    toolboxBound: false,
    id: "s-1",
    name: "Fan",
    avatar: "",
    planName: "",
    message: "",
    source: "afdian",
    category: "former",
    isActive: false,
    afdianSyncDisabled: false,
    totalAmount: null,
    month: null,
    paidAt: "",
    planExpiresAt: "",
    afdianExpiresAt: "",
    afdianMonths: 0,
    durationMigrationPending: false,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }
}

describe("summarizeSponsors", () => {
  it("counts categories, bindings, protected profiles and pending migrations", () => {
    const overview = summarizeSponsors([
      sponsor({ category: "current", toolboxBound: true }),
      sponsor({ category: "current", afdianSyncDisabled: true }),
      sponsor({ category: "former", durationMigrationPending: true, toolboxBound: true }),
    ])
    expect(overview).toMatchObject({ total: 3, current: 2, former: 1, bound: 2, manualProfile: 1, migrationPending: 1 })
  })

  it("sums only the recorded amounts and keeps cents exact", () => {
    const overview = summarizeSponsors([
      sponsor({ totalAmount: 0.1 }),
      sponsor({ totalAmount: 0.2 }),
      sponsor({ totalAmount: null }),
      sponsor({ totalAmount: Number.NaN }),
    ])
    expect(overview.amountTotal).toBe(0.3)
    expect(overview.amountCount).toBe(2)
  })

  it("is all zeros for an empty list", () => {
    expect(summarizeSponsors([])).toEqual({
      total: 0, current: 0, former: 0, bound: 0, manualProfile: 0, migrationPending: 0, amountTotal: 0, amountCount: 0,
    })
  })
})

describe("countSponsorsBySource", () => {
  it("orders by count, then name, with the unnamed bucket last among ties", () => {
    const counts = countSponsorsBySource([
      sponsor({ source: "manual" }),
      sponsor({ source: "Afdian" }),
      sponsor({ source: "afdian" }),
      sponsor({ source: "" }),
      sponsor({ source: "legacy" }),
    ])
    expect(counts).toEqual([
      { key: "afdian", count: 2 },
      { key: "legacy", count: 1 },
      { key: "manual", count: 1 },
      { key: "", count: 1 },
    ])
  })
})

describe("countSponsorsByPlan", () => {
  it("keeps the most common plans and folds the rest", () => {
    const breakdown = countSponsorsByPlan([
      sponsor({ planName: "A" }),
      sponsor({ planName: "A" }),
      sponsor({ planName: "B" }),
      sponsor({ planName: "C" }),
      sponsor({ planName: " C " }),
      sponsor({ planName: "D" }),
    ], 2)
    expect(breakdown.top).toEqual([{ key: "A", count: 2 }, { key: "C", count: 2 }])
    expect(breakdown.otherCount).toBe(2)
    expect(breakdown.otherPlans).toBe(2)
  })

  it("has no tail when every plan fits", () => {
    expect(countSponsorsByPlan([sponsor({ planName: "A" })])).toEqual({ top: [{ key: "A", count: 1 }], otherCount: 0, otherPlans: 0 })
  })
})

describe("bucketSponsorExpiries", () => {
  it("buckets current sponsors by days left and skips former ones", () => {
    const at = (days: number) => new Date(NOW + days * DAY).toISOString()
    const buckets = bucketSponsorExpiries([
      sponsor({ category: "current", planExpiresAt: at(-1) }),
      sponsor({ category: "current", planExpiresAt: at(7) }),
      sponsor({ category: "current", planExpiresAt: at(8) }),
      sponsor({ category: "current", planExpiresAt: at(30) }),
      sponsor({ category: "current", planExpiresAt: at(31) }),
      sponsor({ category: "current", planExpiresAt: at(400) }),
      sponsor({ category: "current", planExpiresAt: "" }),
      sponsor({ category: "current", planExpiresAt: "not a date" }),
      sponsor({ category: "former", planExpiresAt: at(3) }),
    ], NOW)
    expect(buckets).toEqual({ within7: 2, within30: 2, within90: 1, later: 1, none: 2 })
  })
})

describe("monthlyNewSponsors", () => {
  it("counts records per UTC month, oldest first, the current month last", () => {
    const counts = monthlyNewSponsors([
      sponsor({ createdAt: "2026-11-01T00:00:00Z" }),
      sponsor({ createdAt: "2026-11-09T23:59:59Z" }),
      sponsor({ createdAt: "2026-10-31T23:59:59Z" }),
      sponsor({ createdAt: "2026-09-15T12:00:00Z" }),
      sponsor({ createdAt: "2025-01-01T00:00:00Z" }),
      sponsor({ createdAt: "2026-12-01T00:00:00Z" }),
      sponsor({ createdAt: "" }),
      sponsor({ createdAt: "nope" }),
    ], NOW, 3)
    expect(counts).toEqual([1, 1, 2])
  })

  it("returns one zero per month for an empty list", () => {
    expect(monthlyNewSponsors([], NOW)).toEqual(new Array(12).fill(0))
  })
})

describe("filterSponsors", () => {
  const list = [
    sponsor({ id: "afd-001", name: "Miku Fan", planName: "Gold", source: "afdian", category: "current" }),
    sponsor({ id: "man-002", name: "线下赞助", planName: "", source: "manual", category: "former" }),
  ]

  it("keeps everything without a query or category", () => {
    expect(filterSponsors(list, { query: "  ", category: "all" })).toHaveLength(2)
  })

  it("matches name, id, plan and source without case", () => {
    expect(filterSponsors(list, { query: "MIKU", category: "all" }).map((item) => item.id)).toEqual(["afd-001"])
    expect(filterSponsors(list, { query: "man-", category: "all" }).map((item) => item.id)).toEqual(["man-002"])
    expect(filterSponsors(list, { query: "gold", category: "all" }).map((item) => item.id)).toEqual(["afd-001"])
    expect(filterSponsors(list, { query: "manual", category: "all" }).map((item) => item.id)).toEqual(["man-002"])
  })

  it("combines the category with the query", () => {
    expect(filterSponsors(list, { query: "", category: "former" }).map((item) => item.id)).toEqual(["man-002"])
    expect(filterSponsors(list, { query: "miku", category: "former" })).toEqual([])
  })
})

describe("pageCount / pageSlice", () => {
  it("always has a first page", () => {
    expect(pageCount(0, 20)).toBe(1)
    expect(pageCount(20, 20)).toBe(1)
    expect(pageCount(21, 20)).toBe(2)
    expect(pageCount(5, 0)).toBe(1)
  })

  it("returns the rows of a page and clamps a page out of range", () => {
    const items = [1, 2, 3, 4, 5]
    expect(pageSlice(items, 1, 2)).toEqual([1, 2])
    expect(pageSlice(items, 3, 2)).toEqual([5])
    expect(pageSlice(items, 9, 2)).toEqual([5])
    expect(pageSlice(items, 0, 2)).toEqual([1, 2])
    expect(pageSlice([], 1, 2)).toEqual([])
  })
})

describe("formatSponsorAmount", () => {
  it("groups thousands and drops needless decimals", () => {
    expect(formatSponsorAmount(12345, "en-US")).toBe("12,345")
    expect(formatSponsorAmount(30.5, "en-US")).toBe("30.5")
    expect(formatSponsorAmount(0.125, "en-US")).toBe("0.13")
  })
})
