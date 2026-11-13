import { computed, onScopeDispose, ref, shallowRef, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { useLocalStorage } from "@vueuse/core"
import { preloadSearchPinyin } from "@/lib/search-match"
import { WEB_NAV_SECTIONS } from "@/config/navigation"
// Concrete subpaths, not the module barrels: this chunk loads when the search
// first opens and should carry the indexes, not the catalog pages' components.
import { useCardsIndex } from "@/modules/cards/composables/useCardsIndex"
import { useEventsIndex } from "@/modules/events/composables/useEventsIndex"
import { resolveEventStatus } from "@/modules/events/lib/event-filter"
import { GACHAS_INDEX_FILES, GACHAS_INDEX_KEY, buildGachasIndex } from "@/modules/gachas/composables/useGachasIndex"
import { useMusicsIndex } from "@/modules/music-library/composables/useMusicsIndex"
import { buildStoryCatalog } from "@/modules/story/lib/story-catalog"
import { useCharactersIndex } from "@/shared/sekai/catalog-resources"
import { useEffectiveCatalogRegion } from "@/shared/sekai/catalog-region"
import { isUnreleasedContent, useUnreleasedContentDisplay } from "@/shared/sekai/unreleased"
import { useCatalogResource } from "@/shared/sekai/use-catalog-resource"
import { useUserStore } from "@/shared/stores/user"
import { createHarukiAliasProvider } from "@/modules/search/lib/alias-provider"
import {
  SEARCH_ENTRY_TYPES,
  browseEntries,
  buildCardSearchEntries,
  buildCharacterSearchEntries,
  buildEventSearchEntries,
  buildGachaSearchEntries,
  buildMusicSearchEntries,
  buildPageSearchEntries,
  buildStorySearchEntries,
  createSearchIndex,
  resolveAliasMatches,
  resolveSearchListTarget,
  searchEntries,
  type SearchAliasMatch,
  type SearchEntryTarget,
  type SearchEntryType,
  type SearchIndexEntry,
  type SearchResultEntry,
  type SearchScope,
} from "@/modules/search/lib/search-index"
import { buildSearchPageSources } from "@/modules/search/lib/search-pages"
import {
  SEARCH_RECENTS_STORAGE_KEY,
  parseSearchRecents,
  pushSearchRecent,
} from "@/modules/search/lib/search-recents"

export const ALIAS_LOOKUP_DEBOUNCE_MS = 300

/**
 * The story masters the search reads: titles of the main, event and special
 * stories. Card stories and area talks are left to the story page (a card is
 * already found as a card), which keeps `cardEpisodes` and `actionSets` out
 * of the search.
 */
export const SEARCH_STORIES_KEY = "search/stories"
export const SEARCH_STORY_FILES = ["unitStories", "eventStories", "eventStoryUnits", "specialStories"] as const
const SEARCH_STORY_OPTIONAL = ["eventStoryUnits", "specialStories"] as const

function pickStoryFiles(files: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const name of SEARCH_STORY_FILES) out[name] = files[name]
  return out
}

/** Pages offered before anything is typed and nothing has been opened yet. */
const SUGGESTED_PAGE_PATHS = ["/deck-recommend", "/pt-calculator", "/rank-border", "/event-planner", "/upload-data", "/music"]

/** What a row at the end of a group does: open the list page, or narrow the search to that type. */
export type SearchMoreAction =
  | { kind: "list"; type: SearchEntryType; total: number; to: SearchEntryTarget }
  | { kind: "scope"; type: SearchEntryType; total: number }

export type SearchSectionKind = "recent" | "ongoing" | "suggested" | "browse" | "results"

export type SearchSection = {
  id: string
  kind: SearchSectionKind
  /** The type every item shares, for a group of one type. */
  type: SearchEntryType | null
  items: (SearchResultEntry)[]
  more: SearchMoreAction | null
}

/** One keyboard stop: an entry, or a group's "more" row. */
export type SearchRow =
  | { id: string; kind: "entry"; entry: SearchResultEntry }
  | { id: string; kind: "more"; more: SearchMoreAction }

// One provider for every dialog instance, so its in-memory cache is shared.
const aliasProvider = createHarukiAliasProvider()

export function useGlobalSearch() {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const { region } = useEffectiveCatalogRegion()
  const { hideUnreleased, blurUnreleased } = useUnreleasedContentDisplay()

  const query = ref("")
  const scope = ref<SearchScope>("all")
  const hasQuery = computed(() => query.value.trim() !== "")

  // ---- Sources: the indexes the list pages already build and cache. ----
  const musics = useMusicsIndex(region)
  const cards = useCardsIndex(region)
  const events = useEventsIndex(region)
  const characters = useCharactersIndex(region)
  // Gachas (a ~30 MB file on jp) and stories wait until they are searched for.
  const extraEnabled = ref(false)
  const gachas = useCatalogResource(region, GACHAS_INDEX_KEY, GACHAS_INDEX_FILES, buildGachasIndex, {
    enabled: extraEnabled,
  })
  const storyFiles = useCatalogResource(region, SEARCH_STORIES_KEY, SEARCH_STORY_FILES, pickStoryFiles, {
    optional: SEARCH_STORY_OPTIONAL,
    enabled: extraEnabled,
  })
  watch([hasQuery, scope], ([typed, currentScope]) => {
    if (typed || currentScope === "gacha" || currentScope === "story") {
      extraEnabled.value = true
    }
  })

  const coreSources = [musics, cards, events, characters]
  const extraSources = [gachas, storyFiles]
  const loading = computed(() =>
    coreSources.some((source) => source.loading.value)
    || (extraEnabled.value && extraSources.some((source) => source.loading.value)),
  )
  const failed = computed(() =>
    coreSources.some((source) => source.error.value != null && source.data.value == null)
    || (extraEnabled.value && extraSources.some((source) => source.error.value != null && source.data.value == null)),
  )

  function reload() {
    for (const source of [...coreSources, ...(extraEnabled.value ? extraSources : [])]) {
      if (source.error.value != null) {
        void source.reload()
      }
    }
  }

  // ---- Entries, one list per source so one arriving does not rebuild the rest. ----
  const navSections = computed(() => {
    const sections = new Map<string, string>()
    for (const section of WEB_NAV_SECTIONS) {
      for (const item of section.items) {
        if (item.url) {
          sections.set(item.url, section.titleKey ? t(section.titleKey) : "")
        }
        for (const sub of item.items ?? []) {
          sections.set(sub.url, t(item.titleKey))
        }
      }
    }
    return sections
  })

  const pageEntries = computed(() =>
    buildPageSearchEntries(
      buildSearchPageSources(router.getRoutes(), {
        isAdmin: userStore.isAdmin,
        isSuperAdmin: userStore.isSuperAdmin,
        translate: (key) => t(key),
        sectionOf: (path) => navSections.value.get(path) ?? null,
      }),
    ),
  )

  const characterEntries = computed(() => {
    const index = characters.data.value
    if (!index) return []
    const counts = new Map<number, number>()
    for (const [characterId, list] of cards.data.value?.byCharacter ?? []) {
      counts.set(characterId, list.length)
    }
    return buildCharacterSearchEntries(index.characters, counts)
  })

  const musicEntries = computed(() => buildMusicSearchEntries(musics.data.value?.entries ?? []))

  const cardEntries = computed(() => {
    const names = new Map<number, string>()
    for (const character of characters.data.value?.characters ?? []) {
      names.set(character.id, character.name)
    }
    return buildCardSearchEntries(cards.data.value?.list ?? [], names)
  })

  const eventEntries = computed(() => buildEventSearchEntries(events.data.value?.list ?? []))

  const gachaEntries = computed(() => {
    const index = gachas.data.value
    return index ? buildGachaSearchEntries(index.list, index.bannerAliasMap) : []
  })

  const storyEntries = computed(() => {
    const files = storyFiles.data.value
    const eventIndex = events.data.value
    const characterIndex = characters.data.value
    if (!files || !eventIndex || !characterIndex) return []
    const catalog = buildStoryCatalog({
      stories: files,
      events: eventIndex.byId,
      cards: new Map(),
      characters: characterIndex.characterMap,
    })
    return buildStorySearchEntries([...catalog.tabs.event, ...catalog.tabs.unit, ...catalog.tabs.special])
  })

  const index = computed(() =>
    createSearchIndex([
      ...pageEntries.value,
      ...characterEntries.value,
      ...musicEntries.value,
      ...cardEntries.value,
      ...eventEntries.value,
      ...gachaEntries.value,
      ...storyEntries.value,
    ]),
  )

  // Pinyin arrives after the first Han lookup; the variants built without it
  // are thrown away so "zuka" starts finding 组卡.
  const matcherEpoch = ref(0)
  void preloadSearchPinyin().then(() => {
    index.value.invalidate()
    matcherEpoch.value += 1
  })

  // ---- Community aliases: debounced, never blocking the local index. ----
  const aliasMatches = shallowRef<SearchAliasMatch[]>([])
  let aliasTimer: ReturnType<typeof setTimeout> | null = null
  let aliasToken = 0

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
          // The provider already degrades to "no aliases"; nothing to show.
        })
    }, ALIAS_LOOKUP_DEBOUNCE_MS)
  })

  onScopeDispose(() => {
    if (aliasTimer !== null) {
      clearTimeout(aliasTimer)
      aliasTimer = null
    }
  })

  // ---- Recently opened ----
  const storedRecents = useLocalStorage<unknown>(SEARCH_RECENTS_STORAGE_KEY, [], {
    serializer: {
      read: (raw) => {
        try {
          return JSON.parse(raw) as unknown
        } catch {
          return []
        }
      },
      write: (value) => JSON.stringify(value),
    },
  })
  const recents = computed(() => parseSearchRecents(storedRecents.value))

  function remember(entry: SearchResultEntry) {
    storedRecents.value = pushSearchRecent(recents.value, entry)
  }

  function clearRecents() {
    storedRecents.value = []
  }

  // ---- What the list shows ----
  const exclude = computed(() => {
    if (!hideUnreleased.value) return undefined
    const nowMs = Date.now()
    return (entry: SearchIndexEntry) => isUnreleasedContent(entry.releaseAt, nowMs)
  })

  const results = computed(() => {
    void matcherEpoch.value
    return searchEntries(index.value, query.value, {
      scope: scope.value,
      aliasEntries: resolveAliasMatches(index.value, aliasMatches.value),
      exclude: exclude.value,
    })
  })

  const sections = computed<SearchSection[]>(() => {
    const currentIndex = index.value
    if (hasQuery.value) {
      return results.value.groups.map((group) => {
        const hidden = group.total > group.items.length
        const listTarget = resolveSearchListTarget(group.type, query.value)
        let more: SearchMoreAction | null = null
        if (hidden && listTarget) {
          more = { kind: "list", type: group.type, total: group.total, to: listTarget }
        } else if (hidden && scope.value === "all") {
          more = { kind: "scope", type: group.type, total: group.total }
        }
        return { id: `results-${group.type}`, kind: "results", type: group.type, items: group.items, more }
      })
    }

    if (scope.value !== "all") {
      const group = browseEntries(currentIndex, scope.value, { exclude: exclude.value })
      return group.items.length > 0
        ? [{ id: `browse-${group.type}`, kind: "browse", type: group.type, items: group.items, more: null }]
        : []
    }

    const out: SearchSection[] = []
    // A stored entry is shown with the current region's title when the index has it.
    const recentItems = recents.value.map((entry) => currentIndex.byKey.get(entry.key) ?? entry)
    if (recentItems.length > 0) {
      out.push({ id: "recent", kind: "recent", type: null, items: recentItems, more: null })
    }

    const nowMs = Date.now()
    const ongoing = (events.data.value?.list ?? [])
      .filter((event) => resolveEventStatus(event, nowMs) === "ongoing")
      .map((event) => currentIndex.byKey.get(`event-${event.id}`))
      .filter((entry): entry is SearchIndexEntry => entry != null)
    if (ongoing.length > 0) {
      out.push({ id: "ongoing", kind: "ongoing", type: "event", items: ongoing, more: null })
    }

    const opened = new Set(recentItems.map((entry) => entry.key))
    const suggested = SUGGESTED_PAGE_PATHS
      .map((path) => currentIndex.byKey.get(`page-${path}`))
      .filter((entry): entry is SearchIndexEntry => entry != null && !opened.has(entry.key))
    if (suggested.length > 0) {
      out.push({ id: "suggested", kind: "suggested", type: "page", items: suggested, more: null })
    }
    return out
  })

  const rows = computed<SearchRow[]>(() => {
    const out: SearchRow[] = []
    for (const section of sections.value) {
      for (const entry of section.items) {
        out.push({ id: `${section.id}:${entry.key}`, kind: "entry", entry })
      }
      if (section.more) {
        out.push({ id: `${section.id}:more`, kind: "more", more: section.more })
      }
    }
    return out
  })

  /** Scopes worth offering: every type the index holds something of (extras once asked for). */
  const scopes = computed<SearchScope[]>(() => {
    const present = new Set<SearchEntryType>(["page", "gacha", "story"])
    for (const entry of index.value.entries) {
      present.add(entry.type)
    }
    return ["all", ...SEARCH_ENTRY_TYPES.filter((type) => present.has(type))]
  })

  function reset() {
    query.value = ""
    scope.value = "all"
  }

  return {
    query,
    scope,
    scopes,
    hasQuery,
    region,
    blurUnreleased,
    loading,
    failed,
    results,
    sections,
    rows,
    recents,
    remember,
    clearRecents,
    reload,
    reset,
  }
}
