import type { SearchAliasMatch, SearchAliasMatchType, SearchAliasProvider } from "./search-index"

const DEFAULT_BASE_URL = "https://production-bot-api.neo.bot.haruki.seiunx.com"
const MAX_ALIAS_QUERY_LENGTH = 100
const CACHE_LIMIT = 200
const DEFAULT_TIMEOUT_MS = 4000

const ALIAS_ENDPOINTS: readonly { aliasType: string; matchType: SearchAliasMatchType }[] = [
  { aliasType: "music", matchType: "music" },
  { aliasType: "character", matchType: "character" },
]

export type HarukiAliasProviderOptions = {
  baseUrl?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

/**
 * Network-backed {@link SearchAliasProvider} for the public Haruki alias API.
 *
 * The API does not currently allow cross-origin browser calls, so every
 * failure mode (network/CORS error, timeout, non-2xx, malformed body,
 * non-200 envelope status) degrades silently to an empty result.
 */
export function createHarukiAliasProvider(options: HarukiAliasProviderOptions = {}): SearchAliasProvider {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? readEnvBaseUrl() ?? DEFAULT_BASE_URL)
  const fetchImpl =
    options.fetchImpl ?? ((input: RequestInfo | URL, init?: RequestInit) => globalThis.fetch(input, init))
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const cache = new Map<string, SearchAliasMatch[]>()
  const inFlight = new Map<string, Promise<SearchAliasMatch[]>>()
  let failureLogged = false

  function logFailureOnce(error: unknown) {
    if (!failureLogged) {
      failureLogged = true
      console.debug("[global-search] alias lookup unavailable:", error)
    }
  }

  function remember(query: string, matches: SearchAliasMatch[]) {
    if (cache.size >= CACHE_LIMIT) {
      const oldest = cache.keys().next().value
      if (oldest !== undefined) {
        cache.delete(oldest)
      }
    }

    cache.set(query, matches)
  }

  async function fetchMatchIds(aliasType: string, alias: string): Promise<number[]> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(
        `${baseUrl}/api/v2/public/pjsk/alias/${aliasType}/by-alias?alias=${encodeURIComponent(alias)}`,
        { signal: controller.signal },
      )
      if (!response.ok) {
        // 404 means "no alias registered" — an ordinary empty result.
        return []
      }

      return extractMatchIds(await response.json())
    } catch (error) {
      logFailureOnce(error)
      return []
    } finally {
      clearTimeout(timer)
    }
  }

  async function resolveAliases(alias: string): Promise<SearchAliasMatch[]> {
    const perEndpoint = await Promise.all(
      ALIAS_ENDPOINTS.map(async ({ aliasType, matchType }) => {
        const ids = await fetchMatchIds(aliasType, alias)
        return ids.map<SearchAliasMatch>((id) => ({ type: matchType, id }))
      }),
    )
    return perEndpoint.flat()
  }

  return {
    lookup(query: string): Promise<SearchAliasMatch[]> {
      const trimmed = query.trim()
      if (!trimmed || trimmed.length > MAX_ALIAS_QUERY_LENGTH) {
        return Promise.resolve([])
      }

      const cached = cache.get(trimmed)
      if (cached) {
        return Promise.resolve(cached)
      }

      const pending = inFlight.get(trimmed)
      if (pending) {
        return pending
      }

      const request = resolveAliases(trimmed)
        .then((matches) => {
          remember(trimmed, matches)
          return matches
        })
        .finally(() => {
          inFlight.delete(trimmed)
        })
      inFlight.set(trimmed, request)
      return request
    },
  }
}

function extractMatchIds(body: unknown): number[] {
  if (typeof body !== "object" || body === null) {
    return []
  }

  const envelope = body as { status?: unknown; data?: unknown }
  if (envelope.status !== 200 || typeof envelope.data !== "object" || envelope.data === null) {
    return []
  }

  const matchIds = (envelope.data as { match_ids?: unknown }).match_ids
  if (!Array.isArray(matchIds)) {
    return []
  }

  return matchIds.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
}

function readEnvBaseUrl(): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>).VITE_HARUKI_ALIAS_API_BASE
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "")
}
