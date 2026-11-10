import { describe, expect, it } from "bun:test"
import {
  buildCountMatrix,
  compareHalves,
  findFailureExtremes,
  formatDurationMs,
  formatSignedPercent,
  ratio,
  summarizeSeries,
} from "./dashboard-metrics"

describe("ratio", () => {
  it("divides when there is a positive total", () => {
    expect(ratio(1220, 1234)).toBeCloseTo(0.98865, 4)
    expect(ratio(0, 10)).toBe(0)
    expect(ratio(1_118_000, 51_234)).toBeCloseTo(21.82, 2)
  })

  it("has no answer without a usable total", () => {
    expect(ratio(5, 0)).toBeNull()
    expect(ratio(5, -1)).toBeNull()
    expect(ratio(null, 4)).toBeNull()
    expect(ratio(4, undefined)).toBeNull()
    expect(ratio(Number.NaN, 4)).toBeNull()
  })
})

describe("summarizeSeries", () => {
  it("returns the sum, the mean and the first largest bucket", () => {
    expect(summarizeSeries([3, 9, 9, 3])).toEqual({ total: 24, average: 6, peak: { index: 1, value: 9 } })
  })

  it("has no peak for an all-zero series and no mean for an empty one", () => {
    expect(summarizeSeries([0, 0])).toEqual({ total: 0, average: 0, peak: null })
    expect(summarizeSeries([])).toEqual({ total: 0, average: null, peak: null })
  })

  it("counts non-finite values as zero", () => {
    expect(summarizeSeries([Number.NaN, 4]).total).toBe(4)
  })
})

describe("findFailureExtremes", () => {
  it("finds the highest and lowest failure rate among buckets with uploads", () => {
    const { worst, best } = findFailureExtremes([
      { uploads: 100, uploadFailures: 2 },
      { uploads: 0, uploadFailures: 0 },
      { uploads: 50, uploadFailures: 5 },
      { uploads: 400, uploadFailures: 4 },
    ])
    expect(worst).toEqual({ index: 2, rate: 0.1, failures: 5, uploads: 50 })
    expect(best).toEqual({ index: 3, rate: 0.01, failures: 4, uploads: 400 })
  })

  it("keeps the earlier bucket as worst and the later one as best on a tie", () => {
    const { worst, best } = findFailureExtremes([
      { uploads: 10, uploadFailures: 1 },
      { uploads: 20, uploadFailures: 2 },
    ])
    expect(worst?.index).toBe(0)
    expect(best?.index).toBe(1)
  })

  it("has nothing to report when no bucket saw an upload", () => {
    expect(findFailureExtremes([{ uploads: 0, uploadFailures: 0 }])).toEqual({ worst: null, best: null })
    expect(findFailureExtremes([])).toEqual({ worst: null, best: null })
  })
})

describe("compareHalves", () => {
  it("drops the cut first and last buckets and compares equal runs", () => {
    // 8 daily points for a 7-day range: 6 complete days, 3 against 3.
    expect(compareHalves([99, 1, 2, 3, 4, 5, 6, 99])).toEqual({ current: 15, previous: 6, size: 3 })
  })

  it("drops the oldest complete bucket when their number is odd", () => {
    expect(compareHalves([99, 100, 1, 2, 3, 4, 99])).toEqual({ current: 7, previous: 3, size: 2 })
  })

  it("needs at least two complete buckets", () => {
    expect(compareHalves([1, 2, 3])).toBeNull()
    expect(compareHalves([1, 2])).toBeNull()
    expect(compareHalves([])).toBeNull()
    expect(compareHalves([9, 4, 6, 9])).toEqual({ current: 6, previous: 4, size: 1 })
  })
})

describe("buildCountMatrix", () => {
  it("pivots pairs into rows and columns ordered by their totals", () => {
    const matrix = buildCountMatrix([
      { row: "manual", column: "suite", count: 10 },
      { row: "proxy", column: "mysekai", count: 40 },
      { row: "proxy", column: "suite", count: 70 },
      { row: "manual", column: "suite", count: 5 },
    ])
    expect(matrix.rows).toEqual([{ key: "proxy", total: 110 }, { key: "manual", total: 15 }])
    expect(matrix.columns).toEqual([{ key: "suite", total: 85 }, { key: "mysekai", total: 40 }])
    expect(matrix.cells).toEqual([[70, 40], [15, 0]])
    expect(matrix.total).toBe(125)
    expect(matrix.max).toBe(70)
  })

  it("drops blank keys and non-positive or invalid counts", () => {
    const matrix = buildCountMatrix([
      { row: "", column: "suite", count: 3 },
      { row: "manual", column: null, count: 3 },
      { row: "manual", column: "suite", count: 0 },
      { row: "manual", column: "suite", count: Number.NaN },
      { row: undefined, column: "suite", count: 2 },
    ])
    expect(matrix).toEqual({ rows: [], columns: [], cells: [], total: 0, max: 0 })
  })
})

describe("formatDurationMs", () => {
  it("uses milliseconds below a second and seconds above", () => {
    expect(formatDurationMs(182.4)).toBe("182 ms")
    expect(formatDurationMs(0)).toBe("0 ms")
    expect(formatDurationMs(1240.8)).toBe("1.24 s")
  })

  it("has nothing to format for a missing or invalid duration", () => {
    expect(formatDurationMs(null)).toBeNull()
    expect(formatDurationMs(undefined)).toBeNull()
    expect(formatDurationMs(-1)).toBeNull()
  })
})

describe("formatSignedPercent", () => {
  it("signs the change and keeps one decimal", () => {
    expect(formatSignedPercent(12.44)).toBe("+12.4%")
    expect(formatSignedPercent(-3.06)).toBe("−3.1%")
    expect(formatSignedPercent(0.04)).toBe("0%")
    expect(formatSignedPercent(-0.04)).toBe("0%")
  })
})
