import type { BadgeVariants } from "@/components/ui/badge"
import { cardRarityHasTrainedArt, cardShowsOnlyTrainedArt, type CatalogMasterCard } from "@/shared/sekai/catalog"
import type { CardArtMode } from "@/modules/cards/lib/card-query"

export type CardArtKind = "normal" | "trained"

/**
 * Which artworks a list tile shows for the chosen art mode: cards that only
 * have trained art (`initialSpecialTrainingStatus: done`) always show it,
 * 1★ / 2★ / birthday cards only have the normal art, everything else follows
 * the mode.
 */
export function resolveCardTileArts(
  card: Pick<CatalogMasterCard, "cardRarityType" | "trainedByDefault">,
  mode: CardArtMode,
): CardArtKind[] {
  if (cardShowsOnlyTrainedArt(card)) {
    return ["trained"]
  }
  if (!cardRarityHasTrainedArt(card.cardRarityType)) {
    return ["normal"]
  }
  return mode === "both" ? ["normal", "trained"] : [mode]
}

/**
 * How many art slots a list tile reserves in the given mode. `both` always
 * reserves two, even for a card that only has one artwork (1★ / 2★ / birthday,
 * or trained-by-default cards) — otherwise those tiles rendered their single
 * thumbnail at full tile width, twice the size of their neighbours', and the
 * grid rows came out ragged.
 */
export function resolveCardTileArtSlots(mode: CardArtMode): number {
  return mode === "both" ? 2 : 1
}

/** Supply types worth a badge on tiles (plain permanent cards stay unlabelled). */
const HIGHLIGHTED_SUPPLY_VARIANTS: Record<string, NonNullable<BadgeVariants["variant"]>> = {
  term_limited: "amber",
  colorful_festival_limited: "fuchsia",
  bloom_festival_limited: "rose",
  unit_event_limited: "violet",
  collaboration_limited: "cyan",
  birthday: "sky",
}

export function resolveCardSupplyBadgeVariant(supplyType: string | null | undefined): BadgeVariants["variant"] | null {
  if (!supplyType) {
    return null
  }
  return HIGHLIGHTED_SUPPLY_VARIANTS[supplyType] ?? null
}
