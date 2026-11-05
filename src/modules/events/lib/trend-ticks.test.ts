import { describe, expect, it } from "bun:test"
import { selectTrendMonthTicks, trendMonthKey } from "./trend-ticks"

const month = (year: number, monthIndex: number, day = 1) => new Date(year, monthIndex, day).getTime()

describe("selectTrendMonthTicks", () => {
  it("places one tick on the first event of each month, never two in the same month", () => {
    const starts = [month(2026, 6, 26), month(2026, 9, 1), month(2026, 9, 21), month(2026, 10, 2)]
    expect(selectTrendMonthTicks(starts, 8)).toEqual([0, 1, 3])
  })

  it("thins the months to the tick budget and always keeps the first", () => {
    const starts = Array.from({ length: 12 }, (_, index) => month(2026, index))
    const ticks = selectTrendMonthTicks(starts, 4)
    expect(ticks).toHaveLength(4)
    expect(ticks[0]).toBe(0)
    expect(selectTrendMonthTicks(starts, 1)).toEqual([0])
  })

  it("skips points without a start and yields nothing for an empty series", () => {
    expect(selectTrendMonthTicks([null, month(2026, 2), undefined, month(2026, 3)], 8)).toEqual([1, 3])
    expect(selectTrendMonthTicks([], 8)).toEqual([])
    expect(trendMonthKey(null)).toBeNull()
  })
})
