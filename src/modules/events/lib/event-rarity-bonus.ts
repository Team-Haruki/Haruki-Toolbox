import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"

/** One `eventRarityBonusRates` row; `bonusRate` is already a percentage (10 = +10 %). */
export type EventRarityBonusRate = {
  cardRarityType: string
  masterRank: number
  bonusRate: number
}

export const EVENT_MASTER_RANKS = [0, 1, 2, 3, 4, 5] as const

/** Table row order: strongest rarity first, birthday cards last. */
const RARITY_ORDER = ["rarity_4", "rarity_3", "rarity_2", "rarity_1", "rarity_birthday"]

export type EventRarityBonusRow = {
  cardRarityType: string
  /** Bonus per master rank, indexed by `EVENT_MASTER_RANKS`; null when the dump lacks the rank. */
  rates: (number | null)[]
}

export function normalizeEventRarityBonusRates(value: unknown): EventRarityBonusRate[] {
  const rows: EventRarityBonusRate[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const cardRarityType = normalizeCatalogString(record.cardRarityType)
    const masterRank = normalizeCatalogNumber(record.masterRank)
    const bonusRate = normalizeCatalogNumber(record.bonusRate)
    if (!cardRarityType || masterRank == null || masterRank < 0 || bonusRate == null) {
      continue
    }
    rows.push({ cardRarityType, masterRank, bonusRate })
  }
  return rows
}

export function buildEventRarityBonusTable(rates: readonly EventRarityBonusRate[]): EventRarityBonusRow[] {
  const byRarity = new Map<string, (number | null)[]>()
  for (const rate of rates) {
    const index = EVENT_MASTER_RANKS.indexOf(rate.masterRank as (typeof EVENT_MASTER_RANKS)[number])
    if (index < 0) {
      continue
    }
    let row = byRarity.get(rate.cardRarityType)
    if (!row) {
      row = EVENT_MASTER_RANKS.map(() => null)
      byRarity.set(rate.cardRarityType, row)
    }
    row[index] = rate.bonusRate
  }
  const order = (rarity: string) => {
    const index = RARITY_ORDER.indexOf(rarity)
    return index < 0 ? RARITY_ORDER.length : index
  }
  return [...byRarity.entries()]
    .map(([cardRarityType, row]) => ({ cardRarityType, rates: row }))
    .sort((a, b) => order(a.cardRarityType) - order(b.cardRarityType) || a.cardRarityType.localeCompare(b.cardRarityType))
}
