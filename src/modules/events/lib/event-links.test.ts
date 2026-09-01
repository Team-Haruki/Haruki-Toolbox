import { describe, expect, test } from "bun:test"
import type { EventBonusGroup } from "./event-bonus"
import type { SekaiWorldBloomChapter } from "./event-filter"
import {
  buildEventDeckRecommendLink,
  buildEventRankBorderLink,
  resolveEventDeckRecommendBonus,
  resolveWorldBloomActiveChapter,
} from "./event-links"

const DAY = 24 * 60 * 60 * 1000
const NOW = Date.UTC(2024, 10, 12)

function chapter(overrides: Partial<SekaiWorldBloomChapter>): SekaiWorldBloomChapter {
  return {
    id: 1,
    eventId: 112,
    gameCharacterId: 18,
    chapterNo: 1,
    chapterStartAt: NOW - 3 * DAY,
    aggregateAt: NOW - DAY,
    chapterEndAt: NOW - DAY + 600_000,
    chapterType: "game_character",
    isSupplemental: false,
    ...overrides,
  }
}

const CHAPTERS: SekaiWorldBloomChapter[] = [
  chapter({ id: 1, chapterNo: 1, gameCharacterId: 18 }),
  chapter({ id: 2, chapterNo: 2, gameCharacterId: 20, chapterStartAt: NOW - DAY, aggregateAt: NOW + DAY, chapterEndAt: NOW + DAY + 600_000 }),
  chapter({ id: 3, chapterNo: 3, gameCharacterId: null, chapterType: "finale", chapterStartAt: NOW + DAY, aggregateAt: NOW + 3 * DAY, chapterEndAt: NOW + 3 * DAY }),
]

describe("resolveWorldBloomActiveChapter", () => {
  test("returns the running character chapter", () => {
    expect(resolveWorldBloomActiveChapter(CHAPTERS, NOW)?.gameCharacterId).toBe(20)
  })

  test("falls back to the first character chapter before or after the run", () => {
    expect(resolveWorldBloomActiveChapter(CHAPTERS, NOW - 10 * DAY)?.gameCharacterId).toBe(18)
    expect(resolveWorldBloomActiveChapter(CHAPTERS, NOW + 10 * DAY)?.gameCharacterId).toBe(18)
  })

  test("never resolves the finale and returns null without character chapters", () => {
    expect(resolveWorldBloomActiveChapter([CHAPTERS[2]], NOW + 2 * DAY)).toBeNull()
    expect(resolveWorldBloomActiveChapter([], NOW)).toBeNull()
  })
})

describe("buildEventRankBorderLink", () => {
  test("upcoming events go to the landing page", () => {
    expect(buildEventRankBorderLink({ id: 5, eventType: "marathon" }, "jp", "upcoming", [], NOW)).toEqual({ path: "/rank-border" })
  })

  test("running and ended events open the T100 border line", () => {
    expect(buildEventRankBorderLink({ id: 5, eventType: "cheerful_carnival" }, "tw", "ongoing", [], NOW)).toEqual({
      path: "/rank-border/detail",
      query: { region: "tw", event: "5", interval: "3600", target: "line:100" },
    })
  })

  test("world link events carry the chapter character", () => {
    expect(buildEventRankBorderLink({ id: 112, eventType: "world_bloom" }, "jp", "ongoing", CHAPTERS, NOW)).toEqual({
      path: "/rank-border/detail",
      query: { region: "jp", event: "112", interval: "3600", target: "line:100", mode: "world_bloom", wl: "20" },
    })
  })

  test("world link events without a resolvable chapter fall back", () => {
    expect(buildEventRankBorderLink({ id: 112, eventType: "world_bloom" }, "jp", "ended", [], NOW)).toEqual({ path: "/rank-border" })
  })
})

const GROUPS: EventBonusGroup[] = [
  { cardAttr: "pure", bonusRate: 50, characters: [{ gameCharacterId: 14, unit: "theme_park" }, { gameCharacterId: 9, unit: "idol" }] },
  { cardAttr: null, bonusRate: 25, characters: [{ gameCharacterId: 21, unit: null }] },
  { cardAttr: "pure", bonusRate: 25, characters: [] },
]

describe("resolveEventDeckRecommendBonus", () => {
  test("takes the combo attribute and every bonus character", () => {
    expect(resolveEventDeckRecommendBonus(GROUPS)).toEqual({ attr: "pure", characterIds: [9, 14, 21] })
  })

  test("uses the attribute-only group when no combo exists", () => {
    expect(resolveEventDeckRecommendBonus([GROUPS[1], GROUPS[2]])).toEqual({ attr: "pure", characterIds: [21] })
    expect(resolveEventDeckRecommendBonus([])).toEqual({ attr: null, characterIds: [] })
  })
})

describe("buildEventDeckRecommendLink", () => {
  test("ongoing events only pass the region", () => {
    expect(buildEventDeckRecommendLink("kr", "ongoing", GROUPS)).toEqual({ path: "/deck-recommend", query: { region: "kr" } })
  })

  test("other events replay the bonus through the custom keys", () => {
    expect(buildEventDeckRecommendLink("jp", "ended", GROUPS)).toEqual({
      path: "/deck-recommend",
      query: { region: "jp", customBonusAttr: "pure", customBonusCharacterIds: "9,14,21" },
    })
    expect(buildEventDeckRecommendLink("jp", "upcoming", [GROUPS[1]])).toEqual({
      path: "/deck-recommend",
      query: { region: "jp", customBonusCharacterIds: "21" },
    })
  })
})
