import { afterEach, describe, expect, it } from "bun:test"
import { resetAssetHostState } from "@/shared/sekai/asset-image-fallback"
import { costumeLoadTracker, loadCostumeContent, openMirrorOnRoute, resolveCostumeContentBaseUrl } from "./costume-content"
import type { HarukiCostumeShopContent } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"
import type { HarukiOriginalAssetBundleElement } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"


describe("resolveCostumeContentBaseUrl", () => {
  it("points the 3D kernel at the region's raw-bundle mirror on the chosen asset CDN", () => {
    expect(resolveCostumeContentBaseUrl("global", "jp", undefined)).toBe(
      "https://sekai-assets-haruki.seiunx.net/raw-bundles/jp/android/",
    )
    expect(resolveCostumeContentBaseUrl("china_cdn", "tw", undefined)).toBe(
      "https://sekai-assets-cn03-she01-cdn.haruki.seiunx.com/raw-bundles/tw/android/",
    )
  })

  it("takes another mirror root when one is configured", () => {
    expect(resolveCostumeContentBaseUrl("global", "kr", " http://localhost:4200/raw-bundles/ ")).toBe(
      "http://localhost:4200/raw-bundles/kr/android/",
    )
    expect(resolveCostumeContentBaseUrl("global", "jp", "  ")).toBe(
      "https://sekai-assets-haruki.seiunx.net/raw-bundles/jp/android/",
    )
  })
})

describe("loadCostumeContent", () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  function serve(status: number) {
    const requested: string[] = []
    globalThis.fetch = (async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input)
      requested.push(new URL(url).pathname)
      if (status !== 200) {
        return new Response("down", { status })
      }
      if (url.endsWith("/current.json")) {
        return Response.json({ catalog: "catalogs/7.1.0.60.msgpack", assetVersion: "7.1.0.60" })
      }
      return new Response(new Uint8Array([7, 7]))
    }) as typeof fetch
    return requested
  }

  it("shares one content per mirror root and counts the bundles it downloads", async () => {
    const base = "https://shared.example/raw-bundles/jp/android/"
    const requested = serve(200)
    const content = await loadCostumeContent(base)
    expect(await loadCostumeContent(base)).toBe(content)
    expect(content.assetBundleInfo).toBe(`${base}catalogs/7.1.0.60.msgpack`)

    const tracker = costumeLoadTracker(base)
    expect(costumeLoadTracker(base)).toBe(tracker)
    expect(costumeLoadTracker("https://other.example/")).not.toBe(tracker)
    const bundle = { bundleName: "shader/live", hash: "h", fileSize: 2 } as HarukiOriginalAssetBundleElement
    const bytes = await content.provideBundle(bundle, { version: "1", signal: new AbortController().signal })
    expect(new Uint8Array(bytes as ArrayBuffer)).toEqual(new Uint8Array([7, 7]))
    expect(tracker.progressSince(0)).toEqual({ requested: 1, done: 1, bytesRequested: 2, bytesDone: 2, fraction: 1 })
    expect(requested.filter((path) => path.endsWith("current.json"))).toHaveLength(1)
  })

  it("does not keep a failed load, so the next call asks again", async () => {
    const base = "https://flaky.example/raw-bundles/jp/android/"
    const requested = serve(503)
    await expect(loadCostumeContent(base)).rejects.toThrow()
    await expect(loadCostumeContent(base)).rejects.toThrow()
    expect(requested).toHaveLength(2)
  })
})

describe("openMirrorOnRoute", () => {
  const china = "https://sekai-assets-cn03-she01-cdn.haruki.seiunx.com/raw-bundles/tw/android/"
  const global = "https://sekai-assets-haruki.seiunx.net/raw-bundles/tw/android/"
  afterEach(() => resetAssetHostState())

  const opener = (fail: Record<string, Error>) => {
    const opened: string[] = []
    const open = async (base: string) => {
      opened.push(base)
      if (fail[base]) {
        throw fail[base]
      }
      return { assetBundleInfo: `${base}catalogs/x.msgpack` } as HarukiCostumeShopContent
    }
    return { opened, open }
  }

  it("opens the mirror on the global route when the China route fails", async () => {
    const { opened, open } = opener({ [china]: new Error(`${china}current.json: HTTP 503`) })
    expect((await openMirrorOnRoute(china, open)).assetBundleInfo).toBe(`${global}catalogs/x.msgpack`)
    expect(opened).toEqual([china, global])
    // The China host stays behind its twin for a while.
    opened.length = 0
    await openMirrorOnRoute(china, open)
    expect(opened).toEqual([global])
  })

  it("keeps a missing mirror an error, and has no twin for a configured root", async () => {
    const missing = opener({ [china]: new Error(`${china}current.json: HTTP 404`) })
    await expect(openMirrorOnRoute(china, missing.open)).rejects.toThrow("HTTP 404")
    expect(missing.opened).toEqual([china])

    const local = "http://localhost:4200/raw-bundles/tw/android/"
    const down = opener({ [local]: new TypeError("failed to fetch") })
    await expect(openMirrorOnRoute(local, down.open)).rejects.toThrow("failed to fetch")
    expect(down.opened).toEqual([local])
  })
})
