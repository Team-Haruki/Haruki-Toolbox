import { afterEach, describe, expect, it } from "bun:test"
import { setI18nLocale } from "@/shared/i18n"
import {
  DATE_FORMAT_PRESETS,
  formatDateCN,
  formatDateKey,
  formatDateTimeCN,
  formatLocalizedDate,
  formatLocalizedDateRange,
  formatLocalizedDateTime,
  formatWithZone,
  resolveDateFormatOptions,
  resolveSekaiServerTimeZone,
  toValidDate,
} from "@/lib/date-time"

describe("date format presets", () => {
  // Local time, so the expectations hold in any zone.
  const at = new Date(2026, 9, 1, 16, 5, 7)
  const end = new Date(2026, 10, 8, 20, 0, 0)

  afterEach(async () => {
    await setI18nLocale("zh-CN")
  })

  it("resolves preset names and passes raw options through", () => {
    expect(resolveDateFormatOptions("date")).toBe(DATE_FORMAT_PRESETS.date)
    expect(resolveDateFormatOptions({ dateStyle: "medium" })).toEqual({ dateStyle: "medium" })
    expect(resolveDateFormatOptions(undefined)).toBeUndefined()
  })

  it("prints the zh-CN shapes", () => {
    expect(formatLocalizedDate(at, "date")).toBe("2026/10/01")
    expect(formatLocalizedDateTime(at, "dateTime")).toBe("2026/10/01 16:05")
    expect(formatLocalizedDateTime(at, "dateTimeSeconds")).toBe("2026/10/01 16:05:07")
    expect(formatLocalizedDate(at, "monthDay")).toBe("10/01")
    expect(formatLocalizedDateRange(at, end)).toBe("2026/10/01 – 2026/11/08")
    expect(formatLocalizedDateRange(at, end, "dateTime")).toBe("2026/10/01 16:05 – 2026/11/08 20:00")
  })

  it("prints midnight as 00:00 on the 24 h clock", () => {
    expect(formatLocalizedDateTime(new Date(2026, 9, 1, 0, 0), "dateTime")).toBe("2026/10/01 00:00")
  })

  it("follows the active locale", async () => {
    await setI18nLocale("en-US")
    expect(formatLocalizedDate(at, "date")).toBe("10/01/2026")
    expect(formatLocalizedDateTime(at, "dateTime")).toBe("10/01/2026, 16:05")
    expect(formatLocalizedDate(at, "monthDay")).toBe("10/01")
  })

  it("keeps the fallback per end of a range", () => {
    expect(formatLocalizedDateRange(at, null)).toBe("2026/10/01 – —")
    expect(formatLocalizedDateRange("nope", end, "date", "?")).toBe("? – 2026/11/08")
  })

  it("accepts a preset in formatWithZone", () => {
    const result = formatWithZone(Date.UTC(2026, 0, 1, 3, 0), "jp", "dateTime", { locale: "zh-CN", localZone: "Asia/Tokyo" })
    expect(result.local).toBe("2026/01/01 12:00")
  })
})

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
