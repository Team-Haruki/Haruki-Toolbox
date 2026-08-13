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
 * Compact large numbers so long values stay scannable: zh locales use the
 * 万-based `w` shorthand (16,234 → `1.6w`), other locales use `k`/`M`
 * (3,000 → `3k`, 1,172,288 → `1.2M`). Values below the first threshold keep
 * their grouped form.
 */
export function formatCompactNumber(value: number, locale: string = getI18nLocale()): string {
  const abs = Math.abs(value)
  if (locale.toLowerCase().startsWith("zh")) {
    if (abs >= 10_000) {
      return `${trimOneDecimal(value / 10_000)}w`
    }
    return new Intl.NumberFormat(locale).format(value)
  }

  if (abs >= 1_000_000) {
    return `${trimOneDecimal(value / 1_000_000)}M`
  }
  if (abs >= 1_000) {
    return `${trimOneDecimal(value / 1_000)}k`
  }
  return new Intl.NumberFormat(locale).format(value)
}

function trimOneDecimal(value: number): string {
  const rounded = Math.round(value * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
