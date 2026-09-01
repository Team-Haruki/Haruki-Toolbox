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
