import type { SekaiRegion } from "@/types"
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

/** The wall clock each game server runs on (event starts, gacha ends). */
export const SEKAI_REGION_TIME_ZONES: Readonly<Record<SekaiRegion, string>> = {
    jp: "Asia/Tokyo",
    tw: "Asia/Taipei",
    kr: "Asia/Seoul",
    cn: "Asia/Shanghai",
    en: "UTC",
}

export function resolveSekaiServerTimeZone(region: SekaiRegion): string {
    return SEKAI_REGION_TIME_ZONES[region] ?? "UTC"
}

export function resolveBrowserTimeZone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
    } catch {
        return "UTC"
    }
}

export type ZonedDateTimeLabel = {
    /** Formatted in the viewer's zone. */
    local: string
    /**
     * Formatted in the region's server zone, or null when it would read the
     * same (same zone, or another zone at the same offset for that instant).
     */
    server: string | null
    localZone: string
    serverZone: string
}

export type FormatWithZoneOptions = {
    locale?: string
    /** Override the viewer's zone (tests, previews). */
    localZone?: string
    fallback?: string
}

function formatInZone(date: Date, locale: string, options: Intl.DateTimeFormatOptions | undefined, timeZone: string): string {
    try {
        return date.toLocaleString(locale, { ...options, timeZone })
    } catch {
        // An unknown zone name (ancient ICU data): fall back to the default zone.
        return date.toLocaleString(locale, options)
    }
}

/**
 * A timestamp in the viewer's zone plus, when that differs, the same instant
 * on the region's game server — so a JP event's 15:00 JST is never mistaken
 * for 15:00 local.
 */
export function formatWithZone(
    value: DateInput,
    region: SekaiRegion,
    options?: Intl.DateTimeFormatOptions,
    zoneOptions: FormatWithZoneOptions = {},
): ZonedDateTimeLabel {
    const localZone = zoneOptions.localZone ?? resolveBrowserTimeZone()
    const serverZone = resolveSekaiServerTimeZone(region)
    const date = toValidDate(value)
    if (!date) {
        return { local: zoneOptions.fallback ?? "—", server: null, localZone, serverZone }
    }

    const locale = zoneOptions.locale ?? getI18nLocale()
    const local = formatInZone(date, locale, options, localZone)
    if (localZone === serverZone) {
        return { local, server: null, localZone, serverZone }
    }
    const server = formatInZone(date, locale, options, serverZone)
    return { local, server: server === local ? null : server, localZone, serverZone }
}
