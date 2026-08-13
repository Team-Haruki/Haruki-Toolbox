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

export type CardSkillView = {
  id: number
  description: string
  formattedDescription: string
  effectRows: CardSkillEffectRow[]
}

export type CardSkillContext = {
  /** Substituted into `{{0;c}}` placeholders (Bloom Fes character-rank skills). */
  characterName?: string
}

type SkillEffectDetail = {
  level: number
  value: number | null
  duration: number | null
}

type SkillEffect = {
  id: number
  effectType: string
  enhanceValue: number | null
  details: SkillEffectDetail[]
}

// Master data placeholders: `{{6;v}}`, `{{6;d}}`, `{{44;e}}`, `{{0;c}}` and
// the multi-id Bloom Fes forms `{{54,103;r}}` / `{{53,103;s}}`.
const SKILL_PLACEHOLDER_PATTERN = /\{\{\s*(\d+(?:\s*,\s*\d+)*)\s*;\s*([a-z])\s*\}\}/g

export function normalizeCardSkill(
  rawSkills: unknown,
  skillId: number | null,
  context: CardSkillContext = {},
): CardSkillView | null {
  if (skillId == null) {
    return null
  }

  const record = normalizeCatalogRecords(rawSkills)
    .find((candidate) => normalizeCatalogNumber(candidate.id) === skillId)
  if (!record) {
    return null
  }

  const description = normalizeCatalogString(record.description)
  const effects = normalizeSkillEffects(record.skillEffects)
  return {
    id: skillId,
    description,
    formattedDescription: formatSkillDescription(description, effects, context),
    effectRows: buildEffectRows(effects),
  }
}

/**
 * Replaces master data placeholders with resolved values:
 * - `v` per-level value list (e.g. "70/75/80/90"), `d` per-level durations
 * - `e` the skillEnhance bonus (a single constant, e.g. unit-Fes "+10%")
 * - `c` the card's character name
 * - `r` a min~max range across the two listed effects (Bloom Fes rank bonus)
 * - `s`/`o`/`u` per-level sums of the listed effects (base + max bonus)
 * Unresolvable placeholders degrade to "?" so raw braces never leak.
 */
export function formatSkillDescription(
  description: string,
  effects: readonly SkillEffect[],
  context: CardSkillContext = {},
): string {
  const byId = new Map(effects.map((effect) => [effect.id, effect]))

  const valueList = (effect: SkillEffect | undefined, kind: "value" | "duration") => {
    const values = (effect?.details ?? [])
      .map((detail) => (kind === "duration" ? detail.duration : detail.value))
      .filter((value): value is number => value != null)
    return values
  }

  const collapse = (values: readonly number[]) => {
    if (values.length === 0) {
      return null
    }
    const unique = [...new Set(values.map(formatSkillNumber))]
    return unique.length === 1 ? unique[0] : unique.join("/")
  }

  return description.replace(SKILL_PLACEHOLDER_PATTERN, (match, idsText: string, kind: string) => {
    const ids = idsText.split(",").map((part) => Number(part.trim()))

    if (kind === "c") {
      return context.characterName ?? "?"
    }

    if (kind === "d" || (kind === "v" && ids.length === 1)) {
      const collapsed = collapse(valueList(byId.get(ids[0]), kind === "d" ? "duration" : "value"))
      return collapsed ?? "?"
    }

    if (kind === "e") {
      const enhance = byId.get(ids[0])?.enhanceValue
      return enhance != null ? formatSkillNumber(enhance) : "?"
    }

    if (kind === "m") {
      // Unit-Fes maximum: base value plus the enhance bonus applied for the
      // four other unit members and once more on a full unit match.
      const effect = byId.get(ids[0])
      const enhance = effect?.enhanceValue
      const values = valueList(effect, "value")
      if (enhance == null || values.length === 0) {
        return "?"
      }
      return collapse(values.map((value) => value + enhance * 5)) ?? "?"
    }

    if (kind === "r") {
      // Range across the listed effects, e.g. rank bonus "1~50".
      const low = collapse(valueList(byId.get(ids[0]), "value"))
      const high = collapse(valueList(byId.get(ids[ids.length - 1]), "value"))
      return low != null && high != null ? `${low}~${high}` : "?"
    }

    // Multi-id sums (`s`/`o`/`u` and multi-id `v`): base effect plus the max
    // bonus effect per level — the static ceiling of a dynamic in-game total.
    if (ids.length > 1) {
      const lists = ids.map((id) => valueList(byId.get(id), "value"))
      if (lists.some((list) => list.length === 0)) {
        return "?"
      }
      const levels = Math.max(...lists.map((list) => list.length))
      const sums = Array.from({ length: levels }, (_, index) =>
        lists.reduce((total, list) => total + (list[Math.min(index, list.length - 1)] ?? 0), 0),
      )
      return collapse(sums) ?? "?"
    }

    return "?"
  })
}

/**
 * The per-level table follows the skill's primary effect. Some skills list a
 * secondary effect first (birthday cards put the instant life recovery before
 * the score up, whose duration is 0), so prefer the score-up family.
 */
function buildEffectRows(effects: readonly SkillEffect[]): CardSkillEffectRow[] {
  const primary = effects.find((effect) => effect.effectType.startsWith("score_up")) ?? effects[0]
  if (!primary) {
    return []
  }

  return [...primary.details]
    .map(({ level, value, duration }) => ({ level, value, duration }))
    .sort((a, b) => a.level - b.level)
}

function normalizeSkillEffects(rawSkillEffects: unknown): SkillEffect[] {
  return normalizeCatalogRecords(rawSkillEffects).flatMap((record) => {
    const id = normalizeCatalogNumber(record.id)
    if (id == null) {
      return []
    }

    const enhance = record.skillEnhance
    const enhanceValue = enhance && typeof enhance === "object"
      ? normalizeCatalogNumber((enhance as Record<string, unknown>).activateEffectValue)
      : null

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
      enhanceValue,
      details,
    }]
  })
}

function formatSkillNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
}
