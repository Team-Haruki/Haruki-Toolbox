import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { EventCardLink, SekaiEventItem } from "@/modules/events"
import type { CatalogGachaSummary } from "@/modules/gachas"
import { buildCostumeThumbnailAssetbundleName } from "@/modules/costumes/lib/costume-options"

export type CardRelatedEvent = {
  event: SekaiEventItem
  /** `eventCards.bonusRate`; null when the dump does not carry it. */
  bonusRate: number | null
  /** `eventCards.leaderBonusRate`; absent on the en dump. */
  leaderBonusRate: number | null
  hasStory: boolean
}

/** Events the card was featured in, newest first, with its bonus rates. */
export function selectCardRelatedEvents(
  cardId: number,
  cardLinksByCard: ReadonlyMap<number, readonly EventCardLink[]>,
  eventsById: ReadonlyMap<number, SekaiEventItem>,
): CardRelatedEvent[] {
  const seen = new Set<number>()
  const rows: CardRelatedEvent[] = []
  for (const link of cardLinksByCard.get(cardId) ?? []) {
    const event = eventsById.get(link.eventId)
    if (!event || seen.has(event.id)) {
      continue
    }
    seen.add(event.id)
    rows.push({
      event,
      bonusRate: link.bonusRate,
      leaderBonusRate: link.leaderBonusRate,
      hasStory: link.isDisplayCardStory,
    })
  }
  return rows.sort((a, b) => (b.event.startAt ?? 0) - (a.event.startAt ?? 0) || b.event.id - a.event.id)
}

/** Gachas that pick up the card, original run first. */
export function selectCardRelatedGachas(
  cardId: number,
  gachaIdsByPickupCard: ReadonlyMap<number, readonly number[]>,
  gachasById: ReadonlyMap<number, CatalogGachaSummary>,
): CatalogGachaSummary[] {
  const gachas: CatalogGachaSummary[] = []
  for (const gachaId of gachaIdsByPickupCard.get(cardId) ?? []) {
    const gacha = gachasById.get(gachaId)
    if (gacha) {
      gachas.push(gacha)
    }
  }
  return gachas.sort((a, b) => (a.startAt ?? 0) - (b.startAt ?? 0) || a.id - b.id)
}

export type CardCostumeColor = {
  /** Representative part (prefers body) for the thumbnail, name and selection. */
  costume3dId: number
  colorId: number | null
  colorName: string
  assetbundleName: string
  /** Engine slot of the representative part (head covers accessories too). */
  slot: "body" | "hair" | "head"
  /** Same-color parts of this group, split by slot, to preview together. */
  bodyCostume3dId: number | null
  headCostume3dId: number | null
  hairCostume3dId: number | null
}

export type CardCostumeGroup = {
  costume3dGroupId: number
  name: string
  colors: CardCostumeColor[]
}

type CostumeRecord = {
  id: number
  costume3dGroupId: number
  partType: string
  colorId: number | null
  colorName: string
  name: string
  assetbundleName: string
}

type CostumeColorBucket = {
  colorId: number | null
  colorName: string
  body: CostumeRecord | null
  head: CostumeRecord | null
  hair: CostumeRecord | null
}

function collectLinkedCostumeIds(rawCardCostume3ds: unknown, cardId: number): Set<number> {
  const linkedCostumeIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawCardCostume3ds)) {
    const linkedCardId = normalizeCatalogNumber(record.cardId)
    const costume3dId = normalizeCatalogNumber(record.costume3dId)
    if (linkedCardId === cardId && costume3dId != null) {
      linkedCostumeIds.add(costume3dId)
    }
  }
  return linkedCostumeIds
}

function normalizeCostumeRecord(record: Record<string, unknown>): CostumeRecord | null {
  const id = normalizeCatalogNumber(record.id)
  const groupId = normalizeCatalogNumber(record.costume3dGroupId)
  if (id == null || groupId == null) {
    return null
  }

  const partType = normalizeCatalogString(record.partType)
  const colorId = normalizeCatalogNumber(record.colorId)
  return {
    id,
    costume3dGroupId: groupId,
    partType,
    colorId,
    colorName: normalizeCatalogString(record.colorName),
    name: normalizeCatalogString(record.name),
    // Nuverse regions (cn/tw/kr) ship costume3ds.assetbundleName blank for
    // ~92% of rows; reconstruct it from id/part/color so the thumbnail works.
    assetbundleName: buildCostumeThumbnailAssetbundleName(
      id,
      partType,
      colorId,
      normalizeCatalogString(record.assetbundleName),
    ),
  }
}

function indexCostumeRecords(
  rawCostume3ds: unknown,
  linkedCostumeIds: ReadonlySet<number>,
): { groupIds: Set<number>, recordsByGroup: Map<number, CostumeRecord[]> } {
  const groupIds = new Set<number>()
  const recordsByGroup = new Map<number, CostumeRecord[]>()
  for (const rawRecord of normalizeCatalogRecords(rawCostume3ds)) {
    const record = normalizeCostumeRecord(rawRecord)
    if (!record) {
      continue
    }

    const records = recordsByGroup.get(record.costume3dGroupId) ?? []
    records.push(record)
    recordsByGroup.set(record.costume3dGroupId, records)
    if (linkedCostumeIds.has(record.id)) {
      groupIds.add(record.costume3dGroupId)
    }
  }
  return { groupIds, recordsByGroup }
}

function costumeSlot(partType: string): "body" | "hair" | "head" {
  if (partType === "hair" || partType === "head") {
    return partType
  }
  return "body"
}

function bucketCostumeColors(parts: readonly CostumeRecord[]): {
  byColor: Map<number, CostumeColorBucket>
  order: number[]
} {
  const byColor = new Map<number, CostumeColorBucket>()
  const order: number[] = []
  for (const record of parts) {
    const key = record.colorId ?? record.id
    let bucket = byColor.get(key)
    if (!bucket) {
      bucket = { colorId: record.colorId, colorName: "", body: null, head: null, hair: null }
      byColor.set(key, bucket)
      order.push(key)
    }
    bucket.colorName ||= record.colorName
    bucket[costumeSlot(record.partType)] ??= record
  }
  return { byColor, order }
}

function buildCostumeColor(bucket: CostumeColorBucket): CardCostumeColor | null {
  const representative = bucket.body ?? bucket.head ?? bucket.hair
  if (!representative) {
    return null
  }

  const headIsUnique = bucket.head?.assetbundleName.includes("unique_head") ?? false
  const headCostume3dId = bucket.body
    ? (headIsUnique ? bucket.head!.id : null)
    : bucket.head?.id ?? null
  return {
    costume3dId: representative.id,
    colorId: bucket.colorId,
    colorName: bucket.colorName,
    assetbundleName: representative.assetbundleName,
    slot: costumeSlot(representative.partType),
    bodyCostume3dId: bucket.body?.id ?? null,
    headCostume3dId,
    hairCostume3dId: bucket.hair?.id ?? null,
  }
}

function buildCostumeColors(parts: readonly CostumeRecord[]): CardCostumeColor[] {
  const { byColor, order } = bucketCostumeColors(parts)
  const colors: CardCostumeColor[] = []
  for (const key of order.sort((a, b) => a - b)) {
    const bucket = byColor.get(key)
    const color = bucket ? buildCostumeColor(bucket) : null
    if (color) {
      colors.push(color)
    }
  }
  return colors
}

function resolveCostumeGroupName(parts: readonly CostumeRecord[]): string {
  return parts.find((record) => record.partType === "body" && record.name)?.name
    || parts.find((record) => record.name)?.name
    || ""
}

/**
 * Costume groups unlocked by a card. Within a group the body/head/hair parts
 * that share a color are combined into a single entry so the top and bottom of
 * one color preview together (the 3D recipe fills every slot the color has).
 * Groups without a body (e.g. accessory-only unlocks) fall back to whatever
 * part they have so the group still renders.
 */
export function resolveCardCostumeGroups(
  rawCardCostume3ds: unknown,
  rawCostume3ds: unknown,
  cardId: number,
): CardCostumeGroup[] {
  const linkedCostumeIds = collectLinkedCostumeIds(rawCardCostume3ds, cardId)
  if (linkedCostumeIds.size === 0) {
    return []
  }

  const { groupIds, recordsByGroup } = indexCostumeRecords(rawCostume3ds, linkedCostumeIds)
  const groups: CardCostumeGroup[] = []
  for (const groupId of [...groupIds].sort((a, b) => a - b)) {
    const parts = (recordsByGroup.get(groupId) ?? []).filter((record) => record.assetbundleName)
    if (parts.length === 0) {
      continue
    }

    const colors = buildCostumeColors(parts)
    if (colors.length === 0) {
      continue
    }

    groups.push({
      costume3dGroupId: groupId,
      // Prefer a body's name; empty on Nuverse regions (names ship blank), where
      // the view layers a runtime-registry name fallback before a slot label.
      name: resolveCostumeGroupName(parts),
      colors,
    })
  }

  return groups
}

export function selectSameCharacterCards(
  cards: readonly CatalogMasterCard[],
  card: CatalogMasterCard,
  limit = 12,
): CatalogMasterCard[] {
  if (card.characterId == null) {
    return []
  }

  return cards
    .filter((candidate) => candidate.characterId === card.characterId && candidate.id !== card.id)
    .sort((a, b) => (b.releaseAt ?? 0) - (a.releaseAt ?? 0) || b.id - a.id)
    .slice(0, Math.max(0, limit))
}
