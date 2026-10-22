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
    const { index, jpRoot } = await fetchStoryAssetIndex("https://h/jp-assets", 7_200_000)
    expect(urls).toEqual(["https://h/jp-assets/story-player/index.json?h=2"])
    expect(jpRoot).toBe("https://h/jp-assets")
    expect(index.models.a.model3).toBe("m")
    expect(index.movies).toEqual({})
    expect(index.se).toEqual({})
  } finally {
    globalThis.fetch = realFetch
  }
})

/** A fetch double: "down" hosts fail like a dropped connection, the rest answer by path. */
function fakeHosts(answer: (url: string) => Response, down: readonly string[] = []) {
  const urls: string[] = []
  const realFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = String(input)
    urls.push(url)
    if (down.some((host) => url.startsWith(host))) throw new TypeError("Failed to fetch")
    return answer(url)
  }) as typeof fetch
  return { urls, restore: () => (globalThis.fetch = realFetch) }
}

test("fetchStoryAssetIndex reads the index from the fallback host when the chosen one is down", async () => {
  const hosts = fakeHosts(() => new Response(JSON.stringify({ version: "v" }), { status: 200 }), ["https://cn"])
  try {
    const result = await fetchStoryAssetIndex("https://cn/jp-assets", 0, "https://gl/jp-assets")
    expect(result.jpRoot).toBe("https://gl/jp-assets")
    expect(result.index.version).toBe("v")
    expect(hosts.urls).toEqual(["https://cn/jp-assets/story-player/index.json?h=0", "https://gl/jp-assets/story-player/index.json?h=0"])
  } finally {
    hosts.restore()
  }
})

test("fetchStoryAssetIndex retries a 5xx on the fallback host but not a 404", async () => {
  let status = 503
  const hosts = fakeHosts((url) =>
    url.startsWith("https://cn") ? new Response("", { status }) : new Response(JSON.stringify({ version: "g" }), { status: 200 }))
  try {
    expect((await fetchStoryAssetIndex("https://cn/jp-assets", 0, "https://gl/jp-assets")).jpRoot).toBe("https://gl/jp-assets")
    status = 404
    await expect(fetchStoryAssetIndex("https://cn/jp-assets", 0, "https://gl/jp-assets")).rejects.toThrow("HTTP 404")
    expect(hosts.urls.filter((u) => u.startsWith("https://gl"))).toHaveLength(1)
  } finally {
    hosts.restore()
  }
})

test("fetchStoryAssetIndex without a fallback fails as before", async () => {
  const hosts = fakeHosts(() => new Response("", { status: 200 }), ["https://cn"])
  try {
    await expect(fetchStoryAssetIndex("https://cn/jp-assets", 0)).rejects.toThrow("Failed to fetch")
    expect(hosts.urls).toHaveLength(1)
  } finally {
    hosts.restore()
  }
})

test("fetchScenarioJson retries the same path once on the fallback host", async () => {
  const hosts = fakeHosts((url) => {
    if (url === "https://cn/jp-assets/b.json") return new Response("", { status: 502 })
    if (url.endsWith("/b.json")) return new Response(JSON.stringify({ ok: 2 }), { status: 200 })
    return new Response("", { status: 404 })
  })
  try {
    expect(await fetchScenarioJson<{ ok: number }>("https://cn", "jp", ["a.json", "b.json"], undefined, "https://gl")).toEqual({ ok: 2 })
    // a 404 moves on to the next path without asking the fallback host
    expect(hosts.urls).toEqual(["https://cn/jp-assets/a.json", "https://cn/jp-assets/b.json", "https://gl/jp-assets/b.json"])
  } finally {
    hosts.restore()
  }
})

test("fetchScenarioJson treats a body cut short as a failure worth the fallback", async () => {
  const hosts = fakeHosts((url) =>
    url.startsWith("https://cn") ? new Response("{\"ok\":", { status: 200 }) : new Response(JSON.stringify({ ok: 3 }), { status: 200 }))
  try {
    expect(await fetchScenarioJson<{ ok: number }>("https://cn", "en", ["a.json"], undefined, "https://gl")).toEqual({ ok: 3 })
  } finally {
    hosts.restore()
  }
})

test("fetchScenarioJson does not retry the caller's own abort", async () => {
  const hosts = fakeHosts(() => new Response("", { status: 200 }))
  const controller = new AbortController()
  controller.abort()
  globalThis.fetch = ((input: string | URL | Request, init?: RequestInit) => {
    hosts.urls.push(String(input))
    return Promise.reject(init?.signal?.reason ?? new DOMException("aborted", "AbortError"))
  }) as typeof fetch
  try {
    await expect(fetchScenarioJson("https://cn", "jp", ["a.json"], controller.signal, "https://gl")).rejects.toThrow()
    expect(hosts.urls).toEqual(["https://cn/jp-assets/a.json"])
  } finally {
    hosts.restore()
  }
})
