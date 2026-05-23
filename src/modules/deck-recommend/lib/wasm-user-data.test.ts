import { describe, expect, it } from "bun:test"

const storage = {
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
}

Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true })
Object.defineProperty(globalThis, "sessionStorage", { value: storage, configurable: true })

const {
  createRecommendUserDataStringForWasm,
  prepareRecommendUserDataForWasm,
} = await import("./wasm-user-data")

describe("deck recommend wasm user data helpers", () => {
  it("keeps only wasm-consumed suite fields", () => {
    const fullData = {
      ignoredTopLevel: true,
      userGamedata: { userId: 1, deck: 2, rank: 300, ignored: "drop" },
      userAreas: [
        {
          areaId: 10,
          ignored: "drop",
          actionSets: [{ id: 11, status: "activated", ignored: "drop" }],
          areaItems: [{ areaItemId: 12, level: 13, ignored: "drop" }],
          userAreaStatus: { areaId: 14, status: "released", ignored: "drop" },
        },
      ],
      userCards: [
        {
          userId: 1,
          cardId: 100,
          level: 60,
          skillLevel: 4,
          masterRank: 5,
          specialTrainingStatus: "done",
          defaultImage: "special_training",
          ignored: "drop",
          episodes: [{ cardEpisodeId: 101, scenarioStatus: "already_read", ignored: "drop" }],
        },
      ],
      userChallengeLiveSoloDecks: [{ characterId: 1, leader: 100, support1: 101, ignored: "drop" }],
      userCharacters: [{ characterId: 1, characterRank: 80, ignored: "drop" }],
      userDecks: [{ deckId: 1, leader: 100, member1: 100, member2: 101, ignored: "drop" }],
      userHonors: [{ honorId: 1, level: 2, ignored: "drop" }],
      userMysekaiCanvases: [{ mysekaiFixtureId: 1, cardId: 100, isSpecialTraining: true, quantity: 1, ignored: "drop" }],
      userMysekaiFixtureGameCharacterPerformanceBonuses: [
        { gameCharacterId: 1, totalBonusRate: 3.5, ignored: "drop" },
      ],
      userMysekaiGates: [
        { mysekaiGateId: 1, mysekaiGateSkinId: 2, mysekaiGateLevel: 3, visitCount: 4, isSettingAtHomeSite: true, ignored: "drop" },
      ],
    }

    expect(prepareRecommendUserDataForWasm(fullData)).toEqual({
      userGamedata: { userId: 1, deck: 2, rank: 300 },
      userAreas: [
        {
          areaId: 10,
          actionSets: [{ id: 11, status: "activated" }],
          areaItems: [{ areaItemId: 12, level: 13 }],
          userAreaStatus: { areaId: 14, status: "released" },
        },
      ],
      userCards: [
        {
          userId: 1,
          cardId: 100,
          level: 60,
          skillLevel: 4,
          masterRank: 5,
          specialTrainingStatus: "done",
          defaultImage: "special_training",
          episodes: [{ cardEpisodeId: 101, scenarioStatus: "already_read" }],
        },
      ],
      userChallengeLiveSoloDecks: [{ characterId: 1, leader: 100, support1: 101 }],
      userCharacters: [{ characterId: 1, characterRank: 80 }],
      userDecks: [{ deckId: 1, leader: 100, member1: 100, member2: 101 }],
      userHonors: [{ honorId: 1, level: 2 }],
      userMysekaiCanvases: [{ mysekaiFixtureId: 1, cardId: 100, isSpecialTraining: true, quantity: 1 }],
      userMysekaiFixtureGameCharacterPerformanceBonuses: [{ gameCharacterId: 1, totalBonusRate: 3.5 }],
      userMysekaiGates: [
        { mysekaiGateId: 1, mysekaiGateSkinId: 2, mysekaiGateLevel: 3, visitCount: 4, isSettingAtHomeSite: true },
      ],
    })
  })

  it("serializes compact wasm user data once", () => {
    const fullData = {
      userGamedata: { deck: 1, ignored: "drop" },
      userAreas: [],
      userCards: [],
      userCharacters: [],
      userHonors: [],
    }

    expect(JSON.parse(createRecommendUserDataStringForWasm(fullData))).toEqual({
      userGamedata: { deck: 1 },
      userAreas: [],
      userCards: [],
      userChallengeLiveSoloDecks: [],
      userCharacters: [],
      userDecks: [],
      userHonors: [],
      userMysekaiCanvases: [],
      userMysekaiFixtureGameCharacterPerformanceBonuses: [],
      userMysekaiGates: [],
    })
  })

  it("reports missing required suite fields before calling wasm", () => {
    expect(() => prepareRecommendUserDataForWasm({ userCards: [] })).toThrow("missing userGamedata")
  })
})
