import { unwrapGameAccountDataResponse } from "../api/recommend-data"

const USER_GAMEDATA_FIELDS = [
  "userId",
  "deck",
  "customProfileId",
  "rank",
  "exp",
  "totalExp",
  "coin",
  "virtualCoin",
] as const

const USER_AREA_FIELDS = ["areaId"] as const
const USER_AREA_ACTION_SET_FIELDS = ["id", "status"] as const
const USER_AREA_ITEM_FIELDS = ["areaItemId", "level"] as const
const USER_AREA_STATUS_FIELDS = ["areaId", "status"] as const

const USER_CARD_FIELDS = [
  "userId",
  "cardId",
  "level",
  "exp",
  "totalExp",
  "skillLevel",
  "skillExp",
  "totalSkillExp",
  "masterRank",
  "specialTrainingStatus",
  "defaultImage",
] as const

const USER_CARD_EPISODE_FIELDS = ["cardEpisodeId", "scenarioStatus"] as const
const USER_CHARACTER_FIELDS = ["characterId", "characterRank"] as const
const USER_DECK_FIELDS = [
  "userId",
  "deckId",
  "leader",
  "subLeader",
  "member1",
  "member2",
  "member3",
  "member4",
  "member5",
] as const
const USER_HONOR_FIELDS = ["honorId", "level"] as const
const USER_CHALLENGE_LIVE_SOLO_DECK_FIELDS = [
  "characterId",
  "leader",
  "support1",
  "support2",
  "support3",
  "support4",
] as const
const USER_MYSEKAI_CANVAS_FIELDS = ["mysekaiFixtureId", "cardId", "isSpecialTraining", "quantity"] as const
const USER_MYSEKAI_FIXTURE_BONUS_FIELDS = ["gameCharacterId", "totalBonusRate"] as const
const USER_MYSEKAI_GATE_FIELDS = [
  "mysekaiGateId",
  "mysekaiGateSkinId",
  "mysekaiGateLevel",
  "visitCount",
  "isSettingAtHomeSite",
] as const

export function prepareRecommendUserDataForWasm(value: unknown): Record<string, unknown> {
  const userData = unwrapGameAccountDataResponse(value)
  const missingKeys = [
    isRecord(userData.userGamedata) ? null : "userGamedata",
    Array.isArray(userData.userAreas) ? null : "userAreas",
    Array.isArray(userData.userCards) ? null : "userCards",
    Array.isArray(userData.userCharacters) ? null : "userCharacters",
    Array.isArray(userData.userHonors) ? null : "userHonors",
  ].filter((key): key is string => key != null)
  if (missingKeys.length > 0) {
    throw new Error(`invalid suite user data: missing ${missingKeys.join(", ")}`)
  }

  return {
    userGamedata: pickRecord(userData.userGamedata, USER_GAMEDATA_FIELDS),
    userAreas: compactArray(userData.userAreas, compactUserArea),
    userCards: compactArray(userData.userCards, compactUserCard),
    userChallengeLiveSoloDecks: compactArray(
      userData.userChallengeLiveSoloDecks,
      (item) => compactRecord(item, USER_CHALLENGE_LIVE_SOLO_DECK_FIELDS),
    ),
    userCharacters: compactArray(userData.userCharacters, (item) => compactRecord(item, USER_CHARACTER_FIELDS)),
    userDecks: compactArray(userData.userDecks, (item) => compactRecord(item, USER_DECK_FIELDS)),
    userHonors: compactArray(userData.userHonors, (item) => compactRecord(item, USER_HONOR_FIELDS)),
    userMysekaiCanvases: compactArray(
      userData.userMysekaiCanvases,
      (item) => compactRecord(item, USER_MYSEKAI_CANVAS_FIELDS),
    ),
    userMysekaiFixtureGameCharacterPerformanceBonuses: compactArray(
      userData.userMysekaiFixtureGameCharacterPerformanceBonuses,
      (item) => compactRecord(item, USER_MYSEKAI_FIXTURE_BONUS_FIELDS),
    ),
    userMysekaiGates: compactArray(userData.userMysekaiGates, (item) => compactRecord(item, USER_MYSEKAI_GATE_FIELDS)),
  }
}

export function createRecommendUserDataStringForWasm(value: unknown): string {
  return JSON.stringify(prepareRecommendUserDataForWasm(value))
}

function compactUserArea(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }

  return {
    ...pickRecord(value, USER_AREA_FIELDS),
    actionSets: compactArray(value.actionSets, (item) => compactRecord(item, USER_AREA_ACTION_SET_FIELDS)),
    areaItems: compactArray(value.areaItems, (item) => compactRecord(item, USER_AREA_ITEM_FIELDS)),
    userAreaStatus: compactRecord(value.userAreaStatus, USER_AREA_STATUS_FIELDS),
  }
}

function compactUserCard(value: unknown): unknown {
  if (!isRecord(value)) {
    return value
  }

  return {
    ...pickRecord(value, USER_CARD_FIELDS),
    episodes: compactArray(value.episodes, (item) => compactRecord(item, USER_CARD_EPISODE_FIELDS)),
  }
}

function compactArray(value: unknown, compactItem: (item: unknown) => unknown): unknown[] {
  return Array.isArray(value) ? value.map(compactItem) : []
}

function compactRecord<T extends readonly string[]>(value: unknown, fields: T): unknown {
  if (!isRecord(value)) {
    return value
  }

  return pickRecord(value, fields)
}

function pickRecord<T extends readonly string[]>(value: unknown, fields: T): Record<T[number], unknown> {
  const picked = {} as Record<T[number], unknown>
  if (!isRecord(value)) {
    return picked
  }

  for (const field of fields) {
    if (field in value) {
      picked[field] = value[field]
    }
  }

  return picked
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
