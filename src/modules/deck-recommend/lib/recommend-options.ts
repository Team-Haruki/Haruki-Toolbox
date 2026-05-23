import type {
  CardConfig,
  EventAttr,
  EventType,
  MusicDifficulty,
  RecommendOptions,
  RecommendTarget,
  SingleCardConfig,
  UnitType,
} from "haruki-sekai-deck-recommend-cpp"
import type { SekaiRegion } from "@/types"
import type { CardTrainingConfig } from "./training-config"
import type { DeckRecommendSingleCardOverride } from "./user-data-preparation"

export type DeckRecommendMode =
  | "event"
  | "challenge"
  | "bonus"
  | "mysekai"
  | "max"

export type DeckRecommendTarget = RecommendTarget

export type DeckRecommendLiveType = "solo" | "multi" | "auto" | "cheerful"

export type DeckRecommendAlgorithm = "dfs_ga" | "dfs" | "ga" | "rl"

export type DeckRecommendSkillReferenceStrategy = "average" | "max" | "min"

export type DeckRecommendSkillOrderStrategy = DeckRecommendSkillReferenceStrategy | "specific"

export type DeckRecommendSimulatedEventType = "marathon" | "cheerful_carnival"

export type DeckRecommendEventAttr = EventAttr

export type DeckRecommendUnitType = UnitType

export type DeckRecommendSupportUnitType = Exclude<UnitType, "piapro">

export const DECK_RECOMMEND_SUPPORT_UNITS: DeckRecommendSupportUnitType[] = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
]

export type DeckRecommendEventSimulationInput = {
  enabled: boolean
  eventType: DeckRecommendSimulatedEventType
  attr: DeckRecommendEventAttr | null
  unit: DeckRecommendUnitType | null
  worldBloomTurn: number | null
  worldBloomCharacterId: string | number | null
  worldBloomCharacterUnit: DeckRecommendUnitType | null
}

export type WasmRecommendLiveType =
  | "solo"
  | "multi"
  | "challenge"
  | "auto"
  | "challenge_auto"
  | "cheerful"
  | "mysekai"

export type BuildDeckRecommendOptionsInput = {
  region: SekaiRegion
  mode: DeckRecommendMode
  target?: DeckRecommendTarget | null
  liveType: DeckRecommendLiveType
  algorithm: DeckRecommendAlgorithm
  musicId: string | number | null
  musicDifficulty: string | null
  eventId: string | number | null
  characterId: string | number | null
  forcedLeaderCharacterId?: string | number | null
  eventSimulation?: DeckRecommendEventSimulationInput
  targetBonuses?: readonly number[]
  customBonusAttr?: DeckRecommendEventAttr | null
  customBonusCharacterIds?: readonly number[]
  customBonusCharacterSupportUnits?: Readonly<Record<string, DeckRecommendSupportUnitType>>
  filterOtherUnit?: boolean
  multiLiveTeammatePower?: number | null
  multiLiveTeammateScoreUp?: number | null
  multiLiveScoreUpLowerBound?: number | null
  fixedCards?: readonly number[]
  currentDeckCards?: readonly number[]
  useCurrentDeck?: boolean
  fixedCharacters?: readonly number[]
  excludedCards?: readonly number[]
  singleCardConfigs?: RecommendOptions["single_card_configs"]
  skillOrderStrategy?: DeckRecommendSkillOrderStrategy | null
  skillReferenceStrategy?: DeckRecommendSkillReferenceStrategy | null
  specificSkillOrder?: readonly number[]
  keepAfterTrainingState?: boolean
  supportMasterMax?: boolean
  supportSkillMax?: boolean
  boost?: number | null
  areaItemLevel?: number | null
  unitFilter?: DeckRecommendUnitType | null
  attrFilter?: DeckRecommendEventAttr | null
  trainingConfig: CardTrainingConfig[]
  userData: unknown
  limit?: number
  timeoutMs?: number
}

export function resolveWasmLiveType(
  mode: DeckRecommendMode,
  liveType: DeckRecommendLiveType,
): WasmRecommendLiveType {
  if (mode === "mysekai") {
    return "mysekai"
  }

  if (mode === "challenge") {
    return liveType === "auto" ? "challenge_auto" : "challenge"
  }

  if (mode === "bonus") {
    return "solo"
  }

  return liveType
}

export function buildDeckRecommendOptions(input: BuildDeckRecommendOptionsInput): RecommendOptions {
  const musicId = normalizePositiveInteger(input.musicId)
  const musicDiff = normalizeMusicDifficulty(input.musicDifficulty)
  if (!musicId) {
    throw new Error("music_id is required")
  }
  if (!musicDiff) {
    throw new Error("music_diff is required")
  }

  const liveType = resolveWasmLiveType(input.mode, input.liveType)
  const target = resolveRecommendTarget(input.mode, input.target)
  const userDataOption = typeof input.userData === "string"
    ? { user_data_str: input.userData }
    : { user_data: input.userData }
  const options: RecommendOptions = {
    region: input.region,
    live_type: liveType,
    music_id: musicId,
    music_diff: musicDiff,
    ...userDataOption,
    target,
    algorithm: resolveRecommendAlgorithm(input.mode, input.algorithm),
    limit: input.limit ?? 6,
    timeout_ms: input.timeoutMs ?? 15_000,
    member: 5,
    best_skill_as_leader: true,
    keep_after_training_state: input.keepAfterTrainingState ?? false,
    skill_order_choose_strategy: input.skillOrderStrategy ?? defaultSkillStrategy(input.mode, liveType),
    skill_reference_choose_strategy: input.skillReferenceStrategy ?? defaultSkillStrategy(input.mode, liveType),
    ...buildRarityConfigs(input.trainingConfig),
  }

  const simulatedEvent = buildSimulatedEventOptions(input.eventSimulation)
  if (simulatedEvent) {
    Object.assign(options, simulatedEvent)
  }

  if ((input.mode === "event" || input.mode === "bonus" || input.mode === "mysekai") && !simulatedEvent) {
    const eventId = normalizePositiveInteger(input.eventId)
    if (eventId) {
      options.event_id = eventId
    }

    const worldBloomCharacterId = normalizePositiveInteger(input.characterId)
    if (worldBloomCharacterId) {
      options.world_bloom_character_id = worldBloomCharacterId
    }

    const forcedLeaderCharacterId = normalizePositiveInteger(input.forcedLeaderCharacterId)
    if (forcedLeaderCharacterId) {
      options.forcedLeaderCharacterId = forcedLeaderCharacterId
    }
  }

  if (input.mode === "bonus") {
    const targetBonuses = normalizeTargetBonuses(input.targetBonuses)
    if (targetBonuses.length === 0) {
      throw new Error("target_bonus_list is required")
    }
    options.target_bonus_list = targetBonuses
  }

  const customBonusEnabled = isCustomBonusSimulation(input.eventSimulation)

  if (customBonusEnabled && input.customBonusAttr) {
    options.custom_bonus_attr = input.customBonusAttr
  }

  const customBonusCharacterIds = customBonusEnabled
    ? normalizeCustomBonusCharacterIds(input.customBonusCharacterIds)
    : []
  if (customBonusCharacterIds.length > 0) {
    options.custom_bonus_character_ids = customBonusCharacterIds
  }

  const customBonusCharacterSupportUnits = normalizeCustomBonusSupportUnits(
    input.customBonusCharacterSupportUnits,
    customBonusCharacterIds,
  )
  if (Object.keys(customBonusCharacterSupportUnits).length > 0) {
    options.custom_bonus_character_support_units = customBonusCharacterSupportUnits
  }

  if (customBonusEnabled && input.filterOtherUnit === true) {
    options.filter_other_unit = true
  }

  if (input.mode === "challenge") {
    const characterId = normalizePositiveInteger(input.characterId)
    if (characterId) {
      options.challenge_live_character_id = characterId
    }
  }

  const fixedCards = input.useCurrentDeck
    ? normalizeCompleteDeckCards(input.currentDeckCards)
    : normalizePositiveIntegers(input.fixedCards)
  if (fixedCards.length > 0) {
    options.fixed_cards = fixedCards
    if (input.useCurrentDeck) {
      options.best_skill_as_leader = false
    }
  }

  const fixedCharacters = normalizePositiveIntegers(input.fixedCharacters)
  if (input.mode !== "challenge" && !input.useCurrentDeck && fixedCharacters.length > 0) {
    options.fixed_characters = fixedCharacters
  }

  const singleCardConfigs = mergeSingleCardConfigs(input.singleCardConfigs, buildExcludedCardConfigs(input.excludedCards))
  if (singleCardConfigs.length > 0) {
    options.single_card_configs = singleCardConfigs
  }

  if (input.supportMasterMax === true) {
    options.support_master_max = true
  }
  if (input.supportSkillMax === true) {
    options.support_skill_max = true
  }

  const specificSkillOrder = normalizeSpecificSkillOrder(input.specificSkillOrder)
  if (options.skill_order_choose_strategy === "specific") {
    if (specificSkillOrder.length !== 5) {
      throw new Error("specific_skill_order is required")
    }
    options.specific_skill_order = specificSkillOrder
  }

  if (isWasmMultiLiveType(liveType)) {
    const teammatePower = normalizeNumber(input.multiLiveTeammatePower)
    if (teammatePower != null) {
      options.multi_live_teammate_power = teammatePower
    }
    const teammateScoreUp = normalizeNumber(input.multiLiveTeammateScoreUp)
    if (teammateScoreUp != null) {
      options.multi_live_teammate_score_up = teammateScoreUp
    }
    const lowerBound = normalizeNumber(input.multiLiveScoreUpLowerBound)
    if (lowerBound != null) {
      options.multi_live_score_up_lower_bound = lowerBound
    }
  }

  return options
}

export type { DeckRecommendSingleCardOverride }

export type DeckBonusTargetsParseResult = {
  targets: number[]
  invalidTokens: string[]
}

export type DeckIntegerListParseResult = {
  values: number[]
  invalidTokens: string[]
}

export type DeckCustomBonusSupportUnitsParseResult = {
  values: Record<string, DeckRecommendSupportUnitType>
  invalidTokens: string[]
}

export function parseDeckBonusTargetsInput(value: string): DeckBonusTargetsParseResult {
  const tokens = value
    .split(/[\s,，、]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const targets: number[] = []
  const invalidTokens: string[] = []
  const seen = new Set<number>()
  for (const token of tokens) {
    const normalized = token
      .replace(/加成/g, "")
      .replace(/[％%]$/g, "")
      .trim()
    const target = Number(normalized)
    if (!Number.isInteger(target) || target <= 0) {
      invalidTokens.push(token)
      continue
    }
    if (!seen.has(target)) {
      seen.add(target)
      targets.push(target)
    }
  }

  return { targets, invalidTokens }
}

export function parseDeckIntegerListInput(value: string): DeckIntegerListParseResult {
  const tokens = value
    .split(/[\s,，、]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const values: number[] = []
  const invalidTokens: string[] = []
  const seen = new Set<number>()
  for (const token of tokens) {
    const value = Number(token)
    if (!Number.isInteger(value) || value <= 0) {
      invalidTokens.push(token)
      continue
    }
    if (!seen.has(value)) {
      seen.add(value)
      values.push(value)
    }
  }

  return { values, invalidTokens }
}

export function parseDeckCustomBonusCharacterIdsInput(value: string): DeckIntegerListParseResult {
  const tokens = value
    .split(/[\s,，、]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const values: number[] = []
  const invalidTokens: string[] = []
  const seen = new Set<number>()
  for (const token of tokens) {
    const characterId = Number(token)
    if (!Number.isInteger(characterId) || characterId < 1 || characterId > 26) {
      invalidTokens.push(token)
      continue
    }
    if (!seen.has(characterId)) {
      seen.add(characterId)
      values.push(characterId)
    }
  }

  return { values, invalidTokens }
}

export function parseDeckCustomBonusSupportUnitsInput(value: string): DeckCustomBonusSupportUnitsParseResult {
  const tokens = value
    .split(/[\s,，、]+/)
    .map((token) => token.trim())
    .filter(Boolean)

  const values: Record<string, DeckRecommendSupportUnitType> = {}
  const invalidTokens: string[] = []
  for (const token of tokens) {
    const match = token.match(/^(\d+)\s*[:=：]\s*([a-z_]+)$/i)
    const characterId = match ? Number(match[1]) : null
    const supportUnit = match?.[2]?.toLowerCase()
    if (
      !characterId
      || !Number.isInteger(characterId)
      || characterId < 21
      || characterId > 26
      || !supportUnit
      || !isDeckRecommendSupportUnit(supportUnit)
    ) {
      invalidTokens.push(token)
      continue
    }

    values[String(characterId)] = supportUnit
  }

  return { values, invalidTokens }
}

export function parseDeckSkillOrderInput(value: string): DeckIntegerListParseResult {
  const compact = value.replace(/[\s,，、-]+/g, "")
  if (/^\d{5}$/.test(compact)) {
    const values = [...compact].map((token) => Number(token))
    const uniqueValues = new Set(values)
    if (uniqueValues.size === 5 && values.every((item) => item >= 1 && item <= 5)) {
      return {
        values: values.map((item) => item - 1),
        invalidTokens: [],
      }
    }
  }

  const tokens = value
    .split(/[\s,，、-]+/)
    .map((token) => token.trim())
    .filter(Boolean)
  const values: number[] = []
  const invalidTokens: string[] = []
  for (const token of tokens) {
    const item = Number(token)
    if (!Number.isInteger(item) || item < 1 || item > 5) {
      invalidTokens.push(token)
      continue
    }
    values.push(item)
  }

  if (
    invalidTokens.length === 0
    && values.length === 5
    && new Set(values).size === 5
  ) {
    return {
      values: values.map((item) => item - 1),
      invalidTokens: [],
    }
  }

  const trimmed = value.trim()
  return {
    values: [],
    invalidTokens: trimmed ? [trimmed] : [],
  }
}

export function resolveCurrentDeckCards(userData: unknown): number[] {
  const root = Array.isArray(userData) ? userData[0] : userData
  if (!isRecord(root)) {
    return []
  }

  const profileDeck = isRecord(root.userDeck) ? normalizeCurrentDeckCardsFromRecord(root.userDeck) : []
  if (profileDeck.length === 5) {
    return profileDeck
  }

  const userGamedata = root.userGamedata
  const activeDeckId = isRecord(userGamedata) ? normalizePositiveInteger(userGamedata.deck) : null
  if (!activeDeckId) {
    return []
  }

  const userDecks = Array.isArray(root.userDecks) ? root.userDecks : []
  const deck = userDecks.find((item) =>
    isRecord(item) && normalizePositiveInteger(item.deckId) === activeDeckId,
  )
  if (!isRecord(deck)) {
    return []
  }

  return normalizeCurrentDeckCards([
    normalizePositiveInteger(deck.member1),
    normalizePositiveInteger(deck.member2),
    normalizePositiveInteger(deck.member3),
    normalizePositiveInteger(deck.member4),
    normalizePositiveInteger(deck.member5),
  ], normalizePositiveInteger(deck.leader))
}

export function resolveCurrentDeckCardsWithProfile(userData: unknown, profileData: unknown): number[] {
  const profileDeck = resolveCurrentDeckCards(profileData)
  if (profileDeck.length === 5) {
    return profileDeck
  }

  return resolveCurrentDeckCards(userData)
}

export function resolveRecommendDataMode(mode: DeckRecommendMode): "suite" | "mysekai" {
  return mode === "mysekai" ? "mysekai" : "suite"
}

function resolveRecommendTarget(
  mode: DeckRecommendMode,
  target: DeckRecommendTarget | null | undefined,
): RecommendTarget {
  if (mode === "bonus") {
    return "bonus"
  }

  return isAllowedRecommendTarget(mode, target) ? target : "score"
}

function resolveRecommendAlgorithm(
  mode: DeckRecommendMode,
  algorithm: DeckRecommendAlgorithm,
): DeckRecommendAlgorithm {
  if (mode === "bonus") {
    return "dfs"
  }

  return algorithm
}

function isAllowedRecommendTarget(
  mode: DeckRecommendMode,
  target: DeckRecommendTarget | null | undefined,
): target is DeckRecommendTarget {
  if (!target) {
    return false
  }

  switch (mode) {
    case "event":
      return target === "score" || target === "power" || target === "skill" || target === "bonus"
    case "mysekai":
      return target === "score" || target === "power" || target === "bonus"
    case "challenge":
      return target === "score" || target === "power"
    case "max":
      return target === "score" || target === "power" || target === "skill"
    case "bonus":
      return target === "bonus"
  }
}

function defaultSkillStrategy(mode: DeckRecommendMode, liveType: WasmRecommendLiveType) {
  if (mode === "challenge" && liveType !== "challenge_auto" && liveType !== "auto") {
    return "max"
  }

  return "average"
}

function buildSimulatedEventOptions(
  input: DeckRecommendEventSimulationInput | undefined,
): Partial<RecommendOptions> | null {
  if (!input?.enabled) {
    return null
  }

  const worldBloomTurn = normalizeWorldBloomTurn(input.worldBloomTurn)
  if (input.worldBloomTurn != null && !worldBloomTurn) {
    throw new Error("world_bloom_event_turn must be 1, 2, or 3")
  }

  if (worldBloomTurn) {
    const worldBloomCharacterId = normalizePositiveInteger(input.worldBloomCharacterId)
    if (!worldBloomCharacterId) {
      throw new Error("world_bloom_character_id is required")
    }
    if (worldBloomTurn <= 2 && !input.worldBloomCharacterUnit) {
      throw new Error("event_unit is required for world_bloom_event_turn 1 or 2")
    }

    return {
      event_type: "world_bloom" satisfies EventType,
      world_bloom_event_turn: worldBloomTurn,
      world_bloom_character_id: worldBloomCharacterId,
      ...(worldBloomTurn <= 2 && input.worldBloomCharacterUnit ? { event_unit: input.worldBloomCharacterUnit } : {}),
    }
  }

  if (!input.attr && !input.unit) {
    return {
      event_type: input.eventType,
    }
  }

  if (!input.attr || !input.unit) {
    throw new Error("event_attr and event_unit are required")
  }

  return {
    event_type: input.eventType,
    event_attr: input.attr,
    event_unit: input.unit,
  }
}

function isCustomBonusSimulation(input: DeckRecommendEventSimulationInput | undefined): boolean {
  return input?.enabled === true
    && input.worldBloomTurn == null
    && !input.attr
    && !input.unit
}

function isWasmMultiLiveType(liveType: WasmRecommendLiveType): boolean {
  return liveType === "multi" || liveType === "cheerful"
}

function buildRarityConfigs(trainingConfig: CardTrainingConfig[]) {
  const byRarity = Object.fromEntries(
    trainingConfig.map((row) => [row.rarity, toWasmCardConfig(row)]),
  )

  return {
    rarity_1_config: byRarity.rarity_1,
    rarity_2_config: byRarity.rarity_2,
    rarity_3_config: byRarity.rarity_3,
    rarity_4_config: byRarity.rarity_4,
    rarity_birthday_config: byRarity.rarity_birthday,
  }
}

function toWasmCardConfig(row: CardTrainingConfig): CardConfig {
  return {
    disable: row.disabled,
    level_max: row.maxLevel,
    episode_read: row.episodesRead,
    master_max: row.maxMasterRank,
    skill_max: row.maxSkillLevel,
    canvas: row.mySekaiCanvas,
  }
}

function normalizeTargetBonuses(values: readonly number[] | undefined): number[] {
  if (!values) {
    return []
  }

  const seen = new Set<number>()
  const targets: number[] = []
  for (const value of values) {
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) {
      continue
    }
    seen.add(value)
    targets.push(value)
  }
  return targets
}

function normalizeCustomBonusCharacterIds(values: readonly number[] | undefined): number[] {
  if (!values) {
    return []
  }

  const seen = new Set<number>()
  const normalized: number[] = []
  for (const value of values) {
    if (!Number.isInteger(value) || value < 1 || value > 26 || seen.has(value)) {
      continue
    }
    seen.add(value)
    normalized.push(value)
  }
  return normalized
}

function normalizeCustomBonusSupportUnits(
  values: Readonly<Record<string, DeckRecommendSupportUnitType>> | undefined,
  customBonusCharacterIds: readonly number[],
): Record<string, DeckRecommendSupportUnitType> {
  if (!values) {
    return {}
  }

  const customBonusCharacterIdSet = new Set(customBonusCharacterIds)
  const normalized: Record<string, DeckRecommendSupportUnitType> = {}
  for (const [rawCharacterId, unit] of Object.entries(values)) {
    const characterId = Number(rawCharacterId)
    if (
      !Number.isInteger(characterId)
      || characterId < 21
      || characterId > 26
      || !customBonusCharacterIdSet.has(characterId)
      || !isDeckRecommendSupportUnit(unit)
    ) {
      continue
    }
    normalized[String(characterId)] = unit
  }

  return normalized
}

function buildExcludedCardConfigs(values: readonly number[] | undefined): SingleCardConfig[] {
  return normalizePositiveIntegers(values).map((cardId) => ({
    card_id: cardId,
    disable: true,
  }))
}

function mergeSingleCardConfigs(
  first: readonly SingleCardConfig[] | undefined,
  second: readonly SingleCardConfig[] | undefined,
): SingleCardConfig[] {
  const configs = new Map<number, SingleCardConfig>()
  for (const item of [...(first ?? []), ...(second ?? [])]) {
    if (!Number.isInteger(item.card_id) || item.card_id <= 0) {
      continue
    }

    configs.set(item.card_id, {
      ...configs.get(item.card_id),
      ...item,
    })
  }
  return [...configs.values()]
}

function normalizeCompleteDeckCards(values: readonly number[] | undefined): number[] {
  const cards = normalizePositiveIntegers(values)
  if (cards.length !== 5) {
    throw new Error("current deck requires 5 cards")
  }

  return cards
}

function normalizePositiveIntegers(values: readonly number[] | undefined): number[] {
  if (!values) {
    return []
  }

  const seen = new Set<number>()
  const normalized: number[] = []
  for (const value of values) {
    if (!Number.isInteger(value) || value <= 0 || seen.has(value)) {
      continue
    }
    seen.add(value)
    normalized.push(value)
  }
  return normalized
}

function normalizeSpecificSkillOrder(values: readonly number[] | undefined): number[] {
  if (!values) {
    return []
  }

  const uniqueValues = new Set<number>()
  const normalized: number[] = []
  for (const value of values) {
    if (!Number.isInteger(value) || value < 0 || value > 4 || uniqueValues.has(value)) {
      continue
    }
    uniqueValues.add(value)
    normalized.push(value)
  }
  return normalized
}

function normalizeCurrentDeckCards(values: readonly (number | null)[], leader: number | null): number[] {
  if (values.some((value) => value == null)) {
    return []
  }

  const cards = values.filter((value): value is number => value != null)
  if (cards.length !== 5) {
    return []
  }

  if (!leader) {
    return cards
  }

  const leaderIndex = cards.indexOf(leader)
  if (leaderIndex <= 0) {
    return cards
  }

  return [
    leader,
    ...cards.slice(0, leaderIndex),
    ...cards.slice(leaderIndex + 1),
  ]
}

function normalizeCurrentDeckCardsFromRecord(deck: Record<string, unknown>): number[] {
  return normalizeCurrentDeckCards([
    normalizePositiveInteger(deck.member1),
    normalizePositiveInteger(deck.member2),
    normalizePositiveInteger(deck.member3),
    normalizePositiveInteger(deck.member4),
    normalizePositiveInteger(deck.member5),
  ], normalizePositiveInteger(deck.leader))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value != null && !Array.isArray(value)
}

function normalizeNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function isDeckRecommendSupportUnit(value: string): value is DeckRecommendSupportUnitType {
  return DECK_RECOMMEND_SUPPORT_UNITS.includes(value as DeckRecommendSupportUnitType)
}

function normalizeWorldBloomTurn(value: number | null): number | null {
  if (value == null || !Number.isInteger(value) || value < 1 || value > 3) {
    return null
  }

  return value
}

function normalizePositiveInteger(value: string | number | null): number | null {
  const raw = typeof value === "string" ? Number(value) : value
  if (!Number.isInteger(raw) || raw <= 0) {
    return null
  }

  return raw
}

function normalizeMusicDifficulty(value: string | null): MusicDifficulty | null {
  switch (value) {
    case "easy":
    case "normal":
    case "hard":
    case "expert":
    case "master":
    case "append":
      return value
    default:
      return null
  }
}
