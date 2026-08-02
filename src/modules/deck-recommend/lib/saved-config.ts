import { SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import type { SekaiRegion } from "@/types"
import type { DeckRecommendExecutionMode } from "../composables/useDeckRecommendRunner"
import {
  type DeckRecommendAlgorithm,
  type DeckRecommendEventAttr,
  type DeckRecommendLiveType,
  type DeckRecommendMode,
  type DeckRecommendSimulatedEventType,
  type DeckRecommendSkillOrderStrategy,
  type DeckRecommendSkillReferenceStrategy,
  type DeckRecommendSupportUnitType,
  type DeckRecommendTarget,
  type DeckRecommendUnitType,
} from "./recommend-options"
import { createDefaultCardTrainingConfig, type CardTrainingConfig } from "./training-config"
import type { DeckRecommendSingleCardOverride } from "./user-data-preparation"

const DECK_RECOMMEND_PREFERENCES_STORAGE_KEY = "haruki:deck-recommend:preferences"
const DECK_RECOMMEND_PREFERENCES_VERSION = 3
const DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY = "haruki:deck-recommend:saved-config"
const DECK_RECOMMEND_SAVED_CONFIG_VERSION = 1

// v0.3.0 前的默认三算法组合；仅用于偏好迁移时识别“用户未定制”
export const LEGACY_DEFAULT_ALGORITHMS: DeckRecommendAlgorithm[] = ["dfs_ga", "ga", "rl"]
export const DECK_RECOMMEND_ALGORITHMS: DeckRecommendAlgorithm[] = ["dfs_ga", "dfs", "ga", "rl"]
export const DECK_RECOMMEND_MODES: DeckRecommendMode[] = ["event", "challenge", "bonus", "mysekai", "max"]
export const DECK_RECOMMEND_LIVE_TYPES: DeckRecommendLiveType[] = ["solo", "multi", "auto"]
export const DECK_RECOMMEND_EXECUTION_MODES: DeckRecommendExecutionMode[] = ["sequential", "parallel"]
export const DECK_RECOMMEND_EVENT_ATTRS: DeckRecommendEventAttr[] = ["happy", "cute", "cool", "pure", "mysterious"]
export const DECK_RECOMMEND_UNITS: DeckRecommendUnitType[] = [
  "light_sound",
  "idol",
  "street",
  "theme_park",
  "school_refusal",
  "piapro",
]
export const DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT = "custom_bonus_characters" as const
const DECK_RECOMMEND_EVENT_SIMULATION_MODES = ["marathon", "cheerful_carnival", "world_bloom"] as const
const DECK_RECOMMEND_SKILL_REFERENCE_STRATEGIES: DeckRecommendSkillReferenceStrategy[] = ["average", "max", "min"]
const DECK_RECOMMEND_SKILL_ORDER_STRATEGIES: DeckRecommendSkillOrderStrategy[] = ["average", "max", "min", "specific"]

export type DeckRecommendEventSimulationMode = DeckRecommendSimulatedEventType | "world_bloom"
export type DeckRecommendAlgorithmSelectionMode = "auto" | "manual"
export type DeckRecommendSimulatedEventUnitValue = DeckRecommendUnitType | typeof DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT

export type DeckRecommendSavedConfig = {
  selectedAccountKey?: string
  dataRegion?: SekaiRegion
  recommendMode?: DeckRecommendMode
  recommendTarget?: DeckRecommendTarget
  liveType?: DeckRecommendLiveType
  selectedAlgorithms?: DeckRecommendAlgorithm[]
  algorithmSelectionMode?: DeckRecommendAlgorithmSelectionMode
  executionMode?: DeckRecommendExecutionMode
  selectedEventId?: string | null
  selectedCharacterId?: string | null
  selectedMusicId?: string | null
  selectedDifficulty?: string | null
  bonusTargetsInput?: string
  customBonusCharacterIds?: number[]
  customBonusSupportUnits?: Record<string, DeckRecommendSupportUnitType>
  filterOtherUnit?: boolean
  eventSimulationEnabled?: boolean
  simulatedEventMode?: DeckRecommendEventSimulationMode
  simulatedEventAttr?: DeckRecommendEventAttr | null
  simulatedEventUnit?: DeckRecommendSimulatedEventUnitValue | null
  simulatedWorldBloomTurn?: string | null
  simulatedWorldBloomCharacterId?: string | null
  multiLiveTeammatePowerInput?: string
  multiLiveTeammateScoreUpInput?: string
  multiLiveScoreUpLowerBoundInput?: string
  boostInput?: string
  areaItemLevelInput?: string
  areaItemLevelOverrideInputs?: Record<string, string>
  characterRankInput?: string
  characterRankOverrideInputs?: Record<string, string>
  mysekaiGateLevelInput?: string
  mysekaiGateLevelOverrideInputs?: Record<string, string>
  mysekaiFixtureBonusRateInput?: string
  mysekaiFixtureBonusRateOverrideInputs?: Record<string, string>
  resultLimitInput?: string
  engineTimeoutMsInput?: string
  unitFilters?: DeckRecommendUnitType[]
  attrFilters?: DeckRecommendEventAttr[]
  characterFilters?: number[]
  fixedCardIds?: number[]
  useCurrentDeck?: boolean
  fixedCharacterIds?: number[]
  excludedCardIds?: number[]
  singleCardOverrides?: DeckRecommendSingleCardOverride[]
  skillOrderStrategy?: DeckRecommendSkillOrderStrategy
  skillReferenceStrategy?: DeckRecommendSkillReferenceStrategy
  specificSkillOrderInput?: string
  keepAfterTrainingState?: boolean
  supportMasterMax?: boolean
  supportSkillMax?: boolean
  trainingConfig?: CardTrainingConfig[]
}

export type DeckRecommendPreferences = {
  algorithms?: DeckRecommendAlgorithm[]
  algorithmsAuto?: boolean
  executionMode?: DeckRecommendExecutionMode
}

// --- Value validators shared by persistence and route hydration ---

export function isSekaiRegionValue(value: string): value is SekaiRegion {
  return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
}

export function isDeckRecommendMode(value: string): value is DeckRecommendMode {
  return (DECK_RECOMMEND_MODES as readonly string[]).includes(value)
}

export function isDeckRecommendTarget(value: string): value is DeckRecommendTarget {
  return value === "score" || value === "power" || value === "skill" || value === "bonus"
}

export function isDeckRecommendLiveType(value: string): value is DeckRecommendLiveType {
  return (DECK_RECOMMEND_LIVE_TYPES as readonly string[]).includes(value)
}

export function isDeckRecommendExecutionMode(value: string): value is DeckRecommendExecutionMode {
  return (DECK_RECOMMEND_EXECUTION_MODES as readonly string[]).includes(value)
}

export function isDeckRecommendEventSimulationMode(value: string): value is DeckRecommendEventSimulationMode {
  return (DECK_RECOMMEND_EVENT_SIMULATION_MODES as readonly string[]).includes(value)
}

export function isDeckRecommendEventAttr(value: string): value is DeckRecommendEventAttr {
  return (DECK_RECOMMEND_EVENT_ATTRS as readonly string[]).includes(value)
}

export function isDeckRecommendUnit(value: string): value is DeckRecommendUnitType {
  return (DECK_RECOMMEND_UNITS as readonly string[]).includes(value)
}

export function isDeckRecommendSimulatedEventUnit(value: string): value is DeckRecommendSimulatedEventUnitValue {
  return value === DECK_RECOMMEND_CUSTOM_SIMULATED_UNIT || isDeckRecommendUnit(value)
}

export function isDeckRecommendSkillOrderStrategy(value: string): value is DeckRecommendSkillOrderStrategy {
  return (DECK_RECOMMEND_SKILL_ORDER_STRATEGIES as readonly string[]).includes(value)
}

export function isDeckRecommendSkillReferenceStrategy(value: string): value is DeckRecommendSkillReferenceStrategy {
  return (DECK_RECOMMEND_SKILL_REFERENCE_STRATEGIES as readonly string[]).includes(value)
}

// --- Preferences (algorithms/execution mode) ---

export function isLegacyDefaultAlgorithmSelection(algorithms: readonly DeckRecommendAlgorithm[]): boolean {
  return algorithms.length === LEGACY_DEFAULT_ALGORITHMS.length
    && LEGACY_DEFAULT_ALGORITHMS.every((algorithm) => algorithms.includes(algorithm))
}

export function resolveInitialAlgorithmSelectionIsManual(
  savedConfig: DeckRecommendSavedConfig,
  preferences: DeckRecommendPreferences,
): boolean {
  if (savedConfig.algorithmSelectionMode) {
    return savedConfig.algorithmSelectionMode === "manual"
  }

  // 旧版保存配置没有选择模式标记：与旧默认组合一致视为未手动定制
  if (savedConfig.selectedAlgorithms) {
    return !isLegacyDefaultAlgorithmSelection(savedConfig.selectedAlgorithms)
  }

  return preferences.algorithms != null
}

export function readDeckRecommendPreferences(): DeckRecommendPreferences {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>
    const persistedExecutionMode = typeof parsed.executionMode === "string" && isDeckRecommendExecutionMode(parsed.executionMode)
      ? parsed.executionMode
      : undefined
    const preferencesVersion = typeof parsed.version === "number" ? parsed.version : 1
    const persistedAlgorithms = normalizePersistedAlgorithms(parsed.algorithms)

    if (preferencesVersion < 3) {
      // v3迁移：等于旧默认三算法组合（或缺失）视为未定制，交给按场景默认；
      // 用户自选的组合与执行方式原样保留
      const isCustomized = persistedAlgorithms != null
        && persistedAlgorithms.length > 0
        && !isLegacyDefaultAlgorithmSelection(persistedAlgorithms)
      return {
        algorithms: isCustomized ? persistedAlgorithms : undefined,
        executionMode: isCustomized ? persistedExecutionMode : undefined,
      }
    }

    return {
      algorithms: parsed.algorithmsAuto === true ? undefined : persistedAlgorithms,
      executionMode: persistedExecutionMode,
    }
  } catch {
    return {}
  }
}

export function writeDeckRecommendPreferences(preferences: Required<DeckRecommendPreferences>) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(DECK_RECOMMEND_PREFERENCES_STORAGE_KEY, JSON.stringify({
      ...preferences,
      version: DECK_RECOMMEND_PREFERENCES_VERSION,
    }))
  } catch {
  }
}

// --- Saved config ---

export function readDeckRecommendSavedConfig(): DeckRecommendSavedConfig {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== DECK_RECOMMEND_SAVED_CONFIG_VERSION || !isRecord(parsed.config)) {
      return {}
    }

    return normalizeDeckRecommendSavedConfig(parsed.config)
  } catch {
    return {}
  }
}

export function writeDeckRecommendSavedConfig(config: DeckRecommendSavedConfig) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY, JSON.stringify({
    version: DECK_RECOMMEND_SAVED_CONFIG_VERSION,
    config,
  }))
}

export function removeDeckRecommendSavedConfig() {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(DECK_RECOMMEND_SAVED_CONFIG_STORAGE_KEY)
  } catch {
  }
}

export function normalizeDeckRecommendSavedConfig(value: Record<string, unknown>): DeckRecommendSavedConfig {
  const config: DeckRecommendSavedConfig = {}
  const selectedAccount = optionalString(value.selectedAccountKey)
  if (selectedAccount != null) {
    config.selectedAccountKey = selectedAccount
  }

  const region = optionalString(value.dataRegion)
  if (region && isSekaiRegionValue(region)) {
    config.dataRegion = region
  }

  const mode = optionalString(value.recommendMode)
  if (mode && isDeckRecommendMode(mode)) {
    config.recommendMode = mode
  }

  const target = optionalString(value.recommendTarget)
  if (target && isDeckRecommendTarget(target)) {
    config.recommendTarget = target
  }

  const live = optionalString(value.liveType)
  if (live && isDeckRecommendLiveType(live)) {
    config.liveType = live
  }

  config.selectedAlgorithms = normalizePersistedAlgorithms(value.selectedAlgorithms)
  const algorithmSelectionMode = optionalString(value.algorithmSelectionMode)
  if (algorithmSelectionMode === "auto" || algorithmSelectionMode === "manual") {
    config.algorithmSelectionMode = algorithmSelectionMode
  }
  const execution = optionalString(value.executionMode)
  if (execution && isDeckRecommendExecutionMode(execution)) {
    config.executionMode = execution
  }

  config.selectedEventId = optionalNullableString(value.selectedEventId)
  config.selectedCharacterId = optionalNullableString(value.selectedCharacterId)
  config.selectedMusicId = optionalNullableString(value.selectedMusicId)
  config.selectedDifficulty = optionalNullableString(value.selectedDifficulty)
  config.bonusTargetsInput = optionalString(value.bonusTargetsInput)
  config.customBonusCharacterIds = normalizePositiveIntegerArray(value.customBonusCharacterIds)
  config.customBonusSupportUnits = normalizeSupportUnitRecord(value.customBonusSupportUnits)
  config.filterOtherUnit = optionalBoolean(value.filterOtherUnit)
  config.eventSimulationEnabled = optionalBoolean(value.eventSimulationEnabled)

  const simulationMode = optionalString(value.simulatedEventMode)
  if (simulationMode && isDeckRecommendEventSimulationMode(simulationMode)) {
    config.simulatedEventMode = simulationMode
  }

  const simulationAttr = optionalNullableString(value.simulatedEventAttr)
  if (simulationAttr == null || isDeckRecommendEventAttr(simulationAttr)) {
    config.simulatedEventAttr = simulationAttr
  }

  const simulationUnit = optionalNullableString(value.simulatedEventUnit)
  if (simulationUnit == null || isDeckRecommendSimulatedEventUnit(simulationUnit)) {
    config.simulatedEventUnit = simulationUnit
  }

  config.simulatedWorldBloomTurn = optionalNullableString(value.simulatedWorldBloomTurn)
  config.simulatedWorldBloomCharacterId = optionalNullableString(value.simulatedWorldBloomCharacterId)
  config.multiLiveTeammatePowerInput = optionalString(value.multiLiveTeammatePowerInput)
  config.multiLiveTeammateScoreUpInput = optionalString(value.multiLiveTeammateScoreUpInput)
  config.multiLiveScoreUpLowerBoundInput = optionalString(value.multiLiveScoreUpLowerBoundInput)
  config.boostInput = optionalString(value.boostInput)
  config.areaItemLevelInput = optionalString(value.areaItemLevelInput)
  config.areaItemLevelOverrideInputs = normalizeNumericStringRecord(value.areaItemLevelOverrideInputs)
  config.characterRankInput = optionalString(value.characterRankInput)
  config.characterRankOverrideInputs = normalizeNumericStringRecord(value.characterRankOverrideInputs)
  config.mysekaiGateLevelInput = optionalString(value.mysekaiGateLevelInput)
  config.mysekaiGateLevelOverrideInputs = normalizeNumericStringRecord(value.mysekaiGateLevelOverrideInputs)
  config.mysekaiFixtureBonusRateInput = optionalString(value.mysekaiFixtureBonusRateInput)
  config.mysekaiFixtureBonusRateOverrideInputs = normalizeNumericStringRecord(value.mysekaiFixtureBonusRateOverrideInputs)
  config.resultLimitInput = optionalString(value.resultLimitInput)
  config.engineTimeoutMsInput = optionalString(value.engineTimeoutMsInput)
  config.unitFilters = normalizeStringArray(value.unitFilters, isDeckRecommendUnit)
  config.attrFilters = normalizeStringArray(value.attrFilters, isDeckRecommendEventAttr)
  config.characterFilters = normalizePositiveIntegerArray(value.characterFilters)
  config.fixedCardIds = normalizePositiveIntegerArray(value.fixedCardIds)
  config.useCurrentDeck = optionalBoolean(value.useCurrentDeck)
  config.fixedCharacterIds = normalizePositiveIntegerArray(value.fixedCharacterIds)
  config.excludedCardIds = normalizePositiveIntegerArray(value.excludedCardIds)
  config.singleCardOverrides = normalizeSingleCardOverrides(value.singleCardOverrides)

  const skillOrder = optionalString(value.skillOrderStrategy)
  if (skillOrder && isDeckRecommendSkillOrderStrategy(skillOrder)) {
    config.skillOrderStrategy = skillOrder
  }

  const skillReference = optionalString(value.skillReferenceStrategy)
  if (skillReference && isDeckRecommendSkillReferenceStrategy(skillReference)) {
    config.skillReferenceStrategy = skillReference
  }

  config.specificSkillOrderInput = optionalString(value.specificSkillOrderInput)
  config.keepAfterTrainingState = optionalBoolean(value.keepAfterTrainingState)
  config.supportMasterMax = optionalBoolean(value.supportMasterMax)
  config.supportSkillMax = optionalBoolean(value.supportSkillMax)
  config.trainingConfig = normalizeTrainingConfig(value.trainingConfig)

  return config
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined
}

function optionalNullableString(value: unknown): string | null | undefined {
  return value == null ? null : optionalString(value)
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function normalizeStringArray<T extends string>(value: unknown, isValid: (item: string) => item is T): T[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return [...new Set(value.filter((item): item is T => typeof item === "string" && isValid(item)))]
}

function normalizePositiveIntegerArray(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return [...new Set(value
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0))]
}

function normalizeNumericStringRecord(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const record: Record<string, string> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    const id = Number(key)
    const itemValue = Number(rawValue)
    if (Number.isInteger(id) && id > 0 && Number.isFinite(itemValue)) {
      record[String(id)] = String(rawValue)
    }
  }

  return record
}

function normalizeSupportUnitRecord(value: unknown): Record<string, DeckRecommendSupportUnitType> | undefined {
  if (!isRecord(value)) {
    return undefined
  }

  const record: Record<string, DeckRecommendSupportUnitType> = {}
  for (const [key, rawValue] of Object.entries(value)) {
    const characterId = Number(key)
    if (
      Number.isInteger(characterId)
      && characterId > 0
      && typeof rawValue === "string"
      && DECK_RECOMMEND_UNITS.includes(rawValue as DeckRecommendUnitType)
      && rawValue !== "piapro"
    ) {
      record[String(characterId)] = rawValue as DeckRecommendSupportUnitType
    }
  }

  return record
}

function normalizeSingleCardOverrides(value: unknown): DeckRecommendSingleCardOverride[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return value
    .filter(isRecord)
    .map((item) => ({
      cardId: Number(item.cardId),
      disabled: item.disabled === true,
      level: normalizeNullableInteger(item.level, 1),
      skillLevel: normalizeNullableInteger(item.skillLevel, 1),
      masterRank: normalizeNullableInteger(item.masterRank, 0),
      episodeState: normalizeSingleCardEpisodeState(item.episodeState),
      canvas: typeof item.canvas === "boolean" ? item.canvas : null,
    }))
    .filter((item) => Number.isInteger(item.cardId) && item.cardId > 0)
}

function normalizeTrainingConfig(value: unknown): CardTrainingConfig[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const defaults = createDefaultCardTrainingConfig()
  const inputMap = new Map(
    value
      .filter(isRecord)
      .map((item) => [item.rarity, item]),
  )

  return defaults.map((defaultItem) => {
    const input = inputMap.get(defaultItem.rarity)
    if (!input) {
      return defaultItem
    }

    return {
      rarity: defaultItem.rarity,
      disabled: input.disabled === true,
      maxLevel: input.maxLevel === true,
      episodesRead: input.episodesRead === true,
      maxMasterRank: input.maxMasterRank === true,
      maxSkillLevel: input.maxSkillLevel === true,
      mySekaiCanvas: input.mySekaiCanvas !== false,
    }
  })
}

function normalizeNullableInteger(value: unknown, min: number): number | null {
  if (value == null) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= min ? parsed : null
}

function normalizeSingleCardEpisodeState(value: unknown): DeckRecommendSingleCardOverride["episodeState"] {
  return value === "none" || value === "first" || value === "both" ? value : null
}

export function normalizePersistedAlgorithms(value: unknown): DeckRecommendAlgorithm[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  return DECK_RECOMMEND_ALGORITHMS.filter((algorithm) => value.includes(algorithm))
}
