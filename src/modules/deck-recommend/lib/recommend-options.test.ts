import { describe, expect, it } from "bun:test"
import {
  buildDeckRecommendOptions,
  parseDeckBonusTargetsInput,
  parseDeckCustomBonusCharacterIdsInput,
  parseDeckCustomBonusSupportUnitsInput,
  parseDeckIntegerListInput,
  parseDeckSkillOrderInput,
  resolveRecommendDataMode,
  resolveCurrentDeckCards,
  resolveCurrentDeckCardsWithProfile,
  resolveWasmLiveType,
} from "./recommend-options"
import { createDefaultCardTrainingConfig } from "./training-config"

describe("deck recommend wasm option helpers", () => {
  it("keeps cheerful live type aligned with wasm", () => {
    expect(resolveWasmLiveType("event", "cheerful")).toBe("cheerful")
  })

  it("maps challenge auto live type to challenge_auto and other challenge types to challenge", () => {
    expect(resolveWasmLiveType("challenge", "auto")).toBe("challenge_auto")
    expect(resolveWasmLiveType("challenge", "multi")).toBe("challenge")
  })

  it("forces mysekai mode to mysekai live type", () => {
    expect(resolveWasmLiveType("mysekai", "multi")).toBe("mysekai")
  })

  it("forces bonus mode to solo live type", () => {
    expect(resolveWasmLiveType("bonus", "multi")).toBe("solo")
  })

  it("builds wasm recommend options from form state", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.region).toBe("jp")
    expect(options.live_type).toBe("multi")
    expect(options.target).toBe("score")
    expect(options.algorithm).toBe("dfs_ga")
    expect(options.event_id).toBe(205)
    expect(options.multi_live_teammate_power).toBeUndefined()
    expect(options.multi_live_teammate_score_up).toBeUndefined()
    expect(options.rarity_1_config?.master_max).toBe(true)
    expect(options.rarity_4_config?.skill_max).toBe(false)
  })

  it("passes explicit recommendation targets", () => {
    expect(buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      target: "power",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    }).target).toBe("power")

    const eventBonusOptions = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      target: "bonus",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })
    expect(eventBonusOptions.target).toBe("bonus")
    expect(eventBonusOptions.target_bonus_list).toBeUndefined()

    expect(buildDeckRecommendOptions({
      region: "jp",
      mode: "challenge",
      target: "bonus",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: "1",
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    }).target).toBe("score")
  })

  it("passes pre-serialized user data through user_data_str", () => {
    const userData = JSON.stringify({ userCards: [] })
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "1",
      musicDifficulty: "master",
      eventId: "205",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData,
    })

    expect(options.user_data).toBeUndefined()
    expect(options.user_data_str).toBe(userData)
  })

  it("passes optional multi-live and deck constraint options", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "cheerful",
      algorithm: "dfs_ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      multiLiveTeammatePower: 370000,
      multiLiveTeammateScoreUp: 210,
      multiLiveScoreUpLowerBound: 200,
      fixedCards: [101, 102, 101],
      fixedCharacters: [1, 2, 1],
      excludedCards: [201, 202, 201],
      skillOrderStrategy: "max",
      skillReferenceStrategy: "min",
      keepAfterTrainingState: true,
      supportMasterMax: true,
      supportSkillMax: true,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.multi_live_teammate_power).toBe(370000)
    expect(options.multi_live_teammate_score_up).toBe(210)
    expect(options.multi_live_score_up_lower_bound).toBe(200)
    expect(options.fixed_cards).toEqual([101, 102])
    expect(options.fixed_characters).toEqual([1, 2])
    expect(options.single_card_configs).toEqual([
      { card_id: 201, disable: true },
      { card_id: 202, disable: true },
    ])
    expect(options.skill_order_choose_strategy).toBe("max")
    expect(options.skill_reference_choose_strategy).toBe("min")
    expect(options.keep_after_training_state).toBe(true)
    expect(options.support_master_max).toBe(true)
    expect(options.support_skill_max).toBe(true)
  })

  it("uses current deck cards as fixed cards and disables leader skill override", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      fixedCards: [101, 102],
      currentDeckCards: [501, 502, 503, 504, 505],
      useCurrentDeck: true,
      fixedCharacters: [1, 2],
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.fixed_cards).toEqual([501, 502, 503, 504, 505])
    expect(options.fixed_characters).toBeUndefined()
    expect(options.best_skill_as_leader).toBe(false)
  })

  it("passes specific skill order only with specific strategy", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      skillOrderStrategy: "specific",
      specificSkillOrder: [0, 4, 1, 2, 3],
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.skill_order_choose_strategy).toBe("specific")
    expect(options.specific_skill_order).toEqual([0, 4, 1, 2, 3])
  })

  it("requires a complete skill order for specific strategy", () => {
    expect(() => buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "dfs_ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      skillOrderStrategy: "specific",
      specificSkillOrder: [0, 1, 2],
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })).toThrow("specific_skill_order")
  })

  it("uses mysekai user data mode only for mysekai deck mode", () => {
    expect(resolveRecommendDataMode("mysekai")).toBe("mysekai")
    expect(resolveRecommendDataMode("event")).toBe("suite")
  })

  it("passes world bloom character id for event-like modes", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "solo",
      algorithm: "ga",
      musicId: "1",
      musicDifficulty: "expert",
      eventId: "112",
      characterId: "18",
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.world_bloom_character_id).toBe(18)
  })

  it("passes forced leader character id for final world bloom events", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "solo",
      algorithm: "ga",
      musicId: "1",
      musicDifficulty: "expert",
      eventId: "180",
      characterId: null,
      forcedLeaderCharacterId: "18",
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.world_bloom_character_id).toBeUndefined()
    expect(options.forcedLeaderCharacterId).toBe(18)
  })

  it("omits world bloom character ids when no character is selected", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "solo",
      algorithm: "ga",
      musicId: "1",
      musicDifficulty: "expert",
      eventId: "180",
      characterId: null,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.world_bloom_character_id).toBeUndefined()
    expect(options.forcedLeaderCharacterId).toBeUndefined()
  })

  it("builds simulated unit-attr event options without forwarding event id", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      eventSimulation: {
        enabled: true,
        eventType: "cheerful_carnival",
        attr: "cool",
        unit: "idol",
        worldBloomTurn: null,
        worldBloomCharacterId: null,
        worldBloomCharacterUnit: null,
      },
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.event_id).toBeUndefined()
    expect(options.event_type).toBe("cheerful_carnival")
    expect(options.event_attr).toBe("cool")
    expect(options.event_unit).toBe("idol")
  })

  it("builds simulated world bloom options", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      eventSimulation: {
        enabled: true,
        eventType: "marathon",
        attr: null,
        unit: null,
        worldBloomTurn: 2,
        worldBloomCharacterId: "13",
        worldBloomCharacterUnit: "theme_park",
      },
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.event_id).toBeUndefined()
    expect(options.event_type).toBe("world_bloom")
    expect(options.world_bloom_event_turn).toBe(2)
    expect(options.world_bloom_character_id).toBe(13)
    expect(options.event_unit).toBe("theme_park")
  })

  it("requires unit for simulated world bloom turn 1 or 2", () => {
    expect(() => buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: null,
      characterId: null,
      eventSimulation: {
        enabled: true,
        eventType: "marathon",
        attr: null,
        unit: null,
        worldBloomTurn: 1,
        worldBloomCharacterId: "13",
        worldBloomCharacterUnit: null,
      },
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })).toThrow("event_unit is required")
  })

  it("rejects unsupported simulated world bloom turns", () => {
    expect(() => buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: null,
      characterId: null,
      eventSimulation: {
        enabled: true,
        eventType: "marathon",
        attr: null,
        unit: null,
        worldBloomTurn: 4,
        worldBloomCharacterId: "13",
        worldBloomCharacterUnit: "theme_park",
      },
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })).toThrow("world_bloom_event_turn")
  })

  it("builds bonus target options with dfs exact search", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "bonus",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      targetBonuses: [120, 130, 120],
      customBonusAttr: "cool",
      customBonusCharacterIds: [1, 21, 1],
      customBonusCharacterSupportUnits: {
        "21": "light_sound",
        "22": "idol",
      },
      filterOtherUnit: true,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.target).toBe("bonus")
    expect(options.live_type).toBe("solo")
    expect(options.algorithm).toBe("dfs")
    expect(options.target_bonus_list).toEqual([120, 130])
    expect(options.custom_bonus_attr).toBeUndefined()
    expect(options.custom_bonus_character_ids).toBeUndefined()
    expect(options.custom_bonus_character_support_units).toBeUndefined()
    expect(options.filter_other_unit).toBeUndefined()
  })

  it("builds custom bonus simulated event options", () => {
    const options = buildDeckRecommendOptions({
      region: "jp",
      mode: "event",
      liveType: "multi",
      algorithm: "ga",
      musicId: "74",
      musicDifficulty: "expert",
      eventId: "205",
      characterId: null,
      eventSimulation: {
        enabled: true,
        eventType: "marathon",
        attr: null,
        unit: null,
        worldBloomTurn: null,
        worldBloomCharacterId: null,
        worldBloomCharacterUnit: null,
      },
      customBonusAttr: "cool",
      customBonusCharacterIds: [1, 21, 1],
      customBonusCharacterSupportUnits: {
        "21": "light_sound",
        "22": "idol",
      },
      filterOtherUnit: true,
      trainingConfig: createDefaultCardTrainingConfig(),
      userData: { userCards: [] },
    })

    expect(options.event_id).toBeUndefined()
    expect(options.event_type).toBe("marathon")
    expect(options.event_attr).toBeUndefined()
    expect(options.event_unit).toBeUndefined()
    expect(options.custom_bonus_attr).toBe("cool")
    expect(options.custom_bonus_character_ids).toEqual([1, 21])
    expect(options.custom_bonus_character_support_units).toEqual({ "21": "light_sound" })
    expect(options.filter_other_unit).toBe(true)
  })

  it("parses bonus target input with common separators", () => {
    expect(parseDeckBonusTargetsInput("100 120,130，140% 100").targets).toEqual([100, 120, 130, 140])
    expect(parseDeckBonusTargetsInput("100 nope").invalidTokens).toEqual(["nope"])
  })

  it("parses integer list input with dedupe and invalid token tracking", () => {
    expect(parseDeckIntegerListInput("101 102,103，101、104").values).toEqual([101, 102, 103, 104])
    expect(parseDeckIntegerListInput("101 nope 102.5").invalidTokens).toEqual(["nope", "102.5"])
  })

  it("parses custom bonus character and support unit inputs", () => {
    expect(parseDeckCustomBonusCharacterIdsInput("1 21 21 26").values).toEqual([1, 21, 26])
    expect(parseDeckCustomBonusCharacterIdsInput("0 27 nope").invalidTokens).toEqual(["0", "27", "nope"])
    expect(parseDeckCustomBonusSupportUnitsInput("21:light_sound 25=school_refusal")).toEqual({
      values: {
        "21": "light_sound",
        "25": "school_refusal",
      },
      invalidTokens: [],
    })
    expect(parseDeckCustomBonusSupportUnitsInput("1:idol 21:piapro 22:nope").invalidTokens).toEqual([
      "1:idol",
      "21:piapro",
      "22:nope",
    ])
  })

  it("parses specific skill order input as zero-based order", () => {
    expect(parseDeckSkillOrderInput("12345").values).toEqual([0, 1, 2, 3, 4])
    expect(parseDeckSkillOrderInput("1,5,2,3,4").values).toEqual([0, 4, 1, 2, 3])
    expect(parseDeckSkillOrderInput("11234").invalidTokens).toEqual(["11234"])
    expect(parseDeckSkillOrderInput("1 1 2 3 4 5").invalidTokens).toEqual(["1 1 2 3 4 5"])
  })

  it("resolves current deck cards with leader first", () => {
    const cards = resolveCurrentDeckCards({
      userGamedata: { deck: 7 },
      userDecks: [
        { deckId: 6, leader: 101, member1: 101, member2: 102, member3: 103, member4: 104, member5: 105 },
        { deckId: 7, leader: 205, member1: 201, member2: 202, member3: 203, member4: 204, member5: 205 },
      ],
    })

    expect(cards).toEqual([205, 201, 202, 203, 204])
  })

  it("resolves current deck cards from profile user deck", () => {
    const cards = resolveCurrentDeckCards({
      userDeck: {
        deckId: 99,
        leader: 1005,
        member1: 1001,
        member2: 1002,
        member3: 1003,
        member4: 1004,
        member5: 1005,
      },
    })

    expect(cards).toEqual([1005, 1001, 1002, 1003, 1004])
  })

  it("prefers profile current deck and falls back to suite data", () => {
    const suiteData = {
      userGamedata: { deck: 1 },
      userDecks: [
        { deckId: 1, leader: 201, member1: 201, member2: 202, member3: 203, member4: 204, member5: 205 },
      ],
    }

    expect(resolveCurrentDeckCardsWithProfile(suiteData, {
      userDeck: {
        leader: 105,
        member1: 101,
        member2: 102,
        member3: 103,
        member4: 104,
        member5: 105,
      },
    })).toEqual([105, 101, 102, 103, 104])

    expect(resolveCurrentDeckCardsWithProfile(suiteData, null)).toEqual([201, 202, 203, 204, 205])
  })
})
