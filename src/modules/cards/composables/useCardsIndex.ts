import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import {
  normalizeCatalogMasterCard,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
  pushCatalogGroup,
  type CatalogMasterCard,
} from "@/shared/sekai/catalog"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import { buildCardSupplyTypeMap } from "@/modules/cards/lib/card-filter"

/**
 * The only resource that reads `cards.json` (≈35 MB raw on jp). Everything
 * a page needs from a card is extracted here once per master version so
 * list, detail, event, gacha and music pages never re-read the file:
 * compact card records, per-card extras and the level→power tables.
 */
export const CARDS_INDEX_KEY = "cards/index"
export const CARDS_INDEX_FILES = ["cards", "cardSupplies"] as const

export type CardPowerBonus = {
  p1: number
  p2: number
  p3: number
}

export type CardIndexExtras = {
  gachaPhrase: string | null
  flavorText: string | null
  /** Bloom Fes cards switch to a second skill after special training. */
  specialTrainingSkillId: number | null
  specialTrainingSkillName: string | null
  /** Fixed power added by special training (per parameter). */
  specialTrainingPowerBonus: CardPowerBonus
  /** Nuverse dumps: when the card entered the archive; null elsewhere. */
  archivePublishedAt: number | null
}

/** `cardParameters` re-shaped as arrays indexed by `level - 1`. */
export type CardPowerTable = {
  /** Highest level present in the table (50 for 3★ trained, 60 for 4★ trained…). */
  maxLevel: number
  p1: number[]
  p2: number[]
  p3: number[]
}

export type CardsIndex = {
  /** Every card, in id order. */
  list: CatalogMasterCard[]
  byId: Map<number, CatalogMasterCard>
  byCharacter: Map<number, CatalogMasterCard[]>
  /** `cardSupplyId` → `cardSupplyType`. */
  supplyTypeMap: Map<number, string>
  extrasById: Map<number, CardIndexExtras>
  powerTables: Map<number, CardPowerTable>
}

/** `-` is the master-data convention for "no text". */
function normalizeMasterText(value: unknown): string | null {
  const text = normalizeCatalogString(value)
  return text && text !== "-" ? text : null
}

type PowerColumn = "p1" | "p2" | "p3"

function powerColumnOf(parameterType: string): PowerColumn | null {
  switch (parameterType) {
    case "param1":
      return "p1"
    case "param2":
      return "p2"
    case "param3":
      return "p3"
    default:
      return null
  }
}

/** `cardParameters` rows → per-parameter power by level index (level 1 at index 0). */
function collectPowerColumns(raw: unknown): Record<PowerColumn, number[]> {
  const columns: Record<PowerColumn, number[]> = { p1: [], p2: [], p3: [] }
  for (const row of normalizeCatalogRecords(raw)) {
    const level = normalizeCatalogNumber(row.cardLevel)
    const power = normalizeCatalogNumber(row.power)
    const column = powerColumnOf(normalizeCatalogString(row.cardParameterType))
    if (!level || level < 1 || power == null || !column) {
      continue
    }
    columns[column][level - 1] = power
  }
  return columns
}

/** Fills gaps (missing levels) with the previous value so lookups are total. */
function fillPowerGaps(table: number[], maxLevel: number) {
  let last = 0
  for (let index = 0; index < maxLevel; index += 1) {
    if (table[index] == null) {
      table[index] = last
    } else {
      last = table[index]
    }
  }
}

function normalizePowerTable(raw: unknown): CardPowerTable | null {
  const { p1, p2, p3 } = collectPowerColumns(raw)
  const maxLevel = Math.max(p1.length, p2.length, p3.length)
  if (maxLevel === 0) {
    return null
  }
  for (const table of [p1, p2, p3]) {
    fillPowerGaps(table, maxLevel)
  }
  return { maxLevel, p1, p2, p3 }
}

function normalizeCardExtras(record: Record<string, unknown>): CardIndexExtras {
  return {
    gachaPhrase: normalizeMasterText(record.gachaPhrase),
    flavorText: normalizeMasterText(record.flavorText),
    specialTrainingSkillId: normalizeCatalogNumber(record.specialTrainingSkillId),
    specialTrainingSkillName: normalizeMasterText(record.specialTrainingSkillName),
    specialTrainingPowerBonus: {
      p1: normalizeCatalogNumber(record.specialTrainingPower1BonusFixed) ?? 0,
      p2: normalizeCatalogNumber(record.specialTrainingPower2BonusFixed) ?? 0,
      p3: normalizeCatalogNumber(record.specialTrainingPower3BonusFixed) ?? 0,
    },
    archivePublishedAt: normalizeCatalogNumber(record.archivePublishedAt),
  }
}

export function buildCardsIndex(files: Record<string, unknown>): CardsIndex {
  const list: CatalogMasterCard[] = []
  const byId = new Map<number, CatalogMasterCard>()
  const byCharacter = new Map<number, CatalogMasterCard[]>()
  const extrasById = new Map<number, CardIndexExtras>()
  const powerTables = new Map<number, CardPowerTable>()

  for (const record of normalizeCatalogRecords(files.cards)) {
    const card = normalizeCatalogMasterCard(record)
    if (!card) {
      continue
    }
    list.push(card)
    byId.set(card.id, card)
    if (card.characterId != null) {
      pushCatalogGroup(byCharacter, card.characterId, card)
    }
    extrasById.set(card.id, normalizeCardExtras(record))
    const table = normalizePowerTable(record.cardParameters)
    if (table) {
      powerTables.set(card.id, table)
    }
  }

  list.sort((a, b) => a.id - b.id)
  for (const group of byCharacter.values()) {
    group.sort((a, b) => a.id - b.id)
  }

  return {
    list,
    byId,
    byCharacter,
    supplyTypeMap: buildCardSupplyTypeMap(files.cardSupplies),
    extrasById,
    powerTables,
  }
}

export function useCardsIndex(region: Ref<SekaiRegion>): CatalogResource<CardsIndex> {
  return useCatalogResource(region, CARDS_INDEX_KEY, CARDS_INDEX_FILES, buildCardsIndex)
}
