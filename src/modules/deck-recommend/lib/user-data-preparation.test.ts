import { describe, expect, it } from "bun:test"
import { createPreparedDeckRecommendUserDataString } from "./user-data-preparation"
import { createDefaultCardTrainingConfig } from "./training-config"

describe("deck recommend user data preparation", () => {
  const masterData = {
    cards: [
      {
        id: 100,
        characterId: 1,
        cardRarityType: "rarity_4",
        attr: "happy",
      },
      {
        id: 101,
        characterId: 1,
        cardRarityType: "rarity_4",
        attr: "cool",
      },
      {
        id: 102,
        characterId: 2,
        cardRarityType: "rarity_4",
        attr: "cool",
      },
      {
        id: 103,
        characterId: 3,
        cardRarityType: "rarity_4",
        attr: "pure",
      },
    ],
    cardRarities: [
      {
        cardRarityType: "rarity_4",
        maxLevel: 50,
        trainingMaxLevel: 60,
        maxSkillLevel: 4,
      },
    ],
    cardEpisodes: [
      {
        id: 1001,
        cardId: 100,
        cardEpisodePartType: "first_part",
      },
      {
        id: 1002,
        cardId: 100,
        cardEpisodePartType: "second_part",
      },
    ],
    gameCharacters: [
      {
        id: 1,
        unit: "idol",
      },
      {
        id: 2,
        unit: "street",
      },
      {
        id: 3,
        unit: "theme_park",
      },
    ],
  }

  it("forwards precise single-card training overrides to the wasm engine", () => {
    const prepared = createPreparedDeckRecommendUserDataString({
      masterData,
      userData: {
        userCards: [
          {
            cardId: 100,
            level: 1,
            skillLevel: 1,
            masterRank: 0,
            episodes: [],
          },
        ],
      },
      singleCardOverrides: [
        {
          cardId: 100,
          disabled: false,
          level: 55,
          skillLevel: 3,
          masterRank: 2,
          episodeState: "both",
          canvas: true,
        },
      ],
    })

    expect(prepared.singleCardConfigs).toEqual([
      {
        card_id: 100,
        canvas: true,
        level: 55,
        skill_level: 3,
        master_rank: 2,
        episode_read_count: 2,
      },
    ])
  })

  it("maps locked episodes to an exact zero read-count override", () => {
    const prepared = createPreparedDeckRecommendUserDataString({
      masterData,
      userData: {
        userCards: [
          {
            cardId: 100,
            level: 60,
            skillLevel: 4,
            masterRank: 5,
            episodes: [
              {
                cardEpisodeId: 1001,
                scenarioStatus: "already_read",
              },
            ],
          },
        ],
      },
      singleCardOverrides: [
        {
          cardId: 100,
          disabled: false,
          level: null,
          skillLevel: null,
          masterRank: null,
          episodeState: "none",
          canvas: false,
        },
      ],
    })

    expect(prepared.singleCardConfigs).toEqual([
      {
        card_id: 100,
        canvas: false,
        episode_read_count: 0,
      },
    ])
  })

  it("omits unset single-card episode overrides", () => {
    const prepared = createPreparedDeckRecommendUserDataString({
      masterData,
      userData: {
        userCards: [
          {
            cardId: 100,
          },
        ],
      },
      singleCardOverrides: [
        {
          cardId: 100,
          disabled: false,
          level: null,
          skillLevel: null,
          masterRank: null,
          episodeState: null,
          canvas: true,
        },
      ],
    })

    expect(prepared.singleCardConfigs).toEqual([
      {
        card_id: 100,
        canvas: true,
      },
    ])
  })

  it("inherits rarity training defaults before applying precise single-card overrides", () => {
    const prepared = createPreparedDeckRecommendUserDataString({
      masterData,
      userData: {
        userCards: [
          {
            cardId: 100,
          },
        ],
      },
      trainingConfig: createDefaultCardTrainingConfig(),
      singleCardOverrides: [
        {
          cardId: 100,
          disabled: false,
          level: null,
          skillLevel: 2,
          masterRank: null,
          episodeState: null,
          canvas: null,
        },
      ],
    })

    expect(prepared.singleCardConfigs).toEqual([
      {
        card_id: 100,
        disable: false,
        level_max: true,
        episode_read: true,
        master_max: false,
        skill_max: false,
        canvas: true,
        skill_level: 2,
      },
    ])
  })

  it("filters user cards by any selected unit and any selected attribute", () => {
    const prepared = createPreparedDeckRecommendUserDataString({
      masterData,
      userData: {
        userCards: [
          { cardId: 100 },
          { cardId: 101 },
          { cardId: 102 },
          { cardId: 103 },
        ],
      },
      unitFilters: ["idol", "street"],
      attrFilters: ["cool"],
    })

    const userData = JSON.parse(prepared.userDataString) as { userCards: Array<{ cardId: number }> }

    expect(userData.userCards.map((card) => card.cardId)).toEqual([101, 102])
  })
})
