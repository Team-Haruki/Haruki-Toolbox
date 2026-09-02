import { describe, expect, it } from "bun:test"
import {
  MUSICS_INDEX_FILES,
  MUSICS_INDEX_KEY,
  MUSICS_INDEX_OPTIONAL,
  buildMusicsIndex,
} from "./useMusicsIndex"

/** jp-shaped rows: no `categories` on any music. */
const JP_MUSICS = [
  { id: 3, title: "Third", assetbundleName: "jacket_s_003", publishedAt: 3 },
  { id: 1, title: "First", assetbundleName: "jacket_s_001", publishedAt: 1 },
  { id: 2, title: "Second", assetbundleName: "jacket_s_002", publishedAt: 2 },
  { title: "broken record without id" },
]

const DIFFICULTIES = [
  { id: 1, musicId: 1, musicDifficulty: "master", playLevel: 26, totalNoteCount: 886 },
  { id: 2, musicId: 3, musicDifficulty: "append", playLevel: 30, totalNoteCount: 1100 },
]

const TAGS = [
  { musicId: 1, musicTag: "all" },
  { musicId: 1, musicTag: "vocaloid" },
  { musicId: 3, musicTag: "street" },
]

describe("buildMusicsIndex", () => {
  it("declares the canonical key and files", () => {
    expect(MUSICS_INDEX_KEY).toBe("music-library/index")
    expect([...MUSICS_INDEX_FILES]).toEqual(["musics", "musicDifficulties", "musicTags", "musicCategories"])
    // Optional files must be a subset, or the resource fails where they are absent.
    for (const file of MUSICS_INDEX_OPTIONAL) {
      expect([...MUSICS_INDEX_FILES]).toContain(file)
    }
  })

  it("sorts entries by id and indexes them by id", () => {
    const index = buildMusicsIndex({ musics: JP_MUSICS, musicDifficulties: DIFFICULTIES, musicTags: TAGS })
    expect(index.entries.map((entry) => entry.id)).toEqual([1, 2, 3])
    expect(index.byId.size).toBe(3)
    expect(index.byId.get(1)).toBe(index.entries[0])
    expect(index.byId.get(3)).toBe(index.entries[2])
    expect(index.byId.get(1)).toMatchObject({
      title: "First",
      tags: ["vocaloid"],
      difficulties: { master: { playLevel: 26, totalNoteCount: 886 } },
    })
    expect(index.byId.get(3)?.difficulties).toEqual({ append: { playLevel: 30, totalNoteCount: 1100 } })
    expect(index.byId.get(2)?.tags).toEqual([])
    expect(index.byId.has(4)).toBe(false)
  })

  it("takes categories from the standalone table jp ships since client 6.8.1", () => {
    const index = buildMusicsIndex({
      musics: JP_MUSICS,
      musicDifficulties: DIFFICULTIES,
      musicTags: TAGS,
      musicCategories: [
        { id: 1, musicId: 1, musicCategoryName: "mv" },
        { id: 2, musicId: 1, musicCategoryName: "image" },
        { id: 3, musicId: 2, musicCategoryName: "original" },
      ],
    })
    expect(index.byId.get(1)?.categories).toEqual(["mv", "image"])
    expect(index.byId.get(3)?.categories).toEqual([])
    expect(index.hasCategories).toBe(true)
  })

  it("reports hasCategories false for jp-like dumps without categories", () => {
    const index = buildMusicsIndex({ musics: JP_MUSICS, musicDifficulties: DIFFICULTIES, musicTags: TAGS })
    expect(index.hasCategories).toBe(false)
    expect(index.entries.every((entry) => entry.categories.length === 0)).toBe(true)
  })

  it("reports hasCategories true as soon as one music carries a category", () => {
    const musics = [
      { id: 2, title: "Second", assetbundleName: "jacket_s_002" },
      { id: 1, title: "First", assetbundleName: "jacket_s_001", categories: [{ musicCategoryName: "mv" }] },
      { id: 3, title: "Third", assetbundleName: "jacket_s_003", categories: ["mv_2d", "image"] },
    ]
    const index = buildMusicsIndex({ musics, musicDifficulties: DIFFICULTIES, musicTags: TAGS })
    expect(index.hasCategories).toBe(true)
    expect(index.entries.map((entry) => entry.id)).toEqual([1, 2, 3])
    expect(index.byId.get(1)?.categories).toEqual(["mv"])
    expect(index.byId.get(2)?.categories).toEqual([])
    expect(index.byId.get(3)?.categories).toEqual(["mv_2d", "image"])
  })

  it("tolerates missing or malformed files", () => {
    const empty = buildMusicsIndex({})
    expect(empty.entries).toEqual([])
    expect(empty.byId.size).toBe(0)
    expect(empty.hasCategories).toBe(false)

    const partial = buildMusicsIndex({ musics: JP_MUSICS, musicDifficulties: "x", musicTags: null })
    expect(partial.entries.map((entry) => entry.id)).toEqual([1, 2, 3])
    expect(partial.byId.get(1)?.difficulties).toEqual({})
    expect(partial.byId.get(1)?.tags).toEqual([])
  })
})
