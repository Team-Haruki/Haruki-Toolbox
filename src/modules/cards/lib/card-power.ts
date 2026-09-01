import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { CardIndexExtras, CardPowerBonus, CardPowerTable } from "@/modules/cards/composables/useCardsIndex"

/**
 * Base-power math for the card detail Power section. Everything here is a
 * plain sum over master-data fixed bonuses:
 *
 *   base(level) + special training + side stories + master rank + canvas
 *
 * Region items, titles and character ranks are deliberately out of scope —
 * the section is labelled "base power".
 */

export const ZERO_POWER_BONUS: CardPowerBonus = { p1: 0, p2: 0, p3: 0 }

export type CardPowerOptions = {
  level: number
  trained: boolean
  /** One flag per side story (`cardEpisodes` rows in `seq` order). */
  episodes: readonly boolean[]
  /** 0..5 */
  masterRank: number
  canvas: boolean
}

export type CardPowerResult = CardPowerBonus & {
  total: number
}

export type CardEpisodeCost = {
  resourceType: string
  resourceId: number | null
  quantity: number
}

export type CardEpisodeRow = {
  id: number
  seq: number
  cardId: number
  title: string
  /** `first_part` / `second_part` */
  partType: string
  bonus: CardPowerBonus
  costs: CardEpisodeCost[]
}

export type CardRarityInfo = {
  cardRarityType: string
  maxLevel: number
  /** Level cap after special training (3★ / 4★ only). */
  trainingMaxLevel: number | null
  maxSkillLevel: number
}

/** Built once per master version by the `"cards/detail-extras"` resource. */
export type CardDetailExtras = {
  episodesByCard: Map<number, CardEpisodeRow[]>
  raritiesByType: Map<string, CardRarityInfo>
  /** Per-rank increments (index `masterRank - 1`); the bonus at rank N is the sum of the first N. */
  masterLessonsByRarity: Map<string, CardPowerBonus[]>
  canvasBonusByRarity: Map<string, CardPowerBonus>
}

export const CARD_DETAIL_EXTRAS_FILES = [
  "cardEpisodes",
  "cardRarities",
  "masterLessons",
  "cardMysekaiCanvasBonuses",
] as const

function readPowerBonus(record: Record<string, unknown>): CardPowerBonus {
  return {
    p1: normalizeCatalogNumber(record.power1BonusFixed) ?? 0,
    p2: normalizeCatalogNumber(record.power2BonusFixed) ?? 0,
    p3: normalizeCatalogNumber(record.power3BonusFixed) ?? 0,
  }
}

function addPowerBonus(target: CardPowerBonus, bonus: CardPowerBonus | null | undefined): CardPowerBonus {
  if (!bonus) {
    return target
  }
  return { p1: target.p1 + bonus.p1, p2: target.p2 + bonus.p2, p3: target.p3 + bonus.p3 }
}

function normalizeEpisodeCosts(raw: unknown): CardEpisodeCost[] {
  return normalizeCatalogRecords(raw).flatMap((cost) => {
    const quantity = normalizeCatalogNumber(cost.quantity)
    if (quantity == null || quantity <= 0) {
      return []
    }
    return [{
      resourceType: normalizeCatalogString(cost.resourceType),
      resourceId: normalizeCatalogNumber(cost.resourceId),
      quantity,
    }]
  })
}

export function buildCardEpisodesByCard(rawCardEpisodes: unknown): Map<number, CardEpisodeRow[]> {
  const byCard = new Map<number, CardEpisodeRow[]>()
  for (const record of normalizeCatalogRecords(rawCardEpisodes)) {
    const id = normalizeCatalogNumber(record.id)
    const cardId = normalizeCatalogNumber(record.cardId)
    if (id == null || cardId == null) {
      continue
    }
    const row: CardEpisodeRow = {
      id,
      seq: normalizeCatalogNumber(record.seq) ?? id,
      cardId,
      title: normalizeCatalogString(record.title),
      partType: normalizeCatalogString(record.cardEpisodePartType),
      bonus: readPowerBonus(record),
      costs: normalizeEpisodeCosts(record.costs),
    }
    const rows = byCard.get(cardId)
    if (rows) {
      rows.push(row)
    } else {
      byCard.set(cardId, [row])
    }
  }
  for (const rows of byCard.values()) {
    rows.sort((a, b) => a.seq - b.seq || a.id - b.id)
  }
  return byCard
}

export function buildCardRaritiesByType(rawCardRarities: unknown): Map<string, CardRarityInfo> {
  const byType = new Map<string, CardRarityInfo>()
  for (const record of normalizeCatalogRecords(rawCardRarities)) {
    const cardRarityType = normalizeCatalogString(record.cardRarityType)
    const maxLevel = normalizeCatalogNumber(record.maxLevel)
    if (!cardRarityType || maxLevel == null) {
      continue
    }
    byType.set(cardRarityType, {
      cardRarityType,
      maxLevel,
      trainingMaxLevel: normalizeCatalogNumber(record.trainingMaxLevel),
      maxSkillLevel: normalizeCatalogNumber(record.maxSkillLevel) ?? 4,
    })
  }
  return byType
}

export function buildMasterLessonsByRarity(rawMasterLessons: unknown): Map<string, CardPowerBonus[]> {
  const rows = new Map<string, { rank: number; bonus: CardPowerBonus }[]>()
  for (const record of normalizeCatalogRecords(rawMasterLessons)) {
    const cardRarityType = normalizeCatalogString(record.cardRarityType)
    const rank = normalizeCatalogNumber(record.masterRank)
    if (!cardRarityType || rank == null || rank < 1) {
      continue
    }
    const list = rows.get(cardRarityType) ?? []
    list.push({ rank, bonus: readPowerBonus(record) })
    rows.set(cardRarityType, list)
  }
  const byRarity = new Map<string, CardPowerBonus[]>()
  for (const [cardRarityType, list] of rows) {
    list.sort((a, b) => a.rank - b.rank)
    byRarity.set(cardRarityType, list.map((row) => row.bonus))
  }
  return byRarity
}

export function buildCanvasBonusByRarity(rawCanvasBonuses: unknown): Map<string, CardPowerBonus> {
  const byRarity = new Map<string, CardPowerBonus>()
  for (const record of normalizeCatalogRecords(rawCanvasBonuses)) {
    const cardRarityType = normalizeCatalogString(record.cardRarityType)
    if (cardRarityType && !byRarity.has(cardRarityType)) {
      byRarity.set(cardRarityType, readPowerBonus(record))
    }
  }
  return byRarity
}

export function buildCardDetailExtras(files: Record<string, unknown>): CardDetailExtras {
  return {
    episodesByCard: buildCardEpisodesByCard(files.cardEpisodes),
    raritiesByType: buildCardRaritiesByType(files.cardRarities),
    masterLessonsByRarity: buildMasterLessonsByRarity(files.masterLessons),
    canvasBonusByRarity: buildCanvasBonusByRarity(files.cardMysekaiCanvasBonuses),
  }
}

/**
 * Level cap for the slider: the rarity's trained cap when trained (3★ 50,
 * 4★ 60), its base cap otherwise, never beyond what the power table holds.
 */
export function resolveCardLevelCap(
  rarity: CardRarityInfo | null | undefined,
  table: CardPowerTable | null | undefined,
  trained: boolean,
): number {
  const tableMax = table?.maxLevel ?? 0
  const rarityMax = trained ? (rarity?.trainingMaxLevel ?? rarity?.maxLevel ?? 0) : (rarity?.maxLevel ?? 0)
  if (tableMax > 0 && rarityMax > 0) {
    return Math.min(tableMax, rarityMax)
  }
  return Math.max(1, tableMax || rarityMax)
}

export function resolveCardPower(
  table: CardPowerTable | null | undefined,
  options: CardPowerOptions,
  extras: Pick<CardIndexExtras, "specialTrainingPowerBonus"> | null | undefined,
  episodeBonuses: readonly CardPowerBonus[],
  masterLessonBonuses: readonly CardPowerBonus[],
  canvasBonus: CardPowerBonus | null | undefined,
): CardPowerResult {
  let power: CardPowerBonus = ZERO_POWER_BONUS
  if (table && table.maxLevel > 0) {
    const index = Math.min(Math.max(1, Math.trunc(options.level)), table.maxLevel) - 1
    power = {
      p1: table.p1[index] ?? 0,
      p2: table.p2[index] ?? 0,
      p3: table.p3[index] ?? 0,
    }
  }

  if (options.trained) {
    power = addPowerBonus(power, extras?.specialTrainingPowerBonus)
  }

  options.episodes.forEach((enabled, index) => {
    if (enabled) {
      power = addPowerBonus(power, episodeBonuses[index])
    }
  })

  const rank = Math.min(Math.max(0, Math.trunc(options.masterRank)), masterLessonBonuses.length)
  for (let index = 0; index < rank; index += 1) {
    power = addPowerBonus(power, masterLessonBonuses[index])
  }

  if (options.canvas) {
    power = addPowerBonus(power, canvasBonus)
  }

  return { ...power, total: power.p1 + power.p2 + power.p3 }
}

/** Total base power at the table's highest level (the list's "power" sort key). */
export function resolveCardMaxPower(table: CardPowerTable | null | undefined): number | null {
  if (!table || table.maxLevel <= 0) {
    return null
  }
  const index = table.maxLevel - 1
  return (table.p1[index] ?? 0) + (table.p2[index] ?? 0) + (table.p3[index] ?? 0)
}

export function buildCardMaxPowerMap(powerTables: ReadonlyMap<number, CardPowerTable>): Map<number, number> {
  const map = new Map<number, number>()
  for (const [cardId, table] of powerTables) {
    const power = resolveCardMaxPower(table)
    if (power != null) {
      map.set(cardId, power)
    }
  }
  return map
}
