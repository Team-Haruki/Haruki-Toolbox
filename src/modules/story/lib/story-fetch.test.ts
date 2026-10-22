import { expect, test } from "bun:test"
import { ScenarioCache, fetchScenarioJson, fetchStoryAssetIndex } from "@/modules/story/lib/story-fetch"

test("ScenarioCache shares loads, evicts the oldest and forgets failures", async () => {
  const cache = new ScenarioCache<string>(2)
  let loads = 0
  const load = (v: string) => () => {
    loads++
    return Promise.resolve(v)
  }
  expect(await cache.get("a", load("A"))).toBe("A")
  expect(await cache.get("a", load("A2"))).toBe("A")
  await cache.get("b", load("B"))
  await cache.get("c", load("C")) // evicts "a"
  expect(await cache.get("a", load("A3"))).toBe("A3")
  expect(loads).toBe(4)

  await expect(cache.get("x", () => Promise.reject(new Error("down")))).rejects.toThrow("down")
  expect(await cache.get("x", load("X"))).toBe("X")
})

test("fetchScenarioJson tries the candidate paths and skips missing ones", async () => {
  const realFetch = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input)
    urls.push(url)
    if (url.endsWith("/b.json")) return new Response(JSON.stringify({ ok: 1 }), { status: 200 })
    if (url.endsWith("/boom.json")) return new Response("", { status: 502 })
    return new Response("", { status: 404 })
  }) as typeof fetch
  try {
    expect(await fetchScenarioJson<{ ok: number }>("https://h", "cn", ["a.json", "b.json"])).toEqual({ ok: 1 })
    expect(urls).toEqual(["https://h/cn-assets/a.json", "https://h/cn-assets/b.json"])
    expect(await fetchScenarioJson("https://h", "jp", ["a.json"])).toBeNull()
    await expect(fetchScenarioJson("https://h", "jp", ["boom.json"])).rejects.toThrow("HTTP 502")
  } finally {
    globalThis.fetch = realFetch
  }
})

test("fetchStoryAssetIndex reads the hourly index and fills in missing maps", async () => {
  const realFetch = globalThis.fetch
  const urls: string[] = []
  globalThis.fetch = (async (input: string | URL | Request) => {
    urls.push(String(input))
    return new Response(JSON.stringify({ version: "v", models: { a: { dir: "d", model3: "m" } } }), { status: 200 })
  }) as typeof fetch
  try {
    const index = await fetchStoryAssetIndex("https://h/jp-assets", 7_200_000)
    expect(urls).toEqual(["https://h/jp-assets/story-player/index.json?h=2"])
    expect(index.models.a.model3).toBe("m")
    expect(index.movies).toEqual({})
    expect(index.se).toEqual({})
  } finally {
    globalThis.fetch = realFetch
  }
})
