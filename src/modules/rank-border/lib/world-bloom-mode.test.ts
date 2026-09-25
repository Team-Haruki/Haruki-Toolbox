import { describe, expect, it } from "bun:test"
import { hasWorldBloomChapters, resolveWorldBloomModeSelection } from "./world-bloom-mode"

const NOW = 1_000_000
const chapters = [
  { value: "21", chapterStartAt: NOW - 3000 },
  { value: "22", chapterStartAt: NOW - 1000, active: true },
]

describe("world bloom mode selection", () => {
  it("leaves the selection alone until the event is known", () => {
    const selection = { mode: "world_bloom" as const, worldBloomCharacterId: "5" }
    expect(resolveWorldBloomModeSelection(selection, null, [], NOW)).toEqual(selection)
  })

  it("falls back to total for events without chapters", () => {
    expect(resolveWorldBloomModeSelection(
      { mode: "world_bloom", worldBloomCharacterId: "21" },
      { isWorldBloom: false },
      [],
      NOW,
    )).toEqual({ mode: "normal", worldBloomCharacterId: null })
    expect(resolveWorldBloomModeSelection(
      { mode: "world_bloom", worldBloomCharacterId: "21" },
      { isWorldBloom: true },
      [],
      NOW,
    )).toEqual({ mode: "normal", worldBloomCharacterId: null })
  })

  it("replaces a chapter that does not belong to the event with the running chapter", () => {
    expect(resolveWorldBloomModeSelection(
      { mode: "world_bloom", worldBloomCharacterId: "3" },
      { isWorldBloom: true },
      chapters,
      NOW,
    )).toEqual({ mode: "world_bloom", worldBloomCharacterId: "22" })
    expect(resolveWorldBloomModeSelection(
      { mode: "world_bloom", worldBloomCharacterId: null },
      { isWorldBloom: true },
      [{ value: "21", chapterStartAt: NOW - 3000 }, { value: "23", chapterStartAt: NOW - 10 }],
      NOW,
    )).toEqual({ mode: "world_bloom", worldBloomCharacterId: "23" })
  })

  it("keeps a valid chapter and total mode on World Link events", () => {
    const chapter = { mode: "world_bloom" as const, worldBloomCharacterId: "21" }
    expect(resolveWorldBloomModeSelection(chapter, { isWorldBloom: true }, chapters, NOW)).toEqual(chapter)
    const total = { mode: "normal" as const, worldBloomCharacterId: "21" }
    expect(resolveWorldBloomModeSelection(total, { isWorldBloom: true }, chapters, NOW)).toEqual(total)
  })

  it("only reports chapters for World Link events that have them", () => {
    expect(hasWorldBloomChapters(null, chapters)).toBe(false)
    expect(hasWorldBloomChapters({ isWorldBloom: false }, chapters)).toBe(false)
    expect(hasWorldBloomChapters({ isWorldBloom: true }, [])).toBe(false)
    expect(hasWorldBloomChapters({ isWorldBloom: true }, chapters)).toBe(true)
  })
})
