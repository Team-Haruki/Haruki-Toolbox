import { describe, expect, test } from "bun:test"
import {
  buildStoryCatalog,
  hideUnreleasedStories,
  overlayStoryTitles,
  type StoryCatalogSources,
} from "@/modules/story/lib/story-catalog"

function sources(overrides: Partial<StoryCatalogSources["stories"]> = {}, names: Record<number, string> = {}): StoryCatalogSources {
  return {
    stories: {
      unitStories: [{
        unit: "street",
        chapters: [{ chapterNo: 1, title: "Chapter", assetbundleName: "street-story-chapter", episodes: [
          { scenarioId: "street_01_01", episodeNoLabel: "1話", title: "Start", assetbundleName: "street_01_01" },
        ] }],
      }],
      eventStories: [
        { id: 7, eventId: 150, assetbundleName: "event_scratch_2024", eventStoryEpisodes: [
          { episodeNo: 2, title: "Two", scenarioId: "event_150_02", assetbundleName: "event_150_02" },
          { episodeNo: 1, title: "One", scenarioId: "event_150_01", assetbundleName: "event_150_01" },
        ] },
        { id: 8, eventId: 151, assetbundleName: "event_next", eventStoryEpisodes: [
          { episodeNo: 1, title: "Next", scenarioId: "event_151_01", assetbundleName: "event_151_01" },
        ] },
      ],
      eventStoryUnits: [{ eventStoryId: 7, unit: "school_refusal", eventStoryUnitRelation: "main" }],
      cardEpisodes: [
        { seq: 2, cardId: 9, title: "B", scenarioId: "card_9_b", cardEpisodePartType: "second_part" },
        { seq: 1, cardId: 9, title: "A", scenarioId: "card_9_a", cardEpisodePartType: "first_part" },
      ],
      specialStories: [{ id: 3, title: "Special", assetbundleName: "sp_story", startAt: 50, episodes: [
        { episodeNo: 1, title: "S1", scenarioId: "sp_01", assetbundleName: "sp_ep" },
      ] }],
      actionSets: [{ id: 1234, areaId: 5, scenarioId: "areatalk_1234", characterIds: [21, 10] }],
      areas: [{ id: 5, name: "Shibuya" }],
      ...overrides,
    },
    events: new Map([[150, { name: "Event 150", startAt: 100 }], [151, { name: "Event 151", startAt: 200 }]]),
    cards: new Map([[9, { characterId: 21, prefix: "Hello", assetbundleName: "res021_no009", releaseAt: 150, supportUnit: "street" }]]),
    characters: new Map([
      [21, { name: names[21] ?? "初音ミク", unit: "piapro" }],
      [10, { name: names[10] ?? "白石杏", unit: "street" }],
    ]),
  }
}

describe("buildStoryCatalog", () => {
  const cat = buildStoryCatalog(sources())

  test("lists events newest first with their paths, images and bundle", () => {
    expect(cat.tabs.event.map((s) => s.key)).toEqual(["event:151", "event:150"])
    const ev = cat.tabs.event[1]
    expect(ev.unit).toBe("school_refusal")
    expect(ev.logo).toBe("ondemand/event/event_scratch_2024/logo/logo.png")
    const ep = ev.episodes.find((e) => e.sid === "event_150_01")!
    expect(ep.paths).toEqual(["ondemand/event_story/event_scratch_2024/scenario/event_150_01.json"])
    expect(ep.thumb).toBe("ondemand/event_story/event_scratch_2024/episode_image/event_150_01.png")
    expect(ep.bundle).toBe("event_scratch_2024")
    expect(ep.label).toEqual({ type: "episode", no: 1 })
  })

  test("orders card parts, tags VS cards and uses the support unit", () => {
    const card = cat.tabs.card[0]
    expect(card.title).toBe("【Hello】初音ミク")
    expect(card.unit).toBe("street")
    expect(card.vsUnit).toBe("piapro")
    expect(card.chars).toEqual([21])
    expect(card.episodes.map((e) => e.label)).toEqual([{ type: "part", part: "first" }, { type: "part", part: "second" }])
    expect(card.episodes[0].paths).toEqual(["startapp/character/member/res021_no009/card_9_a.json"])
  })

  test("tries both special story folders and groups area talks", () => {
    expect(cat.tabs.special[0].episodes[0].paths).toEqual([
      "startapp/scenario/special/sp_ep/sp_01.json",
      "startapp/scenario/special/sp_story/sp_01.json",
    ])
    const area = cat.tabs.area[0]
    expect(area.title).toBe("Shibuya")
    expect(area.episodes[0].paths).toEqual(["startapp/scenario/actionset/group12/areatalk_1234.json"])
    expect(area.episodes[0].title).toBe("初音ミク・白石杏")
    expect(cat.units[10]).toBe("street")
    expect(cat.names[21]).toBe("初音ミク")
  })

  test("indexes every episode by scenario id", () => {
    expect(cat.bySid.get("street_01_01")?.series.kind).toBe("unit")
    expect(cat.bySid.get("card_9_b")?.episode.title).toBe("B")
  })
})

test("overlayStoryTitles takes another region's titles where it has the story", () => {
  const jp = buildStoryCatalog(sources())
  const cn = buildStoryCatalog(sources({
    eventStories: [{ id: 7, eventId: 150, assetbundleName: "event_scratch_2024", eventStoryEpisodes: [
      { episodeNo: 1, title: "第一话", scenarioId: "event_150_01", assetbundleName: "event_150_01" },
    ] }],
  }))
  const out = overlayStoryTitles(jp, cn)
  const ev = out.bySid.get("event_150_01")!
  expect(ev.episode.title).toBe("第一话")
  expect(ev.episode.paths).toEqual(jp.bySid.get("event_150_01")!.episode.paths)
  // CN lacks episode 2 and event 151: JP titles stay
  expect(out.bySid.get("event_150_02")!.episode.title).toBe("Two")
  expect(out.bySid.get("event_151_01")!.episode.title).toBe("Next")
})

test("hideUnreleasedStories drops stories that are not out yet", () => {
  const out = hideUnreleasedStories(buildStoryCatalog(sources()), 160)
  expect(out.tabs.event.map((s) => s.key)).toEqual(["event:150"])
  expect(out.tabs.card).toHaveLength(1)
  expect(out.tabs.unit).toHaveLength(1)
})

test("hideUnreleasedStories drops unreleased episodes and their direct links", () => {
  const out = hideUnreleasedStories(buildStoryCatalog(sources({
    actionSets: [
      { id: 1234, areaId: 5, scenarioId: "areatalk_1234", characterIds: [21], archivePublishedAt: 100 },
      { id: 1235, areaId: 5, scenarioId: "areatalk_1235", characterIds: [10], archivePublishedAt: 300 },
      { id: 1236, areaId: 6, scenarioId: "areatalk_1236", characterIds: [10], archivePublishedAt: 300 },
    ],
  })), 160)
  expect(out.tabs.area.map((s) => s.episodes.map((e) => e.sid))).toEqual([["areatalk_1234"]])
  expect(out.bySid.has("areatalk_1234")).toBe(true)
  for (const sid of ["areatalk_1235", "areatalk_1236", "event_151_01"]) {
    expect(out.bySid.has(sid)).toBe(false)
    expect(out.unreleased?.has(sid)).toBe(true)
  }
  expect(out.unreleased?.has("event_150_01")).toBe(false)
})
