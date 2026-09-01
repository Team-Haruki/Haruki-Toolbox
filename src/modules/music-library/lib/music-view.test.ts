import { describe, expect, it } from "bun:test"
import {
  formatMusicDate,
  listMusicDifficultyPills,
  listMusicDifficultyRows,
  resolveMusicEventBoxView,
} from "./music-view"

const entry = {
  difficulties: {
    master: { playLevel: 30, totalNoteCount: 1200 },
    easy: { playLevel: 6, totalNoteCount: 200 },
    append: { playLevel: 32, totalNoteCount: null },
  },
}

describe("difficulty pills", () => {
  it("lists charts in canonical order with their colors", () => {
    expect(listMusicDifficultyPills(entry)).toEqual([
      { difficulty: "easy", color: "#66DD11", playLevel: 6 },
      { difficulty: "master", color: "#BB33EE", playLevel: 30 },
      { difficulty: "append", color: "#FF7ADB", playLevel: 32 },
    ])
    expect(listMusicDifficultyPills({ difficulties: {} })).toEqual([])
  })

  it("adds note counts for the table rows", () => {
    expect(listMusicDifficultyRows(entry).map((row) => row.totalNoteCount)).toEqual([200, 1200, null])
  })
})

describe("formatMusicDate", () => {
  it("formats known timestamps and returns null otherwise", () => {
    const formatter = { format: (date: Date) => date.toISOString().slice(0, 10) }
    expect(formatMusicDate(Date.UTC(2024, 0, 2), formatter)).toBe("2024-01-02")
    expect(formatMusicDate(null, formatter)).toBeNull()
  })
})

describe("resolveMusicEventBoxView", () => {
  const characterMap = new Map([[2, { name: "Saki" }]])

  it("joins the box info with the character name", () => {
    expect(resolveMusicEventBoxView({ eventId: 1, characterId: 2, boxNumber: 3 }, characterMap)).toEqual({
      characterId: 2,
      name: "Saki",
      boxNumber: 3,
    })
  })

  it("returns null without box info or for unknown characters", () => {
    expect(resolveMusicEventBoxView(null, characterMap)).toBeNull()
    expect(resolveMusicEventBoxView(undefined, characterMap)).toBeNull()
    expect(resolveMusicEventBoxView({ eventId: 1, characterId: 9, boxNumber: 1 }, characterMap)).toBeNull()
  })
})
