import { describe, expect, it } from "bun:test"
import { createHarukiAliasProvider } from "./alias-provider"

function okEnvelope(matchIds: number[]) {
  return { status: 200, message: "ok", data: { match_ids: matchIds } }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function createFetchStub(handler: (url: string) => Response | Promise<Response>) {
  const calls: string[] = []
  const fetchImpl = ((input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    return Promise.resolve(handler(url))
  }) as typeof fetch
  return { calls, fetchImpl }
}

describe("createHarukiAliasProvider", () => {
  it("queries music and character endpoints in parallel and merges the matches", async () => {
    const { calls, fetchImpl } = createFetchStub((url) =>
      url.includes("/alias/music/")
        ? jsonResponse(okEnvelope([1, 2]))
        : jsonResponse(okEnvelope([21])))
    const provider = createHarukiAliasProvider({ fetchImpl, baseUrl: "https://alias.test/" })

    const matches = await provider.lookup(" 初音ミク ")
    expect(matches).toEqual([
      { type: "music", id: 1 },
      { type: "music", id: 2 },
      { type: "character", id: 21 },
    ])
    expect(calls).toHaveLength(2)
    // Base URL trailing slash trimmed, query trimmed and URL-encoded.
    expect(calls).toContain(
      `https://alias.test/api/v2/public/pjsk/alias/music/by-alias?alias=${encodeURIComponent("初音ミク")}`,
    )
    expect(calls).toContain(
      `https://alias.test/api/v2/public/pjsk/alias/character/by-alias?alias=${encodeURIComponent("初音ミク")}`,
    )
  })

  it("treats a 404 on one endpoint as an empty result for that side only", async () => {
    const { fetchImpl } = createFetchStub((url) =>
      url.includes("/alias/music/")
        ? jsonResponse({ message: "Alias not found", data: null, status: 404 }, 404)
        : jsonResponse(okEnvelope([21])))
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("miku")).toEqual([{ type: "character", id: 21 }])
  })

  it("returns an empty result on network errors", async () => {
    const failing: (input: RequestInfo | URL) => Promise<Response> = () => Promise.reject(new TypeError("Failed to fetch"))
    const fetchImpl = failing as typeof fetch
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("miku")).toEqual([])
  })

  it("returns an empty result on malformed JSON bodies", async () => {
    const { fetchImpl } = createFetchStub(() => new Response("not json", { status: 200 }))
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("miku")).toEqual([])
  })

  it("returns an empty result when the envelope status is not 200", async () => {
    const { fetchImpl } = createFetchStub(() =>
      jsonResponse({ status: 500, message: "error", data: { match_ids: [1] } }))
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("miku")).toEqual([])
  })

  it("ignores non-numeric match ids and malformed data payloads", async () => {
    const { fetchImpl } = createFetchStub((url) =>
      url.includes("/alias/music/")
        ? jsonResponse({ status: 200, message: "ok", data: { match_ids: [1, "2", null, 3] } })
        : jsonResponse({ status: 200, message: "ok", data: null }))
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("miku")).toEqual([
      { type: "music", id: 1 },
      { type: "music", id: 3 },
    ])
  })

  it("short-circuits empty, whitespace, and overlong queries without fetching", async () => {
    const { calls, fetchImpl } = createFetchStub(() => jsonResponse(okEnvelope([1])))
    const provider = createHarukiAliasProvider({ fetchImpl })

    expect(await provider.lookup("")).toEqual([])
    expect(await provider.lookup("   ")).toEqual([])
    expect(await provider.lookup("a".repeat(101))).toEqual([])
    expect(calls).toHaveLength(0)
  })

  it("serves repeat lookups from the cache", async () => {
    const { calls, fetchImpl } = createFetchStub(() => jsonResponse(okEnvelope([1])))
    const provider = createHarukiAliasProvider({ fetchImpl })

    const first = await provider.lookup("miku")
    const second = await provider.lookup("miku")
    expect(first).toEqual(second)
    expect(calls).toHaveLength(2)
  })

  it("dedupes concurrent lookups for the same query", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const { calls, fetchImpl } = createFetchStub(async () => {
      await gate
      return jsonResponse(okEnvelope([5]))
    })
    const provider = createHarukiAliasProvider({ fetchImpl })

    const first = provider.lookup("miku")
    const second = provider.lookup("miku")
    release()
    const [a, b] = await Promise.all([first, second])
    expect(a).toEqual([{ type: "music", id: 5 }, { type: "character", id: 5 }])
    expect(b).toEqual(a)
    expect(calls).toHaveLength(2)
  })

  it("aborts slow requests via the timeout and resolves empty", async () => {
    const fetchImpl = ((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("The operation was aborted.", "AbortError"))
        })
      })) as typeof fetch
    const provider = createHarukiAliasProvider({ fetchImpl, timeoutMs: 10 })

    expect(await provider.lookup("slow")).toEqual([])
  })
})
