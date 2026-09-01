import { describe, expect, test } from "bun:test"
import {
  buildEventDetailExtras,
  groupWorldBloomChaptersByEvent,
  normalizeCheerfulCarnivalTeams,
  normalizeEventMusics,
  normalizeEventStories,
} from "./event-extras"

const EVENT_MUSICS = [
  { eventId: 214, musicId: 788, seq: 1, releaseConditionId: 1 },
  { eventId: 213, musicId: 728, seq: 2, releaseConditionId: 1 },
  { eventId: 213, musicId: 700, seq: 1, releaseConditionId: 1 },
  { eventId: 0, musicId: 1 },
]

const TEAMS = [
  { id: 82, eventId: 186, seq: 2, teamName: "Bチーム", assetbundleName: "event_cheerfutest2_2025_item_2" },
  { id: 81, eventId: 186, seq: 1, teamName: "Aチーム", assetbundleName: "event_cheerfutest2_2025_item_1" },
  { id: 5, eventId: 3, seq: 1 },
]

const STORIES = [
  {
    id: 215,
    eventId: 215,
    outline: "Outline text",
    bannerGameCharacterUnitId: 24,
    assetbundleName: "event_partytime_2026",
    eventStoryEpisodes: [
      { id: 1001736, eventStoryId: 215, episodeNo: 2, title: "作戦会議！" },
      { id: 1001735, eventStoryId: 215, episodeNo: 1, title: "友達になりたい！" },
      { episodeNo: 3, title: "broken" },
    ],
  },
  { id: 9, outline: "no event" },
]

const WORLD_BLOOMS = [
  { id: 11202, eventId: 112, gameCharacterId: 20, chapterNo: 2, chapterStartAt: 1731322800000, aggregateAt: 1731581999000, chapterEndAt: 1731582599000, worldBloomChapterType: "game_character", isSupplemental: false },
  { id: 11201, eventId: 112, gameCharacterId: 18, chapterNo: 1, chapterStartAt: 1731063600000, aggregateAt: 1731322799000, chapterEndAt: 1731323399000 },
  { id: 11301, eventId: 113, gameCharacterId: 1, chapterNo: 1 },
]

describe("normalizeEventMusics", () => {
  test("keeps valid rows sorted by event and seq", () => {
    expect(normalizeEventMusics(EVENT_MUSICS)).toEqual([
      { eventId: 213, musicId: 700, seq: 1 },
      { eventId: 213, musicId: 728, seq: 2 },
      { eventId: 214, musicId: 788, seq: 1 },
    ])
  })
})

describe("normalizeCheerfulCarnivalTeams", () => {
  test("keeps teams sorted by seq with optional assets", () => {
    const teams = normalizeCheerfulCarnivalTeams(TEAMS)
    expect(teams.map((team) => team.id)).toEqual([5, 81, 82])
    expect(teams[0]).toEqual({ id: 5, eventId: 3, seq: 1, teamName: "#5", assetbundleName: null })
  })
})

describe("normalizeEventStories", () => {
  test("keeps the outline and sorted episodes", () => {
    const stories = normalizeEventStories(STORIES)
    expect(stories).toHaveLength(1)
    expect(stories[0].outline).toBe("Outline text")
    expect(stories[0].bannerGameCharacterUnitId).toBe(24)
    expect(stories[0].episodes.map((episode) => episode.episodeNo)).toEqual([1, 2])
  })

  test("handles the optional file being absent", () => {
    expect(normalizeEventStories(undefined)).toEqual([])
  })
})

describe("groupWorldBloomChaptersByEvent", () => {
  test("groups and sorts chapters per event", () => {
    const grouped = groupWorldBloomChaptersByEvent(WORLD_BLOOMS)
    expect([...grouped.keys()]).toEqual([112, 113])
    expect(grouped.get(112)?.map((chapter) => chapter.chapterNo)).toEqual([1, 2])
    expect(grouped.get(112)?.[0].chapterType).toBeNull()
    expect(grouped.get(112)?.[1].chapterType).toBe("game_character")
  })
})

describe("buildEventDetailExtras", () => {
  test("builds every lookup from the file map", () => {
    const extras = buildEventDetailExtras({
      eventRarityBonusRates: [{ id: 401, cardRarityType: "rarity_4", masterRank: 0, bonusRate: 10 }],
      worldBlooms: WORLD_BLOOMS,
      eventMusics: EVENT_MUSICS,
      cheerfulCarnivalTeams: TEAMS,
      eventStories: STORIES,
    })
    expect(extras.rarityBonusRates).toHaveLength(1)
    expect(extras.chaptersByEvent.get(113)).toHaveLength(1)
    expect(extras.musicsByEvent.get(213)?.map((row) => row.musicId)).toEqual([700, 728])
    expect(extras.teamsByEvent.get(186)?.map((team) => team.teamName)).toEqual(["Aチーム", "Bチーム"])
    expect(extras.storiesByEvent.get(215)?.episodes).toHaveLength(2)
    expect(extras.storiesByEvent.has(9)).toBe(false)
  })

  test("tolerates empty optional files", () => {
    const extras = buildEventDetailExtras({ eventRarityBonusRates: [], worldBlooms: [], eventMusics: [], cheerfulCarnivalTeams: [], eventStories: [] })
    expect(extras.storiesByEvent.size).toBe(0)
    expect(extras.musicsByEvent.size).toBe(0)
  })
})
