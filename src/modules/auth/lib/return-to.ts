export interface FlowReturnToOptions {
  currentOrigin: string
  kratosOrigin?: string
  allowedOrigins?: Iterable<string>
  maxDepth?: number
}

interface PublicFrontendOriginOptions {
  webUrl?: unknown
}

function readEnvString(key: keyof ImportMetaEnv): string {
  const value = import.meta.env?.[key]
  return typeof value === "string" ? value : ""
}

function parseHttpUrl(value: string, base?: string): URL | null {
  try {
    const url = base ? new URL(value, base) : new URL(value)
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null
    }
    return url
  } catch {
    return null
  }
}

function parseAbsoluteOrigin(value: string): string {
  return parseHttpUrl(value)?.origin ?? ""
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

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10))
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  return parts[0] === 10
    || parts[0] === 127
    || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168)
}

function isLocalHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  return normalized === "localhost"
    || normalized.endsWith(".localhost")
    || normalized === "::1"
    || normalized === "0.0.0.0"
    || isPrivateIpv4(normalized)
}

export function resolvePublicFrontendOrigin(
  currentOrigin: string,
  options: PublicFrontendOriginOptions = {}
): string {
  const configuredWebUrl = typeof options.webUrl === "string"
    ? options.webUrl
    : readEnvString("VITE_HARUKI_TOOLBOX_WEB_URL")
  const configuredOrigin = parseAbsoluteOrigin(configuredWebUrl)
  if (configuredOrigin) {
    return configuredOrigin
  }

  const currentUrl = parseHttpUrl(currentOrigin)
  if (!currentUrl) {
    return ""
  }

  if (currentUrl.protocol === "http:" && !isLocalHostname(currentUrl.hostname)) {
    currentUrl.protocol = "https:"
  }

  return currentUrl.origin
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
  return parseAllowedReturnToOrigins(readEnvString("VITE_HARUKI_TOOLBOX_ALLOWED_RETURN_TO_ORIGINS"))
}

export function createAllowedReturnToOrigins(
  currentOrigin: string,
  extraOrigins: Iterable<string> = []
): Set<string> {
  const currentUrl = parseHttpUrl(currentOrigin)
  const safeCurrentOrigin = currentUrl && (currentUrl.protocol !== "http:" || isLocalHostname(currentUrl.hostname))
    ? currentUrl.origin
    : ""

  return new Set([
    resolvePublicFrontendOrigin(currentOrigin),
    safeCurrentOrigin,
    ...getConfiguredAllowedReturnToOrigins(),
    ...[...extraOrigins].map(parseAbsoluteOrigin).filter((origin) => origin !== ""),
  ].filter((origin) => origin !== ""))
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

  const currentOrigin = resolvePublicFrontendOrigin(options.currentOrigin) || options.currentOrigin
  const parsed = parseReturnToUrl(value, currentOrigin)
  if (!parsed) {
    return false
  }

  const allowedOrigins = new Set([
    currentOrigin,
    ...[...(options.allowedOrigins ?? [])]
      .map(parseAbsoluteOrigin)
      .filter((origin) => origin !== ""),
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
