import { computed, onMounted, ref, watch } from "vue"
import { useRoute, type LocationQuery } from "vue-router"
import { useI18n } from "vue-i18n"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { createPageQuery, type QueryParams, setQueryValue, setTrimmedQueryValue } from "@/core/http/query"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { focusInvalidField } from "@/lib/form-focus"
import {
  readQueryDate,
  readQueryEnum,
  readQueryEnumList,
  readQueryString,
  writeQueryList,
  writeQueryValue,
} from "@/lib/query-codec"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import { getUploadLogs } from "@/modules/admin-statistics/api/upload-log"
import {
  CHART_COLORS,
  DEFAULT_UPLOAD_LOG_SORT,
  UPLOAD_DATA_TYPE_FILTER_VALUES,
  UPLOAD_METHOD_FILTER_VALUES,
  UPLOAD_SERVER_FILTER_VALUES,
  UPLOAD_SORT_FILTER_VALUES,
  describeMultiFilterSelection,
  getUploadDataTypeOptions,
  getUploadMethodOptions,
  getUploadServerOptions,
  getUploadSortOptions,
  getUploadSuccessOptions,
  resolveMultiFilterLabel,
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import type { UploadLog, UploadLogsResponse, UploadLogsSummary } from "@/types/admin"

export interface UploadLogFilters {
  from?: Date
  to?: Date
  gameUserId: string
  method: string[]
  dataType: string[]
  server: string[]
  success: string
  sort: string
}

const SUCCESS_FILTER_VALUES = ["true", "false"] as const
const QUERY_KEYS = ["from", "to", "uid", "method", "type", "server", "success", "sort", "page", "size"] as const
export const UPLOAD_LOG_FILTER_IDS = {
  from: "upload-log-filter-from",
  to: "upload-log-filter-to",
  gameUser: "upload-log-filter-game-user",
} as const

export function createDefaultUploadLogFilters(): UploadLogFilters {
  return {
    from: undefined,
    to: undefined,
    gameUserId: "",
    method: [],
    dataType: [],
    server: [],
    success: "all",
    sort: DEFAULT_UPLOAD_LOG_SORT,
  }
}

/** Filters from a shared or restored URL; unknown values fall back to the defaults. */
export function parseUploadLogFiltersQuery(query: LocationQuery): UploadLogFilters {
  return {
    from: readQueryDate(query.from) ?? undefined,
    to: readQueryDate(query.to) ?? undefined,
    gameUserId: readQueryString(query.uid) ?? "",
    method: readQueryEnumList(query.method, UPLOAD_METHOD_FILTER_VALUES),
    dataType: readQueryEnumList(query.type, UPLOAD_DATA_TYPE_FILTER_VALUES),
    server: readQueryEnumList(query.server, UPLOAD_SERVER_FILTER_VALUES),
    success: readQueryEnum(query.success, SUCCESS_FILTER_VALUES) ?? "all",
    sort: readQueryEnum(query.sort, UPLOAD_SORT_FILTER_VALUES) ?? DEFAULT_UPLOAD_LOG_SORT,
  }
}

export function hasInvalidUploadLogTimeRange(filters: Pick<UploadLogFilters, "from" | "to">): boolean {
  return !!filters.from && !!filters.to && filters.from.getTime() > filters.to.getTime()
}

function cloneFilters(filters: UploadLogFilters): UploadLogFilters {
  return {
    ...filters,
    method: [...filters.method],
    dataType: [...filters.dataType],
    server: [...filters.server],
  }
}

export function useUploadLogs() {
  const { t } = useI18n()
  const route = useRoute()

  const summary = ref<UploadLogsSummary | null>(null)
  const responseFrom = ref("")
  const responseTo = ref("")
  const filtersExpanded = ref(true)
  const loadError = ref<ErrorDescription | null>(null)

  // `filters` is what the form shows; `applied` is what the list was loaded
  // with (and what the URL mirrors), so paging never picks up half-edited filters.
  const filters = ref<UploadLogFilters>(parseUploadLogFiltersQuery(route.query))
  const applied = ref<UploadLogFilters>(cloneFilters(filters.value))
  // The range error only shows after a query was attempted with it, and clears
  // itself as soon as the pickers are fixed, so later queries are never blocked.
  const timeRangeAttempted = ref(false)
  const timeRangeInvalid = computed(() => hasInvalidUploadLogTimeRange(filters.value))
  const timeRangeError = computed(() =>
    timeRangeAttempted.value && timeRangeInvalid.value ? t("adminStatistics.uploadLogs.toast.invalidTimeRange") : null
  )

  const {
    loading,
    items: logs,
    total,
    page,
    pageSize,
    totalPages,
    resetPage,
    load: loadLogs,
    prevPage,
    nextPage,
    goToPage,
  } = usePagedList<UploadLog, UploadLogsResponse>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: ({ page, pageSize }) => getUploadLogs(buildParams(page, pageSize)),
    mapResponse: (response) => ({
      items: response.items ?? [],
      total: response.total ?? 0,
    }),
    onBeforeLoad: () => {
      loadError.value = null
    },
    onSuccess: (response) => {
      summary.value = response.summary ?? null
      responseFrom.value = response.from ?? ""
      responseTo.value = response.to ?? ""
    },
    onError: (error) => {
      summary.value = null
      responseFrom.value = ""
      responseTo.value = ""
      loadError.value = describeError(error, t("adminStatistics.uploadLogs.toast.loadFailedFallback"))
    },
  })

  const uploadMethods = computed(() => getUploadMethodOptions(t).filter((option) => option.value !== "all"))
  const dataTypeOptions = computed(() => getUploadDataTypeOptions(t).filter((option) => option.value !== "all"))
  const servers = computed(() => getUploadServerOptions(t).filter((option) => option.value !== "all"))
  const sortOptions = computed(() => getUploadSortOptions(t))
  const successOptions = computed(() => getUploadSuccessOptions(t))

  function toggleMultiFilter(key: "method" | "dataType" | "server", value: string, checked: boolean) {
    const current = filters.value[key]
    filters.value[key] = checked
      ? Array.from(new Set([...current, value]))
      : current.filter((item) => item !== value)
  }

  function moreLabel(first: string, count: number) {
    return t("adminStatistics.uploadLogs.filters.selectedMore", { first, count })
  }

  function methodLabel(method?: string) {
    return resolveUploadMethodLabel(method, t)
  }

  function serverLabel(server?: string) {
    return resolveUploadServerLabel(server, t)
  }

  function formatTime(iso?: string) {
    return formatLocalizedDateTime(iso, undefined, t("adminStatistics.common.fallback"))
  }

  function dataTypeLabel(type?: string) {
    return resolveUploadDataTypeLabel(type, t)
  }

  function buildParams(currentPage: number, currentPageSize: number) {
    const current = applied.value
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    setQueryValue(params, "sort", current.sort)
    setQueryValue(params, "from", current.from?.toISOString())
    setQueryValue(params, "to", current.to?.toISOString())

    if (current.method.length > 0) setQueryValue(params, "upload_method", current.method.join(","))
    if (current.dataType.length > 0) setQueryValue(params, "data_type", current.dataType.join(","))
    if (current.server.length > 0) setQueryValue(params, "server", current.server.join(","))
    if (current.success !== "all") setQueryValue(params, "success", current.success)

    setTrimmedQueryValue(params, "game_user_id", current.gameUserId)
    return params
  }

  function applyFilters() {
    if (timeRangeInvalid.value) {
      timeRangeAttempted.value = true
      focusInvalidField(UPLOAD_LOG_FILTER_IDS.from)
      return
    }
    timeRangeAttempted.value = false
    applied.value = cloneFilters(filters.value)
    resetPage()
    void loadLogs()
  }

  function resetFilters() {
    filters.value = createDefaultUploadLogFilters()
    timeRangeAttempted.value = false
    applyFilters()
  }

  function reload() {
    void loadLogs()
  }

  watch(pageSize, () => {
    resetPage()
    void loadLogs()
  })

  useRouteQuerySync(QUERY_KEYS, () => {
    const current = applied.value
    return {
      from: writeQueryValue(current.from?.toISOString()),
      to: writeQueryValue(current.to?.toISOString()),
      uid: writeQueryValue(current.gameUserId.trim()),
      method: writeQueryList(current.method),
      type: writeQueryList(current.dataType),
      server: writeQueryList(current.server),
      success: writeQueryValue(current.success, "all"),
      sort: writeQueryValue(current.sort, DEFAULT_UPLOAD_LOG_SORT),
      page: writeQueryValue(page.value, 1),
      size: writeQueryValue(pageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
    }
  })

  const successRateValue = computed(() => {
    if (!summary.value) return null
    const count = summary.value.success + summary.value.failed
    if (count === 0) return null
    return (summary.value.success / count) * 100
  })

  const successRate = computed(() => {
    if (successRateValue.value === null) return null
    return successRateValue.value.toFixed(1)
  })

  const isSuccessRateHealthy = computed(() => {
    if (successRateValue.value === null) return false
    return successRateValue.value >= 90
  })

  const timeRangeLabel = computed(() => {
    if (!responseFrom.value || !responseTo.value) return ""
    return `${formatTime(responseFrom.value)} — ${formatTime(responseTo.value)}`
  })

  const donutData = computed(() => {
    if (!summary.value) return []

    return [
      { key: t("adminStatistics.common.success"), value: summary.value.success, color: "#22c55e" },
      { key: t("adminStatistics.common.failure"), value: summary.value.failed, color: "#ef4444" },
    ].filter((item) => item.value > 0)
  })

  const methodChartData = computed(() => {
    if (!summary.value?.byMethod?.length) return []

    return [...summary.value.byMethod]
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        label: methodLabel(item.key),
        value: item.count,
        color: CHART_COLORS[index % CHART_COLORS.length] as string,
      }))
      .filter((item) => item.value > 0)
  })

  const methodTotal = computed(() => methodChartData.value.reduce((sum, item) => sum + item.value, 0))

  const dataTypeChartData = computed(() => {
    if (!summary.value?.byDataType?.length) return []

    return [...summary.value.byDataType]
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        label: dataTypeLabel(item.key),
        value: item.count,
        color: CHART_COLORS[index % CHART_COLORS.length] as string,
      }))
      .filter((item) => item.value > 0)
  })

  const dataTypeTotal = computed(() => dataTypeChartData.value.reduce((sum, item) => sum + item.value, 0))

  onMounted(() => {
    void loadLogs()
  })

  return {
    loading,
    loadError,
    logs,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    filtersExpanded,
    filters,
    timeRangeError,
    uploadMethods,
    dataTypeOptions,
    servers,
    sortOptions,
    successOptions,
    toggleMethodFilter: (value: string, checked: boolean) => toggleMultiFilter("method", value, checked),
    toggleDataTypeFilter: (value: string, checked: boolean) => toggleMultiFilter("dataType", value, checked),
    toggleServerFilter: (value: string, checked: boolean) => toggleMultiFilter("server", value, checked),
    filterMethodLabel: computed(() => resolveMultiFilterLabel(filters.value.method, uploadMethods.value, t("adminStatistics.uploadLogs.filters.allMethods"), moreLabel)),
    filterDataTypeLabel: computed(() => resolveMultiFilterLabel(filters.value.dataType, dataTypeOptions.value, t("adminStatistics.uploadLogs.filters.allDataTypes"), moreLabel)),
    filterServerLabel: computed(() => resolveMultiFilterLabel(filters.value.server, servers.value, t("adminStatistics.uploadLogs.filters.allServers"), moreLabel)),
    filterMethodTitle: computed(() => describeMultiFilterSelection(filters.value.method, uploadMethods.value)),
    filterDataTypeTitle: computed(() => describeMultiFilterSelection(filters.value.dataType, dataTypeOptions.value)),
    filterServerTitle: computed(() => describeMultiFilterSelection(filters.value.server, servers.value)),
    applyFilters,
    resetFilters,
    reload,
    prevPage,
    nextPage,
    goToPage,
    methodLabel,
    serverLabel,
    formatTime,
    dataTypeLabel,
    successRate,
    isSuccessRateHealthy,
    timeRangeLabel,
    donutData,
    methodChartData,
    methodTotal,
    dataTypeChartData,
    dataTypeTotal,
  }
}
