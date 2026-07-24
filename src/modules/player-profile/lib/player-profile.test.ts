import { describe, expect, it } from "bun:test"
import {
  buildChallengeLiveGrid,
  buildCharacterRanks,
  buildDeckThumbnailCard,
  buildMusicClearCounts,
  buildPlayerCardMap,
  cleanProfileWord,
  normalizePlayerCards,
  normalizePlayerGamedata,
  normalizePlayerProfile,
  parseSekaiColoredText,
  resolveActiveDeckCardIds,
  shouldUseTrainedImage,
  sortChallengeLiveCells,
  summarizeChallengeLiveTop,
} from "./player-profile"

describe("cleanProfileWord", () => {
  it("strips color tags and trims", () => {
    expect(cleanProfileWord("<#ff00ff>ハロー<#fff>セカイ ")).toBe("ハローセカイ")
    expect(cleanProfileWord("  plain bio  ")).toBe("plain bio")
  })

  it("returns empty string for non-string input", () => {
    expect(cleanProfileWord(null)).toBe("")
    expect(cleanProfileWord(42)).toBe("")
  })
})

describe("normalizePlayerGamedata", () => {
  it("keeps userId as string and parses numbers", () => {
    expect(normalizePlayerGamedata({ userId: 123456789, name: "Miku", rank: 250, deck: 7 })).toEqual({
      userId: "123456789",
      name: "Miku",
      rank: 250,
      deck: 7,
    })
    expect(normalizePlayerGamedata({ userId: " 42 ", name: "P", rank: "5", deck: null })?.userId).toBe("42")
  })

  it("rejects non-object payloads", () => {
    expect(normalizePlayerGamedata(null)).toBeNull()
    expect(normalizePlayerGamedata([])).toBeNull()
  })
})

describe("normalizePlayerProfile", () => {
  it("cleans the word and trims twitterId", () => {
    expect(normalizePlayerProfile({ word: "<#f00>hi", twitterId: " haruki " })).toEqual({
      word: "hi",
      twitterId: "haruki",
    })
    expect(normalizePlayerProfile(undefined)).toEqual({ word: "", twitterId: "" })
  })
})

describe("parseSekaiColoredText", () => {
  it("splits color-tagged names into colored segments", () => {
    expect(parseSekaiColoredText("<#DAC>星<#B68>雲<#9CF>夏<#FCA>希")).toEqual([
      { text: "星", color: "#DAC" },
      { text: "雲", color: "#B68" },
      { text: "夏", color: "#9CF" },
      { text: "希", color: "#FCA" },
    ])
  })

  it("keeps untagged prefixes uncolored and supports 6-digit tags", () => {
    expect(parseSekaiColoredText("Hi<#33CCBB>Miku")).toEqual([
      { text: "Hi", color: null },
      { text: "Miku", color: "#33CCBB" },
    ])
  })

  it("leaves malformed tags as literal text", () => {
    expect(parseSekaiColoredText("<#GGG>abc")).toEqual([{ text: "<#GGG>abc", color: null }])
    expect(parseSekaiColoredText("")).toEqual([])
    expect(parseSekaiColoredText(null)).toEqual([])
  })
})

describe("normalizePlayerCards / buildPlayerCardMap", () => {
  it("parses records defensively and maps by cardId", () => {
    const records = normalizePlayerCards([
      { cardId: 10, level: 60, masterRank: 5, skillLevel: 4, specialTrainingStatus: "done", defaultImage: "special_training" },
      { cardId: "11", level: "1" },
      { cardId: 0 },
      null,
      "junk",
    ])

    expect(records).toHaveLength(2)
    const map = buildPlayerCardMap(records)
    expect(map.get(10)?.masterRank).toBe(5)
    expect(map.get(11)?.level).toBe(1)
    expect(shouldUseTrainedImage(map.get(10)!)).toBe(true)
    expect(shouldUseTrainedImage(map.get(11)!)).toBe(false)
  })
})

describe("buildDeckThumbnailCard", () => {
  it("maps a suite record into the deck-recommend card shape", () => {
    const card = buildDeckThumbnailCard(10, {
      cardId: 10,
      level: 60,
      masterRank: 5,
      skillLevel: 4,
      specialTrainingStatus: "done",
      defaultImage: "special_training",
    })

    expect(card.card_id).toBe(10)
    expect(card.level).toBe(60)
    expect(card.master_rank).toBe(5)
    expect(card.skill_level).toBe(4)
    expect(card.after_training).toBe(true)
    expect(card.default_image).toBe("special_training")
  })

  it("falls back to safe defaults when the record is missing", () => {
    const card = buildDeckThumbnailCard(99, null)

    expect(card.card_id).toBe(99)
    expect(card.level).toBe(0)
    expect(card.master_rank).toBe(0)
    expect(card.after_training).toBe(false)
    expect(card.default_image).toBe("")
  })
})

describe("resolveActiveDeckCardIds", () => {
  const decks = [
    { deckId: 1, leader: 100, member1: 100, member2: 200, member3: 300, member4: 400, member5: 500 },
    { deckId: 2, leader: 900, member1: 800, member2: 900, member3: 0, member4: null, member5: 700 },
  ]

  it("orders leader first and drops duplicates of the leader", () => {
    expect(resolveActiveDeckCardIds(decks, 1)).toEqual([100, 200, 300, 400, 500])
    expect(resolveActiveDeckCardIds(decks, 2)).toEqual([900, 800, 700])
  })

  it("returns empty for unknown or missing deck ids", () => {
    expect(resolveActiveDeckCardIds(decks, 99)).toEqual([])
    expect(resolveActiveDeckCardIds(decks, null)).toEqual([])
    expect(resolveActiveDeckCardIds(null, 1)).toEqual([])
  })
})

describe("buildMusicClearCounts", () => {
  it("dedups by musicId and merges fc/ap flags across rows", () => {
    const rows = buildMusicClearCounts([
      { musicId: 1, musicDifficultyType: "master", playType: "multi", fullComboFlg: false, fullPerfectFlg: false },
      { musicId: 1, musicDifficultyType: "master", playType: "solo", fullComboFlg: true, fullPerfectFlg: false },
      { musicId: 2, musicDifficultyType: "master", fullComboFlg: true, fullPerfectFlg: true },
      { musicId: 3, musicDifficultyType: "expert", fullComboFlg: false, fullPerfectFlg: false },
    ])

    expect(rows).toEqual([
      { difficulty: "expert", clear: 1, fullCombo: 0, allPerfect: 0 },
      { difficulty: "master", clear: 2, fullCombo: 2, allPerfect: 1 },
    ])
  })

  it("skips difficulties without rows and ignores malformed entries", () => {
    const rows = buildMusicClearCounts([
      { musicId: 1, musicDifficultyType: "easy" },
      { musicId: 2, musicDifficultyType: "append_plus" },
      { musicDifficultyType: "hard" },
      null,
    ])

    expect(rows).toEqual([{ difficulty: "easy", clear: 1, fullCombo: 0, allPerfect: 0 }])
  })

  it("returns fixed difficulty order", () => {
    const rows = buildMusicClearCounts([
      { musicId: 1, musicDifficultyType: "append" },
      { musicId: 1, musicDifficultyType: "easy" },
      { musicId: 1, musicDifficultyType: "hard" },
    ])

    expect(rows.map((row) => row.difficulty)).toEqual(["easy", "hard", "append"])
  })
})

describe("buildCharacterRanks", () => {
  it("sorts by characterId and keeps the highest rank on duplicates", () => {
    expect(buildCharacterRanks([
      { characterId: 5, characterRank: 30, totalExp: 1 },
      { characterId: 1, characterRank: 55 },
      { characterId: 5, characterRank: 28 },
      { characterId: 0, characterRank: 9 },
    ])).toEqual([
      { characterId: 1, characterRank: 55 },
      { characterId: 5, characterRank: 30 },
    ])
  })
})

describe("buildChallengeLiveGrid", () => {
  const results = [
    { characterId: 1, highScore: 1234567 },
    { characterId: 2, highScore: 890 },
  ]
  const stages = [
    { characterId: 1, rank: 3, challengeLiveStageStatus: "cleared" },
    { characterId: 1, rank: 7 },
    { characterId: 2, rank: 0 },
  ]

  it("always yields 26 cells with zeros for missing characters", () => {
    const cells = buildChallengeLiveGrid(results, stages)
    expect(cells).toHaveLength(26)
    expect(cells[25]).toEqual({ characterId: 26, highScore: 0, stage: 0, hasData: false })
  })

  it("takes the max stage rank and floors it at 1 when data exists", () => {
    const cells = buildChallengeLiveGrid(results, stages)
    expect(cells[0]).toEqual({ characterId: 1, highScore: 1234567, stage: 7, hasData: true })
    // Character 2 has a result but only a rank-0 stage row: floored to 1.
    expect(cells[1]).toEqual({ characterId: 2, highScore: 890, stage: 1, hasData: true })
  })

  it("summarizes the top character by high score", () => {
    const cells = buildChallengeLiveGrid(results, stages)
    expect(summarizeChallengeLiveTop(cells)).toEqual({
      characterId: 1,
      highScore: 1234567,
      stage: 7,
      hasData: true,
    })
    expect(summarizeChallengeLiveTop(buildChallengeLiveGrid([], []))).toBeNull()
  })

  it("sorts by score descending with characterId tiebreaker", () => {
    const cells = buildChallengeLiveGrid(results, stages)
    const byScore = sortChallengeLiveCells(cells, "score")
    expect(byScore[0]?.characterId).toBe(1)
    expect(byScore[1]?.characterId).toBe(2)
    expect(byScore[2]?.characterId).toBe(3)

    const byCharacter = sortChallengeLiveCells(byScore, "character")
    expect(byCharacter.map((cell) => cell.characterId)).toEqual(
      Array.from({ length: 26 }, (_, index) => index + 1),
    )
  })
})
