import { getI18nLocale } from "@/shared/i18n"

export type DateInput = string | number | Date | null | undefined

export function toValidDate(value: DateInput): Date | null {
    if (value == null) {
        return null
    }

    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function formatLocalizedDateTime(
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
    fallback = "—"
): string {
    const date = toValidDate(value)
    if (!date) {
        return fallback
    }

    return date.toLocaleString(getI18nLocale(), options)
}

export function formatLocalizedDate(
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
    fallback = "—"
): string {
    const date = toValidDate(value)
    if (!date) {
        return fallback
    }

    return date.toLocaleDateString(getI18nLocale(), options)
}

export function formatDateTimeCN(value: DateInput, fallback = "—"): string {
    return formatLocalizedDateTime(value, undefined, fallback)
}

export function formatDateCN(
    value: DateInput,
    options?: Intl.DateTimeFormatOptions,
    fallback = "—"
): string {
    return formatLocalizedDate(value, options, fallback)
}

export function formatDateKey(value: DateInput): string {
    const date = toValidDate(value)
    if (!date) {
        return "unknown-date"
    }

    const year = String(date.getFullYear())
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
}
