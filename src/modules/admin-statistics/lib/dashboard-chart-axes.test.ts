import { describe, expect, it } from "bun:test"
import { buildPairedAxes, niceAxisMax } from "./dashboard-chart-axes"

describe("niceAxisMax", () => {
  it("rounds up to a maximum whose quarters are integers", () => {
    expect(niceAxisMax(1)).toBe(4)
    expect(niceAxisMax(5)).toBe(8)
    expect(niceAxisMax(13)).toBe(20)
    expect(niceAxisMax(37)).toBe(40)
    expect(niceAxisMax(80)).toBe(80)
    expect(niceAxisMax(1234)).toBe(2000)
    expect(niceAxisMax(4000)).toBe(4000)
  })

  it("falls back to a four-step axis for empty or invalid data", () => {
    expect(niceAxisMax(0)).toBe(4)
    expect(niceAxisMax(Number.NaN)).toBe(4)
    expect(niceAxisMax(-3)).toBe(4)
  })
})

describe("buildPairedAxes", () => {
  it("shares tick positions and maps right-hand values both ways", () => {
    const axes = buildPairedAxes([120, 1500, 980], [3, 17, 9])
    expect(axes.leftMax).toBe(2000)
    expect(axes.rightMax).toBe(20)
    expect(axes.tickValues).toEqual([0, 500, 1000, 1500, 2000])
    expect(axes.toLeft(17)).toBe(1700)
    expect(axes.toRight(500)).toBe(5)
    expect(axes.tickValues.map(axes.toRight)).toEqual([0, 5, 10, 15, 20])
  })

  it("keeps integer right-hand ticks when failures outnumber the drawn scale", () => {
    const axes = buildPairedAxes([2, 3], [40, 75])
    expect(axes.leftMax).toBe(4)
    expect(axes.rightMax).toBe(80)
    expect(axes.tickValues.map(axes.toRight)).toEqual([0, 20, 40, 60, 80])
  })

  it("handles a chart with no failures at all", () => {
    const axes = buildPairedAxes([10, 20], [0, 0])
    expect(axes.rightMax).toBe(4)
    expect(axes.toLeft(0)).toBe(0)
  })
})
