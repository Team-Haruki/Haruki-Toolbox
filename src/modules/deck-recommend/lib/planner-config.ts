import type {
  DeckRecommendAreaItemLevelOverride,
  DeckRecommendCharacterRankOverride,
  DeckRecommendMysekaiFixtureBonusRateOverride,
  DeckRecommendMysekaiGateLevelOverride,
  DeckRecommendSingleCardOverride,
} from "./user-data-preparation"
import type {
  DeckRecommendEventAttr,
  DeckRecommendSkillOrderStrategy,
  DeckRecommendSkillReferenceStrategy,
  DeckRecommendUnitType,
} from "./recommend-options"
import { createDefaultCardTrainingConfig, type CardTrainingConfig } from "./training-config"

/**
 * Read-only bridge to the deck recommend page's persisted configuration
 * (`haruki:deck-recommend:saved-config`). The planner's brush dialog applies
 * the same detailed settings the user tuned on the deck page instead of
 * duplicating that whole panel.
 */

const SAVED_CONFIG_STORAGE_KEY = "haruki:deck-recommend:saved-config"
const SAVED_CONFIG_VERSION = 1

export type PlannerDeckConfig = {
  multiLiveTeammatePower: number | null
  multiLiveTeammateScoreUp: number | null
  multiLiveScoreUpLowerBound: number | null
  areaItemLevel: number | null
  areaItemLevelOverrides: DeckRecommendAreaItemLevelOverride[]
  characterRank: number | null
  characterRankOverrides: DeckRecommendCharacterRankOverride[]
  mysekaiGateLevel: number | null
  mysekaiGateLevelOverrides: DeckRecommendMysekaiGateLevelOverride[]
  mysekaiFixtureBonusRate: number | null
  mysekaiFixtureBonusRateOverrides: DeckRecommendMysekaiFixtureBonusRateOverride[]
  unitFilters: DeckRecommendUnitType[]
  attrFilters: DeckRecommendEventAttr[]
  characterFilters: number[]
  fixedCards: number[]
  fixedCharacters: number[]
  excludedCards: number[]
  singleCardOverrides: DeckRecommendSingleCardOverride[]
  skillOrderStrategy: DeckRecommendSkillOrderStrategy
  skillReferenceStrategy: DeckRecommendSkillReferenceStrategy
  specificSkillOrder: number[]
  keepAfterTrainingState: boolean
  supportMasterMax: boolean
  supportSkillMax: boolean
  trainingConfig: CardTrainingConfig[]
  referenceMusicId: string | null
  referenceDifficulty: string | null
}

export function createDefaultPlannerDeckConfig(): PlannerDeckConfig {
  return {
    multiLiveTeammatePower: null,
    multiLiveTeammateScoreUp: null,
    multiLiveScoreUpLowerBound: null,
    areaItemLevel: null,
    areaItemLevelOverrides: [],
    characterRank: null,
    characterRankOverrides: [],
    mysekaiGateLevel: null,
    mysekaiGateLevelOverrides: [],
    mysekaiFixtureBonusRate: null,
    mysekaiFixtureBonusRateOverrides: [],
    unitFilters: [],
    attrFilters: [],
    characterFilters: [],
    fixedCards: [],
    fixedCharacters: [],
    excludedCards: [],
    singleCardOverrides: [],
    skillOrderStrategy: "average",
    skillReferenceStrategy: "average",
    specificSkillOrder: [],
    keepAfterTrainingState: false,
    supportMasterMax: false,
    supportSkillMax: false,
    trainingConfig: createDefaultCardTrainingConfig(),
    referenceMusicId: null,
    referenceDifficulty: null,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value)
}

function parseOptionalInt(value: unknown): number | null {
  if (typeof value !== "string" || value.trim() === "") {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : null
}

function numberArray(value: unknown): number[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    : []
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : []
}

/** `Record<idString, valueString>` override inputs → typed override rows. */
function overrideEntries(value: unknown): Array<{ id: number; value: number }> {
  if (!isRecord(value)) {
    return []
  }

  const entries: Array<{ id: number; value: number }> = []
  for (const [key, raw] of Object.entries(value)) {
    const id = Number(key)
    const parsed = parseOptionalInt(raw)
    if (Number.isInteger(id) && id > 0 && parsed != null) {
      entries.push({ id, value: parsed })
    }
  }

  return entries
}

export function readPlannerDeckConfig(storage: Pick<Storage, "getItem"> | null = defaultStorage()): PlannerDeckConfig {
  const defaults = createDefaultPlannerDeckConfig()
  if (storage == null) {
    return defaults
  }

  let config: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SAVED_CONFIG_STORAGE_KEY) ?? "")
    if (!isRecord(parsed) || parsed.version !== SAVED_CONFIG_VERSION || !isRecord(parsed.config)) {
      return defaults
    }

    config = parsed.config
  } catch {
    return defaults
  }

  return {
    multiLiveTeammatePower: parseOptionalInt(config.multiLiveTeammatePowerInput),
    multiLiveTeammateScoreUp: parseOptionalInt(config.multiLiveTeammateScoreUpInput),
    multiLiveScoreUpLowerBound: parseOptionalInt(config.multiLiveScoreUpLowerBoundInput),
    areaItemLevel: parseOptionalInt(config.areaItemLevelInput),
    areaItemLevelOverrides: overrideEntries(config.areaItemLevelOverrideInputs)
      .map(({ id, value }) => ({ areaItemId: id, level: value })),
    characterRank: parseOptionalInt(config.characterRankInput),
    characterRankOverrides: overrideEntries(config.characterRankOverrideInputs)
      .map(({ id, value }) => ({ characterId: id, rank: value })),
    mysekaiGateLevel: parseOptionalInt(config.mysekaiGateLevelInput),
    mysekaiGateLevelOverrides: overrideEntries(config.mysekaiGateLevelOverrideInputs)
      .map(({ id, value }) => ({ mysekaiGateId: id, level: value })),
    mysekaiFixtureBonusRate: parseOptionalInt(config.mysekaiFixtureBonusRateInput),
    mysekaiFixtureBonusRateOverrides: overrideEntries(config.mysekaiFixtureBonusRateOverrideInputs)
      .map(({ id, value }) => ({ characterId: id, totalBonusRate: value })),
    unitFilters: stringArray(config.unitFilters) as DeckRecommendUnitType[],
    attrFilters: stringArray(config.attrFilters) as DeckRecommendEventAttr[],
    characterFilters: numberArray(config.characterFilters),
    fixedCards: numberArray(config.fixedCardIds),
    fixedCharacters: numberArray(config.fixedCharacterIds),
    excludedCards: numberArray(config.excludedCardIds),
    singleCardOverrides: Array.isArray(config.singleCardOverrides)
      ? config.singleCardOverrides as DeckRecommendSingleCardOverride[]
      : [],
    skillOrderStrategy: typeof config.skillOrderStrategy === "string"
      ? config.skillOrderStrategy as DeckRecommendSkillOrderStrategy
      : defaults.skillOrderStrategy,
    skillReferenceStrategy: typeof config.skillReferenceStrategy === "string"
      ? config.skillReferenceStrategy as DeckRecommendSkillReferenceStrategy
      : defaults.skillReferenceStrategy,
    specificSkillOrder: parseSpecificSkillOrder(config.specificSkillOrderInput),
    keepAfterTrainingState: config.keepAfterTrainingState === true,
    supportMasterMax: config.supportMasterMax === true,
    supportSkillMax: config.supportSkillMax === true,
    trainingConfig: Array.isArray(config.trainingConfig) && config.trainingConfig.length > 0
      ? config.trainingConfig as CardTrainingConfig[]
      : defaults.trainingConfig,
    referenceMusicId: typeof config.selectedMusicId === "string" && config.selectedMusicId !== ""
      ? config.selectedMusicId
      : null,
    referenceDifficulty: typeof config.selectedDifficulty === "string" && config.selectedDifficulty !== ""
      ? config.selectedDifficulty
      : null,
  }
}

function parseSpecificSkillOrder(value: unknown): number[] {
  if (typeof value !== "string") {
    return []
  }

  return value
    .split(/[\s,，]+/)
    .map((token) => Number(token))
    .filter((entry) => Number.isInteger(entry) && entry > 0)
}

function defaultStorage(): Pick<Storage, "getItem"> | null {
  return typeof window === "undefined" ? null : window.localStorage
}
