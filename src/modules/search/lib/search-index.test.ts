import { describe, expect, it } from "bun:test"
import type { SearchIndexEntry } from "./search-index"
import {
  SEARCH_RESULTS_PER_TYPE,
  buildSearchIndex,
  normalizeSearchText,
  searchIndexEntries,
} from "./search-index"

function makeEntry(overrides: Partial<SearchIndexEntry>): SearchIndexEntry {
  return {
    type: "music",
    id: 1,
    title: "Untitled",
    subtitle: "",
    keywords: [],
    ...overrides,
  }
}

const MASTER_INPUT = {
  musics: [
    { id: 1, title: "Tell Your World", pronunciation: "てるゆあわーるど", composer: "kz", arranger: "kz" },
    { id: 2, title: "ハローセカイ", pronunciation: "はろーせかい", composer: "someone", arranger: "other" },
    { id: 3, title: "" },
  ],
  cards: [
    { id: 101, characterId: 21, prefix: "奇跡の歌声" },
    { id: 102, characterId: 999, prefix: "Unknown Owner" },
    { id: 103, characterId: 21 },
  ],
  events: [
    { id: 7, name: "Colorful Live" },
    { id: 8 },
  ],
  gameCharacters: [
    { id: 21, firstName: "初音", givenName: "ミク" },
  ],
}

describe("buildSearchIndex", () => {
  it("builds music entries with pronunciation and credits as deduped keywords", () => {
    const entries = buildSearchIndex(MASTER_INPUT)
    const music = entries.find((entry) => entry.type === "music" && entry.id === 1)
    expect(music).toBeDefined()
    expect(music?.title).toBe("Tell Your World")
    expect(music?.subtitle).toBe("kz")
    expect(music?.keywords).toEqual(["てるゆあわーるど", "kz"])
  })

  it("builds card entries titled by prefix with the resolved character name", () => {
    const entries = buildSearchIndex(MASTER_INPUT)
    const card = entries.find((entry) => entry.type === "card" && entry.id === 101)
    expect(card?.title).toBe("奇跡の歌声")
    expect(card?.subtitle).toBe("初音ミク")
    expect(card?.keywords).toEqual(["初音ミク"])

    const orphan = entries.find((entry) => entry.type === "card" && entry.id === 102)
    expect(orphan?.subtitle).toBe("")
    expect(orphan?.keywords).toEqual([])
  })

  it("builds event entries from names and skips records without id or title", () => {
    const entries = buildSearchIndex(MASTER_INPUT)
    const event = entries.find((entry) => entry.type === "event")
    expect(event).toEqual({ type: "event", id: 7, title: "Colorful Live", subtitle: "", keywords: [] })
    expect(entries.some((entry) => entry.type === "music" && entry.id === 3)).toBe(false)
    expect(entries.some((entry) => entry.type === "card" && entry.id === 103)).toBe(false)
    expect(entries.some((entry) => entry.type === "event" && entry.id === 8)).toBe(false)
  })

  it("returns no entries for missing input", () => {
    expect(buildSearchIndex({})).toEqual([])
  })
})

describe("normalizeSearchText", () => {
  it("applies NFKC normalization, lowercasing, and trimming", () => {
    expect(normalizeSearchText("　ＴＥＬＬ　")).toBe("tell")
    expect(normalizeSearchText("World")).toBe("world")
  })
})

describe("searchIndexEntries", () => {
  const entries = buildSearchIndex(MASTER_INPUT)

  it("returns nothing for an empty or whitespace query", () => {
    expect(searchIndexEntries(entries, "")).toEqual([])
    expect(searchIndexEntries(entries, "   ")).toEqual([])
  })

  it("matches titles case-insensitively by substring", () => {
    expect(searchIndexEntries(entries, "your world").map((entry) => entry.id)).toEqual([1])
    expect(searchIndexEntries(entries, "YOUR").map((entry) => entry.id)).toEqual([1])
    expect(searchIndexEntries(entries, "missing")).toEqual([])
  })

  it("normalizes full-width input via NFKC", () => {
    expect(searchIndexEntries(entries, "ＴＥＬＬ").map((entry) => entry.id)).toEqual([1])
    const fullWidthTitle = [makeEntry({ id: 9, title: "Ｗｏｎｄｅｒ Ｓｔａｇｅ" })]
    expect(searchIndexEntries(fullWidthTitle, "wonder").map((entry) => entry.id)).toEqual([9])
  })

  it("matches keywords such as credits and character names", () => {
    expect(searchIndexEntries(entries, "kz").map((entry) => entry.id)).toEqual([1])
    expect(searchIndexEntries(entries, "初音").map((entry) => entry.id)).toEqual([101])
  })

  it("ranks prefix matches before substring matches", () => {
    const ranked = searchIndexEntries(
      [
        makeEntry({ id: 1, title: "Tell Your World" }),
        makeEntry({ id: 2, title: "World Anthem" }),
        makeEntry({ id: 3, title: "Sekai World" }),
      ],
      "world",
    )
    expect(ranked.map((entry) => entry.id)).toEqual([2, 1, 3])
  })

  it("treats keyword prefixes as prefix matches", () => {
    const ranked = searchIndexEntries(
      [
        makeEntry({ id: 1, title: "Melody in the dark" }),
        makeEntry({ id: 2, title: "Untitled", keywords: ["darkness trio"] }),
      ],
      "dark",
    )
    expect(ranked.map((entry) => entry.id)).toEqual([2, 1])
  })

  it("caps results per type independently", () => {
    const crowded: SearchIndexEntry[] = [
      ...Array.from({ length: 12 }, (_, index) =>
        makeEntry({ id: index + 1, title: `Sekai Song ${index + 1}` })),
      makeEntry({ type: "event", id: 900, title: "Sekai Festival" }),
      makeEntry({ type: "event", id: 901, title: "Another Sekai Festival" }),
    ]
    const results = searchIndexEntries(crowded, "sekai")
    expect(results.filter((entry) => entry.type === "music")).toHaveLength(SEARCH_RESULTS_PER_TYPE)
    expect(results.filter((entry) => entry.type === "event")).toHaveLength(2)
    expect(results.map((entry) => entry.id).slice(0, 8)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it("groups the flat result list in music, card, event order", () => {
    const mixed: SearchIndexEntry[] = [
      makeEntry({ type: "event", id: 1, title: "Sekai Event" }),
      makeEntry({ type: "card", id: 2, title: "Sekai Card" }),
      makeEntry({ type: "music", id: 3, title: "Sekai Music" }),
    ]
    expect(searchIndexEntries(mixed, "sekai").map((entry) => entry.type)).toEqual(["music", "card", "event"])
  })
})
