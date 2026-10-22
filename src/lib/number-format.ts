import { getI18nLocale } from "@/shared/i18n"

export type NumberInput = number | null | undefined

export function formatNumberCN(value: NumberInput, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }
  return value.toLocaleString(getI18nLocale())
}

export function formatPercent(value: NumberInput, digits = 1, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }
  return `${value.toLocaleString(getI18nLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

/**
 * Compact large numbers so long values stay scannable. Chinese locales use
 * the real 万 / 亿 units (16,234 → `1.6万`, 386,160,000 → `3.9亿`), in the
 * traditional script (萬 / 億) for zh-TW / Hant locales; other locales use
 * `K` / `M` (3,000 → `3K`, 1,172,288 → `1.2M`). Values below the first
 * threshold keep their grouped form.
 */
export function formatCompactNumber(value: number, locale: string = getI18nLocale()): string {
  const abs = Math.abs(value)
  if (locale.toLowerCase().startsWith("zh")) {
    const [wan, yi] = isTraditionalChineseLocale(locale) ? ["萬", "億"] : ["万", "亿"]
    if (abs >= 100_000_000) {
      return `${trimOneDecimal(value / 100_000_000)}${yi}`
    }
    if (abs >= 10_000) {
      return `${trimOneDecimal(value / 10_000)}${wan}`
    }
    return new Intl.NumberFormat(locale).format(value)
  }

  if (abs >= 1_000_000) {
    return `${trimOneDecimal(value / 1_000_000)}M`
  }
  if (abs >= 1_000) {
    return `${trimOneDecimal(value / 1_000)}K`
  }
  return new Intl.NumberFormat(locale).format(value)
}

/** zh-TW / zh-HK / zh-MO and any `Hant` script tag write the units in traditional characters. */
function isTraditionalChineseLocale(locale: string): boolean {
  const normalized = locale.toLowerCase()
  return /hant/.test(normalized) || /^zh[-_](tw|hk|mo)\b/.test(normalized)
}

function trimOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
