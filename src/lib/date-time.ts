/**
 * Date and time formatting in the active UI locale.
 *
 * Pass a named preset instead of an `Intl.DateTimeFormatOptions` object so
 * every page prints dates the same way (zh-CN / en-US samples):
 *
 * - `date`            2026/10/01 · 10/01/2026 — day precision: releases, bindings, "since".
 * - `dateTime`        2026/10/01 16:00 · 10/01/2026, 16:00 — minute precision, 24 h clock:
 *                     event and gacha periods, upload times, last seen.
 * - `dateTimeSeconds` 2026/10/01 16:00:05 — only where the second matters (audit
 *                     and job logs, tracker samples); never for periods.
 * - `monthDay`        10/01 · 10/01 — compact labels where the year is known (charts,
 *                     chapter rows, countdown captions).
 * - range             `formatLocalizedDateRange(start, end, "date")` → "2026/10/31 – 2026/11/08"
 *                     (same preset on both ends, " – " between them).
 *
 * `formatLocalizedDate(value, "date")`, `formatLocalizedDateTime(value, "dateTime")`
 * and `formatWithZone(value, region, "dateTime")` all accept the presets; the
 * raw options object still works for one-off shapes (`{ dateStyle: "medium" }`).
 */
import type { SekaiRegion } from "@/types"
import { getI18nLocale } from "@/shared/i18n"

export type DateInput = string | number | Date | null | undefined

export const DATE_FORMAT_PRESETS = {
    date: { year: "numeric", month: "2-digit", day: "2-digit" },
    dateTime: { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
    dateTimeSeconds: {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
    },
    monthDay: { month: "2-digit", day: "2-digit" },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>

export type DateFormatPreset = keyof typeof DATE_FORMAT_PRESETS

/** A preset name or a raw `Intl.DateTimeFormatOptions` object. */
export type DateFormatOptions = Intl.DateTimeFormatOptions | DateFormatPreset

export function resolveDateFormatOptions(options: DateFormatOptions | undefined): Intl.DateTimeFormatOptions | undefined {
    return typeof options === "string" ? DATE_FORMAT_PRESETS[options] : options
}

export function toValidDate(value: DateInput): Date | null {
    if (value == null) {
        return null
    }

    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
}

export function formatLocalizedDateTime(
    value: DateInput,
    options?: DateFormatOptions,
    fallback = "—"
): string {
    const date = toValidDate(value)
    if (!date) {
        return fallback
    }

    return date.toLocaleString(getI18nLocale(), resolveDateFormatOptions(options))
}

export function formatLocalizedDate(
    value: DateInput,
    options?: DateFormatOptions,
    fallback = "—"
): string {
    const date = toValidDate(value)
    if (!date) {
        return fallback
    }

    return date.toLocaleDateString(getI18nLocale(), resolveDateFormatOptions(options))
}

/** Separator between the two ends of a period. */
export const DATE_RANGE_SEPARATOR = " – "

/**
 * "start – end" with both ends in the same preset (default `date`); an
 * unknown end shows the fallback in its place, so "2026/10/31 – —" reads as
 * an open period rather than an error.
 */
export function formatLocalizedDateRange(
    start: DateInput,
    end: DateInput,
    options: DateFormatOptions = "date",
    fallback = "—"
): string {
    // With explicit fields, toLocaleString and toLocaleDateString agree, so one call serves every preset.
    return `${formatLocalizedDateTime(start, options, fallback)}${DATE_RANGE_SEPARATOR}${formatLocalizedDateTime(end, options, fallback)}`
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

/**
 * The wall clock each game server runs on (event starts, gacha ends, the
 * daily reset). The offsets are the ones the bot backend uses
 * (`GameTimeZoneOffsets` in SekaiColo): JP +9, EN −8, TW +8, CN +8. The EN
 * server keeps a fixed UTC−8 all year, hence `Etc/GMT+8` (the IANA name's
 * sign is inverted) rather than a zone with daylight saving.
 */
export const SEKAI_REGION_TIME_ZONES: Readonly<Record<SekaiRegion, string>> = {
    jp: "Asia/Tokyo",
    tw: "Asia/Taipei",
    kr: "Asia/Seoul",
    cn: "Asia/Shanghai",
    en: "Etc/GMT+8",
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

/** "UTC+9" / "UTC−8" / "UTC+5:30" for a zone at a given instant ("" when the zone is unknown). */
export function formatZoneOffset(timeZone: string, at: DateInput = Date.now()): string {
    const date = toValidDate(at) ?? new Date()
    try {
        const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "shortOffset" })
            .formatToParts(date)
            .find((item) => item.type === "timeZoneName")?.value ?? ""
        const offset = part.replace(/^(GMT|UTC)/, "")
        return offset && !/^[+-]0+(:00)?$/.test(offset) ? `UTC${offset.replace("-", "−")}` : "UTC"
    } catch {
        return ""
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
    options?: DateFormatOptions,
    zoneOptions: FormatWithZoneOptions = {},
): ZonedDateTimeLabel {
    const localZone = zoneOptions.localZone ?? resolveBrowserTimeZone()
    const serverZone = resolveSekaiServerTimeZone(region)
    const date = toValidDate(value)
    if (!date) {
        return { local: zoneOptions.fallback ?? "—", server: null, localZone, serverZone }
    }

    const locale = zoneOptions.locale ?? getI18nLocale()
    const resolved = resolveDateFormatOptions(options)
    const local = formatInZone(date, locale, resolved, localZone)
    if (localZone === serverZone) {
        return { local, server: null, localZone, serverZone }
    }
    const server = formatInZone(date, locale, resolved, serverZone)
    return { local, server: server === local ? null : server, localZone, serverZone }
}
