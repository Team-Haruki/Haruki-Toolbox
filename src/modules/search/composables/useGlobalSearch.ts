import { computed, onScopeDispose, ref, shallowRef, watch } from "vue"
import { useSettingsStore } from "@/shared/stores/settings"
import { useSekaiDataStore } from "@/shared/stores/sekai-data"
import { readSekaiMasterFiles } from "@/shared/sekai/cache"
import type { SekaiRegion } from "@/types"
import type {
  SearchAliasMatch,
  SearchEntryType,
  SearchIndexEntry,
  SearchResultEntry,
} from "@/modules/search/lib/search-index"
import {
  SEARCH_ENTRY_TYPES,
  buildSearchIndex,
  mergeAliasResults,
  resolveAliasMatches,
  searchIndexEntries,
} from "@/modules/search/lib/search-index"
import { createHarukiAliasProvider } from "@/modules/search/lib/alias-provider"

export const GLOBAL_SEARCH_MASTER_FILES = ["musics", "cards", "events", "gameCharacters"] as const

export const ALIAS_LOOKUP_DEBOUNCE_MS = 300

export type GlobalSearchStatus = "idle" | "loading" | "ready" | "error"

export type GlobalSearchResultGroup = {
  type: SearchEntryType
  items: SearchResultEntry[]
}

// Module-level singleton so the in-memory alias cache is shared across dialogs.
const aliasProvider = createHarukiAliasProvider()

export function useGlobalSearch() {
  const settingsStore = useSettingsStore()
  const sekaiDataStore = useSekaiDataStore()

  const status = ref<GlobalSearchStatus>("idle")
  const error = ref<string | null>(null)
  const entries = shallowRef<SearchIndexEntry[]>([])
  const query = ref("")

  const region = computed<SekaiRegion>(() => settingsStore.sekaiCatalogRegion)
  let loadedRegion: SekaiRegion | null = null
  let loadToken = 0

  const aliasMatches = shallowRef<SearchAliasMatch[]>([])
  let aliasTimer: ReturnType<typeof setTimeout> | null = null
  let aliasToken = 0

  const results = computed<SearchResultEntry[]>(() => {
    const localResults = searchIndexEntries(entries.value, query.value)
    if (aliasMatches.value.length === 0) {
      return localResults
    }

    return mergeAliasResults(localResults, resolveAliasMatches(entries.value, aliasMatches.value))
  })
  const groupedResults = computed<GlobalSearchResultGroup[]>(() => {
    return SEARCH_ENTRY_TYPES
      .map((type) => ({ type, items: results.value.filter((entry) => entry.type === type) }))
      .filter((group) => group.items.length > 0)
  })

  // Alias lookups are debounced and never block the synchronous local index;
  // stale responses (query changed since dispatch) are dropped.
  watch(query, (nextQuery) => {
    aliasToken += 1
    aliasMatches.value = []
    if (aliasTimer !== null) {
      clearTimeout(aliasTimer)
      aliasTimer = null
    }

    const trimmed = nextQuery.trim()
    if (!trimmed) {
      return
    }

    const token = aliasToken
    aliasTimer = setTimeout(() => {
      aliasTimer = null
      aliasProvider
        .lookup(trimmed)
        .then((matches) => {
          if (token === aliasToken && matches.length > 0) {
            aliasMatches.value = matches
          }
        })
        .catch(() => {
          // Provider already degrades silently; never surface lookup errors.
        })
    }, ALIAS_LOOKUP_DEBOUNCE_MS)
  })

  onScopeDispose(() => {
    if (aliasTimer !== null) {
      clearTimeout(aliasTimer)
      aliasTimer = null
    }
  })

  async function load(targetRegion: SekaiRegion) {
    const token = ++loadToken
    status.value = "loading"
    error.value = null
    try {
      await sekaiDataStore.ensureRegionData(targetRegion, { files: GLOBAL_SEARCH_MASTER_FILES })
      const files = await readSekaiMasterFiles(targetRegion, GLOBAL_SEARCH_MASTER_FILES)
      if (token !== loadToken) {
        return
      }

      entries.value = buildSearchIndex({
        musics: files.musics,
        cards: files.cards,
        events: files.events,
        gameCharacters: files.gameCharacters,
      })
      loadedRegion = targetRegion
      status.value = "ready"
    } catch (loadError) {
      if (token !== loadToken) {
        return
      }

      error.value = loadError instanceof Error ? loadError.message : String(loadError)
      status.value = "error"
    }
  }

  function ensureLoaded() {
    if (status.value === "loading") {
      return
    }

    if (status.value === "ready" && loadedRegion === region.value) {
      return
    }

    void load(region.value)
  }

  function reload() {
    void load(region.value)
  }

  watch(region, (nextRegion) => {
    // Stay lazy: only refresh once the index has been requested at least once.
    if (status.value !== "idle") {
      void load(nextRegion)
    }
  })

  return {
    status,
    error,
    query,
    region,
    entries,
    results,
    groupedResults,
    ensureLoaded,
    reload,
  }
}
