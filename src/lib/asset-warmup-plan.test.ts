import { describe, expect, test } from "bun:test"
import {
  isConstrainedConnection,
  mapWithConcurrency,
  normalizeAssetManifest,
  selectAssetsToWarm,
  WARMUP_MAX_FILE_BYTES,
  WARMUP_MAX_TOTAL_BYTES,
} from "./asset-warmup-plan"

describe("normalizeAssetManifest", () => {
  test("keeps well-formed entries and the build commit", () => {
    expect(normalizeAssetManifest({
      gitCommit: "abc123",
      files: [{ url: "/assets/a.js", bytes: 10 }, { url: "/assets/b.css", bytes: 0 }],
    })).toEqual({
      gitCommit: "abc123",
      files: [{ url: "/assets/a.js", bytes: 10 }, { url: "/assets/b.css", bytes: 0 }],
    })
  })

  test("returns null when the payload is not a manifest", () => {
    expect(normalizeAssetManifest(null)).toBeNull()
    expect(normalizeAssetManifest(undefined)).toBeNull()
    expect(normalizeAssetManifest("nope")).toBeNull()
    expect(normalizeAssetManifest(42)).toBeNull()
    expect(normalizeAssetManifest({})).toBeNull()
    expect(normalizeAssetManifest({ files: "nope" })).toBeNull()
  })

  test("omits a non-string commit rather than failing the manifest", () => {
    expect(normalizeAssetManifest({ gitCommit: 7, files: [] })).toEqual({ gitCommit: undefined, files: [] })
  })

  test("drops entries that could not be fetched safely", () => {
    const manifest = normalizeAssetManifest({
      files: [
        { url: "/assets/keep.js", bytes: 1 },
        null,
        "not-an-entry",
        { url: "https://evil.example/x.js", bytes: 1 },
        { url: "assets/relative.js", bytes: 1 },
        { url: "/assets/no-size.js" },
        { url: "/assets/nan.js", bytes: Number.NaN },
        { url: "/assets/infinite.js", bytes: Number.POSITIVE_INFINITY },
        { url: "/assets/negative.js", bytes: -1 },
        { url: 5, bytes: 1 },
      ],
    })

    expect(manifest?.files).toEqual([{ url: "/assets/keep.js", bytes: 1 }])
  })
})

describe("selectAssetsToWarm", () => {
  const limits = { maxFileBytes: 100, maxTotalBytes: 250 }

  test("returns everything missing from the cache", () => {
    const files = [{ url: "/a.js", bytes: 10 }, { url: "/b.js", bytes: 20 }]
    expect(selectAssetsToWarm(files, new Set())).toEqual(["/a.js", "/b.js"])
  })

  test("skips what the runtime cache already holds", () => {
    const files = [{ url: "/a.js", bytes: 10 }, { url: "/b.js", bytes: 20 }, { url: "/c.js", bytes: 30 }]
    expect(selectAssetsToWarm(files, new Set(["/b.js"]))).toEqual(["/a.js", "/c.js"])
  })

  test("skips oversized files but keeps going", () => {
    const files = [{ url: "/small.js", bytes: 10 }, { url: "/huge.js", bytes: 101 }, { url: "/next.js", bytes: 10 }]
    expect(selectAssetsToWarm(files, new Set(), limits)).toEqual(["/small.js", "/next.js"])
  })

  test("stops once the session budget is spent", () => {
    const files = [
      { url: "/a.js", bytes: 100 },
      { url: "/b.js", bytes: 100 },
      { url: "/c.js", bytes: 100 },
      { url: "/d.js", bytes: 10 },
    ]
    // 100 + 100 fits in 250; /c.js does not, and selection stops there rather
    // than skipping ahead to the smaller /d.js.
    expect(selectAssetsToWarm(files, new Set(), limits)).toEqual(["/a.js", "/b.js"])
  })

  test("spends the budget on files it skipped nothing for", () => {
    const files = [{ url: "/a.js", bytes: 250 }, { url: "/b.js", bytes: 1 }]
    expect(selectAssetsToWarm(files, new Set(), { maxFileBytes: 250, maxTotalBytes: 250 })).toEqual(["/a.js"])
  })

  test("returns nothing when everything is cached", () => {
    const files = [{ url: "/a.js", bytes: 10 }]
    expect(selectAssetsToWarm(files, new Set(["/a.js"]))).toEqual([])
  })

  test("handles an empty manifest", () => {
    expect(selectAssetsToWarm([], new Set())).toEqual([])
  })

  test("defaults keep a whole realistic build under budget", () => {
    const files = Array.from({ length: 300 }, (_, index) => ({ url: `/assets/chunk-${index}.js`, bytes: 12 * 1024 }))
    expect(selectAssetsToWarm(files, new Set())).toHaveLength(300)
    expect(WARMUP_MAX_FILE_BYTES).toBeLessThan(WARMUP_MAX_TOTAL_BYTES)
  })
})

describe("isConstrainedConnection", () => {
  test("treats a missing connection as unconstrained", () => {
    expect(isConstrainedConnection(undefined)).toBe(false)
    expect(isConstrainedConnection(null)).toBe(false)
    expect(isConstrainedConnection({})).toBe(false)
  })

  test("opts out under data saver", () => {
    expect(isConstrainedConnection({ saveData: true })).toBe(true)
  })

  test("opts out on 2G class connections only", () => {
    expect(isConstrainedConnection({ effectiveType: "slow-2g" })).toBe(true)
    expect(isConstrainedConnection({ effectiveType: "2g" })).toBe(true)
    expect(isConstrainedConnection({ effectiveType: "3g" })).toBe(false)
    expect(isConstrainedConnection({ effectiveType: "4g" })).toBe(false)
  })
})

describe("mapWithConcurrency", () => {
  test("processes every item exactly once", async () => {
    const seen: number[] = []
    await mapWithConcurrency([1, 2, 3, 4, 5], 2, async (item) => {
      seen.push(item)
    })
    expect(seen.sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5])
  })

  test("never exceeds the concurrency limit", async () => {
    let inFlight = 0
    let peak = 0
    await mapWithConcurrency(Array.from({ length: 20 }, (_, i) => i), 4, async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await Promise.resolve()
      await Promise.resolve()
      inFlight -= 1
    })
    expect(peak).toBe(4)
  })

  test("never starts more runners than there are items", async () => {
    let peak = 0
    let inFlight = 0
    await mapWithConcurrency([1, 2], 10, async () => {
      inFlight += 1
      peak = Math.max(peak, inFlight)
      await Promise.resolve()
      inFlight -= 1
    })
    expect(peak).toBe(2)
  })

  test("reports a failing item and still finishes the rest", async () => {
    const done: number[] = []
    const failures: Array<[number, unknown]> = []
    await mapWithConcurrency([1, 2, 3], 1, async (item) => {
      if (item === 2) {
        throw new Error("boom")
      }
      done.push(item)
    }, (item, error) => {
      failures.push([item, error])
    })

    expect(done).toEqual([1, 3])
    expect(failures).toHaveLength(1)
    expect(failures[0][0]).toBe(2)
    expect((failures[0][1] as Error).message).toBe("boom")
  })

  test("swallows a failure when no reporter is given", async () => {
    const done: number[] = []
    await mapWithConcurrency([1, 2], 2, async (item) => {
      if (item === 1) {
        throw new Error("boom")
      }
      done.push(item)
    })
    expect(done).toEqual([2])
  })

  test("does nothing for an empty list", async () => {
    let calls = 0
    await mapWithConcurrency([], 4, async () => {
      calls += 1
    })
    expect(calls).toBe(0)
  })

  test("clamps a nonsensical limit to a single runner", async () => {
    const order: number[] = []
    await mapWithConcurrency([1, 2, 3], 0, async (item) => {
      order.push(item)
      await Promise.resolve()
    })
    expect(order).toEqual([1, 2, 3])
  })
})
