import { describe, expect, it } from "bun:test"
import { formatCompactNumber, formatNumberCN, formatPercent } from "@/lib/number-format"

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

  it("formatCompactNumber uses 万 and 亿 in simplified Chinese", () => {
    expect(formatCompactNumber(220_000, "zh-CN")).toBe("22万")
    expect(formatCompactNumber(38_616_000, "zh-CN")).toBe("3861.6万")
    expect(formatCompactNumber(386_160_000, "zh-CN")).toBe("3.9亿")
    expect(formatCompactNumber(9_999, "zh-CN")).toBe("9,999")
    expect(formatCompactNumber(-15_000, "zh-CN")).toBe("-1.5万")
  })

  it("formatCompactNumber uses 萬 and 億 in traditional Chinese", () => {
    expect(formatCompactNumber(220_000, "zh-TW")).toBe("22萬")
    expect(formatCompactNumber(38_616_000, "zh-TW")).toBe("3861.6萬")
    expect(formatCompactNumber(386_160_000, "zh-TW")).toBe("3.9億")
    expect(formatCompactNumber(386_160_000, "zh-Hant-HK")).toBe("3.9億")
    expect(formatCompactNumber(9_999, "zh-TW")).toBe("9,999")
  })

  it("formatCompactNumber uses K and M in English", () => {
    expect(formatCompactNumber(3_000, "en-US")).toBe("3K")
    expect(formatCompactNumber(1_172_288, "en-US")).toBe("1.2M")
    expect(formatCompactNumber(999, "en-US")).toBe("999")
  })
})
