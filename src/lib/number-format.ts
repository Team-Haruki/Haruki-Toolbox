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
