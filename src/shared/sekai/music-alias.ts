import { onScopeDispose, ref, watch, type Ref } from "vue"

/**
 * Public HarukiBot alias API (Haruki-Cloud). Lookups are exact-match against
 * the community-maintained alias table the bot uses for song resolution.
 */
const MUSIC_ALIAS_API_BASE = "https://neo-api.haruki.seiunx.com/api/bot/v2/pjsk"

export const MUSIC_ALIAS_SEARCH_DEBOUNCE_MS = 250

const aliasCache = new Map<string, Promise<readonly number[]>>()

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

/** Music ids whose alias exactly matches the query; empty on miss or API failure. */
export function resolveMusicIdsByAlias(alias: string): Promise<readonly number[]> {
  const normalized = alias.trim()
  if (!normalized) {
    return Promise.resolve([])
  }

  const cached = aliasCache.get(normalized)
  if (cached) {
    return cached
  }

  const promise = fetchMusicAliasMatchIds(normalized)
  aliasCache.set(normalized, promise)
  return promise
}

async function fetchMusicAliasMatchIds(alias: string): Promise<readonly number[]> {
  try {
    const response = await fetch(
      `${MUSIC_ALIAS_API_BASE}/alias/music/by-alias?alias=${encodeURIComponent(alias)}`,
    )
    if (!response.ok) {
      // Cache misses (404) but retry transient failures on the next lookup.
      if (response.status !== 404) {
        aliasCache.delete(alias)
      }
      return []
    }

    return parseMusicAliasMatchIds(await response.json())
  } catch {
    aliasCache.delete(alias)
    return []
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
}

/** Debounced alias lookup bound to a search input. */
export function useMusicAliasMatches(query: Ref<string>): MusicAliasMatches {
  const matchedIds = ref<ReadonlySet<number>>(new Set())
  const pending = ref(false)
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
      void resolveMusicIdsByAlias(trimmed).then((ids) => {
        if (current === generation) {
          matchedIds.value = new Set(ids)
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

  return { matchedIds, pending }
}
