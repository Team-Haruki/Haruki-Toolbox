import type { SingleCardConfig } from "haruki-sekai-deck-recommend-cpp"
import type { DeckRecommendEventAttr, DeckRecommendUnitType } from "./recommend-options"
import type { CardTrainingConfig } from "./training-config"

export type DeckRecommendSingleCardEpisodeState = "none" | "first" | "both"

export type DeckRecommendSingleCardOverride = {
  cardId: number
  disabled: boolean
  level: number | null
  skillLevel: number | null
  masterRank: number | null
  episodeState: DeckRecommendSingleCardEpisodeState | null
  canvas: boolean | null
}

export type DeckRecommendAreaItemLevelOverride = {
  areaItemId: number
  level: number
}

export type DeckRecommendCharacterRankOverride = {
  characterId: number
  rank: number
}

export type DeckRecommendMysekaiGateLevelOverride = {
  mysekaiGateId: number
  level: number
}

export type DeckRecommendMysekaiFixtureBonusRateOverride = {
  characterId: number
  totalBonusRate: number
}

export type PrepareDeckRecommendUserDataInput = {
  userData: unknown
  masterData: Record<string, unknown>
  unitFilters?: readonly DeckRecommendUnitType[] | null
  attrFilters?: readonly DeckRecommendEventAttr[] | null
  characterFilters?: readonly number[] | null
  areaItemLevel?: number | null
  areaItemLevelOverrides?: readonly DeckRecommendAreaItemLevelOverride[]
  characterRank?: number | null
  characterRankOverrides?: readonly DeckRecommendCharacterRankOverride[]
  mysekaiGateLevel?: number | null
  mysekaiGateLevelOverrides?: readonly DeckRecommendMysekaiGateLevelOverride[]
  mysekaiFixtureBonusRate?: number | null
  mysekaiFixtureBonusRateOverrides?: readonly DeckRecommendMysekaiFixtureBonusRateOverride[]
  singleCardOverrides?: readonly DeckRecommendSingleCardOverride[]
  trainingConfig?: readonly CardTrainingConfig[]
}

export type PreparedDeckRecommendUserData = {
  userData: Record<string, unknown>
  singleCardConfigs: SingleCardConfig[]
}

type UserCardRecord = Record<string, unknown> & {
  cardId?: number
  level?: number
  skillLevel?: number
  masterRank?: number
  specialTrainingStatus?: string
  defaultImage?: string
  episodes?: Array<Record<string, unknown>>
}

type MasterCardRecord = {
  id?: number
  characterId?: number
  cardRarityType?: string
  attr?: string
  supportUnit?: string
}

type MasterCardEpisodeRecord = {
  id?: number
  cardId?: number
  cardEpisodePartType?: string
}

type MasterCardRarityRecord = {
  cardRarityType?: string
  maxLevel?: number
  trainingMaxLevel?: number
  maxSkillLevel?: number
}

type UserAreaRecord = Record<string, unknown> & {
  areaId?: number
  areaItems?: Array<Record<string, unknown>>
}

type UserCharacterRecord = Record<string, unknown> & {
  characterId?: number
  characterRank?: number
}

type UserMysekaiGateRecord = Record<string, unknown> & {
  mysekaiGateId?: number
  mysekaiGateLevel?: number
}

type UserMysekaiFixtureBonusRecord = Record<string, unknown> & {
  gameCharacterId?: number
  totalBonusRate?: number
}

type MasterAreaItemRecord = {
  id?: number
  areaId?: number
}

type MasterCharacterRankRecord = {
  characterId?: number
  gameCharacterId?: number
  characterRank?: number
  rank?: number
}

type MasterMysekaiGateRecord = {
  id?: number
}

type MasterMysekaiGateLevelRecord = {
  mysekaiGateId?: number
  mysekaiGateLevel?: number
  level?: number
}

export function prepareDeckRecommendUserData(input: PrepareDeckRecommendUserDataInput): PreparedDeckRecommendUserData {
  const userData = deepCloneRecord(input.userData)
  const cardMap = buildMasterCardMap(input.masterData.cards)
  const characterUnitMap = buildCharacterUnitMap(input.masterData.gameCharacters)
  const rarityMap = buildRarityMap(input.masterData.cardRarities)
  const episodeMap = buildCardEpisodeMap(input.masterData.cardEpisodes)
  const singleCardConfigs = buildSingleCardConfigs(input.singleCardOverrides, cardMap, input.trainingConfig)
  const unitFilters = createFilterSet(input.unitFilters)
  const attrFilters = createFilterSet(input.attrFilters)
  const characterFilters = createPositiveIntegerFilterSet(input.characterFilters)

  userData.userCards = prepareUserCards({
    userCards: userData.userCards,
    cardMap,
    characterUnitMap,
    rarityMap,
    episodeMap,
    unitFilters,
    attrFilters,
    characterFilters,
    singleCardOverrides: input.singleCardOverrides ?? [],
  })

  if (input.areaItemLevel != null && input.areaItemLevel > 0) {
    userData.userAreas = applyAreaItemLevel(
      userData.userAreas,
      input.masterData.areaItems,
      input.masterData.areaItemLevels,
      input.areaItemLevel,
    )
  }

  if (input.areaItemLevelOverrides && input.areaItemLevelOverrides.length > 0) {
    userData.userAreas = applyAreaItemLevelOverrides(
      userData.userAreas,
      input.masterData.areaItems,
      input.masterData.areaItemLevels,
      input.areaItemLevelOverrides,
    )
  }

  userData.userCharacters = applyCharacterRankOverrides(
    userData.userCharacters,
    input.masterData.gameCharacters,
    input.masterData.characterRanks,
    input.characterRank,
    input.characterRankOverrides,
  )

  userData.userMysekaiGates = applyMysekaiGateLevelOverrides(
    userData.userMysekaiGates,
    input.masterData.mysekaiGates,
    input.masterData.mysekaiGateLevels,
    input.mysekaiGateLevel,
    input.mysekaiGateLevelOverrides,
  )

  userData.userMysekaiFixtureGameCharacterPerformanceBonuses = applyMysekaiFixtureBonusRateOverrides(
    userData.userMysekaiFixtureGameCharacterPerformanceBonuses,
    input.masterData.gameCharacters,
    input.mysekaiFixtureBonusRate,
    input.mysekaiFixtureBonusRateOverrides,
  )

  return {
    userData,
    singleCardConfigs,
  }
}

export function createPreparedDeckRecommendUserDataString(input: PrepareDeckRecommendUserDataInput): {
  userDataString: string
  singleCardConfigs: SingleCardConfig[]
} {
  const prepared = prepareDeckRecommendUserData(input)
  return {
    userDataString: JSON.stringify(prepared.userData),
    singleCardConfigs: prepared.singleCardConfigs,
  }
}

export function applyChallengeScoreDelta<T extends { score: number; live_score?: number; challenge_score_delta?: number }>(
  decks: T[],
  userData: unknown,
  characterId: string | number | null,
): T[] {
  const highScore = resolveChallengeHighScore(userData, characterId)
  return decks.map((deck) => ({
    ...deck,
    challenge_score_delta: (Number(deck.live_score) || deck.score) - highScore,
  }))
}

function prepareUserCards(input: {
  userCards: unknown
  cardMap: ReadonlyMap<number, MasterCardRecord>
  characterUnitMap: ReadonlyMap<number, DeckRecommendUnitType>
  rarityMap: ReadonlyMap<string, MasterCardRarityRecord>
  episodeMap: ReadonlyMap<number, MasterCardEpisodeRecord[]>
  unitFilters: ReadonlySet<DeckRecommendUnitType>
  attrFilters: ReadonlySet<DeckRecommendEventAttr>
  characterFilters: ReadonlySet<number>
  singleCardOverrides: readonly DeckRecommendSingleCardOverride[]
}): UserCardRecord[] {
  const overrides = new Map(
    input.singleCardOverrides
      .filter((item) => Number.isInteger(item.cardId) && item.cardId > 0)
      .map((item) => [item.cardId, item]),
  )
  const sourceCards = Array.isArray(input.userCards) ? input.userCards : []
  const preparedCards: UserCardRecord[] = []

  for (const rawCard of sourceCards) {
    if (!isRecord(rawCard)) {
      continue
    }

    const cardId = normalizePositiveInteger(rawCard.cardId)
    if (!cardId) {
      continue
    }

    const override = overrides.get(cardId)
    if (override?.disabled) {
      continue
    }

    const masterCard = input.cardMap.get(cardId)
    if (!matchesFilters(masterCard, input.characterUnitMap, input.unitFilters, input.attrFilters, input.characterFilters)) {
      continue
    }

    preparedCards.push(applySingleCardOverride(rawCard, masterCard, input.rarityMap, input.episodeMap, override))
  }

  const existingIds = new Set(preparedCards.map((card) => normalizePositiveInteger(card.cardId)).filter(Boolean))
  for (const override of overrides.values()) {
    if (override.disabled || existingIds.has(override.cardId)) {
      continue
    }

    const masterCard = input.cardMap.get(override.cardId)
    if (!masterCard || !matchesFilters(masterCard, input.characterUnitMap, input.unitFilters, input.attrFilters, input.characterFilters)) {
      continue
    }

    preparedCards.push(applySingleCardOverride(createSyntheticUserCard(override.cardId), masterCard, input.rarityMap, input.episodeMap, override))
  }

  return preparedCards
}

function matchesFilters(
  masterCard: MasterCardRecord | undefined,
  characterUnitMap: ReadonlyMap<number, DeckRecommendUnitType>,
  unitFilters: ReadonlySet<DeckRecommendUnitType>,
  attrFilters: ReadonlySet<DeckRecommendEventAttr>,
  characterFilters: ReadonlySet<number>,
): boolean {
  if (!masterCard) {
    return false
  }
  if (unitFilters.size === 0 && attrFilters.size === 0 && characterFilters.size === 0) {
    return true
  }
  if (characterFilters.size > 0 && !characterFilters.has(normalizePositiveInteger(masterCard.characterId) ?? 0)) {
    return false
  }
  if (attrFilters.size > 0 && !attrFilters.has(masterCard.attr as DeckRecommendEventAttr)) {
    return false
  }
  if (unitFilters.size > 0) {
    const cardUnit = resolveCardUnit(masterCard, characterUnitMap)
    if (!cardUnit || !unitFilters.has(cardUnit)) {
      return false
    }
  }
  return true
}

function createFilterSet<T extends string>(values: readonly T[] | null | undefined): ReadonlySet<T> {
  if (!values || values.length === 0) {
    return new Set()
  }
  return new Set(values.filter(Boolean))
}

function createPositiveIntegerFilterSet(values: readonly number[] | null | undefined): ReadonlySet<number> {
  if (!values || values.length === 0) {
    return new Set()
  }

  return new Set(values.filter((value) => Number.isInteger(value) && value > 0))
}

function applySingleCardOverride(
  rawCard: Record<string, unknown>,
  masterCard: MasterCardRecord | undefined,
  rarityMap: ReadonlyMap<string, MasterCardRarityRecord>,
  episodeMap: ReadonlyMap<number, MasterCardEpisodeRecord[]>,
  override: DeckRecommendSingleCardOverride | undefined,
): UserCardRecord {
  const card = { ...rawCard } as UserCardRecord
  if (!override) {
    return card
  }

  const rarity = masterCard?.cardRarityType
  const rarityConfig = rarity ? rarityMap.get(rarity) : null
  const maxLevel = rarityConfig?.trainingMaxLevel || rarityConfig?.maxLevel || null
  const maxSkillLevel = rarityConfig?.maxSkillLevel || null
  const level = normalizeBoundedInteger(override.level, 1, maxLevel)
  const skillLevel = normalizeBoundedInteger(override.skillLevel, 1, maxSkillLevel)
  const masterRank = normalizeBoundedInteger(override.masterRank, 0, 5)
  if (level != null) {
    card.level = level
  }
  if (skillLevel != null) {
    card.skillLevel = skillLevel
  }
  if (masterRank != null) {
    card.masterRank = masterRank
  }
  if (masterCard && card.level && rarityConfig?.trainingMaxLevel && card.level >= rarityConfig.trainingMaxLevel) {
    card.specialTrainingStatus = "done"
    card.defaultImage = "special_training"
  }
  if (override.episodeState != null && override.episodeState !== "none") {
    card.episodes = applyEpisodeOverride(episodeMap.get(override.cardId) ?? [], override.episodeState)
  }
  return card
}

function applyEpisodeOverride(
  episodes: readonly MasterCardEpisodeRecord[],
  episodeState: DeckRecommendSingleCardEpisodeState,
): Array<Record<string, unknown>> {
  const allowedParts = episodeState === "both"
    ? new Set(["first_part", "second_part"])
    : new Set(["first_part"])

  return episodes
    .filter((episode) => episode.id && allowedParts.has(String(episode.cardEpisodePartType)))
    .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
    .map((episode) => ({
      cardEpisodeId: episode.id,
      scenarioStatus: "already_read",
    }))
}

function createSyntheticUserCard(cardId: number): UserCardRecord {
  return {
    userId: 0,
    cardId,
    level: 1,
    exp: 0,
    totalExp: 0,
    skillLevel: 1,
    skillExp: 0,
    totalSkillExp: 0,
    masterRank: 0,
    specialTrainingStatus: "not_doing",
    defaultImage: "original",
    episodes: [],
  }
}

function buildSingleCardConfigs(
  overrides: readonly DeckRecommendSingleCardOverride[] | undefined,
  cardMap: ReadonlyMap<number, MasterCardRecord>,
  trainingConfig: readonly CardTrainingConfig[] | undefined,
): SingleCardConfig[] {
  if (!overrides) {
    return []
  }

  return overrides
    .filter((item) => Number.isInteger(item.cardId) && item.cardId > 0)
    .map((item) => {
      const baseConfig = createSingleCardBaseConfig(item.cardId, cardMap, trainingConfig)
      const config: SingleCardConfig = {
        ...baseConfig,
        card_id: item.cardId,
      }
      const level = normalizeBoundedInteger(item.level, 1, null)
      const skillLevel = normalizeBoundedInteger(item.skillLevel, 1, null)
      const masterRank = normalizeBoundedInteger(item.masterRank, 0, 5)

      if (item.disabled || baseConfig.disable != null) {
        config.disable = item.disabled
      }
      if (item.canvas != null) {
        config.canvas = item.canvas
      }
      if (level != null) {
        config.level = level
      }
      if (skillLevel != null) {
        config.skill_level = skillLevel
      }
      if (masterRank != null) {
        config.master_rank = masterRank
      }
      if (item.episodeState != null) {
        config.episode_read_count = toEpisodeReadCount(item.episodeState)
      }

      return config
    })
    .filter(hasSingleCardConfigOverride)
}

function createSingleCardBaseConfig(
  cardId: number,
  cardMap: ReadonlyMap<number, MasterCardRecord>,
  trainingConfig: readonly CardTrainingConfig[] | undefined,
): Omit<SingleCardConfig, "card_id"> {
  const rarity = cardMap.get(cardId)?.cardRarityType
  const config = rarity ? trainingConfig?.find((item) => item.rarity === rarity) : null
  if (!config) {
    return {}
  }

  return {
    disable: config.disabled,
    level_max: config.maxLevel,
    episode_read: config.episodesRead,
    master_max: config.maxMasterRank,
    skill_max: config.maxSkillLevel,
    canvas: config.mySekaiCanvas,
  }
}

export function resolveMaxAreaItemLevel(areaItemLevels: unknown): number | null {
  if (!Array.isArray(areaItemLevels)) {
    return null
  }

  let maxLevel = 0
  for (const item of areaItemLevels) {
    if (!isRecord(item)) {
      continue
    }

    const level = normalizePositiveInteger(item.level)
    if (level && level > maxLevel) {
      maxLevel = level
    }
  }

  return maxLevel > 0 ? maxLevel : null
}

function buildAreaItemMaxLevelMap(areaItemLevels: unknown): Map<number, number> {
  const levels = new Map<number, number>()
  if (!Array.isArray(areaItemLevels)) {
    return levels
  }

  for (const item of areaItemLevels) {
    if (!isRecord(item)) {
      continue
    }

    const itemId = normalizePositiveInteger(item.areaItemId)
    const level = normalizePositiveInteger(item.level)
    if (itemId && level && level > (levels.get(itemId) ?? 0)) {
      levels.set(itemId, level)
    }
  }

  return levels
}

function buildAreaItemAreaMap(areaItems: unknown): Map<number, number> {
  const areaMap = new Map<number, number>()
  if (!Array.isArray(areaItems)) {
    return areaMap
  }

  for (const item of areaItems) {
    if (!isRecord(item)) {
      continue
    }

    const areaItem = item as MasterAreaItemRecord
    const itemId = normalizePositiveInteger(areaItem.id)
    const areaId = normalizePositiveInteger(areaItem.areaId)
    if (itemId && areaId) {
      areaMap.set(itemId, areaId)
    }
  }

  return areaMap
}

function applyAreaItemLevel(userAreas: unknown, areaItems: unknown, areaItemLevels: unknown, targetLevel: number): UserAreaRecord[] {
  const targetLevels = new Map<number, number>()
  const maxLevels = buildAreaItemMaxLevelMap(areaItemLevels)
  const areaItemAreaMap = buildAreaItemAreaMap(areaItems)
  const sourceAreas = Array.isArray(userAreas) ? userAreas.filter(isRecord) as UserAreaRecord[] : []
  for (const area of sourceAreas) {
    if (!Array.isArray(area.areaItems)) {
      continue
    }

    for (const item of area.areaItems) {
      if (!isRecord(item)) {
        continue
      }

      const itemId = normalizePositiveInteger(item.areaItemId)
      const level = normalizePositiveInteger(item.level) ?? 0
      if (itemId && level > (targetLevels.get(itemId) ?? 0)) {
        targetLevels.set(itemId, level)
      }
    }
  }

  if (Array.isArray(areaItems)) {
    for (const item of areaItems) {
      if (!isRecord(item)) {
        continue
      }

      const itemId = normalizePositiveInteger(item.id)
      if (itemId && maxLevels.has(itemId) && !targetLevels.has(itemId)) {
        targetLevels.set(itemId, 0)
      }
    }
  }

  if (targetLevels.size === 0) {
    return sourceAreas
  }

  for (const areaItemId of targetLevels.keys()) {
    targetLevels.set(areaItemId, clampAreaItemLevel(targetLevel, maxLevels.get(areaItemId)))
  }

  const emittedAreaItemIds = new Set<number>()
  const preparedAreas = sourceAreas.map((area) => {
    const preparedAreaItems: Record<string, unknown>[] = []
    const sourceAreaItems = Array.isArray(area.areaItems) ? area.areaItems : []
    for (const item of sourceAreaItems) {
      if (!isRecord(item)) {
        continue
      }

      const itemId = normalizePositiveInteger(item.areaItemId)
      if (!itemId || emittedAreaItemIds.has(itemId) || !targetLevels.has(itemId)) {
        continue
      }

      emittedAreaItemIds.add(itemId)
      preparedAreaItems.push({
        ...item,
        level: targetLevels.get(itemId),
      })
    }

    return {
      ...area,
      areaItems: preparedAreaItems,
    }
  })
  const preparedAreaById = new Map<number, UserAreaRecord>()
  for (const area of preparedAreas) {
    const areaId = normalizePositiveInteger(area.areaId)
    if (areaId) {
      preparedAreaById.set(areaId, area)
    }
  }

  for (const [areaItemId, level] of [...targetLevels.entries()].sort(([left], [right]) => left - right)) {
    if (emittedAreaItemIds.has(areaItemId)) {
      continue
    }

    const areaId = areaItemAreaMap.get(areaItemId)
    if (!areaId) {
      continue
    }

    let area = preparedAreaById.get(areaId)
    if (!area) {
      area = {
        areaId,
        actionSets: [],
        areaItems: [],
        userAreaStatus: {
          areaId,
          status: "released",
        },
      }
      preparedAreaById.set(areaId, area)
      preparedAreas.push(area)
    }

    area.areaItems ??= []
    area.areaItems.push({ areaItemId, level })
    emittedAreaItemIds.add(areaItemId)
  }

  return preparedAreas
}

function applyAreaItemLevelOverrides(
  userAreas: unknown,
  areaItems: unknown,
  areaItemLevels: unknown,
  overrides: readonly DeckRecommendAreaItemLevelOverride[],
): UserAreaRecord[] {
  const targetLevels = new Map<number, number>()
  const maxLevels = buildAreaItemMaxLevelMap(areaItemLevels)
  const areaItemAreaMap = buildAreaItemAreaMap(areaItems)
  const sourceAreas = Array.isArray(userAreas) ? userAreas.filter(isRecord) as UserAreaRecord[] : []

  for (const override of overrides) {
    const areaItemId = normalizePositiveInteger(override.areaItemId)
    const level = normalizePositiveInteger(override.level)
    if (!areaItemId || !level || !maxLevels.has(areaItemId)) {
      continue
    }

    targetLevels.set(areaItemId, clampAreaItemLevel(level, maxLevels.get(areaItemId)))
  }

  if (targetLevels.size === 0) {
    return sourceAreas
  }

  const emittedAreaItemIds = new Set<number>()
  const preparedAreas = sourceAreas.map((area) => {
    const preparedAreaItems: Record<string, unknown>[] = []
    const sourceAreaItems = Array.isArray(area.areaItems) ? area.areaItems : []
    for (const item of sourceAreaItems) {
      if (!isRecord(item)) {
        continue
      }

      const itemId = normalizePositiveInteger(item.areaItemId)
      if (!itemId || emittedAreaItemIds.has(itemId)) {
        continue
      }

      emittedAreaItemIds.add(itemId)
      preparedAreaItems.push({
        ...item,
        level: targetLevels.get(itemId) ?? item.level,
      })
    }

    return {
      ...area,
      areaItems: preparedAreaItems,
    }
  })

  const preparedAreaById = new Map<number, UserAreaRecord>()
  for (const area of preparedAreas) {
    const areaId = normalizePositiveInteger(area.areaId)
    if (areaId) {
      preparedAreaById.set(areaId, area)
    }
  }

  for (const [areaItemId, level] of [...targetLevels.entries()].sort(([left], [right]) => left - right)) {
    if (emittedAreaItemIds.has(areaItemId)) {
      continue
    }

    const areaId = areaItemAreaMap.get(areaItemId)
    if (!areaId) {
      continue
    }

    let area = preparedAreaById.get(areaId)
    if (!area) {
      area = {
        areaId,
        actionSets: [],
        areaItems: [],
        userAreaStatus: {
          areaId,
          status: "released",
        },
      }
      preparedAreaById.set(areaId, area)
      preparedAreas.push(area)
    }

    area.areaItems ??= []
    area.areaItems.push({ areaItemId, level })
    emittedAreaItemIds.add(areaItemId)
  }

  return preparedAreas
}

function clampAreaItemLevel(level: number, maxLevel: number | undefined): number {
  return maxLevel ? Math.min(level, maxLevel) : level
}

function applyCharacterRankOverrides(
  userCharacters: unknown,
  gameCharacters: unknown,
  characterRanks: unknown,
  uniformRank: number | null | undefined,
  overrides: readonly DeckRecommendCharacterRankOverride[] | undefined,
): UserCharacterRecord[] {
  const sourceCharacters = Array.isArray(userCharacters) ? userCharacters.filter(isRecord) as UserCharacterRecord[] : []
  const maxRankMap = buildCharacterMaxRankMap(gameCharacters, characterRanks)
  const targetRanks = new Map<number, number>()
  const normalizedUniformRank = normalizePositiveInteger(uniformRank)
  const normalizedOverrides = normalizeCharacterRankOverrides(overrides, maxRankMap)

  if (normalizedUniformRank) {
    for (const characterId of maxRankMap.keys()) {
      targetRanks.set(characterId, clampPositiveLevel(normalizedUniformRank, maxRankMap.get(characterId)))
    }
  }

  for (const [characterId, rank] of normalizedOverrides) {
    targetRanks.set(characterId, rank)
  }

  if (targetRanks.size === 0) {
    return sourceCharacters
  }

  const emittedCharacterIds = new Set<number>()
  const preparedCharacters: UserCharacterRecord[] = []
  for (const character of sourceCharacters) {
    const characterId = normalizePositiveInteger(character.characterId)
    if (!characterId || emittedCharacterIds.has(characterId)) {
      continue
    }

    emittedCharacterIds.add(characterId)
    preparedCharacters.push({
      ...character,
      characterRank: targetRanks.get(characterId) ?? character.characterRank,
    })
  }

  for (const [characterId, rank] of [...targetRanks.entries()].sort(([left], [right]) => left - right)) {
    if (emittedCharacterIds.has(characterId)) {
      continue
    }

    preparedCharacters.push({
      characterId,
      characterRank: rank,
    })
  }

  return preparedCharacters
}

function applyMysekaiGateLevelOverrides(
  userMysekaiGates: unknown,
  mysekaiGates: unknown,
  mysekaiGateLevels: unknown,
  uniformLevel: number | null | undefined,
  overrides: readonly DeckRecommendMysekaiGateLevelOverride[] | undefined,
): UserMysekaiGateRecord[] {
  const sourceGates = Array.isArray(userMysekaiGates) ? userMysekaiGates.filter(isRecord) as UserMysekaiGateRecord[] : []
  const maxLevelMap = buildMysekaiGateMaxLevelMap(mysekaiGates, mysekaiGateLevels)
  const targetLevels = new Map<number, number>()
  const normalizedUniformLevel = normalizePositiveInteger(uniformLevel)
  const normalizedOverrides = normalizeMysekaiGateLevelOverrides(overrides, maxLevelMap)

  if (normalizedUniformLevel) {
    for (const gateId of maxLevelMap.keys()) {
      targetLevels.set(gateId, clampPositiveLevel(normalizedUniformLevel, maxLevelMap.get(gateId)))
    }
  }

  for (const [gateId, level] of normalizedOverrides) {
    targetLevels.set(gateId, level)
  }

  if (targetLevels.size === 0) {
    return sourceGates
  }

  const emittedGateIds = new Set<number>()
  const preparedGates: UserMysekaiGateRecord[] = []
  for (const gate of sourceGates) {
    const gateId = normalizePositiveInteger(gate.mysekaiGateId)
    if (!gateId || emittedGateIds.has(gateId)) {
      continue
    }

    emittedGateIds.add(gateId)
    preparedGates.push({
      ...gate,
      mysekaiGateLevel: targetLevels.get(gateId) ?? gate.mysekaiGateLevel,
    })
  }

  for (const [gateId, level] of [...targetLevels.entries()].sort(([left], [right]) => left - right)) {
    if (emittedGateIds.has(gateId)) {
      continue
    }

    preparedGates.push({
      mysekaiGateId: gateId,
      mysekaiGateSkinId: 0,
      mysekaiGateLevel: level,
      visitCount: 0,
      isSettingAtHomeSite: true,
    })
  }

  return preparedGates
}

function applyMysekaiFixtureBonusRateOverrides(
  userFixtureBonuses: unknown,
  gameCharacters: unknown,
  uniformRate: number | null | undefined,
  overrides: readonly DeckRecommendMysekaiFixtureBonusRateOverride[] | undefined,
): UserMysekaiFixtureBonusRecord[] {
  const sourceBonuses = Array.isArray(userFixtureBonuses)
    ? userFixtureBonuses.filter(isRecord) as UserMysekaiFixtureBonusRecord[]
    : []
  const characterIds = buildGameCharacterIdSet(gameCharacters)
  const targetRates = new Map<number, number>()
  const normalizedUniformRate = normalizeFixtureBonusRate(uniformRate)
  const normalizedOverrides = normalizeMysekaiFixtureBonusRateOverrides(overrides, characterIds)

  if (normalizedUniformRate != null) {
    for (const characterId of characterIds) {
      targetRates.set(characterId, normalizedUniformRate)
    }
  }

  for (const [characterId, rate] of normalizedOverrides) {
    targetRates.set(characterId, rate)
  }

  if (targetRates.size === 0) {
    return sourceBonuses
  }

  const emittedCharacterIds = new Set<number>()
  const preparedBonuses: UserMysekaiFixtureBonusRecord[] = []
  for (const bonus of sourceBonuses) {
    const characterId = normalizePositiveInteger(bonus.gameCharacterId)
    if (!characterId || emittedCharacterIds.has(characterId)) {
      continue
    }

    emittedCharacterIds.add(characterId)
    preparedBonuses.push({
      ...bonus,
      totalBonusRate: targetRates.get(characterId) ?? bonus.totalBonusRate,
    })
  }

  for (const [characterId, totalBonusRate] of [...targetRates.entries()].sort(([left], [right]) => left - right)) {
    if (emittedCharacterIds.has(characterId)) {
      continue
    }

    preparedBonuses.push({
      gameCharacterId: characterId,
      totalBonusRate,
    })
  }

  return preparedBonuses
}

function buildCharacterMaxRankMap(gameCharacters: unknown, characterRanks: unknown): Map<number, number> {
  const map = new Map<number, number>()
  if (Array.isArray(gameCharacters)) {
    for (const item of gameCharacters) {
      if (!isRecord(item)) {
        continue
      }

      const characterId = normalizePositiveInteger(item.id)
      if (characterId) {
        map.set(characterId, 0)
      }
    }
  }

  if (Array.isArray(characterRanks)) {
    for (const item of characterRanks) {
      if (!isRecord(item)) {
        continue
      }

      const rankItem = item as MasterCharacterRankRecord
      const characterId = normalizePositiveInteger(rankItem.characterId) ?? normalizePositiveInteger(rankItem.gameCharacterId)
      const rank = normalizePositiveInteger(rankItem.characterRank) ?? normalizePositiveInteger(rankItem.rank)
      if (characterId && rank) {
        map.set(characterId, Math.max(map.get(characterId) ?? 0, rank))
      }
    }
  }

  return new Map([...map.entries()].filter(([, maxRank]) => maxRank > 0))
}

function buildMysekaiGateMaxLevelMap(mysekaiGates: unknown, mysekaiGateLevels: unknown): Map<number, number> {
  const map = new Map<number, number>()
  if (Array.isArray(mysekaiGates)) {
    for (const item of mysekaiGates) {
      if (!isRecord(item)) {
        continue
      }

      const gateId = normalizePositiveInteger((item as MasterMysekaiGateRecord).id)
      if (gateId) {
        map.set(gateId, 0)
      }
    }
  }

  if (Array.isArray(mysekaiGateLevels)) {
    for (const item of mysekaiGateLevels) {
      if (!isRecord(item)) {
        continue
      }

      const levelItem = item as MasterMysekaiGateLevelRecord
      const gateId = normalizePositiveInteger(levelItem.mysekaiGateId)
      const level = normalizePositiveInteger(levelItem.mysekaiGateLevel) ?? normalizePositiveInteger(levelItem.level)
      if (gateId && level) {
        map.set(gateId, Math.max(map.get(gateId) ?? 0, level))
      }
    }
  }

  return new Map([...map.entries()].filter(([, maxLevel]) => maxLevel > 0))
}

function buildGameCharacterIdSet(gameCharacters: unknown): Set<number> {
  const set = new Set<number>()
  if (!Array.isArray(gameCharacters)) {
    return set
  }

  for (const item of gameCharacters) {
    if (!isRecord(item)) {
      continue
    }

    const characterId = normalizePositiveInteger(item.id)
    if (characterId) {
      set.add(characterId)
    }
  }

  return set
}

function normalizeCharacterRankOverrides(
  overrides: readonly DeckRecommendCharacterRankOverride[] | undefined,
  maxRankMap: ReadonlyMap<number, number>,
): Map<number, number> {
  const map = new Map<number, number>()
  for (const override of overrides ?? []) {
    const characterId = normalizePositiveInteger(override.characterId)
    const rank = normalizePositiveInteger(override.rank)
    if (!characterId || !rank || !maxRankMap.has(characterId)) {
      continue
    }

    map.set(characterId, clampPositiveLevel(rank, maxRankMap.get(characterId)))
  }
  return map
}

function normalizeMysekaiGateLevelOverrides(
  overrides: readonly DeckRecommendMysekaiGateLevelOverride[] | undefined,
  maxLevelMap: ReadonlyMap<number, number>,
): Map<number, number> {
  const map = new Map<number, number>()
  for (const override of overrides ?? []) {
    const gateId = normalizePositiveInteger(override.mysekaiGateId)
    const level = normalizePositiveInteger(override.level)
    if (!gateId || !level || !maxLevelMap.has(gateId)) {
      continue
    }

    map.set(gateId, clampPositiveLevel(level, maxLevelMap.get(gateId)))
  }
  return map
}

function normalizeMysekaiFixtureBonusRateOverrides(
  overrides: readonly DeckRecommendMysekaiFixtureBonusRateOverride[] | undefined,
  characterIds: ReadonlySet<number>,
): Map<number, number> {
  const map = new Map<number, number>()
  for (const override of overrides ?? []) {
    const characterId = normalizePositiveInteger(override.characterId)
    const totalBonusRate = normalizeFixtureBonusRate(override.totalBonusRate)
    if (!characterId || totalBonusRate == null || !characterIds.has(characterId)) {
      continue
    }

    map.set(characterId, totalBonusRate)
  }
  return map
}

function normalizeFixtureBonusRate(value: unknown): number | null {
  const numericValue = typeof value === "string" ? Number(value) : value
  if (!Number.isInteger(numericValue) || numericValue < 0 || numericValue > 100) {
    return null
  }

  return numericValue
}

function clampPositiveLevel(level: number, maxLevel: number | undefined): number {
  return maxLevel ? Math.min(level, maxLevel) : level
}

function resolveChallengeHighScore(userData: unknown, characterId: string | number | null): number {
  const targetCharacterId = typeof characterId === "string" ? Number(characterId) : characterId
  if (!Number.isInteger(targetCharacterId) || !targetCharacterId) {
    return 0
  }
  if (!isRecord(userData) || !Array.isArray(userData.userChallengeLiveSoloResults)) {
    return 0
  }

  for (const item of userData.userChallengeLiveSoloResults) {
    if (!isRecord(item)) {
      continue
    }
    const itemCharacterId = normalizePositiveInteger(item.characterId)
    const highScore = normalizeNonNegativeInteger(item.highScore)
    if (itemCharacterId === targetCharacterId && highScore != null) {
      return highScore
    }
  }
  return 0
}

function normalizeNonNegativeInteger(value: unknown): number | null {
  const numericValue = typeof value === "string" ? Number(value) : value
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    return null
  }

  return numericValue
}

function buildMasterCardMap(rawCards: unknown): Map<number, MasterCardRecord> {
  const map = new Map<number, MasterCardRecord>()
  if (!Array.isArray(rawCards)) {
    return map
  }
  for (const rawCard of rawCards) {
    if (!isRecord(rawCard)) {
      continue
    }
    const id = normalizePositiveInteger(rawCard.id)
    if (!id) {
      continue
    }
    map.set(id, {
      id,
      characterId: normalizePositiveInteger(rawCard.characterId) ?? undefined,
      cardRarityType: normalizeText(rawCard.cardRarityType) ?? undefined,
      attr: normalizeText(rawCard.attr) ?? undefined,
      supportUnit: normalizeText(rawCard.supportUnit) ?? undefined,
    })
  }
  return map
}

function buildCharacterUnitMap(rawCharacters: unknown): Map<number, DeckRecommendUnitType> {
  const map = new Map<number, DeckRecommendUnitType>()
  if (!Array.isArray(rawCharacters)) {
    return map
  }
  for (const rawCharacter of rawCharacters) {
    if (!isRecord(rawCharacter)) {
      continue
    }
    const id = normalizePositiveInteger(rawCharacter.id)
    const unit = normalizeUnit(rawCharacter.unit)
    if (id && unit) {
      map.set(id, unit)
    }
  }
  return map
}

function buildRarityMap(rawRarities: unknown): Map<string, MasterCardRarityRecord> {
  const map = new Map<string, MasterCardRarityRecord>()
  if (!Array.isArray(rawRarities)) {
    return map
  }
  for (const rawRarity of rawRarities) {
    if (!isRecord(rawRarity)) {
      continue
    }
    const rarity = normalizeText(rawRarity.cardRarityType)
    if (!rarity) {
      continue
    }
    map.set(rarity, {
      cardRarityType: rarity,
      maxLevel: normalizePositiveInteger(rawRarity.maxLevel) ?? undefined,
      trainingMaxLevel: normalizePositiveInteger(rawRarity.trainingMaxLevel) ?? undefined,
      maxSkillLevel: normalizePositiveInteger(rawRarity.maxSkillLevel) ?? undefined,
    })
  }
  return map
}

function buildCardEpisodeMap(rawEpisodes: unknown): Map<number, MasterCardEpisodeRecord[]> {
  const map = new Map<number, MasterCardEpisodeRecord[]>()
  if (!Array.isArray(rawEpisodes)) {
    return map
  }
  for (const rawEpisode of rawEpisodes) {
    if (!isRecord(rawEpisode)) {
      continue
    }
    const id = normalizePositiveInteger(rawEpisode.id)
    const cardId = normalizePositiveInteger(rawEpisode.cardId)
    if (!id || !cardId) {
      continue
    }
    const items = map.get(cardId) ?? []
    items.push({
      id,
      cardId,
      cardEpisodePartType: normalizeText(rawEpisode.cardEpisodePartType) ?? undefined,
    })
    map.set(cardId, items)
  }
  return map
}

function resolveCardUnit(
  masterCard: MasterCardRecord,
  characterUnitMap: ReadonlyMap<number, DeckRecommendUnitType>,
): DeckRecommendUnitType | null {
  const supportUnit = normalizeUnit(masterCard.supportUnit)
  if (supportUnit && supportUnit !== "piapro") {
    return supportUnit
  }

  return masterCard.characterId ? characterUnitMap.get(masterCard.characterId) ?? null : null
}

function deepCloneRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    return {}
  }

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>
}

function normalizeBoundedInteger(value: number | null, min: number, max: number | null): number | null {
  if (!Number.isInteger(value) || value == null || value < min) {
    return null
  }

  return max != null ? Math.min(value, max) : value
}

function toEpisodeReadCount(value: DeckRecommendSingleCardEpisodeState): number {
  switch (value) {
    case "both":
      return 2
    case "first":
      return 1
    default:
      return 0
  }
}

function hasSingleCardConfigOverride(value: SingleCardConfig): boolean {
  return value.disable != null
    || value.level_max != null
    || value.episode_read != null
    || value.master_max != null
    || value.skill_max != null
    || value.canvas != null
    || value.level != null
    || value.skill_level != null
    || value.master_rank != null
    || value.episode_read_count != null
}

function normalizePositiveInteger(value: unknown): number | null {
  const numericValue = typeof value === "string" ? Number(value) : value
  return typeof numericValue === "number" && Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function normalizeUnit(value: unknown): DeckRecommendUnitType | null {
  switch (value) {
    case "light_sound":
    case "idol":
    case "street":
    case "theme_park":
    case "school_refusal":
    case "piapro":
      return value
    default:
      return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
