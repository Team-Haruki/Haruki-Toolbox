import {
  resolveSekaiEnumLabel,
  resolveSekaiGachaTypeLabel,
  type SekaiLabelContext,
} from "@/shared/sekai/labels"

/**
 * Gacha enum labels. The shared resolver covers the core `gachas.*` enums;
 * members the core bundle does not know (jp ships `gift` gachas) fall back
 * to the module namespace before the raw value.
 */
export function resolveGachaTypeLabel(ctx: SekaiLabelContext, gachaType: string | null | undefined): string {
  const raw = typeof gachaType === "string" ? gachaType.trim() : ""
  const localKey = `gachaCatalog.type.${raw}`
  if (raw && ctx.te(localKey)) {
    return ctx.t(localKey)
  }
  return resolveSekaiGachaTypeLabel(ctx, raw || null)
}

export function resolveGachaRarityLabel(ctx: SekaiLabelContext, rarity: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachas.rarity", rarity)
}

export function resolveGachaBehaviorTypeLabel(ctx: SekaiLabelContext, behaviorType: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachas.behaviorType", behaviorType)
}

export function resolveGachaCostResourceLabel(ctx: SekaiLabelContext, resourceType: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachas.costResource", resourceType)
}

export function resolveGachaLotteryTypeLabel(ctx: SekaiLabelContext, lotteryType: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachaCatalog.rates.lottery", lotteryType)
}

export function resolveGachaExchangeLabelType(ctx: SekaiLabelContext, labelType: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachaCatalog.ceil.label", labelType)
}

export function resolveGachaResourceTypeLabel(ctx: SekaiLabelContext, resourceType: string | null | undefined): string {
  return resolveSekaiEnumLabel(ctx, "gachaCatalog.ceil.resource", resourceType)
}
