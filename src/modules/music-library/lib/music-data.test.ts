import { describe, expect, it } from "bun:test"
import {
  buildMusicLibraryEntries,
  buildOutsideCharacterNameMap,
  findMusicDurationSeconds,
  findMusicLibraryEntry,
  formatMusicDurationLabel,
  listMusicEventLinks,
  listMusicVocalEntries,
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

    const first = entries[0]
    expect(first.id).toBe(1)
    expect(first.title).toBe("Tell Your World")
    expect(first.composer).toBe("kz")
    expect(first.assetbundleName).toBe("jacket_s_001")
    expect(first.publishedAt).toBe(1653026400000)
    expect(first.categories).toEqual(["mv"])
    expect(first.tags).toEqual(["vocaloid"])
    expect(first.difficulties.easy).toEqual({ playLevel: 5, totalNoteCount: 220 })
    expect(first.difficulties.master).toEqual({ playLevel: 26, totalNoteCount: 886 })
    expect(first.difficulties.append).toBeUndefined()
  })

  it("excludes the catch-all tag, deduplicates tags, and drops unknown difficulties", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    const second = entries[1]
    expect(second.tags).toEqual(["street"])
    expect(Object.keys(second.difficulties)).toEqual(["append"])
  })

  it("tolerates malformed payloads", () => {
    expect(buildMusicLibraryEntries(null, undefined, "oops")).toEqual([])
  })
})

describe("findMusicLibraryEntry", () => {
  it("finds an entry by id and returns null for missing ids", () => {
    const entries = buildMusicLibraryEntries(RAW_MUSICS, RAW_DIFFICULTIES, RAW_TAGS)
    expect(findMusicLibraryEntry(entries, 2)?.title).toBe("Bitter Choco Decoration")
    expect(findMusicLibraryEntry(entries, 999)).toBeNull()
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

describe("listMusicVocalEntries", () => {
  const rawVocals = [
    {
      id: 3,
      musicId: 1,
      musicVocalType: "sekai",
      seq: 2,
      caption: "セカイver.",
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

  it("filters by music id and sorts by seq", () => {
    const vocals = listMusicVocalEntries(rawVocals, 1)
    expect(vocals.map((vocal) => vocal.id)).toEqual([1, 3])
    expect(vocals[0].musicVocalType).toBe("original_song")
    expect(vocals[1].characters).toEqual([
      { characterType: "game_character", characterId: 1 },
      { characterType: "outside_character", characterId: 2 },
    ])
  })

  it("returns an empty list for unknown music ids", () => {
    expect(listMusicVocalEntries(rawVocals, 42)).toEqual([])
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

describe("listMusicEventLinks", () => {
  const rawEventMusics = [
    { eventId: 1, musicId: 64, releaseConditionId: 1, seq: 1 },
    { eventId: 2, musicId: 62, releaseConditionId: 1, seq: 1 },
    { eventId: 3, musicId: 64, releaseConditionId: 1, seq: 1 },
  ]
  const rawEvents = [
    { id: 1, eventType: "marathon", name: "Event One", startAt: 1653112800000, aggregateAt: 1653652799000 },
    { id: 2, eventType: "marathon", name: "Event Two", startAt: 1654000000000, aggregateAt: 1654500000000 },
    { id: 3, eventType: "cheerful_carnival", name: "Event Three", startAt: 1655000000000, aggregateAt: 1655500000000 },
  ]

  it("collects all events linked to a music", () => {
    const links = listMusicEventLinks(rawEventMusics, rawEvents, 64)
    expect(links).toEqual([
      { eventId: 1, name: "Event One", startAt: 1653112800000, aggregateAt: 1653652799000 },
      { eventId: 3, name: "Event Three", startAt: 1655000000000, aggregateAt: 1655500000000 },
    ])
  })

  it("returns an empty list when the music has no linked events", () => {
    expect(listMusicEventLinks(rawEventMusics, rawEvents, 1)).toEqual([])
  })
})

describe("findMusicDurationSeconds", () => {
  const rawMetas = [
    { music_id: 1, difficulty: "easy", music_time: 123.2 },
    { music_id: 1, difficulty: "master", music_time: 123.2 },
    { music_id: 2, difficulty: "easy", music_time: 95.5 },
  ]

  it("finds the duration for a music id", () => {
    expect(findMusicDurationSeconds(rawMetas, 1)).toBe(123.2)
    expect(findMusicDurationSeconds(rawMetas, 2)).toBe(95.5)
  })

  it("returns null when metas are missing", () => {
    expect(findMusicDurationSeconds(rawMetas, 3)).toBeNull()
    expect(findMusicDurationSeconds(null, 1)).toBeNull()
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
