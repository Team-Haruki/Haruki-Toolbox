import { describe, expect, test } from "bun:test"
import { DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES, stripCardParameters } from "./main-thread-master"
import { SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES } from "@/shared/sekai/worker-protocol"

describe("stripCardParameters", () => {
  test("drops the engine-only per-level rows and keeps everything else", () => {
    const cards = [
      {
        id: 1,
        characterId: 2,
        attr: "cool",
        cardRarityType: "rarity_4",
        assetbundleName: "res001_no001",
        cardParameters: [{ cardLevel: 1, cardParameterType: "param1", power: 100 }],
        specialTrainingCosts: [{ cost: 1 }],
        masterLessonAchieveResources: [{ resourceId: 1 }],
      },
    ]
    expect(stripCardParameters(cards)).toEqual([
      { id: 1, characterId: 2, attr: "cool", cardRarityType: "rarity_4", assetbundleName: "res001_no001" },
    ])
  })

  test("leaves non-array input and malformed rows untouched", () => {
    expect(stripCardParameters(null)).toBeNull()
    expect(stripCardParameters([1, null, "x"])).toEqual([1, null, "x"])
  })

  test("does not mutate the source rows", () => {
    const card = { id: 1, cardParameters: [1] }
    stripCardParameters([card])
    expect(card.cardParameters).toEqual([1])
  })
})

describe("DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES", () => {
  test("is covered by the files the deck page ensures for the engine, except the page-only tables", () => {
    const engineFiles = new Set<string>(SEKAI_DATA_RECOMMEND_FETCH_MASTER_FILES)
    const pageOnly = DECK_RECOMMEND_MAIN_THREAD_MASTER_FILES.filter((fileName) => !engineFiles.has(fileName))
    expect(pageOnly).toEqual(["unitProfiles"])
  })
})
