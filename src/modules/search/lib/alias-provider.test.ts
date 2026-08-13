import { describe, expect, it } from "bun:test"
import { createHarukiAliasProvider } from "./alias-provider"
import type { SearchIndexEntry } from "./search-index"
import { buildSearchIndex, mergeAliasResults, resolveAliasMatches } from "./search-index"

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
    const fetchImpl = (() => Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch
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

const CARD_INDEX: SearchIndexEntry[] = [
  { type: "music", id: 1, title: "Tell Your World", subtitle: "kz", keywords: [] },
  { type: "card", id: 101, title: "Card A", subtitle: "Miku", keywords: [], characterId: 21 },
  { type: "card", id: 102, title: "Card B", subtitle: "Miku", keywords: [], characterId: 21 },
  { type: "card", id: 201, title: "Card C", subtitle: "Rin", keywords: [], characterId: 22 },
  { type: "event", id: 7, title: "Colorful Live", subtitle: "", keywords: [] },
]

describe("resolveAliasMatches", () => {
  it("expands character matches to that character's card entries", () => {
    const resolved = resolveAliasMatches(CARD_INDEX, [{ type: "character", id: 21 }])
    expect(resolved.map((entry) => entry.id)).toEqual([101, 102])
    expect(resolved.every((entry) => entry.type === "card")).toBe(true)
  })

  it("resolves direct matches by type and id, dropping unknown ids", () => {
    const resolved = resolveAliasMatches(CARD_INDEX, [
      { type: "music", id: 1 },
      { type: "music", id: 999 },
      { type: "event", id: 7 },
      { type: "character", id: 42 },
    ])
    expect(resolved.map((entry) => `${entry.type}-${entry.id}`)).toEqual(["music-1", "event-7"])
  })

  it("dedupes overlapping direct and expanded matches", () => {
    const resolved = resolveAliasMatches(CARD_INDEX, [
      { type: "card", id: 101 },
      { type: "character", id: 21 },
    ])
    expect(resolved.map((entry) => entry.id)).toEqual([101, 102])
  })
})

describe("mergeAliasResults", () => {
  it("appends alias-only hits after local results and flags them", () => {
    const local = CARD_INDEX.filter((entry) => entry.id === 101)
    const alias = resolveAliasMatches(CARD_INDEX, [{ type: "character", id: 21 }])
    const merged = mergeAliasResults(local, alias)
    expect(merged.map((entry) => entry.id)).toEqual([101, 102])
    expect(merged[0]?.viaAlias).toBeUndefined()
    expect(merged[1]?.viaAlias).toBe(true)
  })

  it("keeps music, card, event group ordering with alias-only groups included", () => {
    const local = CARD_INDEX.filter((entry) => entry.type === "event")
    const alias = CARD_INDEX.filter((entry) => entry.type === "music")
    const merged = mergeAliasResults(local, alias)
    expect(merged.map((entry) => `${entry.type}-${entry.id}`)).toEqual(["music-1", "event-7"])
  })

  it("respects the per-type cap when appending alias hits", () => {
    const local = CARD_INDEX.filter((entry) => entry.type === "card" && entry.characterId === 21)
    const alias = CARD_INDEX.filter((entry) => entry.type === "card")
    const merged = mergeAliasResults(local, alias, 2)
    expect(merged.map((entry) => entry.id)).toEqual([101, 102])
  })

  it("returns local results untouched when there are no alias entries", () => {
    const local = CARD_INDEX.slice(0, 2)
    expect(mergeAliasResults(local, [])).toEqual(local)
  })
})

describe("buildSearchIndex characterId", () => {
  it("records the owning character id on card entries", () => {
    const entries = buildSearchIndex({
      cards: [{ id: 101, characterId: 21, prefix: "奇跡の歌声" }],
      gameCharacters: [{ id: 21, firstName: "初音", givenName: "ミク" }],
    })
    expect(entries).toHaveLength(1)
    expect(entries[0]?.characterId).toBe(21)
  })
})
