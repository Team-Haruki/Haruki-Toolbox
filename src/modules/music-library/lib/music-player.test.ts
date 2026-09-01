import { describe, expect, it } from "bun:test"
import type { MusicVocalEntry } from "./music-data"
import {
  formatBpmLabel,
  formatPlayerClock,
  resolveFillerSeconds,
  resolvePreferredChartVocal,
  toDisplayDuration,
  toDisplayTime,
  toMediaTime,
} from "./music-player"

function makeVocal(id: number, musicVocalType: string, assetbundleName: string): MusicVocalEntry {
  return { id, musicVocalType, caption: "", seq: id, assetbundleName, characters: [] }
}

describe("player clocks", () => {
  it("formats m:ss and clamps invalid input", () => {
    expect(formatPlayerClock(0)).toBe("0:00")
    expect(formatPlayerClock(65.9)).toBe("1:05")
    expect(formatPlayerClock(-4)).toBe("0:00")
    expect(formatPlayerClock(Number.NaN)).toBe("0:00")
  })

  it("hides the filler from the displayed position and total", () => {
    expect(resolveFillerSeconds(9.5)).toBe(9.5)
    expect(resolveFillerSeconds(null)).toBe(0)
    expect(resolveFillerSeconds(-2)).toBe(0)
    expect(toDisplayTime(12, 9.5)).toBe(2.5)
    expect(toDisplayTime(3, 9.5)).toBe(0)
    expect(toDisplayDuration(130, 9.5)).toBe(120.5)
    expect(toDisplayDuration(null, 9.5)).toBeNull()
    expect(toDisplayDuration(0, 1)).toBeNull()
  })

  it("maps a user position back onto media time within bounds", () => {
    expect(toMediaTime(10, 9.5, 130)).toBe(19.5)
    expect(toMediaTime(-5, 9.5, 130)).toBe(9.5)
    expect(toMediaTime(500, 9.5, 130)).toBe(130)
    expect(toMediaTime(10, 0, null)).toBe(10)
  })
})

describe("resolvePreferredChartVocal", () => {
  it("prefers the SEKAI version, then any version with audio", () => {
    const sekai = makeVocal(2, "sekai", "0001_02")
    const original = makeVocal(1, "original_song", "0001_01")
    expect(resolvePreferredChartVocal([original, sekai])).toBe(sekai)
    expect(resolvePreferredChartVocal([original, makeVocal(3, "sekai", "")])).toBe(original)
    expect(resolvePreferredChartVocal([makeVocal(3, "sekai", "")])).toBeNull()
    expect(resolvePreferredChartVocal([])).toBeNull()
  })
})

describe("formatBpmLabel", () => {
  it("shows the main BPM and the tempo sequence when it changes", () => {
    expect(formatBpmLabel(null)).toBeNull()
    expect(formatBpmLabel({ mainBpm: 150, events: [{ bar: 0, bpm: 150, duration: 1 }], barCount: 1, duration: 1 })).toBe("150")
    expect(formatBpmLabel({
      mainBpm: 150,
      events: [
        { bar: 0, bpm: 120, duration: 1 },
        { bar: 1, bpm: 150, duration: 2 },
      ],
      barCount: 2,
      duration: 3,
    })).toBe("150 (120 → 150)")
  })
})
