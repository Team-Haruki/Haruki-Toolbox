import { describe, expect, it } from "bun:test"
import {
  resolveDefaultEventOption,
  resolveMusicDifficultyOptions,
  resolveWorldBloomDefaultGameCharacterId,
  resolveWorldBloomGameCharacterIds,
} from "./master-options"

describe("deck recommend master option helpers", () => {
  it("formats difficulty labels in uppercase with levels", () => {
    expect(resolveMusicDifficultyOptions("74", [
      { musicId: 74, musicDifficulty: "expert", playLevel: 24 },
    ])).toEqual([
      { value: "expert", label: "EXPERT Lv.24", playLevel: 24 },
    ])
  })

  it("selects the currently active event by default", () => {
    expect(resolveDefaultEventOption([
      { id: 2, value: "2", label: "future", eventType: null, startAt: 3_000, aggregateAt: 4_000, closedAt: null },
      { id: 1, value: "1", label: "active", eventType: null, startAt: 1_000, aggregateAt: 2_000, closedAt: null },
    ], 1_500)?.value).toBe("1")
  })

  it("returns world bloom game character chapter ids in chapter order", () => {
    expect(resolveWorldBloomGameCharacterIds("112", [
      { id: 111, eventType: "marathon" },
      { id: 112, eventType: "world_bloom" },
    ], [
      { eventId: 112, gameCharacterId: 20, worldBloomChapterType: "game_character", chapterNo: 2 },
      { eventId: 112, gameCharacterId: 18, worldBloomChapterType: "game_character", chapterNo: 1 },
      { eventId: 112, gameCharacterId: 18, worldBloomChapterType: "game_character", chapterNo: 5 },
      { eventId: 112, gameCharacterId: 99, worldBloomChapterType: "other", chapterNo: 3 },
      { eventId: 113, gameCharacterId: 19, worldBloomChapterType: "game_character", chapterNo: 1 },
    ])).toEqual([18, 20])
  })

  it("returns no chapter characters for non-world-bloom events", () => {
    expect(resolveWorldBloomGameCharacterIds("111", [
      { id: 111, eventType: "marathon" },
    ], [
      { eventId: 111, gameCharacterId: 18, worldBloomChapterType: "game_character", chapterNo: 1 },
    ])).toEqual([])
  })

  it("selects active world bloom chapter character or falls back to first chapter", () => {
    const events = [{ id: 112, eventType: "world_bloom", startAt: 1_000, aggregateAt: 5_000 }]
    const worldBlooms = [
      {
        eventId: 112,
        gameCharacterId: 18,
        worldBloomChapterType: "game_character",
        chapterNo: 1,
        chapterStartAt: 1_000,
        aggregateAt: 2_000,
      },
      {
        eventId: 112,
        gameCharacterId: 20,
        worldBloomChapterType: "game_character",
        chapterNo: 2,
        chapterStartAt: 2_000,
        aggregateAt: 3_000,
      },
    ]

    expect(resolveWorldBloomDefaultGameCharacterId("112", events, worldBlooms, 2_500)).toBe(20)
    expect(resolveWorldBloomDefaultGameCharacterId("112", events, worldBlooms, 6_000)).toBe(18)
  })
})
