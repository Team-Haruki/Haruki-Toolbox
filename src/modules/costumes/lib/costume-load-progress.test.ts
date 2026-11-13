import { describe, expect, it } from "bun:test"
import type {
  HarukiCostumeShopContent,
  HarukiOriginalAssetBundleElement,
} from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import { BundleLoadTracker, formatMegabytes, loadProgressSince, trackBundleLoads } from "./costume-load-progress"

const bundle = (bundleName: string, fileSize: number) => ({ bundleName, fileSize }) as HarukiOriginalAssetBundleElement
const context = () => ({ version: "1", signal: new AbortController().signal })

function content(provide: HarukiCostumeShopContent["provideBundle"]): HarukiCostumeShopContent {
  return { assetBundleInfo: "catalog", provideBundle: provide, provideMasterData: () => ({}) as never }
}

describe("trackBundleLoads", () => {
  it("fetches the bundles a content names by URL and counts each download", async () => {
    const tracker = new BundleLoadTracker()
    const seen: number[] = []
    tracker.subscribe((counts) => seen.push(counts.done))
    const fetched: string[] = []
    const tracked = trackBundleLoads(
      content((b) => `https://cdn.example/${b.bundleName}.bundle`),
      tracker,
      async (input) => {
        fetched.push(String(input))
        return new Response(new Uint8Array([1, 2, 3]))
      },
    )

    const bytes = await tracked.provideBundle(bundle("shader/live", 3), context())
    expect(new Uint8Array(bytes as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]))
    expect(fetched).toEqual(["https://cdn.example/shader/live.bundle"])
    expect(tracker.snapshot()).toEqual({ requested: 1, done: 1, bytesRequested: 3, bytesDone: 3 })
    expect(seen).toEqual([0, 1])
    expect(tracked.assetBundleInfo).toBe("catalog")
  })

  it("passes bytes through uncounted and still finishes a failed download", async () => {
    const tracker = new BundleLoadTracker()
    const raw = new Uint8Array([9])
    const passthrough = trackBundleLoads(content(() => raw), tracker, async () => {
      throw new Error("not fetched")
    })
    expect(await passthrough.provideBundle(bundle("a", 1), context())).toBe(raw)
    expect(tracker.snapshot().requested).toBe(0)

    const failing = trackBundleLoads(content(() => "https://cdn.example/b.bundle"), tracker, async () =>
      new Response("missing", { status: 404 }),
    )
    await expect(failing.provideBundle(bundle("b", 5), context())).rejects.toThrow("HTTP 404")
    expect(tracker.snapshot()).toEqual({ requested: 1, done: 1, bytesRequested: 5, bytesDone: 5 })
  })

  it("stops telling a listener once it unsubscribes", () => {
    const tracker = new BundleLoadTracker()
    let calls = 0
    const stop = tracker.subscribe(() => {
      calls += 1
    })
    tracker.begin(1)
    stop()
    tracker.finish(1)
    expect(calls).toBe(1)
  })
})

describe("loadProgressSince", () => {
  it("measures one load from its start, by bytes when sizes are known", () => {
    const start = { requested: 4, done: 4, bytesRequested: 100, bytesDone: 100 }
    expect(loadProgressSince(start, start).fraction).toBeNull()
    expect(loadProgressSince(start, { requested: 6, done: 5, bytesRequested: 400, bytesDone: 175 })).toEqual({
      requested: 2,
      done: 1,
      bytesRequested: 300,
      bytesDone: 75,
      fraction: 0.25,
    })
    // Without sizes, by bundles.
    expect(loadProgressSince(start, { requested: 8, done: 6, bytesRequested: 100, bytesDone: 100 }).fraction).toBe(0.5)
  })
})

describe("formatMegabytes", () => {
  it("shows one decimal", () => {
    expect(formatMegabytes(0)).toBe("0.0")
    expect(formatMegabytes(1536 * 1024)).toBe("1.5")
  })
})
