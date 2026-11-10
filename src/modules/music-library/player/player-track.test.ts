import { describe, expect, it } from "bun:test"
import type { MusicVocalEntry } from "@/modules/music-library/lib/music-data"
import {
  buildPlayerTrack,
  clampVolume,
  crossfadeGains,
  describeSingers,
  findPlayerVocal,
  isSameTrack,
  pickPreferredVocal,
  resolveSwitchResync,
  resolveVocalBadge,
  resolveVocalUnit,
  type BuildPlayerTrackInput,
} from "./player-track"

function vocal(id: number, overrides: Partial<MusicVocalEntry> = {}): MusicVocalEntry {
  return {
    id,
    musicVocalType: "sekai",
    caption: `ver ${id}`,
    seq: id,
    assetbundleName: `vs_${id}`,
    characters: [{ characterType: "game_character", characterId: 21 }],
    ...overrides,
  }
}

function input(overrides: Partial<BuildPlayerTrackInput> = {}): BuildPlayerTrackInput {
  return {
    region: "jp",
    musicId: 761,
    title: "Song",
    jacketUrl: "https://assets.test/jacket.png",
    fillerSec: 9,
    vocals: [vocal(1), vocal(2, { assetbundleName: "" })],
    resolveUrl: (entry) => (entry.assetbundleName ? `https://assets.test/${entry.assetbundleName}.mp3` : null),
    typeLabel: (entry) => entry.musicVocalType.toUpperCase(),
    singerName: (character) => `#${character.characterId}`,
    ...overrides,
  }
}

describe("buildPlayerTrack", () => {
  it("keeps only the versions that have audio, with their labels resolved", () => {
    const track = buildPlayerTrack(input())
    expect(track).toEqual({
      region: "jp",
      musicId: 761,
      title: "Song",
      jacketUrl: "https://assets.test/jacket.png",
      fillerSec: 9,
      vocals: [{
        id: 1,
        type: "sekai",
        unit: null,
        typeLabel: "SEKAI",
        caption: "ver 1",
        singers: [{ characterId: 21, name: "#21" }],
        url: "https://assets.test/vs_1.mp3",
      }],
    })
  })

  it("has no avatar id for outside singers and treats a missing filler as none", () => {
    const track = buildPlayerTrack(input({
      fillerSec: null,
      vocals: [vocal(1, { characters: [{ characterType: "outside_character", characterId: 7 }] })],
    }))
    expect(track?.fillerSec).toBe(0)
    expect(track?.vocals[0].singers).toEqual([{ characterId: null, name: "#7" }])
  })

  it("is null when nothing is playable", () => {
    expect(buildPlayerTrack(input({ vocals: [vocal(2, { assetbundleName: "" })] }))).toBeNull()
    expect(buildPlayerTrack(input({ vocals: [] }))).toBeNull()
  })
})

describe("player track helpers", () => {
  const track = buildPlayerTrack(input())

  it("compares tracks by song and server", () => {
    expect(isSameTrack(track, buildPlayerTrack(input({ title: "Renamed" })))).toBe(true)
    expect(isSameTrack(track, buildPlayerTrack(input({ region: "en" })))).toBe(false)
    expect(isSameTrack(track, buildPlayerTrack(input({ musicId: 1 })))).toBe(false)
    expect(isSameTrack(track, null)).toBe(false)
    expect(isSameTrack(null, null)).toBe(false)
  })

  it("finds a vocal by id and describes its singers", () => {
    expect(findPlayerVocal(track, 1)?.caption).toBe("ver 1")
    expect(findPlayerVocal(track, 99)).toBeNull()
    expect(findPlayerVocal(track, null)).toBeNull()
    expect(findPlayerVocal(null, 1)).toBeNull()
    expect(describeSingers(findPlayerVocal(track, 1))).toBe("#21")
    expect(describeSingers({ id: 1, type: "sekai", unit: null, typeLabel: "", caption: "", url: "", singers: [{ characterId: 1, name: "A" }, { characterId: null, name: "" }, { characterId: 2, name: "B" }] }, "、")).toBe("A、B")
    expect(describeSingers(null)).toBe("")
  })
})

describe("pickPreferredVocal", () => {
  const withTypes = (...types: string[]) => buildPlayerTrack(input({
    vocals: types.map((type, index) => vocal(index + 1, { musicVocalType: type })),
  }))!

  it("starts with the SEKAI version by default, and the original song when asked", () => {
    const track = withTypes("original_song", "sekai", "another_vocal")
    expect(pickPreferredVocal(track, "sekai").type).toBe("sekai")
    expect(pickPreferredVocal(track, "original").type).toBe("original_song")
    expect(pickPreferredVocal(track, "nonsense").type).toBe("sekai")
  })

  it("takes the virtual singer version when there is no original song", () => {
    expect(pickPreferredVocal(withTypes("sekai", "virtual_singer"), "original").type).toBe("virtual_singer")
  })

  it("falls back to the first version when the song has neither", () => {
    expect(pickPreferredVocal(withTypes("another_vocal", "april_fool_2022"), "sekai").id).toBe(1)
    expect(pickPreferredVocal(withTypes("virtual_singer", "another_vocal"), "sekai").id).toBe(1)
    expect(pickPreferredVocal(withTypes("sekai"), "original").id).toBe(1)
  })
})

describe("resolveVocalUnit", () => {
  it("takes the unit most singers belong to, with virtual singers only as a last resort", () => {
    expect(resolveVocalUnit(["school_refusal", "school_refusal", "piapro", null])).toBe("school_refusal")
    expect(resolveVocalUnit(["piapro", "piapro", "idol"])).toBe("idol")
    expect(resolveVocalUnit(["piapro"])).toBe("piapro")
    expect(resolveVocalUnit([null, null])).toBeNull()
    expect(resolveVocalUnit([])).toBeNull()
  })

  it("is carried on the track's vocals", () => {
    const track = buildPlayerTrack(input({ singerUnit: () => "street" }))
    expect(track?.vocals[0].unit).toBe("street")
  })
})

describe("resolveVocalBadge", () => {
  const withAvatar = [{ characterId: 21, name: "A" }]
  const outsideOnly = [{ characterId: null, name: "B" }]

  it("gives a SEKAI version its unit's emblem, or its singers when the unit is unknown", () => {
    expect(resolveVocalBadge({ type: "sekai", unit: "idol", singers: withAvatar })).toEqual({ kind: "unit", unit: "idol" })
    expect(resolveVocalBadge({ type: "sekai", unit: null, singers: withAvatar })).toEqual({ kind: "singers" })
    expect(resolveVocalBadge({ type: "sekai", unit: null, singers: outsideOnly })).toEqual({ kind: "icon", icon: "vocal" })
  })

  it("shows who sings an Another Vocal", () => {
    expect(resolveVocalBadge({ type: "another_vocal", unit: "idol", singers: withAvatar })).toEqual({ kind: "singers" })
    expect(resolveVocalBadge({ type: "another_vocal", unit: null, singers: [] })).toEqual({ kind: "icon", icon: "vocal" })
  })

  it("marks the other kinds on their own", () => {
    expect(resolveVocalBadge({ type: "virtual_singer", unit: null, singers: withAvatar })).toEqual({ kind: "unit", unit: "piapro" })
    expect(resolveVocalBadge({ type: "original_song", unit: "piapro", singers: withAvatar })).toEqual({ kind: "icon", icon: "original" })
    expect(resolveVocalBadge({ type: "instrumental", unit: null, singers: [] })).toEqual({ kind: "icon", icon: "instrumental" })
    expect(resolveVocalBadge({ type: "april_fool_2022", unit: null, singers: withAvatar })).toEqual({ kind: "singers" })
  })
})

describe("crossfadeGains", () => {
  it("fades with equal power: full to silent, level in the middle", () => {
    expect(crossfadeGains(0)).toEqual({ out: 1, in: 0 })
    const end = crossfadeGains(1)
    expect(end.out).toBeCloseTo(0, 10)
    expect(end.in).toBeCloseTo(1, 10)
    const middle = crossfadeGains(0.5)
    expect(middle.out ** 2 + middle.in ** 2).toBeCloseTo(1, 10)
  })

  it("clamps out-of-range and invalid progress", () => {
    expect(crossfadeGains(-1)).toEqual({ out: 1, in: 0 })
    expect(crossfadeGains(5).in).toBeCloseTo(1, 10)
    expect(crossfadeGains(Number.NaN).in).toBeCloseTo(1, 10)
  })
})

describe("resolveSwitchResync", () => {
  it("re-seeks only when the two versions drifted apart", () => {
    expect(resolveSwitchResync(30, 30.01)).toBeNull()
    expect(resolveSwitchResync(30, 29.9)).toBe(30)
    expect(resolveSwitchResync(30, 30.2)).toBe(30)
    expect(resolveSwitchResync(Number.NaN, 30)).toBeNull()
    expect(resolveSwitchResync(30, Number.NaN)).toBeNull()
  })
})

describe("clampVolume", () => {
  it("keeps the volume within 0..1 and falls back on junk", () => {
    expect(clampVolume(0.4)).toBe(0.4)
    expect(clampVolume(2)).toBe(1)
    expect(clampVolume(-1)).toBe(0)
    expect(clampVolume("0.5")).toBe(1)
    expect(clampVolume(Number.NaN, 0.8)).toBe(0.8)
  })
})
