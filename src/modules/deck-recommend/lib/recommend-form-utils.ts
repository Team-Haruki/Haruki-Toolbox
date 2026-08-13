import type {
  DeckRecommendLiveType,
  DeckRecommendMode,
  DeckRecommendSingleCardOverride,
  DeckRecommendTarget,
  DeckRecommendUnitType,
} from "./recommend-options"
import { isDeckRecommendLiveType, isDeckRecommendUnit } from "./saved-config"
import type { CardTrainingConfig } from "./training-config"

export type NumericInputValue = string | number

export const MYSEKAI_FIXTURE_BONUS_RATE_MAX = 100

export function parseOptionalNumberInput(
  value: NumericInputValue | null | undefined,
  options: { min?: number; max?: number; integer?: boolean } = {},
): { value: number | null; invalid: boolean } {
  const trimmed = value == null ? "" : String(value).trim()
  if (trimmed === "") {
    return { value: null, invalid: false }
  }

  const parsed = Number(trimmed)
  if (
    !Number.isFinite(parsed)
    || (options.integer === true && !Number.isInteger(parsed))
    || (options.min != null && parsed < options.min)
    || (options.max != null && parsed > options.max)
  ) {
    return { value: null, invalid: true }
  }

  return { value: parsed, invalid: false }
}

export function parseFixtureBonusRateInput(value: NumericInputValue | null | undefined): { value: number | null; invalid: boolean } {
  const trimmed = value == null ? "" : String(value).trim()
  if (trimmed === "") {
    return { value: null, invalid: false }
  }

  const parsed = Number(trimmed)
  return isValidFixtureBonusRate(parsed)
    ? { value: parsed, invalid: false }
    : { value: null, invalid: true }
}

export function isValidFixtureBonusRate(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MYSEKAI_FIXTURE_BONUS_RATE_MAX && canBuildFixtureBonusRate(value)
}

function canBuildFixtureBonusRate(value: number): boolean {
  // 1 is available, so every integer total in the supported range can be expressed.
  return value >= 0
}

export function buildFixtureBonusRateValues(): number[] {
  return Array.from({ length: MYSEKAI_FIXTURE_BONUS_RATE_MAX + 1 }, (_, value) => value)
}

export function toggleSelectedValue<T extends string>(values: readonly T[], value: T, checked: boolean): T[] {
  if (checked) {
    return values.includes(value) ? [...values] : [...values, value]
  }
  return values.filter((item) => item !== value)
}

export function stringArraySignature(values: readonly string[]) {
  return values.join(",")
}

export function numberArraySignature(values: readonly number[]) {
  return values.join(",")
}

export function sortedRecordSignature(record: Record<string, string>) {
  return Object.entries(record)
    .sort(([left], [right]) => Number(left) - Number(right))
    .map(([key, value]) => `${key}=${value}`)
    .join(",")
}

export function singleCardOverridesSignature(values: readonly DeckRecommendSingleCardOverride[]) {
  return values
    .map((item) => [
      item.cardId,
      item.disabled ? 1 : 0,
      item.level ?? "",
      item.skillLevel ?? "",
      item.masterRank ?? "",
      item.episodeState ?? "",
      item.canvas == null ? "" : item.canvas ? 1 : 0,
    ].join(":"))
    .join(",")
}

export function trainingConfigSignature(values: readonly CardTrainingConfig[]) {
  return values
    .map((item) => [
      item.rarity,
      item.disabled ? 1 : 0,
      item.maxLevel ? 1 : 0,
      item.episodesRead ? 1 : 0,
      item.maxMasterRank ? 1 : 0,
      item.maxSkillLevel ? 1 : 0,
      item.mySekaiCanvas ? 1 : 0,
    ].join(":"))
    .join(",")
}

export function hasRequiredFiles(cachedFiles: readonly string[], requiredFiles: readonly string[]): boolean {
  return requiredFiles.every((fileName) => cachedFiles.includes(fileName))
}

export function mergeMasterFileNames(...groups: readonly (readonly string[])[]): string[] {
  return [...new Set(groups.flat())]
}

export function isAllowedRecommendTarget(target: DeckRecommendTarget, mode: DeckRecommendMode): boolean {
  return allowedRecommendTargets(mode).includes(target)
}

export function allowedRecommendTargets(mode: DeckRecommendMode): DeckRecommendTarget[] {
  switch (mode) {
    case "event":
      return ["score", "power", "skill", "bonus"]
    case "mysekai":
      return ["score", "power", "bonus"]
    case "challenge":
      return ["score", "power"]
    case "max":
      return ["score", "power", "skill"]
    case "bonus":
      return ["bonus"]
  }
}

export function defaultRecommendTarget(mode: DeckRecommendMode): DeckRecommendTarget {
  return mode === "bonus" ? "bonus" : "score"
}

export function normalizeLegacyRecommendModeTarget(
  mode: string | null,
): { mode: DeckRecommendMode; target: DeckRecommendTarget } | null {
  if (mode === "max-power") {
    return { mode: "max", target: "power" }
  }
  if (mode === "max-skill") {
    return { mode: "max", target: "skill" }
  }
  return null
}

export function normalizeDeckRecommendLiveType(value: string | null): DeckRecommendLiveType | null {
  if (!value) {
    return null
  }

  return value === "cheerful"
    ? "multi"
    : isDeckRecommendLiveType(value)
      ? value
      : null
}

export function normalizeDeckRecommendUnit(value: string | null | undefined): DeckRecommendUnitType | null {
  return value && isDeckRecommendUnit(value) ? value : null
}

export function parseWorldBloomTurn(value: string | null): number | null {
  const parsed = typeof value === "string" ? Number(value) : null
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 3) {
    return null
  }

  return parsed
}
