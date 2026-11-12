import { describe, expect, test } from "bun:test"
import { buildMusicSearchEntries, buildPageSearchEntries, type SearchResultEntry } from "./search-index"
import { parseSearchRecents, pushSearchRecent, toSearchRecentEntry } from "./search-recents"

function musicEntry(id: number): SearchResultEntry {
  return buildMusicSearchEntries([{
    id,
    title: `Song ${id}`,
    pronunciation: "よみ",
    composer: "c",
    arranger: "",
    lyricist: "",
    assetbundleName: `jacket_${id}`,
    publishedAt: 1000,
    difficulties: {},
  }])[0]
}

describe("search recents", () => {
  test("a stored entry drops the search text and the alias flag", () => {
    const stored = toSearchRecentEntry({ ...musicEntry(1), viaAlias: true })
    expect(stored.parts).toEqual([])
    expect("viaAlias" in stored).toBe(false)
    expect(stored).toMatchObject({ key: "music-1", title: "Song 1", to: "/music/1" })
  })

  test("the newest goes first, an older copy is replaced, the tail is cut", () => {
    let recents = pushSearchRecent([], musicEntry(1))
    recents = pushSearchRecent(recents, musicEntry(2))
    recents = pushSearchRecent(recents, musicEntry(1))
    expect(recents.map((entry) => entry.key)).toEqual(["music-1", "music-2"])
    recents = pushSearchRecent(recents, musicEntry(3), 2)
    expect(recents.map((entry) => entry.key)).toEqual(["music-3", "music-1"])
  })

  test("what was stored reads back as it was written", () => {
    const page = buildPageSearchEntries([{ path: "/deck-recommend", title: "组卡推荐", section: "工具" }])[0]
    const written = JSON.parse(JSON.stringify(pushSearchRecent(pushSearchRecent([], musicEntry(1)), page)))
    const read = parseSearchRecents(written)
    expect(read.map((entry) => entry.key)).toEqual(["page-/deck-recommend", "music-1"])
    expect(read[1]).toMatchObject({ type: "music", releaseAt: 1000, music: { assetbundleName: "jacket_1" } })
  })

  test("anything malformed is dropped rather than shown", () => {
    const good = JSON.parse(JSON.stringify(toSearchRecentEntry(musicEntry(1))))
    const read = parseSearchRecents([
      null,
      "music-1",
      { ...good, type: "player" },
      { ...good, key: "music-2" },
      { ...good, title: "" },
      { ...good, to: "https://example.test/" },
      { ...good, to: { query: { q: "a" } } },
      { ...good, to: { path: "/music", query: { q: 1 } } },
      { ...good, music: undefined },
      good,
      good,
    ])
    expect(read.map((entry) => entry.key)).toEqual(["music-1"])
    expect(parseSearchRecents("nope")).toEqual([])
    expect(parseSearchRecents({ 0: good })).toEqual([])
  })

  test("a missing release time reads as none, and the limit holds", () => {
    const good = JSON.parse(JSON.stringify(toSearchRecentEntry(musicEntry(1))))
    expect(parseSearchRecents([{ ...good, releaseAt: "soon" }])[0].releaseAt).toBeNull()
    const many = [1, 2, 3].map((id) => JSON.parse(JSON.stringify(toSearchRecentEntry(musicEntry(id)))))
    expect(parseSearchRecents(many, 2)).toHaveLength(2)
  })
})
