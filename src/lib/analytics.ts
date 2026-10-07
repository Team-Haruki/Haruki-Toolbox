/** Google Analytics 4 property of the site (the gtag.js loader is in index.html). */
export const GA_MEASUREMENT_ID = "G-3VHNZT3G3P"

// Query parameters that must never reach analytics: the OAuth2 device user
// code and every Hydra challenge. Login and register pages carry them inside
// their redirect target, so those values are cleaned as well.
const SENSITIVE_PARAMS = new Set(["user_code"])
const NESTED_TARGET_PARAMS = ["redirect", "return_to"]

function isSensitiveParam(name: string): boolean {
  return SENSITIVE_PARAMS.has(name) || name.endsWith("_challenge")
}

function stripSensitiveParams(url: URL): boolean {
  let changed = false
  for (const name of [...new Set(url.searchParams.keys())]) {
    if (isSensitiveParam(name)) {
      url.searchParams.delete(name)
      changed = true
    }
  }
  return changed
}

/** Cleans a redirect target, keeping it relative when it was relative. */
function sanitizeNestedTarget(value: string, base: URL): string {
  let target: URL
  try {
    target = new URL(value, base)
  } catch {
    return value
  }
  if (!stripSensitiveParams(target)) {
    return value
  }
  const isRelative = value.startsWith("/") && !value.startsWith("//")
  return isRelative ? `${target.pathname}${target.search}${target.hash}` : target.toString()
}

/**
 * The page address as analytics may record it: without `user_code` or any
 * `*_challenge` parameter, also inside a `redirect` / `return_to` target.
 * Returns the input unchanged when there is nothing to remove.
 */
export function sanitizeAnalyticsLocation(href: string): string {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return href
  }
  let changed = stripSensitiveParams(url)
  for (const name of NESTED_TARGET_PARAMS) {
    const value = url.searchParams.get(name)
    if (value === null) {
      continue
    }
    const sanitized = sanitizeNestedTarget(value, url)
    if (sanitized !== value) {
      url.searchParams.set(name, sanitized)
      changed = true
    }
  }
  return changed ? url.toString() : href
}

type Gtag = (...args: unknown[]) => void

/**
 * Sends the GA config (and so the first page view). A landing address that
 * carries a device code or a challenge is reported without it; any other
 * address is left to gtag's own `page_location`, as before.
 */
export function configureAnalytics(view: Window = window): void {
  const gtag = (view as Window & { gtag?: Gtag }).gtag
  if (typeof gtag !== "function") {
    return
  }
  const href = view.location.href
  const pageLocation = sanitizeAnalyticsLocation(href)
  if (pageLocation === href) {
    gtag("config", GA_MEASUREMENT_ID)
  } else {
    gtag("config", GA_MEASUREMENT_ID, { page_location: pageLocation })
  }
}
