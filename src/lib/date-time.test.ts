import { describe, expect, it } from "bun:test"
import {
  formatDateCN,
  formatDateKey,
  formatDateTimeCN,
  formatWithZone,
  resolveSekaiServerTimeZone,
  toValidDate,
} from "@/lib/date-time"

describe("date-time helpers", () => {
  it("toValidDate returns null for nullish and invalid inputs", () => {
    expect(toValidDate(null)).toBeNull()
    expect(toValidDate(undefined)).toBeNull()
    expect(toValidDate("not-a-date")).toBeNull()
  })

  it("formatDateTimeCN returns fallback for invalid input", () => {
    expect(formatDateTimeCN("not-a-date", "N/A")).toBe("N/A")
  })

  it("formatDateCN returns fallback for invalid input", () => {
    expect(formatDateCN(undefined, { year: "numeric" }, "N/A")).toBe("N/A")
  })

  it("formatDateKey returns local date key", () => {
    const date = new Date(2026, 0, 2, 3, 4, 5)
    expect(formatDateKey(date)).toBe("2026-01-02")
  })
})

describe("formatWithZone", () => {
  // 03:00 UTC → 12:00 in Tokyo, 22:00 (the day before) in New York.
  const at = Date.UTC(2026, 0, 1, 3, 0)
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit", hour12: false }

  it("maps every region to its server zone", () => {
    expect(resolveSekaiServerTimeZone("jp")).toBe("Asia/Tokyo")
    expect(resolveSekaiServerTimeZone("tw")).toBe("Asia/Taipei")
    expect(resolveSekaiServerTimeZone("kr")).toBe("Asia/Seoul")
    expect(resolveSekaiServerTimeZone("cn")).toBe("Asia/Shanghai")
    expect(resolveSekaiServerTimeZone("en")).toBe("UTC")
  })

  it("adds the server time when the viewer is in another zone", () => {
    const result = formatWithZone(at, "jp", options, { locale: "en-US", localZone: "America/New_York" })
    expect(result.local).toContain("22:00")
    expect(result.server).toContain("12:00")
    expect(result.localZone).toBe("America/New_York")
    expect(result.serverZone).toBe("Asia/Tokyo")
  })

  it("omits the server time when the viewer is in the server zone", () => {
    const result = formatWithZone(at, "jp", options, { locale: "en-US", localZone: "Asia/Tokyo" })
    expect(result.local).toContain("12:00")
    expect(result.server).toBeNull()
  })

  it("omits the server time when another zone reads the same wall clock", () => {
    const result = formatWithZone(at, "cn", options, { locale: "en-US", localZone: "Asia/Taipei" })
    expect(result.local).toContain("11:00")
    expect(result.server).toBeNull()
  })

  it("returns the fallback for invalid input", () => {
    const result = formatWithZone("nope", "jp", options, { localZone: "UTC", fallback: "TBA" })
    expect(result).toEqual({ local: "TBA", server: null, localZone: "UTC", serverZone: "Asia/Tokyo" })
  })
})
