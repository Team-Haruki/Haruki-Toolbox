import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { normalizeCatalogNumber, normalizeCatalogRecords, normalizeCatalogString } from "@/shared/sekai/catalog"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildGachaBannerAliasMap,
  normalizeGachaBehaviors,
  normalizeGachaPickups,
  normalizeGachaRarityRates,
  normalizeGachaTimestamp,
  type CatalogGachaBehavior,
  type CatalogGachaPickup,
  type CatalogGachaRarityRate,
} from "@/modules/gachas/lib/gacha-catalog"

/**
 * The only resource that reads `gachas.json` for listing purposes. It keeps
 * a summary per gacha (no `gachaDetails` weights, no information text —
 * those are ~30 MB raw on jp); the detail page reads the full record for
 * one gacha through `useSekaiCatalogStore().readFiles(...)`, which serves it
 * from the raw-file LRU.
 */
export const GACHAS_INDEX_KEY = "gachas/index"
export const GACHAS_INDEX_FILES = ["gachas"] as const

export type CatalogGachaSummary = {
  id: number
  gachaType: string
  name: string
  seq: number | null
  assetbundleName: string
  startAt: number | null
  endAt: number | null
  /** Absent on Nuverse (tw/kr/cn) dumps — join `gachaCeilItems.gachaId` instead. */
  gachaCeilItemId: number | null
  wishSelectCount: number
  wishFixedSelectCount: number
  wishLimitedSelectCount: number
  rarityRates: CatalogGachaRarityRate[]
  pickups: CatalogGachaPickup[]
  pickupCardIds: number[]
  behaviors: CatalogGachaBehavior[]
}

export type GachasIndex = {
  /** Every gacha, newest `startAt` first (ids descending as tiebreak). */
  list: CatalogGachaSummary[]
  byId: Map<number, CatalogGachaSummary>
  /** cardId → gachas that feature the card as a pickup, newest first. */
  gachaIdsByPickupCard: Map<number, number[]>
  /** Rerun gacha id → original gacha id whose banner it can reuse. */
  bannerAliasMap: Map<number, number>
}

export function normalizeCatalogGachaSummary(value: unknown): CatalogGachaSummary | null {
  if (value == null || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  const id = normalizeCatalogNumber(record.id)
  if (!id || id <= 0) {
    return null
  }
  const pickups = normalizeGachaPickups(record.gachaPickups)
  const pickupCardIds = [...new Set(pickups.map((pickup) => pickup.cardId))]
  return {
    id,
    gachaType: normalizeCatalogString(record.gachaType),
    name: normalizeCatalogString(record.name) || `#${id}`,
    seq: normalizeCatalogNumber(record.seq),
    assetbundleName: normalizeCatalogString(record.assetbundleName),
    startAt: normalizeGachaTimestamp(record.startAt),
    endAt: normalizeGachaTimestamp(record.endAt),
    gachaCeilItemId: normalizeCatalogNumber(record.gachaCeilItemId),
    wishSelectCount: normalizeCatalogNumber(record.wishSelectCount) ?? 0,
    wishFixedSelectCount: normalizeCatalogNumber(record.wishFixedSelectCount) ?? 0,
    wishLimitedSelectCount: normalizeCatalogNumber(record.wishLimitedSelectCount) ?? 0,
    rarityRates: normalizeGachaRarityRates(record.gachaCardRarityRates),
    pickups,
    pickupCardIds,
    behaviors: normalizeGachaBehaviors(record.gachaBehaviors),
  }
}

export function buildGachasIndex(files: Record<string, unknown>): GachasIndex {
  const list: CatalogGachaSummary[] = []
  for (const record of normalizeCatalogRecords(files.gachas)) {
    const summary = normalizeCatalogGachaSummary(record)
    if (summary) {
      list.push(summary)
    }
  }
  list.sort((a, b) => (b.startAt ?? 0) - (a.startAt ?? 0) || b.id - a.id)

  const byId = new Map<number, CatalogGachaSummary>()
  const gachaIdsByPickupCard = new Map<number, number[]>()
  for (const gacha of list) {
    byId.set(gacha.id, gacha)
    for (const cardId of gacha.pickupCardIds) {
      const ids = gachaIdsByPickupCard.get(cardId)
      if (ids) {
        ids.push(gacha.id)
      } else {
        gachaIdsByPickupCard.set(cardId, [gacha.id])
      }
    }
  }

  return {
    list,
    byId,
    gachaIdsByPickupCard,
    bannerAliasMap: buildGachaBannerAliasMap(list),
  }
}

export function useGachasIndex(region: Ref<SekaiRegion>): CatalogResource<GachasIndex> {
  return useCatalogResource(region, GACHAS_INDEX_KEY, GACHAS_INDEX_FILES, buildGachasIndex)
}
