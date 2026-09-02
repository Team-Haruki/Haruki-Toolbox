import { describe, expect, it } from "bun:test"
import {
  MUSIC_TAG_EVENT_BOX,
  MUSIC_TAG_WORLD_LINK,
  applyMusicTagByIds,
  buildMusicCategoryMap,
  buildMusicDurationMap,
  buildMusicLibraryEntries,
  buildMusicVocalCharacterMap,
  buildMusicVocalsByMusic,
  buildOutsideCharacterNameMap,
  formatMusicDurationLabel,
  normalizeMusicCategories,
} from "./music-data"

const RAW_MUSICS = [
  {
    id: 1,
    seq: 1100101,
    categories: [{ musicCategoryName: "mv" }],
    title: "Tell Your World",
    pronunciation: "てるゆあわーるど",
    lyricist: "kz",
    composer: "kz",
    arranger: "kz",
    assetbundleName: "jacket_s_001",
    publishedAt: 1653026400000,
    releaseConditionId: 5,
  },
  {
    id: 2,
    seq: 1100102,
    categories: ["mv_2d", "image"],
    title: "Bitter Choco Decoration",
    pronunciation: "びたーちょこでこれーしょん",
    lyricist: "syudou",
    composer: "syudou",
    arranger: "syudou",
    assetbundleName: "jacket_s_002",
    publishedAt: 1601028000000,
  },
  { title: "broken record without id" },
]

const RAW_DIFFICULTIES = [
  { id: 1, musicId: 1, musicDifficulty: "easy", playLevel: 5, totalNoteCount: 220 },
  { id: 2, musicId: 1, musicDifficulty: "master", playLevel: 26, totalNoteCount: 886 },
  { id: 3, musicId: 2, musicDifficulty: "append", playLevel: 29, totalNoteCount: 1002 },
  { id: 4, musicId: 2, musicDifficulty: "unknown_difficulty", playLevel: 40, totalNoteCount: 1 },
]

const RAW_TAGS = [
  { musicId: 1, musicTag: "all" },
  { musicId: 1, musicTag: "vocaloid" },
  { musicId: 2, musicTag: "all" },
  { musicId: 2, musicTag: "street" },
  { musicId: 2, musicTag: "street" },
]

describe("buildMusicLibraryEntries", () => {
  it("builds entries with difficulties and tags keyed by music id", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toMatchObject({
      id: 1,
      title: "Tell Your World",
      pronunciation: "てるゆあわーるど",
      lyricist: "kz",
      categories: ["mv"],
      assetbundleName: "jacket_s_001",
      publishedAt: 1653026400000,
      fillerSec: null,
      releaseConditionId: 5,
      tags: ["vocaloid"],
    })
    expect(entries[0].difficulties).toEqual({
      easy: { playLevel: 5, totalNoteCount: 220 },
      master: { playLevel: 26, totalNoteCount: 886 },
    })
    expect(entries[1].categories).toEqual(["mv_2d", "image"])
    expect(entries[1].releaseConditionId).toBeNull()
  })

  it("excludes the catch-all tag, deduplicates tags, and drops unknown difficulties", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    expect(entries[1].tags).toEqual(["street"])
    expect(entries[1].difficulties).toEqual({ append: { playLevel: 29, totalNoteCount: 1002 } })
  })

  it("tolerates malformed payloads", () => {
    expect(buildMusicLibraryEntries(null, "x", 42)).toEqual([])
    expect(buildMusicLibraryEntries([{ id: 3 }], null, null)[0].title).toBe("#3")
  })
})

describe("normalizeMusicCategories", () => {
  it("supports both string and object category shapes", () => {
    expect(normalizeMusicCategories(["mv", "mv"])).toEqual(["mv"])
    expect(normalizeMusicCategories([{ musicCategoryName: "image" }, "original"])).toEqual([
      "image",
      "original",
    ])
    expect(normalizeMusicCategories("not-an-array")).toEqual([])
  })
})

describe("buildMusicVocalsByMusic", () => {
  const rawVocals = [
    {
      id: 3,
      musicId: 1,
      musicVocalType: "sekai",
      seq: 2,
      caption: "セカイver.",
      assetbundleName: "vs_0001_01",
      characters: [
        { id: 5, musicId: 1, musicVocalId: 3, characterType: "game_character", characterId: 1, seq: 10 },
        { id: 6, musicId: 1, musicVocalId: 3, characterType: "outside_character", characterId: 2, seq: 20 },
      ],
    },
    {
      id: 1,
      musicId: 1,
      musicVocalType: "original_song",
      seq: 1,
      caption: "バーチャル・シンガーver.",
      characters: [
        { id: 1, musicId: 1, musicVocalId: 1, characterType: "game_character", characterId: 21, seq: 10 },
      ],
    },
    { id: 2, musicId: 2, musicVocalType: "original_song", seq: 1, caption: "other music", characters: [] },
  ]

  it("groups every version by music id in seq order", () => {
    const byMusic = buildMusicVocalsByMusic(rawVocals)
    expect([...byMusic.keys()]).toEqual([1, 2])
    expect(byMusic.get(1)?.map((vocal) => vocal.id)).toEqual([1, 3])
    expect(byMusic.get(1)?.[0].musicVocalType).toBe("original_song")
    expect(byMusic.get(1)?.[1]).toMatchObject({
      assetbundleName: "vs_0001_01",
      characters: [
        { characterType: "game_character", characterId: 1 },
        { characterType: "outside_character", characterId: 2 },
      ],
    })
    expect(byMusic.get(2)?.[0].caption).toBe("other music")
  })

  it("tolerates malformed payloads", () => {
    expect(buildMusicVocalsByMusic([{ id: 9 }, null, "x"]).size).toBe(0)
    expect(buildMusicVocalsByMusic(undefined).size).toBe(0)
  })
})

describe("synthetic tags", () => {
  it("appends a synthetic tag without duplicating it or mutating untagged entries", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    const tagged = applyMusicTagByIds(entries, new Set([2]), MUSIC_TAG_WORLD_LINK)
    expect(tagged[0].tags).toEqual(["vocaloid"])
    expect(tagged[0]).toBe(entries[0])
    expect(tagged[1].tags).toEqual(["street", MUSIC_TAG_WORLD_LINK])
    expect(entries[1].tags).toEqual(["street"])

    const retagged = applyMusicTagByIds(tagged, new Set([2]), MUSIC_TAG_WORLD_LINK)
    expect(retagged[1].tags).toEqual(["street", MUSIC_TAG_WORLD_LINK])
  })

  it("accepts a map keyed by music id, matching the event box map shape", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    const boxMap = new Map([[1, { eventId: 3, characterId: 5, boxNumber: 1 }]])
    const tagged = applyMusicTagByIds(entries, boxMap, MUSIC_TAG_EVENT_BOX)
    expect(tagged[0].tags).toEqual(["vocaloid", MUSIC_TAG_EVENT_BOX])
    expect(tagged[1].tags).toEqual(["street"])
  })
})

describe("buildMusicVocalCharacterMap", () => {
  const rawVocals = [
    {
      id: 1,
      musicId: 1,
      musicVocalType: "sekai",
      characters: [
        { characterType: "game_character", characterId: 1 },
        { characterType: "game_character", characterId: 2 },
        { characterType: "outside_character", characterId: 3 },
      ],
    },
    {
      id: 2,
      musicId: 1,
      musicVocalType: "another_vocal",
      characters: [{ characterType: "game_character", characterId: 9 }],
    },
    {
      id: 3,
      musicId: 2,
      musicVocalType: "virtual_singer",
      characters: [{ characterType: "game_character", characterId: 21 }],
    },
  ]

  it("splits singers into vocal and another vocal sets, ignoring outside characters", () => {
    const map = buildMusicVocalCharacterMap(rawVocals)
    expect([...map.get(1)!.vocalCharacterIds].sort((a, b) => a - b)).toEqual([1, 2])
    expect([...map.get(1)!.anotherVocalCharacterIds]).toEqual([9])
    expect([...map.get(2)!.vocalCharacterIds]).toEqual([21])
    expect(map.get(2)!.anotherVocalCharacterIds.size).toBe(0)
  })

  it("tolerates malformed payloads", () => {
    expect(buildMusicVocalCharacterMap(null).size).toBe(0)
    expect(buildMusicVocalCharacterMap([{ musicId: 1 }]).size).toBe(0)
  })
})

describe("buildOutsideCharacterNameMap", () => {
  it("maps ids to names and skips malformed rows", () => {
    const map = buildOutsideCharacterNameMap([
      { id: 1, name: "GUMI" },
      { id: 2, name: "IA" },
      { id: null, name: "broken" },
      { id: 3 },
    ])
    expect(map.get(1)).toBe("GUMI")
    expect(map.get(2)).toBe("IA")
    expect(map.size).toBe(2)
  })
})

describe("buildMusicDurationMap", () => {
  const rawMetas = [
    { music_id: 1, difficulty: "easy", music_time: 123.2 },
    { music_id: 1, difficulty: "master", music_time: 123.2 },
    { music_id: 2, difficulty: "easy", music_time: 95.5 },
  ]

  it("builds a duration map keyed by music id, skipping non-positive times", () => {
    const map = buildMusicDurationMap([...rawMetas, { music_id: 3, music_time: 0 }, { music_id: "x" }])
    expect([...map.entries()]).toEqual([[1, 123.2], [2, 95.5]])
    expect(buildMusicDurationMap(null).size).toBe(0)
  })
})

describe("formatMusicDurationLabel", () => {
  it("formats seconds as m:ss", () => {
    expect(formatMusicDurationLabel(123.2)).toBe("2:03")
    expect(formatMusicDurationLabel(60)).toBe("1:00")
    expect(formatMusicDurationLabel(59.6)).toBe("1:00")
    expect(formatMusicDurationLabel(9)).toBe("0:09")
  })

  it("returns null for invalid values", () => {
    expect(formatMusicDurationLabel(null)).toBeNull()
    expect(formatMusicDurationLabel(0)).toBeNull()
    expect(formatMusicDurationLabel(-5)).toBeNull()
  })
})

describe("buildMusicCategoryMap", () => {
  it("groups the standalone table by music id and de-duplicates", () => {
    const map = buildMusicCategoryMap([
      { id: 1, musicId: 1, musicCategoryName: "mv" },
      { id: 2, musicId: 1, musicCategoryName: "mv_2d" },
      { id: 3, musicId: 1, musicCategoryName: "mv" },
      { id: 4, musicId: 2, musicCategoryName: "original" },
      { id: 5, musicCategoryName: "orphan" },
      { id: 6, musicId: 3, musicCategoryName: "  " },
    ])
    expect(map.get(1)).toEqual(["mv", "mv_2d"])
    expect(map.get(2)).toEqual(["original"])
    expect(map.has(3)).toBe(false)
    expect(buildMusicCategoryMap(undefined).size).toBe(0)
  })
})

describe("music categories across the 6.8.1 split", () => {
  const musics = [
    { id: 1, title: "Split", publishedAt: 1 },
    { id: 2, title: "Inline", categories: ["image"], publishedAt: 1 },
    { id: 3, title: "Neither", publishedAt: 1 },
  ]

  it("takes categories from the standalone table when a region ships one", () => {
    // jp: `musics.categories` is gone, `musicCategories.json` carries them.
    const entries = buildMusicLibraryEntries(musics, [], [], [
      { id: 1, musicId: 1, musicCategoryName: "mv" },
      { id: 2, musicId: 1, musicCategoryName: "mv_2d" },
    ])
    expect(entries.find((entry) => entry.id === 1)?.categories).toEqual(["mv", "mv_2d"])
  })

  it("still reads the inline field on regions that have not migrated", () => {
    const entries = buildMusicLibraryEntries(musics, [], [], undefined)
    expect(entries.find((entry) => entry.id === 2)?.categories).toEqual(["image"])
    expect(entries.find((entry) => entry.id === 1)?.categories).toEqual([])
  })

  it("prefers the table but leaves untouched songs on their inline value", () => {
    const entries = buildMusicLibraryEntries(musics, [], [], [
      { id: 1, musicId: 1, musicCategoryName: "mv" },
    ])
    expect(entries.find((entry) => entry.id === 1)?.categories).toEqual(["mv"])
    expect(entries.find((entry) => entry.id === 2)?.categories).toEqual(["image"])
    expect(entries.find((entry) => entry.id === 3)?.categories).toEqual([])
  })
})
