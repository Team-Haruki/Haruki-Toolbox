// Ported from Sekai Station (MIT © middlered), src/composables/useRelativeTime.ts.

const formatters = new Map<string, Intl.RelativeTimeFormat>()

function formatter(locale: string): Intl.RelativeTimeFormat {
  let format = formatters.get(locale)
  if (!format) {
    format = new Intl.RelativeTimeFormat(locale, { numeric: "always", style: "narrow" })
    formatters.set(locale, format)
  }
  return format
}

/** A unix timestamp (seconds) as a short "N ago" in the given locale */
export function formatRelativeTime(unixSeconds: number, locale: string, nowMs = Date.now()): string {
  const diff = Math.max(0, Math.floor(nowMs / 1000) - unixSeconds)
  const format = formatter(locale)
  // Negating keeps zero as -0, which Intl renders as "0 ago" rather than "in 0"
  if (diff < 60) {
    return format.format(-diff, "second")
  }
  if (diff < 3600) {
    return format.format(-Math.floor(diff / 60), "minute")
  }
  if (diff < 86400) {
    return format.format(-Math.floor(diff / 3600), "hour")
  }
  return format.format(-Math.floor(diff / 86400), "day")
}
