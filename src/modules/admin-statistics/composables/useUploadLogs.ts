import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { usePagedList } from "@/composables/usePagedList"
import {
  createPageQuery,
  setQueryValue,
  setTrimmedQueryValue,
  type QueryParams,
} from "@/core/http/query"
import { getUploadLogs } from "@/modules/admin-statistics/api/upload-log"
import {
  CHART_COLORS,
  DEFAULT_UPLOAD_LOG_SORT,
  getUploadDataTypeOptions,
  getUploadMethodOptions,
  getUploadServerOptions,
  getUploadSortOptions,
  getUploadSuccessOptions,
  resolveUploadDataTypeLabel,
  resolveUploadMethodLabel,
  resolveUploadServerLabel,
} from "@/modules/admin-statistics/lib/upload-log-meta"
import type { UploadLog, UploadLogsResponse, UploadLogsSummary } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useUploadLogs() {
  const { t, locale } = useI18n()
  const summary = ref<UploadLogsSummary | null>(null)
  const responseFrom = ref("")
  const responseTo = ref("")
  const filtersExpanded = ref(true)

  const filterFrom = ref<Date>()
  const filterTo = ref<Date>()
  const filterMethod = ref("all")
  const filterDataType = ref("all")
  const filterServer = ref("all")
  const filterSuccess = ref("all")
  const filterSort = ref(DEFAULT_UPLOAD_LOG_SORT)
  const filterGameUserId = ref("")
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
  } = usePagedList<UploadLog, UploadLogsResponse>({
    initialPage: 1,
    initialPageSize: 20,
    fetchPage: ({ page, pageSize }) => getUploadLogs(buildParams(page, pageSize)),
    mapResponse: (response) => ({
      items: response.items ?? [],
      total: response.total ?? 0,
    }),
    onSuccess: (response) => {
      summary.value = response.summary ?? null
      responseFrom.value = response.from ?? ""
      responseTo.value = response.to ?? ""
    },
    onError: (error) => {
      toastErrorWithExtractedMessage(
        t("adminStatistics.uploadLogs.toast.loadFailedTitle"),
        error,
        t("adminStatistics.uploadLogs.toast.loadFailedFallback")
      )
    },
  })

  const uploadMethods = computed(() => getUploadMethodOptions(t))
  const dataTypeOptions = computed(() => getUploadDataTypeOptions(t))
  const servers = computed(() => getUploadServerOptions(t))
  const sortOptions = computed(() => getUploadSortOptions(t))
  const successOptions = computed(() => getUploadSuccessOptions(t))

  function methodLabel(method?: string) {
    return resolveUploadMethodLabel(method, t)
  }

  function serverLabel(server?: string) {
    return resolveUploadServerLabel(server, t)
  }

  function formatTime(iso?: string) {
    if (!iso) {
      return t("adminStatistics.common.fallback")
    }
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      return t("adminStatistics.common.fallback")
    }
    return date.toLocaleString(locale.value)
  }

  function dataTypeLabel(type?: string) {
    return resolveUploadDataTypeLabel(type, t)
  }

  function buildParams(currentPage: number, currentPageSize: number) {
    const params: QueryParams = createPageQuery(currentPage, currentPageSize)
    setQueryValue(params, "sort", filterSort.value)
    setQueryValue(params, "from", filterFrom.value?.toISOString())
    setQueryValue(params, "to", filterTo.value?.toISOString())

    if (filterMethod.value !== "all") setQueryValue(params, "upload_method", filterMethod.value)
    if (filterDataType.value !== "all") setQueryValue(params, "data_type", filterDataType.value)
    if (filterServer.value !== "all") setQueryValue(params, "server", filterServer.value)
    if (filterSuccess.value !== "all") setQueryValue(params, "success", filterSuccess.value)

    setTrimmedQueryValue(params, "game_user_id", filterGameUserId.value)
    return params
  }

  function hasInvalidTimeRange() {
    return !!filterFrom.value && !!filterTo.value && filterFrom.value.getTime() > filterTo.value.getTime()
  }

  function applyFilters() {
    if (hasInvalidTimeRange()) {
      toast.error(t("adminStatistics.uploadLogs.toast.filterFailedTitle"), {
        description: t("adminStatistics.uploadLogs.toast.invalidTimeRange"),
      })
      return
    }

    resetPage()
    void loadLogs()
  }

  function resetFilters() {
    filterFrom.value = undefined
    filterTo.value = undefined
    filterMethod.value = "all"
    filterDataType.value = "all"
    filterServer.value = "all"
    filterSuccess.value = "all"
    filterSort.value = DEFAULT_UPLOAD_LOG_SORT
    filterGameUserId.value = ""
    resetPage()
    void loadLogs()
  }

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
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
  })

  const methodTotal = computed(() => methodChartData.value.reduce((sum, item) => sum + item.value, 0))

  const dataTypeChartData = computed(() => {
    if (!summary.value?.byDataType?.length) return []

    return [...summary.value.byDataType]
      .sort((a, b) => b.count - a.count)
      .map((item, index) => ({
        label: dataTypeLabel(item.key),
        value: item.count,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }))
  })

  const dataTypeTotal = computed(() => dataTypeChartData.value.reduce((sum, item) => sum + item.value, 0))

  onMounted(() => {
    void loadLogs()
  })

  return {
    loading,
    logs,
    total,
    page,
    totalPages,
    summary,
    filtersExpanded,
    filterFrom,
    filterTo,
    filterMethod,
    filterDataType,
    filterServer,
    filterSuccess,
    filterSort,
    filterGameUserId,
    uploadMethods,
    dataTypeOptions,
    servers,
    sortOptions,
    successOptions,
    applyFilters,
    resetFilters,
    prevPage,
    nextPage,
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
