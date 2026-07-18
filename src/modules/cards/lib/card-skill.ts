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

type SkillEffectDetail = {
  level: number
  value: number | null
  duration: number | null
}

type SkillEffect = {
  id: number
  details: SkillEffectDetail[]
}

const SKILL_PLACEHOLDER_PATTERN = /\{\{\s*(\d+)\s*;\s*([a-z])\s*\}\}/g

export function normalizeCardSkill(rawSkills: unknown, skillId: number | null): CardSkillView | null {
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
    formattedDescription: formatSkillDescription(description, effects),
    effectRows: buildEffectRows(effects),
  }
}

/**
 * Replaces master data placeholders such as `{{6;v}}` / `{{6;d}}` with the
 * per-level value list (e.g. "70/75/80/90") resolved from skillEffects.
 * Unresolvable placeholders degrade to "?" so the raw braces never leak
 * into the UI.
 */
export function formatSkillDescription(description: string, effects: readonly SkillEffect[]): string {
  return description.replace(SKILL_PLACEHOLDER_PATTERN, (match, idText: string, kind: string) => {
    const effect = effects.find((candidate) => candidate.id === Number(idText))
    if (!effect) {
      return "?"
    }

    const values = effect.details
      .map((detail) => (kind === "d" ? detail.duration : detail.value))
      .filter((value): value is number => value != null)
    if (values.length === 0) {
      return "?"
    }

    const unique = [...new Set(values.map(formatSkillNumber))]
    return unique.length === 1 ? unique[0] : unique.join("/")
  })
}

function buildEffectRows(effects: readonly SkillEffect[]): CardSkillEffectRow[] {
  const first = effects[0]
  if (!first) {
    return []
  }

  return [...first.details].sort((a, b) => a.level - b.level)
}

function normalizeSkillEffects(rawSkillEffects: unknown): SkillEffect[] {
  return normalizeCatalogRecords(rawSkillEffects).flatMap((record) => {
    const id = normalizeCatalogNumber(record.id)
    if (id == null) {
      return []
    }

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
    return [{ id, details }]
  })
}

function formatSkillNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10)
}
