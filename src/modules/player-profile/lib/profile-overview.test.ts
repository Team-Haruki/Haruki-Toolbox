import { describe, expect, it } from "bun:test"
import { buildProfileCharacterGroups, summarizeMusicClears } from "./profile-overview"

const UNITS = ["light_sound", "idol", "piapro"]
const unitOf = (characterId: number) => (characterId <= 2 ? "light_sound" : characterId <= 4 ? "idol" : characterId === 21 ? "piapro" : null)

describe("buildProfileCharacterGroups", () => {
  it("merges the three sources into one cell per character, grouped by unit in order", () => {
    const groups = buildProfileCharacterGroups({
      ranks: [{ characterId: 3, characterRank: 40 }, { characterId: 1, characterRank: 52 }, { characterId: 21, characterRank: 30 }],
      collection: [{ characterId: 1, owned: 35, total: 56, percent: 62.5 }, { characterId: 2, owned: 0, total: 54, percent: 0 }],
      challenge: [
        { characterId: 1, highScore: 2_300_000, hasData: true },
        { characterId: 2, highScore: 0, hasData: false },
        { characterId: 4, highScore: 1_000_000, hasData: true },
        { characterId: 3, highScore: 0, hasData: true },
      ],
    }, unitOf, UNITS)

    expect(groups.map((group) => group.unit)).toEqual(["light_sound", "idol", "piapro"])
    expect(groups[0].cells).toEqual([
      { characterId: 1, rank: 52, collection: { owned: 35, total: 56, percent: 62.5 }, challengeScore: 2_300_000 },
      { characterId: 2, rank: null, collection: { owned: 0, total: 54, percent: 0 }, challengeScore: null },
    ])
    expect(groups[1].cells.map((cell) => [cell.characterId, cell.rank, cell.challengeScore])).toEqual([[3, 40, null], [4, null, 1_000_000]])
    expect(groups[2].cells).toEqual([{ characterId: 21, rank: 30, collection: null, challengeScore: null }])
  })

  it("puts characters of an unknown unit last and lists nobody without data", () => {
    const groups = buildProfileCharacterGroups({
      ranks: [{ characterId: 99, characterRank: 5 }, { characterId: 21, characterRank: 30 }],
      collection: [],
      challenge: [{ characterId: 7, highScore: 0, hasData: false }],
    }, unitOf, UNITS)
    expect(groups.map((group) => [group.unit, group.cells.map((cell) => cell.characterId)])).toEqual([["piapro", [21]], [null, [99]]])
  })

  it("is empty without any source data", () => {
    expect(buildProfileCharacterGroups({ ranks: [], collection: [], challenge: [] }, unitOf, UNITS)).toEqual([])
  })
})

describe("summarizeMusicClears", () => {
  it("sums each count over the difficulties", () => {
    expect(summarizeMusicClears([
      { summary: { allPerfect: 700, fullCombo: 730, cleared: 732, total: 735 } },
      { summary: { allPerfect: 45, fullCombo: 142, cleared: 142, total: 156 } },
    ])).toEqual({ allPerfect: 745, fullCombo: 872, cleared: 874, total: 891 })
    expect(summarizeMusicClears([])).toEqual({ allPerfect: 0, fullCombo: 0, cleared: 0, total: 0 })
  })
})
