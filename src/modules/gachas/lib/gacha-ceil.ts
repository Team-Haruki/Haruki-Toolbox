import {
  appendCatalogRecords,
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import {
  normalizeGachaCeilItems,
  normalizeGachaTimestamp,
  type CatalogGachaCeilItem,
} from "@/modules/gachas/lib/gacha-catalog"

/** Purpose tag of the resource boxes the sticker exchange hands out. */
export const GACHA_CEIL_EXCHANGE_BOX_PURPOSE = "gacha_ceil_exchange"

export type GachaCeilExchangeCost = {
  resourceType: string
  resourceId: number | null
  quantity: number
}

export type GachaCeilExchange = {
  id: number
  seq: number | null
  resourceBoxId: number | null
  exchangeLimit: number | null
  substituteLimit: number | null
  /** `limited` / `fes` on jp; absent for plain rows. */
  labelType: string | null
  startAt: number | null
  endAt: number | null
  cost: GachaCeilExchangeCost | null
  substituteCosts: GachaCeilExchangeCost[]
}

export type GachaCeilExchangeSummary = {
  id: number
  /** Absent on the cn dump — join by `gachaCeilItemId` there. */
  gachaId: number | null
  gachaCeilItemId: number | null
  assetbundleName: string
  startAt: number | null
  endAt: number | null
  exchanges: GachaCeilExchange[]
}

export type GachaResourceBoxReward = {
  resourceType: string
  resourceId: number | null
  quantity: number
  level: number | null
}

function normalizeCost(value: unknown, quantityKey: "quantity" | "substituteQuantity"): GachaCeilExchangeCost | null {
  if (value == null || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  const resourceType = normalizeCatalogString(record.resourceType)
  const quantity = normalizeCatalogNumber(record[quantityKey])
  if (!resourceType || quantity == null) {
    return null
  }
  return { resourceType, resourceId: normalizeCatalogNumber(record.resourceId), quantity }
}

function normalizeExchange(value: unknown): GachaCeilExchange | null {
  if (value == null || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (!id) {
    return null
  }
  return {
    id,
    seq: normalizeCatalogNumber(record.seq),
    resourceBoxId: normalizeCatalogNumber(record.resourceBoxId),
    exchangeLimit: normalizeCatalogNumber(record.exchangeLimit),
    substituteLimit: normalizeCatalogNumber(record.substituteLimit),
    labelType: normalizeCatalogString(record.gachaCeilExchangeLabelType) || null,
    startAt: normalizeGachaTimestamp(record.startAt),
    endAt: normalizeGachaTimestamp(record.endAt),
    cost: normalizeCost(record.gachaCeilExchangeCost, "quantity"),
    substituteCosts: normalizeCatalogRecords(record.gachaCeilExchangeSubstituteCosts)
      .map((row) => normalizeCost(row, "substituteQuantity"))
      .filter((cost): cost is GachaCeilExchangeCost => cost != null),
  }
}

export function normalizeGachaCeilExchangeSummaries(value: unknown): GachaCeilExchangeSummary[] {
  const summaries: GachaCeilExchangeSummary[] = []
  for (const record of normalizeCatalogRecords(value)) {
    const id = normalizeCatalogNumber(record.id)
    if (!id) {
      continue
    }
    summaries.push({
      id,
      gachaId: normalizeCatalogNumber(record.gachaId),
      gachaCeilItemId: normalizeCatalogNumber(record.gachaCeilItemId),
      assetbundleName: normalizeCatalogString(record.assetbundleName),
      startAt: normalizeGachaTimestamp(record.startAt),
      endAt: normalizeGachaTimestamp(record.endAt),
      exchanges: normalizeCatalogRecords(record.gachaCeilExchanges)
        .map((row) => normalizeExchange(row))
        .filter((row): row is GachaCeilExchange => row != null)
        .sort((a, b) => (a.seq ?? Number.MAX_SAFE_INTEGER) - (b.seq ?? Number.MAX_SAFE_INTEGER) || a.id - b.id),
    })
  }
  return summaries
}

function normalizeReward(value: Record<string, unknown>): GachaResourceBoxReward | null {
  const resourceType = normalizeCatalogString(value.resourceType)
  if (!resourceType) {
    return null
  }
  return {
    resourceType,
    resourceId: normalizeCatalogNumber(value.resourceId),
    quantity: normalizeCatalogNumber(value.resourceQuantity) ?? 1,
    level: normalizeCatalogNumber(value.resourceLevel),
  }
}

export type GachaCeilResourceBoxes = {
  /** resourceBoxId → rewards, restricted to the sticker-exchange purpose. */
  boxes: Map<number, GachaResourceBoxReward[]>
  /** False when the region ships neither box file (cn): render raw box ids. */
  available: boolean
}

/**
 * jp/en embed `details` in each resourceBoxes row; tw/kr ship a flat
 * resourceBoxDetails.json instead (100k+ rows — appended without spreading).
 * Only the sticker-exchange purpose is kept, so the built value stays small.
 */
function isCeilExchangeBox(record: Record<string, unknown>): boolean {
  return normalizeCatalogString(record.resourceBoxPurpose) === GACHA_CEIL_EXCHANGE_BOX_PURPOSE
}

/** Embedded `details` rows (jp/en). Returns whether any box row existed at all. */
function collectEmbeddedCeilBoxes(boxes: Map<number, GachaResourceBoxReward[]>, rawBoxes: unknown): boolean {
  let sawAnyBox = false
  for (const record of normalizeCatalogRecords(rawBoxes)) {
    sawAnyBox = true
    const id = normalizeCatalogNumber(record.id)
    if (!isCeilExchangeBox(record) || !id) {
      continue
    }
    const rewards: GachaResourceBoxReward[] = []
    for (const detail of normalizeCatalogRecords(record.details)) {
      const reward = normalizeReward(detail)
      if (reward) {
        rewards.push(reward)
      }
    }
    boxes.set(id, rewards)
  }
  return sawAnyBox
}

function addUniqueCeilReward(boxes: Map<number, GachaResourceBoxReward[]>, boxId: number, reward: GachaResourceBoxReward) {
  const rewards = boxes.get(boxId)
  if (!rewards) {
    boxes.set(boxId, [reward])
    return
  }
  if (!rewards.some((row) => row.resourceType === reward.resourceType && row.resourceId === reward.resourceId)) {
    rewards.push(reward)
  }
}

/** Flat resourceBoxDetails rows (tw/kr). Returns whether any row existed at all. */
function collectFlatCeilBoxDetails(boxes: Map<number, GachaResourceBoxReward[]>, rawDetails: unknown): boolean {
  const flatDetails: Record<string, unknown>[] = []
  appendCatalogRecords(flatDetails, rawDetails)
  for (const detail of flatDetails) {
    const boxId = normalizeCatalogNumber(detail.resourceBoxId)
    if (!isCeilExchangeBox(detail) || !boxId) {
      continue
    }
    const reward = normalizeReward(detail)
    if (reward) {
      addUniqueCeilReward(boxes, boxId, reward)
    }
  }
  return flatDetails.length > 0
}

export function buildGachaCeilResourceBoxes(rawBoxes: unknown, rawDetails: unknown): GachaCeilResourceBoxes {
  const boxes = new Map<number, GachaResourceBoxReward[]>()
  const sawEmbedded = collectEmbeddedCeilBoxes(boxes, rawBoxes)
  const sawFlat = collectFlatCeilBoxDetails(boxes, rawDetails)
  return { boxes, available: sawEmbedded || sawFlat }
}

export type GachaCeilItemsIndex = {
  items: CatalogGachaCeilItem[]
  byId: Map<number, CatalogGachaCeilItem>
  byGachaId: Map<number, CatalogGachaCeilItem>
}

export function buildGachaCeilItemsIndex(files: Record<string, unknown>): GachaCeilItemsIndex {
  const byId = normalizeGachaCeilItems(files.gachaCeilItems)
  const items = [...byId.values()].sort((a, b) => a.id - b.id)
  const byGachaId = new Map<number, CatalogGachaCeilItem>()
  for (const item of items) {
    if (item.gachaId != null && !byGachaId.has(item.gachaId)) {
      byGachaId.set(item.gachaId, item)
    }
  }
  return { items, byId, byGachaId }
}

export type GachaCeilExchangeIndex = {
  summaries: GachaCeilExchangeSummary[]
  byGachaId: Map<number, GachaCeilExchangeSummary>
  byCeilItemId: Map<number, GachaCeilExchangeSummary>
  boxes: GachaCeilResourceBoxes
}

export function buildGachaCeilExchangeIndex(files: Record<string, unknown>): GachaCeilExchangeIndex {
  const summaries = normalizeGachaCeilExchangeSummaries(files.gachaCeilExchangeSummaries)
  const byGachaId = new Map<number, GachaCeilExchangeSummary>()
  const byCeilItemId = new Map<number, GachaCeilExchangeSummary>()
  for (const summary of summaries) {
    if (summary.gachaId != null && !byGachaId.has(summary.gachaId)) {
      byGachaId.set(summary.gachaId, summary)
    }
    if (summary.gachaCeilItemId != null && !byCeilItemId.has(summary.gachaCeilItemId)) {
      byCeilItemId.set(summary.gachaCeilItemId, summary)
    }
  }
  return {
    summaries,
    byGachaId,
    byCeilItemId,
    boxes: buildGachaCeilResourceBoxes(files.resourceBoxes, files.resourceBoxDetails),
  }
}

/** `gachaCeilItems.gachaId` first (every region), then the jp/en `gachaCeilItemId` link. */
export function resolveGachaCeilItem(
  index: Pick<GachaCeilItemsIndex, "byId" | "byGachaId">,
  gacha: { id: number; gachaCeilItemId: number | null },
): CatalogGachaCeilItem | null {
  return index.byGachaId.get(gacha.id)
    ?? (gacha.gachaCeilItemId != null ? index.byId.get(gacha.gachaCeilItemId) ?? null : null)
}

/** By `gachaId` first; cn rows lack it, so fall back to the ceil item id. */
export function resolveGachaCeilExchangeSummary(
  index: Pick<GachaCeilExchangeIndex, "byGachaId" | "byCeilItemId">,
  gacha: { id: number; gachaCeilItemId: number | null },
  ceilItem: CatalogGachaCeilItem | null,
): GachaCeilExchangeSummary | null {
  const byGacha = index.byGachaId.get(gacha.id)
  if (byGacha) {
    return byGacha
  }
  const ceilItemId = ceilItem?.id ?? gacha.gachaCeilItemId
  return ceilItemId != null ? index.byCeilItemId.get(ceilItemId) ?? null : null
}

export type GachaCeilExchangeRow = {
  exchange: GachaCeilExchange
  /** Box contents; null when the region ships no box files or the box is unknown. */
  rewards: GachaResourceBoxReward[] | null
}

/** Exchange table rows for one summary, joined with the reward boxes when available. */
export function buildGachaCeilExchangeRows(
  summary: Pick<GachaCeilExchangeSummary, "exchanges"> | null,
  boxes: GachaCeilResourceBoxes | null,
): GachaCeilExchangeRow[] {
  if (!summary) {
    return []
  }
  return summary.exchanges.map((exchange) => ({
    exchange,
    rewards: boxes?.available && exchange.resourceBoxId != null
      ? boxes.boxes.get(exchange.resourceBoxId) ?? null
      : null,
  }))
}
