import { computed, ref } from "vue"
import { useRoute, type LocationQuery } from "vue-router"
import { useI18n } from "vue-i18n"
import {
  createPageQuery,
  setQueryValue,
  setTrimmedQueryValue,
  type QueryParams,
} from "@/core/http/query"
import { readQueryEnum, readQueryString, writeQueryValue, type QueryWriteRecord } from "@/lib/query-codec"
import {
  DEFAULT_SORT,
  FILTER_SERVER_ALL,
  GAME_BINDING_SERVER_FILTER_VALUES,
  GAME_BINDING_SORT_VALUES,
  getServerOptions,
  getSortOptions,
  isServerOption,
} from "@/modules/admin-game-bindings/lib/management-meta"

export interface GameBindingFilterValues {
  q: string
  server: string
  userId: string
  gameUserId: string
  sort: string
}

export const GAME_BINDING_FILTER_QUERY_KEYS = ["q", "server", "uid", "user", "sort"] as const

export function createDefaultGameBindingFilters(): GameBindingFilterValues {
  return { q: "", server: FILTER_SERVER_ALL, userId: "", gameUserId: "", sort: DEFAULT_SORT }
}

/** Filters from a shared or restored URL; unknown values fall back to the defaults. */
export function parseGameBindingFiltersQuery(query: LocationQuery): GameBindingFilterValues {
  return {
    q: readQueryString(query.q) ?? "",
    server: readQueryEnum(query.server, GAME_BINDING_SERVER_FILTER_VALUES) ?? FILTER_SERVER_ALL,
    userId: readQueryString(query.user) ?? "",
    gameUserId: readQueryString(query.uid) ?? "",
    sort: readQueryEnum(query.sort, GAME_BINDING_SORT_VALUES) ?? DEFAULT_SORT,
  }
}

/** The URL record for the applied filters; defaults are omitted. */
export function writeGameBindingFiltersQuery(filters: GameBindingFilterValues): QueryWriteRecord {
  return {
    q: writeQueryValue(filters.q.trim()),
    server: writeQueryValue(filters.server, FILTER_SERVER_ALL),
    uid: writeQueryValue(filters.gameUserId.trim()),
    user: writeQueryValue(filters.userId.trim()),
    sort: writeQueryValue(filters.sort, DEFAULT_SORT),
  }
}

export function useGameBindingFilters() {
  const { t } = useI18n()
  const route = useRoute()
  const initial = parseGameBindingFiltersQuery(route.query)

  const filterQ = ref(initial.q)
  const filterServer = ref<string>(initial.server)
  const filterUserId = ref(initial.userId)
  const filterGameUserId = ref(initial.gameUserId)
  const filterSort = ref(initial.sort)
  // What the list was last loaded with (and what the URL mirrors): the form
  // can be edited freely until 查询 applies it.
  const appliedFilters = ref<GameBindingFilterValues>({ ...initial })

  const servers = computed(() => getServerOptions(t))
  const editServers = computed(() => servers.value.filter(isServerOption))
  const sortOptions = computed(() => getSortOptions(t))

  function snapshotFilters(): GameBindingFilterValues {
    return {
      q: filterQ.value,
      server: filterServer.value,
      userId: filterUserId.value,
      gameUserId: filterGameUserId.value,
      sort: filterSort.value,
    }
  }

  function applyFilterValues() {
    appliedFilters.value = snapshotFilters()
  }

  function buildQueryParams(currentPage: number, currentPageSize: number) {
    const applied = appliedFilters.value
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    setQueryValue(params, "sort", applied.sort)
    setTrimmedQueryValue(params, "q", applied.q)
    if (applied.server !== FILTER_SERVER_ALL) setQueryValue(params, "server", applied.server)
    setTrimmedQueryValue(params, "user_id", applied.userId)
    setTrimmedQueryValue(params, "game_user_id", applied.gameUserId)
    return params
  }

  function resetFilterValues() {
    const defaults = createDefaultGameBindingFilters()
    filterQ.value = defaults.q
    filterServer.value = defaults.server
    filterUserId.value = defaults.userId
    filterGameUserId.value = defaults.gameUserId
    filterSort.value = defaults.sort
  }

  return {
    filterQ,
    filterServer,
    filterUserId,
    filterGameUserId,
    filterSort,
    appliedFilters,
    servers,
    editServers,
    sortOptions,
    applyFilterValues,
    buildQueryParams,
    resetFilterValues,
  }
}
