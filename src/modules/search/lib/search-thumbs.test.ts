import { describe, expect, test } from "bun:test"
import {
  buildCardSearchEntries,
  buildCharacterSearchEntries,
  buildEventSearchEntries,
  buildGachaSearchEntries,
  buildMusicSearchEntries,
  buildPageSearchEntries,
  buildStorySearchEntries,
} from "./search-index"
import { resolveSearchThumb } from "./search-thumbs"

const thumb = (entry: Parameters<typeof resolveSearchThumb>[0]) => resolveSearchThumb(entry, "jp", "china_cdn")

describe("resolveSearchThumb", () => {
  test("a song leads with its jacket", () => {
    const [entry] = buildMusicSearchEntries([{
      id: 1, title: "A", pronunciation: "", composer: "", arranger: "", lyricist: "",
      assetbundleName: "jacket_s_001", publishedAt: null, difficulties: {},
    }])
    const result = thumb(entry)
    expect(result).toMatchObject({ shape: "square", fit: "cover" })
    expect(result?.sources[0]).toContain("startapp/music/jacket/jacket_s_001/jacket_s_001.png")
  })

  test("a card shows the art it has: trained only when that is all there is", () => {
    const base = { characterId: 1, cardRarityType: "rarity_4", attr: "cute", prefix: "A", releaseAt: null }
    const [normal, trained, bare] = buildCardSearchEntries([
      { ...base, id: 1, assetbundleName: "res001_no001" },
      { ...base, id: 2, assetbundleName: "res001_no002", trainedByDefault: true },
      { ...base, id: 3, assetbundleName: "" },
    ], new Map())
    expect(thumb(normal)?.sources[0]).toContain("thumbnail/chara/res001_no001_normal.png")
    expect(thumb(trained)?.sources[0]).toContain("thumbnail/chara/res001_no002_after_training.png")
    expect(thumb(bare)).toMatchObject({ sources: [], shape: "square" })
  })

  test("an event offers its banner, then its logo", () => {
    const [entry] = buildEventSearchEntries([{ id: 1, name: "A", eventType: "marathon", assetbundleName: "event_a", startAt: 1, aggregateAt: 2 }])
    const result = thumb(entry)
    expect(result).toMatchObject({ shape: "wide", fit: "contain" })
    expect(result?.sources).toHaveLength(2)
    expect(result?.sources.every((source) => source?.includes("event_a"))).toBe(true)
  })

  test("a gacha offers its logo first, then banners, a rerun's original among them", () => {
    const [entry] = buildGachaSearchEntries(
      [{ id: 9, name: "A", seq: 1, assetbundleName: "ab_gacha_9", startAt: 1, endAt: 2 }],
      new Map([[9, 3]]),
    )
    const result = thumb(entry)
    expect(result).toMatchObject({ shape: "wide", fit: "contain" })
    expect(result?.sources[0]).toContain("ondemand/gacha/ab_gacha_9/logo/logo.png")
    expect(result?.sources.length).toBeGreaterThan(1)
    expect(result?.sources.some((source) => source?.includes("banner_gacha3"))).toBe(true)
  })

  test("a character shows its round icon", () => {
    const [entry] = buildCharacterSearchEntries([{ id: 21, name: "A", unit: "piapro", iconUrl: "/miku.png" }])
    expect(thumb(entry)).toEqual({ sources: ["/miku.png"], shape: "round", fit: "cover" })
  })

  test("a story shows its logo from the jp asset tree, or its first episode's picture", () => {
    const [withLogo, withThumb, bare] = buildStorySearchEntries([
      { key: "event:1", kind: "event", title: "A", logo: "ondemand/event/a/logo/logo.png", episodes: [{ sid: "s1", thumb: "ep.png" }] },
      { key: "unit:1", kind: "unit", title: "B", episodes: [{ sid: "s2", thumb: "ep2.png" }] },
      { key: "special:1", kind: "special", title: "C", episodes: [{ sid: "s3" }] },
    ])
    const logo = resolveSearchThumb(withLogo, "tw", "china_cdn")
    expect(logo).toMatchObject({ shape: "wide", fit: "contain" })
    expect(logo?.sources).toHaveLength(2)
    expect(logo?.sources[0]).toContain("jp-assets/ondemand/event/a/logo/logo.png")
    expect(thumb(withThumb)).toMatchObject({ fit: "cover" })
    expect(thumb(withThumb)?.sources[0]).toContain("ep2.png")
    expect(thumb(bare)?.sources).toEqual([])
  })

  test("a page has no picture: it shows its icon", () => {
    const [entry] = buildPageSearchEntries([{ path: "/music", title: "曲库" }])
    expect(thumb(entry)).toBeNull()
  })
})
