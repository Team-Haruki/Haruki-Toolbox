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
