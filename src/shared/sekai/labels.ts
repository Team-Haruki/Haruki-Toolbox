/**
 * Master-data enum → i18n label helpers with an unknown-value guard. Master
 * dumps gain new enum members (event types, gacha types, supply types) before
 * the app learns about them; these helpers render the raw value instead of
 * leaking an i18n key like `cards.attr.spicy` into the UI.
 */

type Translate = (key: string) => string
type TranslateExists = (key: string) => boolean

export type SekaiLabelContext = {
  t: Translate
  te: TranslateExists
}

function resolveLabel(ctx: SekaiLabelContext, keyPrefix: string, value: string | null | undefined, fallback?: string): string {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) {
    return fallback ?? ""
  }
  const key = `${keyPrefix}.${raw}`
  return ctx.te(key) ? ctx.t(key) : (fallback ?? raw)
}

export function resolveSekaiUnitLabel(ctx: SekaiLabelContext, unit: string | null | undefined): string {
  return resolveLabel(ctx, "cards.unit", unit)
}

export function resolveSekaiAttrLabel(ctx: SekaiLabelContext, attr: string | null | undefined): string {
  return resolveLabel(ctx, "cards.attr", attr)
}

export function resolveSekaiRarityLabel(ctx: SekaiLabelContext, cardRarityType: string | null | undefined): string {
  return resolveLabel(ctx, "cards.rarity", cardRarityType)
}

export function resolveSekaiSupplyLabel(ctx: SekaiLabelContext, supplyType: string | null | undefined): string {
  return resolveLabel(ctx, "cards.supply", supplyType)
}

export function resolveSekaiEventTypeLabel(ctx: SekaiLabelContext, eventType: string | null | undefined): string {
  return resolveLabel(ctx, "events.type", eventType, eventType ? undefined : ctx.t("events.type.unknown"))
}

export function resolveSekaiGachaTypeLabel(ctx: SekaiLabelContext, gachaType: string | null | undefined): string {
  return resolveLabel(ctx, "gachas.type", gachaType, gachaType ? undefined : ctx.t("gachas.type.unknown"))
}

export function resolveSekaiDifficultyLabel(ctx: SekaiLabelContext, difficulty: string | null | undefined): string {
  return resolveLabel(ctx, "musicLibrary.difficulty", difficulty)
}

export function resolveSekaiMusicTagLabel(ctx: SekaiLabelContext, tag: string | null | undefined): string {
  return resolveLabel(ctx, "musicLibrary.tags", tag)
}

export function resolveSekaiMusicCategoryLabel(ctx: SekaiLabelContext, category: string | null | undefined): string {
  return resolveLabel(ctx, "musicLibrary.categories", category)
}

export function resolveSekaiVocalTypeLabel(ctx: SekaiLabelContext, vocalType: string | null | undefined): string {
  return resolveLabel(ctx, "musicLibrary.vocalTypes", vocalType)
}

/** Generic form for enums whose i18n prefix lives in a module namespace. */
export function resolveSekaiEnumLabel(
  ctx: SekaiLabelContext,
  keyPrefix: string,
  value: string | null | undefined,
  fallback?: string,
): string {
  return resolveLabel(ctx, keyPrefix, value, fallback)
}
