import { onScopeDispose, ref, watch, type Ref } from "vue"

/**
 * Public HarukiBot alias API (Haruki-Cloud). Lookups are exact-match against
 * the community-maintained alias table the bot uses for song resolution.
 */
const MUSIC_ALIAS_API_BASE = "https://neo-api.haruki.seiunx.com/api/bot/v2/pjsk"

export const MUSIC_ALIAS_SEARCH_DEBOUNCE_MS = 250

export type MusicAliasLookup = {
  /** Music ids whose alias exactly matches the query (empty on a miss). */
  ids: readonly number[]
  /** False when the alias API could not be reached, so a miss means nothing. */
  available: boolean
}

const aliasCache = new Map<string, Promise<MusicAliasLookup>>()

export function parseMusicAliasMatchIds(payload: unknown): number[] {
  if (typeof payload !== "object" || payload === null) {
    return []
  }

  const data = (payload as { data?: unknown }).data
  if (typeof data !== "object" || data === null) {
    return []
  }

  const ids = (data as { match_ids?: unknown }).match_ids
  if (!Array.isArray(ids)) {
    return []
  }

  return ids.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
}

/** Alias lookup with its availability; a failed request is not cached. */
export function lookupMusicIdsByAlias(alias: string): Promise<MusicAliasLookup> {
  const normalized = alias.trim()
  if (!normalized) {
    return Promise.resolve({ ids: [], available: true })
  }

  const cached = aliasCache.get(normalized)
  if (cached) {
    return cached
  }

  const promise = fetchMusicAliasMatchIds(normalized)
  aliasCache.set(normalized, promise)
  return promise
}

/** Music ids whose alias exactly matches the query; empty on miss or API failure. */
export function resolveMusicIdsByAlias(alias: string): Promise<readonly number[]> {
  return lookupMusicIdsByAlias(alias).then((lookup) => lookup.ids)
}

const ALIAS_UNAVAILABLE: MusicAliasLookup = { ids: [], available: false }

async function fetchMusicAliasMatchIds(alias: string): Promise<MusicAliasLookup> {
  try {
    const response = await fetch(
      `${MUSIC_ALIAS_API_BASE}/alias/music/by-alias?alias=${encodeURIComponent(alias)}`,
    )
    if (!response.ok) {
      // Cache misses (404) but retry transient failures on the next lookup.
      if (response.status === 404) {
        return { ids: [], available: true }
      }
      aliasCache.delete(alias)
      return ALIAS_UNAVAILABLE
    }

    return { ids: parseMusicAliasMatchIds(await response.json()), available: true }
  } catch {
    aliasCache.delete(alias)
    return ALIAS_UNAVAILABLE
  }
}

const aliasListCache = new Map<number, Promise<readonly string[]>>()

export function parseMusicAliasList(payload: unknown): string[] {
  if (typeof payload !== "object" || payload === null) {
    return []
  }

  const data = (payload as { data?: unknown }).data
  if (typeof data !== "object" || data === null) {
    return []
  }

  const aliases = (data as { aliases?: unknown }).aliases
  if (!Array.isArray(aliases)) {
    return []
  }

  return aliases.filter((alias): alias is string => typeof alias === "string" && alias.trim() !== "")
}

/** All community aliases of a music; empty on miss or API failure. */
export function fetchMusicAliases(musicId: number): Promise<readonly string[]> {
  if (!Number.isInteger(musicId) || musicId <= 0) {
    return Promise.resolve([])
  }

  const cached = aliasListCache.get(musicId)
  if (cached) {
    return cached
  }

  const promise = fetchMusicAliasList(musicId)
  aliasListCache.set(musicId, promise)
  return promise
}

async function fetchMusicAliasList(musicId: number): Promise<readonly string[]> {
  try {
    const response = await fetch(`${MUSIC_ALIAS_API_BASE}/alias/music/${musicId}`)
    if (!response.ok) {
      if (response.status !== 404) {
        aliasListCache.delete(musicId)
      }
      return []
    }

    return parseMusicAliasList(await response.json())
  } catch {
    aliasListCache.delete(musicId)
    return []
  }
}

export type MusicAliasMatches = {
  /** Music ids whose alias exactly matches the current query. */
  matchedIds: Ref<ReadonlySet<number>>
  /** True from query change until the alias lookup for it has settled. */
  pending: Ref<boolean>
  /**
   * The last lookup could not reach the alias API, so alias search is off
   * until one succeeds; callers say so instead of promising alias matches.
   */
  unavailable: Ref<boolean>
}

/** Debounced alias lookup bound to a search input. */
export function useMusicAliasMatches(query: Ref<string>): MusicAliasMatches {
  const matchedIds = ref<ReadonlySet<number>>(new Set())
  const pending = ref(false)
  const unavailable = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null
  let generation = 0

  watch(query, (value) => {
    generation += 1
    if (timer != null) {
      clearTimeout(timer)
      timer = null
    }

    const trimmed = value.trim()
    if (!trimmed) {
      matchedIds.value = new Set()
      pending.value = false
      return
    }

    pending.value = true
    const current = generation
    timer = setTimeout(() => {
      void lookupMusicIdsByAlias(trimmed).then((lookup) => {
        if (current === generation) {
          matchedIds.value = new Set(lookup.ids)
          unavailable.value = !lookup.available
          pending.value = false
        }
      })
    }, MUSIC_ALIAS_SEARCH_DEBOUNCE_MS)
  }, { immediate: true })

  onScopeDispose(() => {
    if (timer != null) {
      clearTimeout(timer)
    }
  })

  return { matchedIds, pending, unavailable }
}
