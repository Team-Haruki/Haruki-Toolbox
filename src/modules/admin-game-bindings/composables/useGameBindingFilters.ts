import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import {
  createPageQuery,
  setQueryValue,
  setTrimmedQueryValue,
  type QueryParams,
} from "@/core/http/query"
import {
  DEFAULT_SORT,
  FILTER_SERVER_ALL,
  getServerOptions,
  getSortOptions,
} from "@/modules/admin-game-bindings/lib/management-meta"

export function useGameBindingFilters() {
  const { t } = useI18n()
  const filterQ = ref("")
  const filterServer = ref<string>(FILTER_SERVER_ALL)
  const filterUserId = ref("")
  const filterGameUserId = ref("")
  const filterSort = ref(DEFAULT_SORT)

  const servers = computed(() => getServerOptions(t))
  const editServers = computed(() => servers.value.filter((item) => item.value !== FILTER_SERVER_ALL))
  const sortOptions = computed(() => getSortOptions(t))

  function buildQueryParams(currentPage: number, currentPageSize: number) {
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    setQueryValue(params, "sort", filterSort.value)
    setTrimmedQueryValue(params, "q", filterQ.value)
    if (filterServer.value !== FILTER_SERVER_ALL) setQueryValue(params, "server", filterServer.value)
    setTrimmedQueryValue(params, "user_id", filterUserId.value)
    setTrimmedQueryValue(params, "game_user_id", filterGameUserId.value)
    return params
  }

  function resetFilterValues() {
    filterQ.value = ""
    filterServer.value = FILTER_SERVER_ALL
    filterUserId.value = ""
    filterGameUserId.value = ""
    filterSort.value = DEFAULT_SORT
  }

  return {
    filterQ,
    filterServer,
    filterUserId,
    filterGameUserId,
    filterSort,
    servers,
    editServers,
    sortOptions,
    buildQueryParams,
    resetFilterValues,
  }
}
