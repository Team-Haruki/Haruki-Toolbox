// When to retry a game asset on the fallback host (`global`, see
// resolveSekaiAssetFallbackRootUrl): the chosen host failed with a network
// error, a timeout, a 5xx or a cut-short body. A 4xx is an answer (the file is
// not there), and a caller's own abort is not a failure, so neither retries.

/** An HTTP answer that was not OK. */
export class AssetHttpError extends Error {
  readonly url: string
  readonly status: number

  constructor(url: string, status: number) {
    super(`${url}: HTTP ${status}`)
    this.name = "AssetHttpError"
    this.url = url
    this.status = status
  }
}

/**
 * The HTTP status a failure carries: an AssetHttpError's, or one written as
 * "HTTP <status>" in the message (the vendored 3D engine and the costume
 * role loader throw plain Errors that way). `null` when there is none.
 */
export function assetFailureStatus(error: unknown): number | null {
  if (error instanceof AssetHttpError) {
    return error.status
  }
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : ""
  const match = /\bHTTP (\d{3})\b/.exec(message)
  return match ? Number(match[1]) : null
}

/** A failure the fallback host may not have: network, timeout, 5xx, broken body. */
export function shouldRetryAssetOnFallback(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") {
    return false
  }
  const status = assetFailureStatus(error)
  return status == null || status >= 500
}

/**
 * `load(primary)`, and once more with `fallback` when that fails with a
 * retryable error (see shouldRetryAssetOnFallback). `usedFallback` tells the
 * caller to stay on the fallback for the rest of the session.
 */
export async function loadWithAssetFallback<T>(
  primary: string,
  fallback: string | null | undefined,
  load: (root: string) => Promise<T>,
): Promise<{ value: T; root: string; usedFallback: boolean }> {
  try {
    return { value: await load(primary), root: primary, usedFallback: false }
  } catch (error) {
    if (!fallback || fallback === primary || !shouldRetryAssetOnFallback(error)) {
      throw error
    }
    console.warn("asset host failed, retrying on the fallback host", error)
    return { value: await load(fallback), root: fallback, usedFallback: true }
  }
}
