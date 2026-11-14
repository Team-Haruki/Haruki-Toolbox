import { afterEach, describe, expect, it } from "bun:test"
import { resetAssetHostState } from "@/shared/sekai/asset-image-fallback"
import type {
  HarukiCostumeShopContent,
  HarukiOriginalAssetBundleElement,
} from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import {
  BundleLoadTracker,
  fetchWithHostFallback,
  formatMegabytes,
  trackBundleLoads,
} from "./costume-load-progress"

const bundle = (bundleName: string, fileSize: number) => ({ bundleName, fileSize }) as HarukiOriginalAssetBundleElement
const context = () => ({ version: "1", signal: new AbortController().signal })

function content(provide: HarukiCostumeShopContent["provideBundle"]): HarukiCostumeShopContent {
  return { assetBundleInfo: "catalog", provideBundle: provide, provideMasterData: () => ({}) as never }
}

describe("trackBundleLoads", () => {
  it("fetches the bundles a content names by URL and counts each download", async () => {
    const tracker = new BundleLoadTracker()
    const seen: number[] = []
    tracker.subscribe(() => seen.push(tracker.progressSince(0).done))
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
    expect(tracker.progressSince(0)).toEqual({ requested: 1, done: 1, bytesRequested: 3, bytesDone: 3, fraction: 1 })
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
    expect(tracker.progressSince(0).requested).toBe(0)

    const failing = trackBundleLoads(content(() => "https://cdn.example/b.bundle"), tracker, async () =>
      new Response("missing", { status: 404 }),
    )
    await expect(failing.provideBundle(bundle("b", 5), context())).rejects.toThrow("HTTP 404")
    expect(tracker.progressSince(0)).toEqual({ requested: 1, done: 1, bytesRequested: 5, bytesDone: 5, fraction: 1 })
  })

  it("stops telling a listener once it unsubscribes", () => {
    const tracker = new BundleLoadTracker()
    let calls = 0
    const stop = tracker.subscribe(() => {
      calls += 1
    })
    const id = tracker.begin(1)
    stop()
    tracker.finish(id)
    expect(calls).toBe(1)
  })
})

describe("BundleLoadTracker.progressSince", () => {
  it("counts only the requests made since the mark, by bytes when sizes are known", () => {
    const tracker = new BundleLoadTracker()
    const earlier = tracker.begin(100)
    const mark = tracker.mark()
    expect(tracker.progressSince(mark).fraction).toBeNull()
    const own = tracker.begin(10)
    tracker.begin(30)
    // A download of the earlier load finishing now does not advance this one.
    tracker.finish(earlier)
    expect(tracker.progressSince(mark)).toEqual({ requested: 2, done: 0, bytesRequested: 40, bytesDone: 0, fraction: 0 })
    tracker.finish(own)
    tracker.finish(own)
    expect(tracker.progressSince(mark)).toEqual({ requested: 2, done: 1, bytesRequested: 40, bytesDone: 10, fraction: 0.25 })
  })

  it("goes by bundles when the catalog gives no sizes", () => {
    const tracker = new BundleLoadTracker()
    tracker.finish(tracker.begin(0))
    tracker.begin(0)
    expect(tracker.progressSince(0).fraction).toBe(0.5)
  })
})

describe("formatMegabytes", () => {
  it("shows one decimal", () => {
    expect(formatMegabytes(0)).toBe("0.0")
    expect(formatMegabytes(1536 * 1024)).toBe("1.5")
  })
})

describe("fetchWithHostFallback", () => {
  const china = "https://sekai-assets-cn03-she01-cdn.haruki.seiunx.com/raw-bundles/jp/android/bundles/shader/live.bundle"
  const global = "https://sekai-assets-haruki.seiunx.net/raw-bundles/jp/android/bundles/shader/live.bundle"
  afterEach(() => resetAssetHostState())

  function hosts(answer: (url: string) => Response | Error) {
    const asked: string[] = []
    const fetchImpl = async (input: string | URL) => {
      asked.push(String(input))
      const result = answer(String(input))
      if (result instanceof Error) {
        throw result
      }
      return result
    }
    return { asked, fetchImpl }
  }

  it("asks the global twin when the China route fails, and goes there first afterwards", async () => {
    const { asked, fetchImpl } = hosts((url) => (url.startsWith("https://sekai-assets-cn03") ? new Response("", { status: 502 }) : new Response("ok")))
    expect((await fetchWithHostFallback(china, undefined, fetchImpl)).status).toBe(200)
    expect(asked).toEqual([china, global])
    asked.length = 0
    await fetchWithHostFallback(china, undefined, fetchImpl)
    expect(asked).toEqual([global])
  })

  it("falls back on a network error but not on a missing file", async () => {
    const down = hosts((url) => (url.startsWith("https://sekai-assets-cn03") ? new TypeError("failed to fetch") : new Response("ok")))
    expect((await fetchWithHostFallback(china, undefined, down.fetchImpl)).status).toBe(200)
    expect(down.asked).toEqual([china, global])

    resetAssetHostState()
    const missing = hosts(() => new Response("", { status: 404 }))
    expect((await fetchWithHostFallback(china, undefined, missing.fetchImpl)).status).toBe(404)
    expect(missing.asked).toEqual([china])
  })

  it("fetches other URLs as they are", async () => {
    const { asked, fetchImpl } = hosts(() => new Response("", { status: 503 }))
    expect((await fetchWithHostFallback("http://localhost:4200/raw-bundles/jp/android/a.bundle", undefined, fetchImpl)).status).toBe(503)
    expect(asked).toEqual(["http://localhost:4200/raw-bundles/jp/android/a.bundle"])
  })
})
