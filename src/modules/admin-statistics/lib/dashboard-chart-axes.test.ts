import { describe, expect, it } from "bun:test"
import { buildCountAxis, niceAxisMax } from "./dashboard-chart-axes"

describe("niceAxisMax", () => {
  it("rounds up to the nearest maximum whose quarters are integers", () => {
    expect(niceAxisMax(1)).toBe(4)
    expect(niceAxisMax(5)).toBe(8)
    expect(niceAxisMax(9)).toBe(12)
    expect(niceAxisMax(13)).toBe(16)
    expect(niceAxisMax(37)).toBe(40)
    expect(niceAxisMax(66)).toBe(80)
    expect(niceAxisMax(80)).toBe(80)
    expect(niceAxisMax(92)).toBe(100)
    expect(niceAxisMax(1234)).toBe(1600)
    expect(niceAxisMax(1750)).toBe(2000)
    expect(niceAxisMax(4000)).toBe(4000)
    expect(niceAxisMax(9500)).toBe(10000)
  })

  it("keeps every tick a whole number", () => {
    for (let max = 1; max <= 5000; max += 7) {
      const nice = niceAxisMax(max)
      expect(nice).toBeGreaterThanOrEqual(max)
      expect(Number.isInteger(nice / 4)).toBe(true)
      expect(nice).toBeLessThanOrEqual(max * 4)
    }
  })

  it("falls back to a four-step axis for empty or invalid data", () => {
    expect(niceAxisMax(0)).toBe(4)
    expect(niceAxisMax(Number.NaN)).toBe(4)
    expect(niceAxisMax(-3)).toBe(4)
  })
})

describe("buildCountAxis", () => {
  it("gives five integer ticks up to the nice maximum", () => {
    expect(buildCountAxis([120, 1500, 980])).toEqual({ max: 1600, ticks: [0, 400, 800, 1200, 1600] })
    expect(buildCountAxis([3, 17, 9])).toEqual({ max: 20, ticks: [0, 5, 10, 15, 20] })
  })

  it("keeps a four-step axis for an empty, all-zero or invalid series", () => {
    expect(buildCountAxis([])).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
    expect(buildCountAxis([0, 0])).toEqual({ max: 4, ticks: [0, 1, 2, 3, 4] })
    expect(buildCountAxis([Number.NaN, 2]).max).toBe(4)
  })
})
