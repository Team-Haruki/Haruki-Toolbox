import { describe, expect, test } from "bun:test"
import { preloadSearchPinyin } from "@/lib/search-match"
import {
  browseEntries,
  buildCardSearchEntries,
  buildCharacterSearchEntries,
  buildEventSearchEntries,
  buildGachaSearchEntries,
  buildMusicSearchEntries,
  buildPageSearchEntries,
  buildStorySearchEntries,
  createSearchIndex,
  parseSearchIdQuery,
  resolveAliasMatches,
  resolveSearchListTarget,
  searchEntries,
  type SearchIndexEntry,
} from "./search-index"

const DAY = 86_400_000

function music(id: number, title: string, extra: Partial<Parameters<typeof buildMusicSearchEntries>[0][number]> = {}) {
  return {
    id,
    title,
    pronunciation: "",
    composer: "",
    arranger: "",
    lyricist: "",
    assetbundleName: `jacket_s_${id}`,
    publishedAt: id * DAY,
    difficulties: { expert: { playLevel: 25 }, master: { playLevel: 30 }, append: undefined },
    ...extra,
  }
}

function card(id: number, prefix: string | null, characterId: number, releaseAt = id * DAY) {
  return {
    id,
    characterId,
    cardRarityType: "rarity_4",
    attr: "cute",
    prefix,
    assetbundleName: `res${id}`,
    releaseAt,
  }
}

function buildIndex(): ReturnType<typeof createSearchIndex> {
  const names = new Map([[21, "初音ミク"], [22, "鏡音リン"]])
  const entries: SearchIndexEntry[] = [
    ...buildPageSearchEntries([
      { path: "/deck-recommend", title: "组卡推荐", section: "活动与榜线工具" },
      { path: "/pt-calculator", title: "控分计算", section: "活动与榜线工具" },
      { path: "/music", title: "曲库" },
    ]),
    ...buildCharacterSearchEntries(
      [
        { id: 21, name: "初音ミク", unit: "piapro", iconUrl: "/miku.png" },
        { id: 22, name: "鏡音リン", unit: "piapro", iconUrl: "/rin.png" },
      ],
      new Map([[21, 2], [22, 1]]),
    ),
    ...buildMusicSearchEntries([
      music(1, "Tell Your World", { pronunciation: "てるゆあわーるど", composer: "kz" }),
      music(2, "ロキ", { pronunciation: "ろき", composer: "みきとP" }),
      music(3, "Worlds End Dancehall", { composer: "wowaka" }),
      music(101, "World"),
    ]),
    ...buildCardSearchEntries([card(101, "奇跡の歌声", 21), card(102, "World Is Mine", 21), card(201, "Card C", 22), card(3, null, 22)], names),
    ...buildEventSearchEntries([
      { id: 101, name: "Stella After the Rain", eventType: "marathon", assetbundleName: "event_stella", startAt: 5 * DAY, aggregateAt: 12 * DAY },
      { id: 7, name: "World Link Festival", eventType: "world_bloom", assetbundleName: "event_wl", startAt: 20 * DAY, aggregateAt: 27 * DAY },
    ]),
    ...buildGachaSearchEntries(
      [{ id: 500, name: "World Link Gacha", seq: 1, assetbundleName: "ab_gacha_500", startAt: 20 * DAY, endAt: 30 * DAY }],
      new Map([[500, 400]]),
    ),
    ...buildStorySearchEntries([
      { key: "event:7", kind: "event", title: "World Link Festival", at: 20 * DAY, logo: "logo.png", episodes: [{ sid: "ev7_01" }, { sid: "ev7_02" }] },
      { key: "special:1", kind: "special", title: "No episodes", episodes: [] },
    ]),
  ]
  return createSearchIndex(entries)
}

function keys(results: ReturnType<typeof searchEntries>) {
  return results.groups.flatMap((group) => group.items.map((entry) => entry.key))
}

describe("builders", () => {
  test("a song keeps its levels and is searchable by its people and reading", () => {
    const [entry] = buildMusicSearchEntries([music(1, "Tell Your World", { pronunciation: "てる", composer: "kz", arranger: "kz", lyricist: "kz" })])
    expect(entry).toMatchObject({ key: "music-1", to: "/music/1", releaseAt: DAY })
    expect(entry.parts).toEqual(["てる", "kz"])
    expect(entry.music.levels).toEqual({ expert: 25, master: 30 })
  })

  test("a card without a name is left out; the rest carry their character", () => {
    const entries = buildCardSearchEntries([card(1, "A", 21), card(2, null, 21)], new Map([[21, "初音ミク"]]))
    expect(entries.map((entry) => entry.id)).toEqual([1])
    expect(entries[0].card).toMatchObject({ characterId: 21, characterName: "初音ミク", trainedByDefault: false })
    expect(entries[0].parts).toEqual(["初音ミク"])
  })

  test("a character opens the card list filtered to it", () => {
    const [entry] = buildCharacterSearchEntries([{ id: 21, name: "初音ミク", unit: "piapro", iconUrl: "/m.png" }], new Map([[21, 9]]))
    expect(entry.to).toEqual({ path: "/cards", query: { chars: "21" } })
    expect(entry.character.cardCount).toBe(9)
  })

  test("a gacha remembers the original whose banner it reuses", () => {
    const [entry] = buildGachaSearchEntries([{ id: 9, name: "Rerun", seq: null, assetbundleName: "", startAt: 1, endAt: 2 }], new Map([[9, 3]]))
    expect(entry.gacha.aliasId).toBe(3)
    expect(entry.to).toBe("/gachas/9")
  })

  test("a story opens on its first episode; one with no episode is left out", () => {
    const entries = buildStorySearchEntries([
      { key: "event:7", kind: "event", title: "A", episodes: [{ sid: "s1", thumb: "t.png" }, { sid: "s2" }] },
      { key: "event:8", kind: "event", title: "B", episodes: [] },
      { key: "event:9", kind: "event", title: "", episodes: [{ sid: "s3" }] },
    ])
    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({ id: "event:7", to: { name: "story.player", query: { scenario: "s1" } } })
    expect(entries[0].story).toMatchObject({ episodeCount: 2, logo: null, thumb: "t.png" })
  })

  test("a page is found by its section and by the words of its path, once per path", () => {
    const entries = buildPageSearchEntries([
      { path: "/deck-recommend", title: "组卡推荐", section: "工具" },
      { path: "/deck-recommend", title: "Duplicate" },
      { path: "/x", title: "" },
    ])
    expect(entries).toHaveLength(1)
    expect(entries[0].parts).toEqual(["工具", "deck recommend"])
    expect(entries[0].page).toEqual({ path: "/deck-recommend", section: "工具" })
  })
})

describe("parseSearchIdQuery", () => {
  test("reads a bare or prefixed number", () => {
    expect(parseSearchIdQuery("225")).toBe(225)
    expect(parseSearchIdQuery(" #225 ")).toBe(225)
    expect(parseSearchIdQuery("ID 225")).toBe(225)
    expect(parseSearchIdQuery("No.7")).toBe(7)
    expect(parseSearchIdQuery("２２５")).toBe(225)
  })

  test("is null for anything else", () => {
    expect(parseSearchIdQuery("world 2")).toBeNull()
    expect(parseSearchIdQuery("2a")).toBeNull()
    expect(parseSearchIdQuery("")).toBeNull()
  })
})

describe("searchEntries", () => {
  test("an empty query finds nothing", () => {
    expect(searchEntries(buildIndex(), "  ")).toEqual({
      groups: [],
      counts: { page: 0, character: 0, music: 0, card: 0, event: 0, gacha: 0, story: 0 },
      total: 0,
    })
  })

  test("groups hits by type in a fixed order and counts every hit", () => {
    const results = searchEntries(buildIndex(), "world")
    expect(results.groups.map((group) => group.type)).toEqual(["music", "card", "event", "gacha", "story"])
    expect(results.counts).toMatchObject({ music: 3, card: 1, event: 1, gacha: 1, story: 1 })
    expect(results.total).toBe(7)
  })

  test("ranks the exact title, then its start, then inside it; newest first within a rank", () => {
    const results = searchEntries(buildIndex(), "world")
    const musicGroup = results.groups.find((group) => group.type === "music")!
    // "World" exactly; "Worlds End Dancehall" starts with it; "Tell Your World" contains it.
    expect(musicGroup.items.map((entry) => entry.id)).toEqual([101, 3, 1])
  })

  test("a number is an id: those records come first, across types", () => {
    const results = searchEntries(buildIndex(), "#101")
    expect(keys(results)).toEqual(["music-101", "card-101", "event-101"])
  })

  test("matches other fields, kana as romaji, and several words in any order", () => {
    const index = buildIndex()
    expect(keys(searchEntries(index, "wowaka"))).toEqual(["music-3"])
    expect(keys(searchEntries(index, "roki"))).toEqual(["music-2"])
    expect(keys(searchEntries(index, "dancehall worlds"))).toEqual(["music-3"])
    // A card is found by its character's name.
    expect(keys(searchEntries(index, "鏡音", { scope: "card" }))).toEqual(["card-201"])
  })

  test("pages are found by pinyin once the dictionary is loaded", async () => {
    const index = buildIndex()
    await preloadSearchPinyin()
    index.invalidate()
    expect(keys(searchEntries(index, "zuka"))).toEqual(["page-/deck-recommend"])
    expect(keys(searchEntries(index, "kongfen"))).toEqual(["page-/pt-calculator"])
    expect(keys(searchEntries(index, "deck"))).toEqual(["page-/deck-recommend"])
  })

  test("a query in Han characters is matched as written, not by its pinyin initials", async () => {
    const names = new Map([[1, "朝比奈まふゆ"]])
    const index = createSearchIndex([
      ...buildCardSearchEntries([card(1, "徹夜を案じて", 1), card(2, "初音の歌", 1)], names),
    ])
    await preloadSearchPinyin()
    index.invalidate()
    // "初音" reduces to "cy", which "徹夜…案" (che ye … an) would contain.
    expect(keys(searchEntries(index, "初音"))).toEqual(["card-2"])
    expect(keys(searchEntries(index, "朝比奈 徹夜"))).toEqual(["card-1"])
    // Typed as letters, pinyin initials still work.
    expect(keys(searchEntries(index, "cy")).length).toBeGreaterThan(0)
  })

  test("a scope lists only its type, at the larger limit, but still counts the rest", () => {
    const results = searchEntries(buildIndex(), "world", { scope: "music", perTypeLimit: 1, scopedLimit: 2 })
    expect(results.groups.map((group) => group.type)).toEqual(["music"])
    expect(results.groups[0].items).toHaveLength(2)
    expect(results.groups[0].total).toBe(3)
    expect(results.counts.event).toBe(1)
  })

  test("the per-type limit hides rows without lowering the total", () => {
    const results = searchEntries(buildIndex(), "world", { perTypeLimit: 1 })
    const musicGroup = results.groups.find((group) => group.type === "music")!
    expect(musicGroup.items.map((entry) => entry.id)).toEqual([101])
    expect(musicGroup.total).toBe(3)
  })

  test("excluded entries are neither listed nor counted", () => {
    const results = searchEntries(buildIndex(), "world", { exclude: (entry) => (entry.releaseAt ?? 0) >= 20 * DAY })
    expect(results.groups.map((group) => group.type)).toEqual(["music"])
    expect(results.groups[0].items.map((entry) => entry.id)).toEqual([3, 1])
    expect(results.counts).toMatchObject({ music: 2, card: 0, event: 0 })
    expect(results.total).toBe(2)
  })

  test("alias hits come after text hits, flagged, and never twice", () => {
    const index = buildIndex()
    const aliasEntries = [index.byKey.get("music-2")!, index.byKey.get("music-1")!]
    const results = searchEntries(index, "world", { scope: "music", aliasEntries })
    expect(results.groups[0].items.map((entry) => [entry.id, entry.viaAlias === true])).toEqual([
      [101, false],
      [3, false],
      [1, false],
      [2, true],
    ])
    expect(results.counts.music).toBe(4)
  })
})

describe("browseEntries", () => {
  test("a dated type shows its newest, up to the limit", () => {
    const group = browseEntries(buildIndex(), "music", { limit: 2 })
    expect(group.items.map((entry) => entry.id)).toEqual([101, 3])
    expect(group.total).toBe(4)
  })

  test("pages and characters are listed whole, in index order", () => {
    const index = buildIndex()
    expect(browseEntries(index, "page", { limit: 1 }).items.map((entry) => entry.id)).toEqual(["/deck-recommend", "/pt-calculator", "/music"])
    expect(browseEntries(index, "character").items.map((entry) => entry.id)).toEqual([21, 22])
  })

  test("honours the exclusion", () => {
    const group = browseEntries(buildIndex(), "event", { exclude: (entry) => entry.id === 7 })
    expect(group.items.map((entry) => entry.id)).toEqual([101])
  })
})

describe("resolveAliasMatches", () => {
  test("a character is itself, then its cards", () => {
    const resolved = resolveAliasMatches(buildIndex(), [{ type: "character", id: 21 }])
    expect(resolved.map((entry) => entry.key)).toEqual(["character-21", "card-101", "card-102"])
  })

  test("direct matches resolve by type and id; unknown ids are dropped", () => {
    const resolved = resolveAliasMatches(buildIndex(), [
      { type: "music", id: 1 },
      { type: "music", id: 999 },
      { type: "event", id: 7 },
      { type: "character", id: 42 },
    ])
    expect(resolved.map((entry) => entry.key)).toEqual(["music-1", "event-7"])
  })

  test("overlapping matches appear once, in match order", () => {
    const resolved = resolveAliasMatches(buildIndex(), [
      { type: "card", id: 102 },
      { type: "character", id: 21 },
    ])
    expect(resolved.map((entry) => entry.key)).toEqual(["card-102", "character-21", "card-101"])
    expect(resolveAliasMatches(buildIndex(), [])).toEqual([])
  })
})

describe("resolveSearchListTarget", () => {
  test("types with a list page open it with the query", () => {
    expect(resolveSearchListTarget("music", " world ")).toEqual({ path: "/music", query: { q: "world" } })
    expect(resolveSearchListTarget("card", "a")).toEqual({ path: "/cards", query: { q: "a" } })
    expect(resolveSearchListTarget("event", "a")).toEqual({ path: "/events", query: { q: "a" } })
    expect(resolveSearchListTarget("gacha", "a")).toEqual({ path: "/gachas", query: { q: "a" } })
  })

  test("the others, and an empty query, have none", () => {
    expect(resolveSearchListTarget("page", "a")).toBeNull()
    expect(resolveSearchListTarget("character", "a")).toBeNull()
    expect(resolveSearchListTarget("story", "a")).toBeNull()
    expect(resolveSearchListTarget("music", "  ")).toBeNull()
  })
})
