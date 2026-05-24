import type { CSSProperties } from "vue"
import type { ComposerTranslation } from "vue-i18n"
import type { DeckRecommendMasterCardOption } from "./card-options"

export type DeckRecommendCardTag = {
  label: string
  class?: string
  style?: CSSProperties
}

export function createDeckRecommendCardTags(
  option: DeckRecommendMasterCardOption,
  t: ComposerTranslation,
): DeckRecommendCardTag[] {
  return [
    option.rarity
      ? {
          label: t(`deckRecommend.training.rarities.${option.rarity}`),
          class: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
        }
      : null,
    option.attr
      ? {
          label: t(`deckRecommend.cardTags.attrs.${option.attr}`),
          class: resolveAttrTagClass(option.attr),
        }
      : null,
    option.characterName
      ? {
          label: option.characterName,
          style: createColorTagStyle(option.characterColorCode),
        }
      : null,
    option.unit
      ? {
          label: option.unitProfileName ?? t(`deckRecommend.eventUnits.${option.unit}`),
          style: createColorTagStyle(option.unitColorCode),
        }
      : null,
  ].filter((tag): tag is DeckRecommendCardTag => tag != null)
}

function resolveAttrTagClass(attr: NonNullable<DeckRecommendMasterCardOption["attr"]>) {
  switch (attr) {
    case "happy":
      return "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200"
    case "cute":
      return "border-pink-200 bg-pink-50 text-pink-800 dark:border-pink-500/30 dark:bg-pink-500/10 dark:text-pink-200"
    case "cool":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
    case "pure":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
    case "mysterious":
      return "border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200"
  }
}

function createColorTagStyle(colorCode: string | null): CSSProperties | undefined {
  if (!colorCode) {
    return undefined
  }

  return {
    borderColor: toRgba(colorCode, 0.5),
    backgroundColor: toRgba(colorCode, 0.14),
    color: colorCode,
  }
}

function toRgba(colorCode: string, alpha: number): string {
  const normalized = colorCode.replace("#", "")
  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}
