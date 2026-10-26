import type { Ref } from "vue"
import type { SekaiRegion } from "@/types"
import { useCatalogResource, type CatalogResource } from "@/shared/sekai/use-catalog-resource"
import {
  buildCardDetailExtras,
  CARD_DETAIL_EXTRAS_FILES,
  CARD_DETAIL_EXTRAS_OPTIONAL_FILES,
  type CardDetailExtras,
} from "@/modules/cards/lib/card-power"

/**
 * Side stories, rarity caps, master-lesson and canvas bonuses for the detail
 * page's Power / Side stories sections, plus the material names the unlock
 * costs refer to (the only region-optional file).
 */
export const CARD_DETAIL_EXTRAS_KEY = "cards/detail-extras"

export function useCardDetailExtras(
  region: Ref<SekaiRegion>,
  enabled?: Ref<boolean>,
): CatalogResource<CardDetailExtras> {
  return useCatalogResource(region, CARD_DETAIL_EXTRAS_KEY, CARD_DETAIL_EXTRAS_FILES, buildCardDetailExtras, {
    enabled,
    optional: CARD_DETAIL_EXTRAS_OPTIONAL_FILES,
  })
}
