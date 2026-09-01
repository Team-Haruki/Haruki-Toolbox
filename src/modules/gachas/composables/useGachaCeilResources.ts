import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildGachaCeilExchangeIndex,
  buildGachaCeilItemsIndex,
  type GachaCeilExchangeIndex,
  type GachaCeilItemsIndex,
} from "@/modules/gachas/lib/gacha-ceil"

/** Sticker items per gacha (small; every region ships it). */
export const GACHA_CEIL_ITEMS_KEY = "gachas/ceil-items"
export const GACHA_CEIL_ITEMS_FILES = ["gachaCeilItems"] as const

/**
 * Sticker exchange tables plus the reward boxes they reference. All three
 * files are region-conditional (tw/kr lack the summaries, cn ships no
 * resourceBoxes) and the exchange section loads this on its first open.
 */
export const GACHA_CEIL_EXCHANGE_KEY = "gachas/ceil-exchange"
export const GACHA_CEIL_EXCHANGE_FILES = ["gachaCeilExchangeSummaries", "resourceBoxes", "resourceBoxDetails"] as const

export function useGachaCeilItems(region: Ref<SekaiRegion>): CatalogResource<GachaCeilItemsIndex> {
  return useCatalogResource(region, GACHA_CEIL_ITEMS_KEY, GACHA_CEIL_ITEMS_FILES, buildGachaCeilItemsIndex)
}

export function useGachaCeilExchange(
  region: Ref<SekaiRegion>,
  enabled: Ref<boolean>,
): CatalogResource<GachaCeilExchangeIndex> {
  return useCatalogResource(region, GACHA_CEIL_EXCHANGE_KEY, GACHA_CEIL_EXCHANGE_FILES, buildGachaCeilExchangeIndex, {
    optional: GACHA_CEIL_EXCHANGE_FILES,
    enabled,
  })
}
