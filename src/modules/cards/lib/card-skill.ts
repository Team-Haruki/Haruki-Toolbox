import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"

export type CardSkillEffectRow = {
  level: number
  value: number | null
  duration: number | null
}

export type CardSkillEffectDetail = {
  level: number
  value: number | null
  duration: number | null
}

export type CardSkillEffect = {
  id: number
  effectType: string
  /** `activateNotesJudgmentType`: `perfect` marks the PERFECT-only score up ("P分"). */
  judgmentType: string
  enhanceValue: number | null
  /** `skillEnhance.skillEnhanceType`: `sub_unit_score_up` marks a unit-Fes skill ("团分"). */
  enhanceType: string | null
  details: CardSkillEffectDetail[]
}

/** One normalized `skills.json` row: the engine input for every skill view. */
export type CardSkillRecord = {
  id: number
  description: string
  effects: CardSkillEffect[]
  /** Distinct `skillEffectType` values, in master order. */
  effectTypes: string[]
  /** The single type the list filter classifies the skill under. */
  filterType: string
  /** Highest `level` present in the effect details (4 for every current skill). */
  maxLevel: number
}

export type CardSkillView = {
  id: number
  description: string
  /** Every level collapsed into `a/b/c/d` lists. */
  formattedDescription: string
  effectRows: CardSkillEffectRow[]
  effectTypes: string[]
  filterType: string
  maxLevel: number
}

export type CardSkillContext = {
  /** Substituted into `{{0;c}}` placeholders (Bloom Fes character-rank skills). */
  characterName?: string
  /** When set, placeholders resolve to this level's value instead of the per-level list. */
  level?: number
}

/**
 * The skill buckets the list filter offers, named after the aliases the Haruki
 * Cloud bot accepts (分卡 / P分 / 判卡 / 奶卡 / 血分 / 判分 / 团分 …). Two of
 * them are not `skillEffectType` values at all: unit-Fes skills carry a plain
 * `score_up` effect and are only distinguishable by their
 * `skillEnhance.skillEnhanceType`, and the PERFECT-only score up by its
 * `activateNotesJudgmentType`. See `classifyCardSkillFilterType`.
 *
 * `score_up_character_rank` is deliberately absent: it is only ever a Bloom Fes
 * card's `specialTrainingSkillId`, never a `skillId`, so as a filter it matched
 * nothing while duplicating `other_member_score_up_reference_rate` +
 * `score_up_unit_count` — the two base skills those same cards carry. The
 * classifier can still return it, and the detail page still labels it.
 */
export const CARD_SKILL_FILTER_TYPES = [
  "score_up",
  "score_up_perfect",
  "judgment_up",
  "life_recovery",
  "score_up_condition_life",
  "score_up_keep",
  "sub_unit_score_up",
  "score_up_unit_count",
  "other_member_score_up_reference_rate",
] as const

export type CardSkillFilterType = (typeof CARD_SKILL_FILTER_TYPES)[number]

export function isCardSkillFilterType(value: unknown): value is CardSkillFilterType {
  return typeof value === "string" && (CARD_SKILL_FILTER_TYPES as readonly string[]).includes(value)
}

/**
 * The single bucket a skill is filed under, most distinguishing trait first:
 * a non-`score_up` effect type (judgment boost, life recovery, life-scaled or
 * streak score up, Bloom Fes character rank, teammate reference, mixed-unit
 * count), then the unit-Fes `skillEnhance`, then a PERFECT-only score up, and
 * finally the plain score up every basic card shares.
 */
export function classifyCardSkillFilterType(effects: readonly CardSkillEffect[]): string {
  const distinguishing = effects.find((effect) => effect.effectType !== "score_up" && effect.effectType !== "")
  if (distinguishing) {
    return distinguishing.effectType
  }
  if (effects.some((effect) => effect.enhanceType === "sub_unit_score_up")) {
    return "sub_unit_score_up"
  }
  if (effects.some((effect) => effect.judgmentType === "perfect")) {
    return "score_up_perfect"
  }
  return "score_up"
}

// Master data placeholders: `{{6;v}}`, `{{6;d}}`, `{{44;e}}`, `{{0;c}}` and
// the multi-id Bloom Fes forms `{{54,103;r}}` / `{{53,103;s}}`.
const SKILL_PLACEHOLDER_PATTERN = /\{\{\s*(\d+(?:\s*,\s*\d+)*)\s*;\s*([a-z])\s*\}\}/g

/** The detail row for `level`: exact match, else the highest lower level, else the lowest. */
function pickSkillDetail(details: readonly CardSkillEffectDetail[], level: number): CardSkillEffectDetail | null {
  let best: CardSkillEffectDetail | null = null
  for (const detail of details) {
    if (detail.level === level) {
      return detail
    }
    if (detail.level < level && (best == null || detail.level > best.level)) {
      best = detail
    }
  }
  return best ?? details[0] ?? null
}

function listSkillEffectValues(
  effect: CardSkillEffect | undefined,
  kind: "value" | "duration",
  level?: number,
): number[] {
  const details = effect?.details ?? []
  const selected = level != null ? [pickSkillDetail(details, level)].filter((detail) => detail != null) : details
  return selected
    .map((detail) => (kind === "duration" ? detail.duration : detail.value))
    .filter((value): value is number => value != null)
}

function collapseSkillValues(values: readonly number[]): string | null {
  if (values.length === 0) {
    return null
  }
  const unique = [...new Set(values.map(formatSkillNumber))]
  return unique.length === 1 ? unique[0] : unique.join("/")
}

function resolveUnitFesMaximum(effect: CardSkillEffect | undefined, level?: number): string {
  const enhance = effect?.enhanceValue
  const values = listSkillEffectValues(effect, "value", level)
  if (enhance == null || values.length === 0) {
    return "?"
  }
  return collapseSkillValues(values.map((value) => value + enhance * 5)) ?? "?"
}

function resolveSkillValueRange(
  ids: readonly number[],
  byId: ReadonlyMap<number, CardSkillEffect>,
  level?: number,
): string {
  const low = collapseSkillValues(listSkillEffectValues(byId.get(ids[0]), "value", level))
  const high = collapseSkillValues(listSkillEffectValues(byId.get(ids[ids.length - 1]), "value", level))
  return low != null && high != null ? `${low}~${high}` : "?"
}

function resolveSkillValueSum(
  ids: readonly number[],
  byId: ReadonlyMap<number, CardSkillEffect>,
  level?: number,
): string {
  const lists = ids.map((id) => listSkillEffectValues(byId.get(id), "value", level))
  if (lists.some((list) => list.length === 0)) {
    return "?"
  }
  const levels = Math.max(...lists.map((list) => list.length))
  const sums = Array.from({ length: levels }, (_, index) =>
    lists.reduce((total, list) => total + (list[Math.min(index, list.length - 1)] ?? 0), 0),
  )
  return collapseSkillValues(sums) ?? "?"
}

function resolveSkillPlaceholder(
  idsText: string,
  kind: string,
  byId: ReadonlyMap<number, CardSkillEffect>,
  context: CardSkillContext,
): string {
  const ids = idsText.split(",").map((part) => Number(part.trim()))
  const level = context.level
  if (kind === "c") {
    return context.characterName ?? "?"
  }
  if (kind === "d" || (kind === "v" && ids.length === 1)) {
    const valueKind = kind === "d" ? "duration" : "value"
    return collapseSkillValues(listSkillEffectValues(byId.get(ids[0]), valueKind, level)) ?? "?"
  }
  if (kind === "e") {
    const enhance = byId.get(ids[0])?.enhanceValue
    return enhance != null ? formatSkillNumber(enhance) : "?"
  }
  if (kind === "m") {
    return resolveUnitFesMaximum(byId.get(ids[0]), level)
  }
  if (kind === "r") {
    return resolveSkillValueRange(ids, byId, level)
  }
  return ids.length > 1 ? resolveSkillValueSum(ids, byId, level) : "?"
}

export function normalizeCardSkillRecord(value: unknown): CardSkillRecord | null {
  if (value == null || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (id == null) {
    return null
  }

  const effects = normalizeSkillEffects(record.skillEffects)
  const effectTypes = [...new Set(effects.map((effect) => effect.effectType).filter(Boolean))]
  const maxLevel = effects.reduce(
    (max, effect) => effect.details.reduce((inner, detail) => Math.max(inner, detail.level), max),
    0,
  )
  return {
    id,
    description: normalizeCatalogString(record.description),
    effects,
    effectTypes,
    filterType: classifyCardSkillFilterType(effects),
    maxLevel: Math.max(1, maxLevel),
  }
}

/** skillId → normalized record, built once per master version by the skills resource. */
export function buildCardSkillIndex(rawSkills: unknown): Map<number, CardSkillRecord> {
  const index = new Map<number, CardSkillRecord>()
  for (const raw of normalizeCatalogRecords(rawSkills)) {
    const record = normalizeCardSkillRecord(raw)
    if (record) {
      index.set(record.id, record)
    }
  }
  return index
}

export function buildCardSkillView(record: CardSkillRecord, context: CardSkillContext = {}): CardSkillView {
  return {
    id: record.id,
    description: record.description,
    formattedDescription: formatSkillDescription(record.description, record.effects, context),
    effectRows: buildEffectRows(record.effects),
    effectTypes: record.effectTypes,
    filterType: record.filterType,
    maxLevel: record.maxLevel,
  }
}

/** The description with every placeholder resolved for one skill level. */
export function formatCardSkillAtLevel(
  record: CardSkillRecord,
  level: number,
  context: Omit<CardSkillContext, "level"> = {},
): string {
  return formatSkillDescription(record.description, record.effects, { ...context, level })
}

export function normalizeCardSkill(
  rawSkills: unknown,
  skillId: number | null,
  context: CardSkillContext = {},
): CardSkillView | null {
  if (skillId == null) {
    return null
  }

  const raw = normalizeCatalogRecords(rawSkills)
    .find((candidate) => normalizeCatalogNumber(candidate.id) === skillId)
  const record = raw ? normalizeCardSkillRecord(raw) : null
  return record ? buildCardSkillView(record, context) : null
}

/**
 * Replaces master data placeholders with resolved values:
 * - `v` per-level value list (e.g. "70/75/80/90"), `d` per-level durations
 * - `e` the skillEnhance bonus (a single constant, e.g. unit-Fes "+10%")
 * - `c` the card's character name
 * - `r` a min~max range across the two listed effects (Bloom Fes rank bonus)
 * - `s`/`o`/`u` per-level sums of the listed effects (base + max bonus)
 * With `context.level` every list collapses to that level's single value.
 * Unresolvable placeholders degrade to "?" so raw braces never leak.
 */
export function formatSkillDescription(
  description: string,
  effects: readonly CardSkillEffect[],
  context: CardSkillContext = {},
): string {
  const byId = new Map(effects.map((effect) => [effect.id, effect]))
  return description.replace(SKILL_PLACEHOLDER_PATTERN, (_match, idsText: string, kind: string) =>
    resolveSkillPlaceholder(idsText, kind, byId, context),
  )
}

/**
 * The per-level table follows the skill's primary effect. Some skills list a
 * secondary effect first (birthday cards put the instant life recovery before
 * the score up, whose duration is 0), so prefer the score-up family.
 */
function buildEffectRows(effects: readonly CardSkillEffect[]): CardSkillEffectRow[] {
  const primary = effects.find((effect) => effect.effectType.startsWith("score_up")) ?? effects[0]
  if (!primary) {
    return []
  }

  return [...primary.details]
    .map(({ level, value, duration }) => ({ level, value, duration }))
    .sort((a, b) => a.level - b.level)
}

function normalizeSkillEffects(rawSkillEffects: unknown): CardSkillEffect[] {
  return normalizeCatalogRecords(rawSkillEffects).flatMap((record) => {
    const id = normalizeCatalogNumber(record.id)
    if (id == null) {
      return []
    }

    const enhance = record.skillEnhance
    const enhanceRecord = enhance && typeof enhance === "object" ? enhance as Record<string, unknown> : null
    const enhanceValue = enhanceRecord ? normalizeCatalogNumber(enhanceRecord.activateEffectValue) : null
    const enhanceType = enhanceRecord ? normalizeCatalogString(enhanceRecord.skillEnhanceType) || null : null

    const details = normalizeCatalogRecords(record.skillEffectDetails)
      .flatMap((detail) => {
        const level = normalizeCatalogNumber(detail.level)
        if (level == null) {
          return []
        }

        return [{
          level,
          value: normalizeCatalogNumber(detail.activateEffectValue),
          duration: normalizeCatalogNumber(detail.activateEffectDuration),
        }]
      })
      .sort((a, b) => a.level - b.level)
    return [{
      id,
      effectType: normalizeCatalogString(record.skillEffectType),
      judgmentType: normalizeCatalogString(record.activateNotesJudgmentType),
      enhanceValue,
      enhanceType,
      details,
    }]
  })
}

function formatSkillNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
}
