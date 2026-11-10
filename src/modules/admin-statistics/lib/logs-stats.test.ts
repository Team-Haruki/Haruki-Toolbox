import { describe, expect, it } from "bun:test"
import {
  buildBreakdownMeterItems,
  buildUploadVolumeSeries,
  countRowsBy,
  failureStageCounts,
  formatByteSize,
  formatDurationMs,
  formatShare,
  pickUploadVolumeInterval,
  rankCategoryCounts,
  successRatePercent,
  sumUploadAttemptsByDimension,
} from "./logs-stats"

describe("successRatePercent", () => {
  it("is the share of successes among everything counted", () => {
    expect(successRatePercent(90, 10)).toBe(90)
    expect(successRatePercent(1, 2)).toBeCloseTo(33.333, 2)
    expect(successRatePercent(5, 0)).toBe(100)
    expect(successRatePercent(0, 5)).toBe(0)
  })

  it("is null when nothing was counted or the input is not a number", () => {
    expect(successRatePercent(0, 0)).toBeNull()
    expect(successRatePercent(Number.NaN, 3)).toBeNull()
  })
})

describe("rankCategoryCounts", () => {
  it("sorts biggest first, ties by key, and totals everything", () => {
    const ranked = rankCategoryCounts([
      { key: "b", count: 5 },
      { key: "c", count: 9 },
      { key: "a", count: 5 },
    ])
    expect(ranked.items.map((entry) => entry.key)).toEqual(["c", "a", "b"])
    expect(ranked.total).toBe(19)
    expect(ranked.otherCount).toBe(0)
    expect(ranked.otherKinds).toBe(0)
  })

  it("folds the tail beyond the limit into one figure", () => {
    const ranked = rankCategoryCounts(
      [
        { key: "a", count: 10 },
        { key: "b", count: 6 },
        { key: "c", count: 3 },
        { key: "d", count: 1 },
      ],
      2,
    )
    expect(ranked.items).toEqual([{ key: "a", count: 10 }, { key: "b", count: 6 }])
    expect(ranked.total).toBe(20)
    expect(ranked.otherCount).toBe(4)
    expect(ranked.otherKinds).toBe(2)
  })

  it("merges duplicate keys and drops empty or invalid counts", () => {
    const ranked = rankCategoryCounts([
      { key: "a", count: 2 },
      { key: "a", count: 3 },
      { key: "zero", count: 0 },
      { key: "negative", count: -4 },
      { key: "nan", count: Number.NaN },
    ])
    expect(ranked.items).toEqual([{ key: "a", count: 5 }])
    expect(ranked.total).toBe(5)
  })

  it("is empty for a missing list", () => {
    expect(rankCategoryCounts(null)).toEqual({ items: [], total: 0, otherCount: 0, otherKinds: 0 })
    expect(rankCategoryCounts(undefined, 3).items).toEqual([])
  })
})

describe("countRowsBy", () => {
  it("counts rows per key and skips rows without one", () => {
    const rows = [{ actor: "1" }, { actor: "2" }, { actor: "1" }, { actor: null }, {}]
    const counts = countRowsBy(rows, (row: { actor?: string | null }) => row.actor)
    expect(counts).toEqual([{ key: "1", count: 2 }, { key: "2", count: 1 }])
  })

  it("is empty for no rows", () => {
    expect(countRowsBy(null, () => "x")).toEqual([])
  })
})

describe("formatShare", () => {
  it("rounds to a whole percentage", () => {
    expect(formatShare(38, 100)).toBe("38%")
    expect(formatShare(1, 3)).toBe("33%")
    expect(formatShare(5, 5)).toBe("100%")
  })

  it("never rounds a present share to nothing or an incomplete one to everything", () => {
    expect(formatShare(1, 1000)).toBe("<1%")
    expect(formatShare(999, 1000)).toBe(">99%")
  })

  it("is 0% without a part or a total", () => {
    expect(formatShare(0, 10)).toBe("0%")
    expect(formatShare(3, 0)).toBe("0%")
    expect(formatShare(Number.NaN, 10)).toBe("0%")
  })
})

describe("buildBreakdownMeterItems", () => {
  it("labels each entry and gives its count and share of everything counted", () => {
    const ranked = rankCategoryCounts(
      [{ key: "jp", count: 1500 }, { key: "cn", count: 400 }, { key: "tw", count: 100 }],
      2,
    )
    const items = buildBreakdownMeterItems(ranked, (key) => key.toUpperCase(), (value) => value.toLocaleString("en-US"))
    expect(items).toEqual([
      { key: "jp", label: "JP", value: 1500, text: "1,500 · 75%" },
      { key: "cn", label: "CN", value: 400, text: "400 · 20%" },
    ])
  })
})

describe("formatDurationMs", () => {
  it("picks the unit by magnitude", () => {
    expect(formatDurationMs(0)).toBe("0 ms")
    expect(formatDurationMs(842.4)).toBe("842 ms")
    expect(formatDurationMs(1240)).toBe("1.24 s")
    expect(formatDurationMs(12_340)).toBe("12.3 s")
    expect(formatDurationMs(125_000)).toBe("2 min 05 s")
  })

  it("is null when the time is unknown", () => {
    expect(formatDurationMs(null)).toBeNull()
    expect(formatDurationMs(undefined)).toBeNull()
    expect(formatDurationMs(-1)).toBeNull()
    expect(formatDurationMs(Number.NaN)).toBeNull()
  })
})

describe("formatByteSize", () => {
  it("uses binary units with one decimal below ten", () => {
    expect(formatByteSize(812)).toBe("812 B")
    expect(formatByteSize(1434)).toBe("1.4 KB")
    expect(formatByteSize(12 * 1024 * 1024)).toBe("12 MB")
    expect(formatByteSize(5 * 1024 ** 3)).toBe("5.0 GB")
  })

  it("is null when the size is unknown", () => {
    expect(formatByteSize(null)).toBeNull()
    expect(formatByteSize(-5)).toBeNull()
  })
})

describe("pickUploadVolumeInterval", () => {
  const now = Date.parse("2026-11-10T12:00:00Z")

  it("buckets by hour for the default day and for ranges up to three days", () => {
    expect(pickUploadVolumeInterval(null, null, now)).toBe("hour")
    expect(pickUploadVolumeInterval(new Date("2026-11-07T12:00:00Z"), null, now)).toBe("hour")
    expect(pickUploadVolumeInterval(null, new Date("2026-10-01T00:00:00Z"), now)).toBe("hour")
  })

  it("buckets by day beyond three days", () => {
    expect(pickUploadVolumeInterval(new Date("2026-11-07T11:59:00Z"), null, now)).toBe("day")
    expect(pickUploadVolumeInterval(new Date("2026-10-11T00:00:00Z"), new Date("2026-11-10T00:00:00Z"), now)).toBe("day")
  })
})

describe("buildUploadVolumeSeries", () => {
  it("sums the groups per bucket and fills the empty buckets with zero", () => {
    const series = buildUploadVolumeSeries(
      [
        { dimensions: { server: "jp", bucket: "2026-11-10T01:00:00Z" }, attemptCount: 10, successCount: 9, failureCount: 1 },
        { dimensions: { server: "cn", bucket: "2026-11-10T01:00:00Z" }, attemptCount: 4, successCount: 4, failureCount: 0 },
        { dimensions: { server: "jp", bucket: "2026-11-10T03:00:00Z" }, attemptCount: 2, successCount: 0, failureCount: 2 },
      ],
      "2026-11-10T00:30:00Z",
      "2026-11-10T04:00:00Z",
      "hour",
    )
    expect(series.map((point) => point.attempts)).toEqual([0, 14, 0, 2])
    expect(series.map((point) => point.failures)).toEqual([0, 1, 0, 2])
    expect(series[0]!.time).toBe(Date.parse("2026-11-10T00:00:00Z"))
  })

  it("treats the end of the range as exclusive and derives failures when they are not given", () => {
    const series = buildUploadVolumeSeries(
      [{ dimensions: { bucket: "2026-11-08T00:00:00Z" }, attemptCount: 7, successCount: 5 }],
      "2026-11-07T00:00:00Z",
      "2026-11-10T00:00:00Z",
      "day",
    )
    expect(series).toHaveLength(3)
    expect(series[1]).toEqual({ time: Date.parse("2026-11-08T00:00:00Z"), attempts: 7, failures: 2 })
  })

  it("ignores groups outside the range or without a readable bucket", () => {
    const series = buildUploadVolumeSeries(
      [
        { dimensions: { bucket: "2026-11-01T00:00:00Z" }, attemptCount: 5 },
        { dimensions: { bucket: "not-a-date" }, attemptCount: 5 },
        { dimensions: { server: "jp" }, attemptCount: 5 },
      ],
      "2026-11-10T00:00:00Z",
      "2026-11-10T02:00:00Z",
      "hour",
    )
    expect(series.map((point) => point.attempts)).toEqual([0, 0])
  })

  it("is empty for an unusable range", () => {
    expect(buildUploadVolumeSeries([], "", "2026-11-10T00:00:00Z", "hour")).toEqual([])
    expect(buildUploadVolumeSeries([], "2026-11-10T00:00:00Z", "2026-11-10T00:00:00Z", "hour")).toEqual([])
    expect(buildUploadVolumeSeries(null, "2020-01-01T00:00:00Z", "2026-01-01T00:00:00Z", "hour")).toEqual([])
  })
})

describe("sumUploadAttemptsByDimension", () => {
  it("adds up the buckets of each dimension value, biggest first", () => {
    const counts = sumUploadAttemptsByDimension(
      [
        { dimensions: { server: "cn", bucket: "a" }, attemptCount: 4 },
        { dimensions: { server: "jp", bucket: "a" }, attemptCount: 10 },
        { dimensions: { server: "cn", bucket: "b" }, attemptCount: 3 },
        { dimensions: { server: null, bucket: "b" }, attemptCount: 1 },
      ],
      "server",
    )
    expect(counts).toEqual([{ key: "jp", count: 10 }, { key: "cn", count: 7 }, { key: "", count: 1 }])
  })

  it("is empty without groups", () => {
    expect(sumUploadAttemptsByDimension(null, "server")).toEqual([])
  })
})

describe("failureStageCounts", () => {
  it("turns the stage map into ranked entries", () => {
    expect(failureStageCounts({ decode: 2, auth: 9, unknown: 2, none: 0 })).toEqual([
      { key: "auth", count: 9 },
      { key: "decode", count: 2 },
      { key: "unknown", count: 2 },
    ])
    expect(failureStageCounts(null)).toEqual([])
  })
})
