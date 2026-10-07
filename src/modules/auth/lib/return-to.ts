import { resolveSafeRedirectTarget } from "@/core/router/navigation"

export interface FlowReturnToOptions {
  currentOrigin: string
  kratosOrigin?: string
  allowedOrigins?: Iterable<string>
  maxDepth?: number
}

function parseAbsoluteOrigin(value: string): string {
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return ""
    }
    return url.origin
  } catch {
    return ""
  }
}

function parseReturnToUrl(value: string, currentOrigin: string): URL | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    return new URL(trimmed, currentOrigin)
  } catch {
    return null
  }
}

export function parseAllowedReturnToOrigins(value: unknown): string[] {
  if (typeof value !== "string") {
    return []
  }

  const origins = new Set<string>()
  value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .forEach((item) => {
      const origin = parseAbsoluteOrigin(item)
      if (origin) {
        origins.add(origin)
      }
    })

  return [...origins]
}

export function getConfiguredAllowedReturnToOrigins(): string[] {
  return parseAllowedReturnToOrigins(import.meta.env.VITE_HARUKI_TOOLBOX_ALLOWED_RETURN_TO_ORIGINS)
}

export function createAllowedReturnToOrigins(
  currentOrigin: string,
  extraOrigins: Iterable<string> = []
): Set<string> {
  return new Set([
    currentOrigin,
    ...getConfiguredAllowedReturnToOrigins(),
    ...[...extraOrigins].map(parseAbsoluteOrigin).filter((origin) => origin !== ""),
  ])
}

export function isAllowedFlowReturnTo(
  value: string,
  options: FlowReturnToOptions,
  depth = 0
): boolean {
  const maxDepth = options.maxDepth ?? 4
  if (depth > maxDepth) {
    return false
  }

  const parsed = parseReturnToUrl(value, options.currentOrigin)
  if (!parsed) {
    return false
  }

  const allowedOrigins = new Set([
    options.currentOrigin,
    ...(options.allowedOrigins ?? []),
  ])
  if (allowedOrigins.has(parsed.origin)) {
    return true
  }

  const kratosOrigin = options.kratosOrigin?.trim() ?? ""
  if (
    kratosOrigin !== ""
    && parsed.origin === kratosOrigin
    && parsed.pathname.startsWith("/self-service/")
  ) {
    const nested = parsed.searchParams.get("return_to")
    return nested
      ? isAllowedFlowReturnTo(nested, options, depth + 1)
      : true
  }

  return false
}

/**
 * Query parameter the sign-in page appends to its return target so App.vue can
 * confirm a fresh sign-in once the session has synced.
 */
export const LOGIN_SUCCESS_QUERY_PARAM = "_login_success"

// Base for checking that a path stays on whatever origin serves the app.
const PATH_CHECK_ORIGIN = "https://return-to.invalid"

/**
 * Accepts an in-app redirect target (the `?redirect` query of the auth pages)
 * only when it is a path on the current origin. On top of
 * resolveSafeRedirectTarget it rejects values that the URL parser would still
 * carry to another host or to a protocol-relative path, such as
 * `/\evil.example` or `/<TAB>/evil.example`.
 */
export function resolveSafeReturnPath(value: unknown): string | null {
  const path = resolveSafeRedirectTarget(value)
  if (!path) {
    return null
  }

  try {
    const url = new URL(path, PATH_CHECK_ORIGIN)
    if (url.origin !== PATH_CHECK_ORIGIN || url.pathname.startsWith("//")) {
      return null
    }
  } catch {
    return null
  }

  return path
}

export interface BuildFlowReturnToOptions {
  /** Path used when the redirect is missing or unsafe. Without one, no return target is built. */
  fallbackPath?: string
  /** Query parameters added to the return target. */
  params?: Record<string, string>
}

/**
 * Builds the absolute `return_to` for a Kratos browser flow from an auth page's
 * `?redirect` value: the safe path, resolved against the current origin.
 * Returns "" when there is nothing safe to return to, so the flow keeps the
 * Kratos default. Without a usable origin the bare path is returned.
 */
export function buildFlowReturnTo(
  redirect: unknown,
  currentOrigin: string,
  options: BuildFlowReturnToOptions = {}
): string {
  const path = resolveSafeReturnPath(redirect) ?? options.fallbackPath ?? ""
  if (!path) {
    return ""
  }

  let url: URL
  try {
    url = new URL(path, currentOrigin)
  } catch {
    return path
  }

  Object.entries(options.params ?? {}).forEach(([name, value]) => {
    url.searchParams.set(name, value)
  })
  return url.toString()
}

/**
 * Recovers the in-app redirect path from a loaded flow's `return_to`. Kratos
 * sends the browser back to the auth page with only `?flow=`, so the page's own
 * `?redirect` is gone by the time its links render. Only targets on the current
 * origin qualify, and the given marker parameters are dropped.
 */
export function resolveRedirectFromFlowReturnTo(
  returnTo: string,
  currentOrigin: string,
  ignoredParams: readonly string[] = []
): string | null {
  const origin = parseAbsoluteOrigin(currentOrigin)
  const trimmed = returnTo.trim()
  if (!origin || !trimmed) {
    return null
  }

  let url: URL
  try {
    url = new URL(trimmed, origin)
  } catch {
    return null
  }

  if (url.origin !== origin) {
    return null
  }

  // Only write through searchParams when something is dropped: doing so
  // re-encodes the whole query.
  if (ignoredParams.some((name) => url.searchParams.has(name))) {
    ignoredParams.forEach((name) => {
      url.searchParams.delete(name)
    })
  }

  return resolveSafeReturnPath(`${url.pathname}${url.search}${url.hash}`)
}

/**
 * The redirect an auth page hands to the sibling auth page it links to (sign-in
 * to registration and back): its own `?redirect`, or else the target recovered
 * from the loaded flow's `return_to`.
 *
 * The app root is not forwarded. It is what the sign-in page falls back to when
 * it has no target (its flow's `return_to` is then `<origin>/?_login_success=1`),
 * so forwarding it would make every sign-up started from the sign-in page send
 * `return_to=<origin>/` instead of leaving Kratos its default return URL.
 */
export function resolveAuthPageRedirect(
  queryRedirect: unknown,
  flowReturnTo: string,
  currentOrigin: string
): string | null {
  const redirect = resolveSafeReturnPath(queryRedirect)
    ?? resolveRedirectFromFlowReturnTo(flowReturnTo, currentOrigin, [LOGIN_SUCCESS_QUERY_PARAM])
  return redirect === "/" ? null : redirect
}

export interface AuthPageLink {
  path: string
  query: Record<string, string>
}

/** Router location for an auth page, carrying the redirect when there is one. */
export function buildAuthPageLink(path: string, redirect: string | null): AuthPageLink {
  return redirect ? { path, query: { redirect } } : { path, query: {} }
}

/** The page's origin, or "" outside a browser. */
export function resolveBrowserOrigin(): string {
  return typeof window === "undefined" ? "" : window.location.origin
}
