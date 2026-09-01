import { describe, expect, it } from "bun:test"
import {
  buildMusicActiveChips,
  createDefaultMusicQueryState,
  formatQueryRange,
  musicQueryCodec,
  parseMusicNoteCountQuery,
  removeMusicChip,
  resolveMusicSortKey,
  serializeMusicNoteCountQuery,
  toMusicLibraryFilter,
  type MusicChipContext,
  type MusicQueryState,
} from "./music-query"

const t = (key: string, params?: Record<string, unknown>) =>
  `${key}${params ? `:${Object.values(params).join("|")}` : ""}`

const chipContext: MusicChipContext = {
  difficultyLabel: (difficulty) => difficulty.toUpperCase(),
  tagLabel: (tag) => `tag-${tag}`,
  categoryLabel: (category) => `cat-${category}`,
  characterName: (id) => (id === 1 ? "Ichika" : null),
  scopeLabel: (scope) => `scope-${scope}`,
  hasCategories: true,
}

function fullState(): MusicQueryState {
  return {
    q: "tell",
    diff: "master",
    lvmin: 26,
    lvmax: 32,
    notes: { mode: "range", exact: null, min: 800, max: 1200 },
    tags: ["vocaloid", "event_box"],
    mv: ["mv", "image"],
    year: 2021,
    char: 1,
    scope: "box",
    append: true,
    sort: "level",
    dir: "asc",
    page: 3,
    size: 120,
  }
}

describe("musicQueryCodec", () => {
  it("round-trips a fully populated state", () => {
    const state = fullState()
    const record = musicQueryCodec.serialize(state)
    expect(record).toEqual({
      q: "tell",
      diff: "master",
      lvmin: "26",
      lvmax: "32",
      notes: "800-1200",
      tags: "vocaloid,event_box",
      mv: "mv,image",
      year: "2021",
      char: "1",
      scope: "box",
      append: "1",
      sort: "level",
      dir: "asc",
      page: "3",
      size: "120",
    })
    expect(musicQueryCodec.parse(record as Record<string, string>)).toEqual(state)
  })

  it("omits every default from the URL", () => {
    const record = musicQueryCodec.serialize(createDefaultMusicQueryState())
    expect(Object.values(record).every((value) => value === undefined)).toBe(true)
    expect(musicQueryCodec.parse({})).toEqual(createDefaultMusicQueryState())
  })

  it("tolerates garbage values", () => {
    const parsed = musicQueryCodec.parse({
      q: "  ",
      diff: "ultra",
      lvmin: "abc",
      lvmax: "500",
      notes: "x-y",
      tags: "vocaloid,bogus,,vocaloid",
      mv: "mv,mv_9d",
      year: "1999",
      char: "-3",
      scope: "box",
      append: "yes",
      sort: "weird",
      dir: "sideways",
      page: "0",
      size: "7",
    })
    expect(parsed).toEqual({
      ...createDefaultMusicQueryState(),
      tags: ["vocaloid"],
      mv: ["mv"],
    })
  })

  it("orders a reversed level range and ignores scope without a character", () => {
    const parsed = musicQueryCodec.parse({ lvmin: "30", lvmax: "20", scope: "vocal" })
    expect(parsed.lvmin).toBe(20)
    expect(parsed.lvmax).toBe(30)
    expect(parsed.scope).toBe("any")
    expect(musicQueryCodec.serialize({ ...createDefaultMusicQueryState(), scope: "vocal" }).scope).toBeUndefined()
  })

  it("keeps the page-neutral keys out of the filter keys", () => {
    expect(musicQueryCodec.filterKeys).not.toContain("sort")
    expect(musicQueryCodec.filterKeys).not.toContain("dir")
    expect(musicQueryCodec.filterKeys).not.toContain("page")
    expect(musicQueryCodec.filterKeys).not.toContain("size")
    expect(musicQueryCodec.filterKeys).toContain("notes")
  })
})

describe("note count query", () => {
  it("parses exact and range forms", () => {
    expect(parseMusicNoteCountQuery("886")).toEqual({ mode: "exact", exact: 886, min: null, max: null })
    expect(parseMusicNoteCountQuery("800-900")).toEqual({ mode: "range", exact: null, min: 800, max: 900 })
    expect(parseMusicNoteCountQuery("800-")).toEqual({ mode: "range", exact: null, min: 800, max: null })
    expect(parseMusicNoteCountQuery("-900")).toEqual({ mode: "range", exact: null, min: null, max: 900 })
  })

  it("falls back to the default on garbage", () => {
    for (const raw of [null, "", "-", "a-b", "1-2-3", "0"]) {
      expect(parseMusicNoteCountQuery(raw)).toEqual({ mode: "exact", exact: null, min: null, max: null })
    }
  })

  it("serializes only when a bound is set", () => {
    expect(serializeMusicNoteCountQuery({ mode: "exact", exact: null, min: null, max: null })).toBeUndefined()
    expect(serializeMusicNoteCountQuery({ mode: "range", exact: null, min: null, max: null })).toBeUndefined()
    expect(serializeMusicNoteCountQuery({ mode: "range", exact: null, min: null, max: 900 })).toBe("-900")
    expect(serializeMusicNoteCountQuery({ mode: "exact", exact: 886, min: 1, max: 2 })).toBe("886")
  })
})

describe("toMusicLibraryFilter", () => {
  it("maps the query state onto the shared filter", () => {
    const filter = toMusicLibraryFilter(fullState(), { hasCategories: true })
    expect(filter.search).toBe("tell")
    expect(filter.difficulty).toBe("master")
    expect(filter.levelMin).toBe(26)
    expect(filter.noteCountMode).toBe("range")
    expect(filter.noteCountMin).toBe(800)
    expect(filter.noteCountExact).toBeNull()
    expect(filter.categories).toEqual(["mv", "image"])
    expect(filter.characterId).toBe(1)
    expect(filter.characterScope).toBe("box")
    expect(filter.hasAppend).toBe(true)
  })

  it("drops categories on servers without them and the scope without a character", () => {
    const filter = toMusicLibraryFilter({ ...fullState(), char: null }, { hasCategories: false })
    expect(filter.categories).toEqual([])
    expect(filter.characterScope).toBe("any")
  })

  it("maps sort values onto the filter sort keys", () => {
    expect(resolveMusicSortKey("published")).toBe("publishedAt")
    expect(resolveMusicSortKey("notes")).toBe("noteCount")
  })
})

describe("active chips", () => {
  it("builds one chip per active filter with removable keys", () => {
    const chips = buildMusicActiveChips(fullState(), chipContext, t)
    expect(chips.map((chip) => chip.key)).toEqual([
      "q",
      "diff",
      "lv",
      "notes",
      "tags:vocaloid",
      "tags:event_box",
      "mv:mv",
      "mv:image",
      "year",
      "char",
      "append",
    ])
    expect(chips.find((chip) => chip.key === "lv")?.label).toBe("musicCatalog.chips.level:26–32")
    expect(chips.find((chip) => chip.key === "char")?.label).toBe("musicCatalog.chips.character:Ichika|scope-box")
    expect(chips.find((chip) => chip.key === "diff")?.label).toBe("MASTER")
  })

  it("hides MV chips on servers without categories and falls back to #id for unknown characters", () => {
    const chips = buildMusicActiveChips(
      { ...fullState(), char: 9, scope: "any" },
      { ...chipContext, hasCategories: false },
      t,
    )
    expect(chips.some((chip) => chip.key.startsWith("mv:"))).toBe(false)
    expect(chips.find((chip) => chip.key === "char")?.label).toBe("#9")
  })

  it("returns no chips for the default state", () => {
    expect(buildMusicActiveChips(createDefaultMusicQueryState(), chipContext, t)).toEqual([])
  })

  it("removes the filter behind a chip", () => {
    const state = fullState()
    removeMusicChip(state, "tags:vocaloid")
    expect(state.tags).toEqual(["event_box"])
    removeMusicChip(state, "mv:image")
    expect(state.mv).toEqual(["mv"])
    removeMusicChip(state, "lv")
    expect(state.lvmin).toBeNull()
    expect(state.lvmax).toBeNull()
    removeMusicChip(state, "char")
    expect(state.char).toBeNull()
    expect(state.scope).toBe("any")
    removeMusicChip(state, "notes")
    expect(state.notes.mode).toBe("exact")
    removeMusicChip(state, "unknown")
    expect(state.append).toBe(true)
    for (const key of ["q", "diff", "year", "append", "tags:event_box", "mv:mv"]) {
      removeMusicChip(state, key)
    }
    expect(buildMusicActiveChips(state, chipContext, t)).toEqual([])
  })

  it("formats ranges", () => {
    expect(formatQueryRange(1, 5)).toBe("1–5")
    expect(formatQueryRange(3, 3)).toBe("3")
    expect(formatQueryRange(3, null)).toBe("≥3")
    expect(formatQueryRange(null, 9)).toBe("≤9")
    expect(formatQueryRange(null, null)).toBe("")
  })
})
