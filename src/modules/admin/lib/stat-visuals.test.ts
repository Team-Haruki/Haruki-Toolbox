import { describe, expect, it } from "bun:test"
import { buildSparkline, easeOutCubic, percentChange, sharePercent, tweenValue } from "./stat-visuals"

describe("easeOutCubic", () => {
  it("starts at 0, ends at 1 and clamps outside the range", () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(2)).toBe(1)
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875)
  })
})

describe("tweenValue", () => {
  it("moves from the start to the target", () => {
    expect(tweenValue(0, 100, 0)).toBe(0)
    expect(tweenValue(0, 100, 1)).toBe(100)
    expect(tweenValue(100, 0, 0.5)).toBeCloseTo(12.5)
  })

  it("jumps to the target when either end is not a number", () => {
    expect(tweenValue(Number.NaN, 5, 0.2)).toBe(5)
    expect(tweenValue(1, Number.POSITIVE_INFINITY, 0.2)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe("buildSparkline", () => {
  it("returns nothing for an empty series or an empty box", () => {
    expect(buildSparkline([], 100, 20)).toEqual({ line: "", area: "", last: null })
    expect(buildSparkline([1, 2], 0, 20).line).toBe("")
  })

  it("spans the box from the zero baseline to the maximum", () => {
    const geometry = buildSparkline([0, 5, 10], 104, 24, 2)
    expect(geometry.line).toBe("M2 22 L52 12 L102 2")
    expect(geometry.area).toBe("M2 22 L52 12 L102 2 L102 22 L2 22 Z")
    expect(geometry.last).toEqual({ x: 102, y: 2 })
  })

  it("draws a single value as a level line across the box", () => {
    expect(buildSparkline([7], 104, 24, 2).line).toBe("M2 2 L102 2")
  })

  it("keeps an all-zero series on the baseline and treats bad values as zero", () => {
    expect(buildSparkline([0, 0, 0], 104, 24, 2).line).toBe("M2 22 L52 22 L102 22")
    expect(buildSparkline([Number.NaN, 4], 104, 24, 2).line).toBe("M2 22 L102 2")
  })

  it("makes room below zero for a series that goes negative", () => {
    expect(buildSparkline([-10, 10], 104, 24, 2).line).toBe("M2 22 L102 2")
  })
})

describe("sharePercent", () => {
  it("is the clamped share of a positive total", () => {
    expect(sharePercent(25, 100)).toBe(25)
    expect(sharePercent(150, 100)).toBe(100)
    expect(sharePercent(-5, 100)).toBe(0)
  })

  it("is zero without a usable total", () => {
    expect(sharePercent(5, 0)).toBe(0)
    expect(sharePercent(5, Number.NaN)).toBe(0)
  })
})

describe("percentChange", () => {
  it("reports direction and size against the previous value", () => {
    expect(percentChange(150, 100)).toEqual({ percent: 50, direction: "up" })
    expect(percentChange(50, 100)).toEqual({ percent: -50, direction: "down" })
    expect(percentChange(100, 100)).toEqual({ percent: 0, direction: "flat" })
  })

  it("has nothing to say without a base", () => {
    expect(percentChange(5, 0)).toBeNull()
    expect(percentChange(Number.NaN, 4)).toBeNull()
  })
})
