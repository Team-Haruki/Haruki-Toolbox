import type { CatalogMasterCard } from "@/shared/sekai/catalog"
import {
  normalizeCatalogNumber,
  normalizeCatalogRecords,
  normalizeCatalogString,
} from "@/shared/sekai/catalog"
import type { CatalogGacha } from "@/modules/gachas/lib/gacha-catalog"
import { buildCostumeThumbnailAssetbundleName } from "@/modules/costumes/lib/costume-options"

export type CardDetailExtras = {
  cardSkillName: string | null
  gachaPhrase: string | null
  /** Bloom Fes cards switch to a second skill after special training. */
  specialTrainingSkillId: number | null
  specialTrainingSkillName: string | null
}

export type CardEventSummary = {
  id: number
  name: string
  assetbundleName: string | null
  startAt: number | null
  aggregateAt: number | null
}

/**
 * Fields the shared CatalogMasterCard normalizer intentionally drops but the
 * detail page still needs. `-` is the master data convention for "no phrase".
 */
export function extractCardDetailExtras(rawCards: unknown, cardId: number): CardDetailExtras {
  const record = normalizeCatalogRecords(rawCards)
    .find((candidate) => normalizeCatalogNumber(candidate.id) === cardId)
  return {
    cardSkillName: normalizeMasterText(record?.cardSkillName),
    gachaPhrase: normalizeMasterText(record?.gachaPhrase),
    specialTrainingSkillId: normalizeCatalogNumber(record?.specialTrainingSkillId),
    specialTrainingSkillName: normalizeMasterText(record?.specialTrainingSkillName),
  }
}

export function buildCardEventIndex(rawEventCards: unknown): Map<number, number[]> {
  const index = new Map<number, number[]>()
  for (const record of normalizeCatalogRecords(rawEventCards)) {
    const cardId = normalizeCatalogNumber(record.cardId)
    const eventId = normalizeCatalogNumber(record.eventId)
    if (cardId == null || eventId == null) {
      continue
    }

    const eventIds = index.get(cardId)
    if (eventIds) {
      if (!eventIds.includes(eventId)) {
        eventIds.push(eventId)
      }
    } else {
      index.set(cardId, [eventId])
    }
  }

  return index
}

export function resolveCardEventSummaries(
  rawEvents: unknown,
  eventIds: readonly number[],
): CardEventSummary[] {
  if (eventIds.length === 0) {
    return []
  }

  const records = new Map<number, Omit<CardEventSummary, "id">>()
  for (const record of normalizeCatalogRecords(rawEvents)) {
    const id = normalizeCatalogNumber(record.id)
    if (id != null && eventIds.includes(id)) {
      records.set(id, {
        name: normalizeCatalogString(record.name),
        assetbundleName: normalizeCatalogString(record.assetbundleName) || null,
        startAt: normalizeCatalogNumber(record.startAt),
        aggregateAt: normalizeCatalogNumber(record.aggregateAt),
      })
    }
  }

  return [...eventIds]
    .sort((a, b) => a - b)
    .map((id) => {
      const record = records.get(id)
      return {
        id,
        name: record?.name || `#${id}`,
        assetbundleName: record?.assetbundleName ?? null,
        startAt: record?.startAt ?? null,
        aggregateAt: record?.aggregateAt ?? null,
      }
    })
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
  const linkedCostumeIds = new Set<number>()
  for (const record of normalizeCatalogRecords(rawCardCostume3ds)) {
    const linkedCardId = normalizeCatalogNumber(record.cardId)
    const costume3dId = normalizeCatalogNumber(record.costume3dId)
    if (linkedCardId === cardId && costume3dId != null) {
      linkedCostumeIds.add(costume3dId)
    }
  }
  if (linkedCostumeIds.size === 0) {
    return []
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
  const groupIds = new Set<number>()
  const recordsByGroup = new Map<number, CostumeRecord[]>()
  for (const record of normalizeCatalogRecords(rawCostume3ds)) {
    const id = normalizeCatalogNumber(record.id)
    const groupId = normalizeCatalogNumber(record.costume3dGroupId)
    if (id == null || groupId == null) {
      continue
    }

    const partType = normalizeCatalogString(record.partType)
    const colorId = normalizeCatalogNumber(record.colorId)
    const records = recordsByGroup.get(groupId) ?? []
    records.push({
      id,
      costume3dGroupId: groupId,
      partType,
      colorId,
      colorName: normalizeCatalogString(record.colorName),
      name: normalizeCatalogString(record.name),
      // Nuverse regions (cn/tw/kr) ship costume3ds.assetbundleName blank for
      // ~92% of rows; reconstruct it from id/part/color so the thumbnail
      // resolves (against the jp mirror) and body grouping still works.
      assetbundleName: buildCostumeThumbnailAssetbundleName(
        id,
        partType,
        colorId,
        normalizeCatalogString(record.assetbundleName),
      ),
    })
    recordsByGroup.set(groupId, records)
    if (linkedCostumeIds.has(id)) {
      groupIds.add(groupId)
    }
  }

  const slotOf = (partType: string): "body" | "hair" | "head" =>
    partType === "hair" ? "hair" : partType === "head" ? "head" : "body"

  const groups: CardCostumeGroup[] = []
  for (const groupId of [...groupIds].sort((a, b) => a - b)) {
    const parts = (recordsByGroup.get(groupId) ?? []).filter((record) => record.assetbundleName)
    if (parts.length === 0) {
      continue
    }

    // Combine same-color parts of this group across slots into one entry.
    type ColorBucket = {
      colorId: number | null
      colorName: string
      body: CostumeRecord | null
      head: CostumeRecord | null
      hair: CostumeRecord | null
    }
    const byColor = new Map<number, ColorBucket>()
    const order: number[] = []
    for (const record of parts) {
      const key = record.colorId ?? record.id
      let bucket = byColor.get(key)
      if (!bucket) {
        bucket = { colorId: record.colorId, colorName: "", body: null, head: null, hair: null }
        byColor.set(key, bucket)
        order.push(key)
      }
      if (!bucket.colorName && record.colorName) {
        bucket.colorName = record.colorName
      }
      const slot = slotOf(record.partType)
      if (slot === "body" && !bucket.body) {
        bucket.body = record
      } else if (slot === "head" && !bucket.head) {
        bucket.head = record
      } else if (slot === "hair" && !bucket.hair) {
        bucket.hair = record
      }
    }

    const colors: CardCostumeColor[] = []
    for (const key of order.sort((a, b) => a - b)) {
      const bucket = byColor.get(key)
      if (!bucket) {
        continue
      }
      // The body carries the outfit thumbnail; accessory-only groups use the
      // head (then hair) so a group without a body still renders.
      const representative = bucket.body ?? bucket.head ?? bucket.hair
      if (!representative) {
        continue
      }
      // Only a limited hairstyle (`*_unique_head`) is worn with its outfit; a
      // plain/default head in a body group is not combined, so the body
      // previews with the character's default head. A standalone accessory
      // group has no body, so its head is what we preview.
      const headIsUnique = bucket.head != null && bucket.head.assetbundleName.includes("unique_head")
      const headCostume3dId = bucket.body != null
        ? (headIsUnique ? bucket.head!.id : null)
        : bucket.head?.id ?? null
      colors.push({
        costume3dId: representative.id,
        colorId: bucket.colorId,
        colorName: bucket.colorName,
        assetbundleName: representative.assetbundleName,
        slot: slotOf(representative.partType),
        bodyCostume3dId: bucket.body?.id ?? null,
        headCostume3dId,
        hairCostume3dId: bucket.hair?.id ?? null,
      })
    }
    if (colors.length === 0) {
      continue
    }

    groups.push({
      costume3dGroupId: groupId,
      // Prefer a body's name; empty on Nuverse regions (names ship blank), where
      // the view layers a runtime-registry name fallback before a slot label.
      name: parts.find((record) => record.partType === "body" && record.name)?.name
        || parts.find((record) => record.name)?.name
        || "",
      colors,
    })
  }

  return groups
}

/** Gachas that pick up the card, ordered by start time. */
export function selectCardPickupGachas(
  gachas: readonly CatalogGacha[],
  cardId: number,
): CatalogGacha[] {
  return gachas
    .filter((gacha) => gacha.pickups.some((pickup) => pickup.cardId === cardId))
    .sort((a, b) => (a.startAt ?? 0) - (b.startAt ?? 0) || a.id - b.id)
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

function normalizeMasterText(value: unknown): string | null {
  const text = normalizeCatalogString(value)
  return text && text !== "-" ? text : null
}
