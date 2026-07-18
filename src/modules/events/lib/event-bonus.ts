import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"

export type EventBonusCharacter = {
  gameCharacterId: number
  /** Unit the bonus applies to, or null when it covers every unit variant of the character. */
  unit: string | null
}

export type EventBonusGroup = {
  /** Bonus card attribute, or null for character-only rows. */
  cardAttr: string | null
  bonusRate: number
  /** Deduplicated bonus characters; empty for attribute-only rows. */
  characters: EventBonusCharacter[]
}

type NormalizedDeckBonus = {
  eventId: number
  gameCharacterUnitId: number | null
  cardAttr: string | null
  bonusRate: number
}

type CharacterUnitEntry = {
  gameCharacterId: number
  unit: string | null
}

/** Miku (game character 21) has dedicated per-unit icon variants at these character icon ids. */
const MIKU_UNIT_ICON_IDS: Record<string, number> = {
  light_sound: 27,
  idol: 28,
  street: 29,
  theme_park: 30,
  school_refusal: 31,
}

function normalizeDeckBonus(record: Record<string, unknown>): NormalizedDeckBonus | null {
  const eventId = normalizeCatalogNumber(record.eventId)
  const bonusRate = normalizeCatalogNumber(record.bonusRate)
  if (!eventId || eventId <= 0 || bonusRate == null || bonusRate <= 0) {
    return null
  }

  const gameCharacterUnitId = normalizeCatalogNumber(record.gameCharacterUnitId)
  const cardAttr = normalizeCatalogString(record.cardAttr).toLowerCase() || null
  if (gameCharacterUnitId == null && cardAttr == null) {
    return null
  }

  return {
    eventId,
    gameCharacterUnitId: gameCharacterUnitId != null && gameCharacterUnitId > 0 ? gameCharacterUnitId : null,
    cardAttr,
    bonusRate,
  }
}

export function buildCharacterUnitMap(rawGameCharacterUnits: unknown): Map<number, CharacterUnitEntry> {
  const map = new Map<number, CharacterUnitEntry>()
  for (const record of normalizeCatalogRecords(rawGameCharacterUnits)) {
    const id = normalizeCatalogNumber(record.id)
    const gameCharacterId = normalizeCatalogNumber(record.gameCharacterId)
    if (!id || !gameCharacterId) {
      continue
    }

    map.set(id, {
      gameCharacterId,
      unit: normalizeCatalogString(record.unit) || null,
    })
  }

  return map
}

/**
 * Aggregates the raw eventDeckBonuses rows of one event into display groups.
 *
 * Master data encodes three bonus shapes per event:
 * - character + attribute rows (e.g. +50%)
 * - character-only rows (e.g. +25%)
 * - attribute-only rows (e.g. +25%)
 *
 * Rows are grouped by (cardAttr, bonusRate); characters inside a group are
 * deduplicated by game character id. A character matched through several unit
 * variants (virtual singers) collapses into a single entry with `unit: null`.
 */
export function aggregateEventDeckBonuses(
  eventId: number,
  rawEventDeckBonuses: unknown,
  rawGameCharacterUnits: unknown,
): EventBonusGroup[] {
  const characterUnits = buildCharacterUnitMap(rawGameCharacterUnits)
  const groups = new Map<string, {
    cardAttr: string | null
    bonusRate: number
    characters: Map<number, EventBonusCharacter>
    hasAttrOnlyRow: boolean
  }>()

  for (const record of normalizeCatalogRecords(rawEventDeckBonuses)) {
    const bonus = normalizeDeckBonus(record)
    if (!bonus || bonus.eventId !== eventId) {
      continue
    }

    const key = `${bonus.cardAttr ?? ""}|${bonus.bonusRate}`
    let group = groups.get(key)
    if (!group) {
      group = {
        cardAttr: bonus.cardAttr,
        bonusRate: bonus.bonusRate,
        characters: new Map(),
        hasAttrOnlyRow: false,
      }
      groups.set(key, group)
    }

    if (bonus.gameCharacterUnitId == null) {
      group.hasAttrOnlyRow = true
      continue
    }

    const entry = characterUnits.get(bonus.gameCharacterUnitId)
    if (!entry) {
      continue
    }

    const existing = group.characters.get(entry.gameCharacterId)
    if (existing) {
      if (existing.unit !== entry.unit) {
        existing.unit = null
      }
      continue
    }

    group.characters.set(entry.gameCharacterId, {
      gameCharacterId: entry.gameCharacterId,
      unit: entry.unit,
    })
  }

  return [...groups.values()]
    .map((group) => ({
      cardAttr: group.cardAttr,
      bonusRate: group.bonusRate,
      characters: [...group.characters.values()].sort((a, b) => a.gameCharacterId - b.gameCharacterId),
    }))
    .filter((group) => group.characters.length > 0 || group.cardAttr != null)
    .sort((a, b) =>
      b.bonusRate - a.bonusRate
      || Number(b.characters.length > 0) - Number(a.characters.length > 0)
      || (a.cardAttr ?? "").localeCompare(b.cardAttr ?? ""))
}

/** Maps eventId -> set of bonus card attributes, for the list page attribute filter. */
export function buildEventBonusAttrMap(rawEventDeckBonuses: unknown): Map<number, Set<string>> {
  const map = new Map<number, Set<string>>()
  for (const record of normalizeCatalogRecords(rawEventDeckBonuses)) {
    const bonus = normalizeDeckBonus(record)
    if (!bonus || bonus.cardAttr == null) {
      continue
    }

    let attrs = map.get(bonus.eventId)
    if (!attrs) {
      attrs = new Set()
      map.set(bonus.eventId, attrs)
    }
    attrs.add(bonus.cardAttr)
  }

  return map
}

/**
 * Resolves which character icon id to display for a bonus character.
 * Miku restricted to a specific sekai unit uses her per-unit icon variant.
 */
export function resolveBonusCharacterIconId(character: EventBonusCharacter): number {
  if (character.gameCharacterId === 21 && character.unit != null) {
    return MIKU_UNIT_ICON_IDS[character.unit] ?? character.gameCharacterId
  }

  return character.gameCharacterId
}

export function formatBonusRate(bonusRate: number): string {
  const rounded = Math.round(bonusRate * 10) / 10
  return `+${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}%`
}
