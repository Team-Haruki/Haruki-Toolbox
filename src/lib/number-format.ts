export type NumberInput = number | null | undefined

export function formatNumberCN(value: NumberInput, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }
  return value.toLocaleString("zh-CN")
}

export function formatPercent(value: NumberInput, digits = 1, fallback = "—"): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback
  }
  return `${value.toFixed(digits)}%`
}
