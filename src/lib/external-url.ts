const SAFE_EXTERNAL_PROTOCOLS = new Set(["http:", "https:"])

export function normalizeExternalHttpUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    const url = new URL(trimmed)
    if (!SAFE_EXTERNAL_PROTOCOLS.has(url.protocol)) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}
