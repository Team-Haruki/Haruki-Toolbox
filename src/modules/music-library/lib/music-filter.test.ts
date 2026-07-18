import { describe, expect, it } from "bun:test"
import type { MusicLibraryEntry } from "./music-data"
import {
  createDefaultMusicLibraryFilter,
  filterMusicEntries,
  getMusicPublishedYear,
  listMusicTagOptions,
  listMusicYearOptions,
  matchesMusicSearch,
  sortMusicEntries,
} from "./music-filter"

function makeEntry(overrides: Partial<MusicLibraryEntry>): MusicLibraryEntry {
  return {
    id: 1,
    title: "Untitled",
    pronunciation: "",
    lyricist: "",
    composer: "",
    arranger: "",
    categories: [],
    assetbundleName: "",
    publishedAt: null,
    tags: [],
    difficulties: {},
    ...overrides,
  }
}

const ENTRIES: MusicLibraryEntry[] = [
  makeEntry({
    id: 1,
    title: "Tell Your World",
    pronunciation: "てるゆあわーるど",
    publishedAt: Date.UTC(2020, 8, 30),
    tags: ["vocaloid"],
    difficulties: {
      easy: { playLevel: 5, totalNoteCount: 220 },
      master: { playLevel: 26, totalNoteCount: 886 },
    },
  }),
  makeEntry({
    id: 2,
    title: "Bitter Choco Decoration",
    publishedAt: Date.UTC(2021, 3, 10),
    tags: ["street"],
    difficulties: {
      master: { playLevel: 30, totalNoteCount: 1200 },
      append: { playLevel: 29, totalNoteCount: 1002 },
    },
  }),
  makeEntry({
    id: 3,
    title: "aNother oNe",
    publishedAt: Date.UTC(2021, 10, 5),
    tags: ["street", "vocaloid"],
    difficulties: {
      easy: { playLevel: 7, totalNoteCount: 300 },
    },
  }),
]

describe("matchesMusicSearch", () => {
  it("matches title case-insensitively and matches pronunciation", () => {
    expect(matchesMusicSearch(ENTRIES[0], "tell your")).toBe(true)
    expect(matchesMusicSearch(ENTRIES[0], "てるゆあ")).toBe(true)
    expect(matchesMusicSearch(ENTRIES[0], "  ")).toBe(true)
    expect(matchesMusicSearch(ENTRIES[0], "missing")).toBe(false)
  })
})

describe("filterMusicEntries", () => {
  it("returns everything with the default filter", () => {
    expect(filterMusicEntries(ENTRIES, createDefaultMusicLibraryFilter())).toHaveLength(3)
  })

  it("filters by tag", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), tag: "street" }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([2, 3])
  })

  it("filters by published year", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), year: 2021 }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([2, 3])
  })

  it("filters by level range on the selected difficulty", () => {
    const filter = {
      ...createDefaultMusicLibraryFilter(),
      difficulty: "master" as const,
      levelMin: 27,
      levelMax: null,
    }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([2])
  })

  it("requires the selected difficulty to exist", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), difficulty: "append" as const }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([2])
  })

  it("filters by level range across all difficulties when none is selected", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), levelMin: 6, levelMax: 8 }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([3])
  })

  it("filters by exact note count", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), noteCountExact: 1002 }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([2])
  })

  it("ignores exact note count when a difficulty without it is selected", () => {
    const filter = {
      ...createDefaultMusicLibraryFilter(),
      difficulty: "master" as const,
      noteCountExact: 1002,
    }
    expect(filterMusicEntries(ENTRIES, filter)).toEqual([])
  })

  it("filters by note count range", () => {
    const filter = {
      ...createDefaultMusicLibraryFilter(),
      noteCountMode: "range" as const,
      noteCountMin: 250,
      noteCountMax: 900,
    }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([1, 3])
  })

  it("combines search with other filters", () => {
    const filter = { ...createDefaultMusicLibraryFilter(), search: "another", tag: "street" }
    expect(filterMusicEntries(ENTRIES, filter).map((entry) => entry.id)).toEqual([3])
  })
})

describe("sortMusicEntries", () => {
  it("sorts by published time in both directions", () => {
    expect(sortMusicEntries(ENTRIES, "publishedAt", "asc", null).map((entry) => entry.id)).toEqual([1, 2, 3])
    expect(sortMusicEntries(ENTRIES, "publishedAt", "desc", null).map((entry) => entry.id)).toEqual([3, 2, 1])
  })

  it("sorts by level of the selected difficulty, keeping missing values last", () => {
    expect(sortMusicEntries(ENTRIES, "level", "asc", "master").map((entry) => entry.id)).toEqual([1, 2, 3])
    expect(sortMusicEntries(ENTRIES, "level", "desc", "master").map((entry) => entry.id)).toEqual([2, 1, 3])
  })

  it("falls back to master difficulty when none is selected", () => {
    expect(sortMusicEntries(ENTRIES, "noteCount", "asc", null).map((entry) => entry.id)).toEqual([1, 2, 3])
  })

  it("sorts by title", () => {
    const ids = sortMusicEntries(ENTRIES, "title", "asc", null).map((entry) => entry.id)
    expect(ids).toEqual([3, 2, 1])
  })

  it("does not mutate the input", () => {
    const input = [...ENTRIES]
    sortMusicEntries(input, "publishedAt", "desc", null)
    expect(input.map((entry) => entry.id)).toEqual([1, 2, 3])
  })
})

describe("option helpers", () => {
  it("lists sorted unique tags", () => {
    expect(listMusicTagOptions(ENTRIES)).toEqual(["street", "vocaloid"])
  })

  it("lists years in descending order", () => {
    expect(listMusicYearOptions(ENTRIES)).toEqual([2021, 2020])
  })

  it("resolves published year in UTC", () => {
    expect(getMusicPublishedYear(Date.UTC(2022, 0, 1))).toBe(2022)
    expect(getMusicPublishedYear(null)).toBeNull()
  })
})
