import { describe, expect, it } from "bun:test"
import { formatNumberCN, formatPercent } from "@/lib/number-format"

describe("number-format helpers", () => {
  it("formatNumberCN formats valid numbers", () => {
    expect(formatNumberCN(1234567)).toBe("1,234,567")
  })

  it("formatNumberCN returns fallback for invalid numbers", () => {
    expect(formatNumberCN(undefined)).toBe("—")
    expect(formatNumberCN(Number.NaN, "N/A")).toBe("N/A")
  })

  it("formatPercent formats percentages", () => {
    expect(formatPercent(88.888, 1)).toBe("88.9%")
    expect(formatPercent(undefined, 2, "N/A")).toBe("N/A")
  })
})
