import { describe, expect, it } from "bun:test"
import { CATALOG_PERMANENT_END_THRESHOLD_MS, isCatalogPermanentEnd, isCatalogPlaceholderDate, resolveCatalogStatus } from "./types"

const NOW = Date.UTC(2026, 9, 21)
const DAY = 24 * 3_600_000

describe("isCatalogPlaceholderDate", () => {
  it("treats the year-2099 sentinel start of an undecided banner as a placeholder", () => {
    expect(isCatalogPlaceholderDate(Date.UTC(2099, 2, 27), NOW)).toBe(true)
  })

  it("keeps real upcoming starts (days to a year out) as dates", () => {
    expect(isCatalogPlaceholderDate(NOW + 3 * DAY, NOW)).toBe(false)
    expect(isCatalogPlaceholderDate(NOW + 365 * DAY, NOW)).toBe(false)
    expect(isCatalogPlaceholderDate(null, NOW)).toBe(false)
  })
})

describe("isCatalogPermanentEnd", () => {
  it("treats an end in 2099 as permanent", () => {
    expect(isCatalogPermanentEnd(Date.UTC(2099, 11, 31), NOW)).toBe(true)
  })

  it("keeps real event and banner windows as countdowns", () => {
    expect(isCatalogPermanentEnd(NOW + 9 * DAY, NOW)).toBe(false)
    expect(isCatalogPermanentEnd(NOW + 400 * DAY, NOW)).toBe(false)
    expect(isCatalogPermanentEnd(NOW + CATALOG_PERMANENT_END_THRESHOLD_MS, NOW)).toBe(false)
    expect(isCatalogPermanentEnd(NOW + CATALOG_PERMANENT_END_THRESHOLD_MS + 1, NOW)).toBe(true)
  })

  it("is false without an end", () => {
    expect(isCatalogPermanentEnd(null, NOW)).toBe(false)
    expect(isCatalogPermanentEnd(undefined, NOW)).toBe(false)
    expect(isCatalogPermanentEnd(Number.NaN, NOW)).toBe(false)
  })

  it("does not change the status itself: a permanent pool is still ongoing", () => {
    expect(resolveCatalogStatus(NOW - DAY, Date.UTC(2099, 11, 31), NOW)).toBe("ongoing")
  })
})
