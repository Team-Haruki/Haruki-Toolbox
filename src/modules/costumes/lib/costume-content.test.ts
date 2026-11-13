import { afterEach, describe, expect, it } from "bun:test"
import { costumeLoadTracker, loadCostumeContent, resolveCostumeContentBaseUrl } from "./costume-content"
import type { HarukiOriginalAssetBundleElement } from "../vendor/haruki-3d-engine/haruki-3d-engine-costume-shop.js"

describe("resolveCostumeContentBaseUrl", () => {
  it("points the 3D kernel at the region's content on the selected API endpoint", () => {
    expect(resolveCostumeContentBaseUrl("https://toolbox-api.example", "jp")).toBe(
      "https://toolbox-api.example/api/misc/costume3d/jp/",
    )
    expect(resolveCostumeContentBaseUrl("https://toolbox-api.example/", "tw")).toBe(
      "https://toolbox-api.example/api/misc/costume3d/tw/",
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

  it("shares one content per backend root and counts the bundles it downloads", async () => {
    const base = "https://shared.example/api/misc/costume3d/jp/"
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
    expect(tracker.snapshot()).toEqual({ requested: 1, done: 1, bytesRequested: 2, bytesDone: 2 })
    expect(requested.filter((path) => path.endsWith("current.json"))).toHaveLength(1)
  })

  it("does not keep a failed load, so the next call asks again", async () => {
    const base = "https://flaky.example/api/misc/costume3d/jp/"
    const requested = serve(503)
    await expect(loadCostumeContent(base)).rejects.toThrow()
    await expect(loadCostumeContent(base)).rejects.toThrow()
    expect(requested).toHaveLength(2)
  })
})
