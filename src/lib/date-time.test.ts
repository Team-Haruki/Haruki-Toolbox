import { describe, expect, it } from "bun:test"
import { formatDateCN, formatDateKey, formatDateTimeCN, toValidDate } from "@/lib/date-time"

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
