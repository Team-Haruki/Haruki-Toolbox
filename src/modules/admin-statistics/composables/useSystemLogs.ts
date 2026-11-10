import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { createPageQuery } from "@/core/http/query"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { formatDateKey, formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { writeQueryValue } from "@/lib/query-codec"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  exportSystemLogs,
  getSystemLogDetail,
  getSystemLogs,
  getSystemLogSummary,
  type SystemLogEntry,
  type SystemLogListResponse,
  type SystemLogSummaryDetail,
} from "@/modules/admin-statistics/api/system-log"
import {
  DEFAULT_SYSTEM_LOG_RANGE,
  buildSystemLogFilterParams,
  countActiveSystemLogFilters,
  createDefaultSystemLogFilters,
  formatSystemLogMetadata,
  parseSystemLogFiltersQuery,
  type SystemLogActorTypeFilter,
  type SystemLogFilters,
  type SystemLogRange,
  type SystemLogResultFilter,
} from "@/modules/admin-statistics/lib/logs-system-query"

const QUERY_KEYS = ["q", "result", "actor", "range", "page", "size"] as const

/** The detail JSON, pretty-printed when it parses; the raw text otherwise. */
export function formatSystemLogDetail(detail: string | null | undefined): string {
  return formatSystemLogMetadata({ detail })
}

export function useSystemLogs() {
  const { t } = useI18n()
  const route = useRoute()
  const initial = parseSystemLogFiltersQuery(route.query)
  const search = ref(initial.search)
  const result = ref<SystemLogResultFilter>(initial.result)
  const actorType = ref<SystemLogActorTypeFilter>(initial.actorType)
  const range = ref<SystemLogRange>(initial.range)
  // The search the list was last loaded with: an Enter-triggered load must not
  // be repeated by the debounce that follows it.
  let loadedSearch = search.value.trim()
  let skipSelectWatch = false
  const loadError = ref<ErrorDescription | null>(null)

  function currentFilters(): SystemLogFilters {
    return { search: search.value, result: result.value, actorType: actorType.value, range: range.value }
  }

  const activeFilterCount = computed(() => countActiveSystemLogFilters(currentFilters()))

  // The window the loaded rows cover, as the backend resolved it.
  const listFrom = ref("")
  const listTo = ref("")

  const {
    loading,
    items: logs,
    page,
    pageSize,
    total,
    totalPages,
    resetPage,
    load: loadLogs,
    prevPage,
    nextPage,
    goToPage,
  } = usePagedList<SystemLogEntry, SystemLogListResponse>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: async ({ page, pageSize }) => {
      loadedSearch = search.value.trim()
      return getSystemLogs({
        ...createPageQuery(page, pageSize),
        ...buildSystemLogFilterParams(currentFilters(), Date.now()),
      })
    },
    mapResponse: (response) => ({
      items: response.items ?? [],
      total: response.total ?? 0,
    }),
    onBeforeLoad: () => {
      loadError.value = null
    },
    onSuccess: (response) => {
      listFrom.value = response.from ?? ""
      listTo.value = response.to ?? ""
    },
    onError: (error) => {
      loadError.value = describeError(error, t("adminStatistics.systemLogs.toast.loadFailedFallback"))
    },
  })

  const summary = ref<SystemLogSummaryDetail | null>(null)
  const summaryLoading = ref(true)
  const summaryError = ref<ErrorDescription | null>(null)
  let latestSummaryRequestId = 0

  const detailOpen = ref(false)
  const detailLog = ref<SystemLogEntry | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<ErrorDescription | null>(null)
  const detailId = ref<string>("")
  let latestDetailRequestId = 0

  const detailText = computed(() => formatSystemLogMetadata(detailLog.value))

  /** The summary covers every log matching the filters in the range, so it follows the filters, not the page. */
  async function loadSummary() {
    const requestId = ++latestSummaryRequestId
    summaryLoading.value = true
    summaryError.value = null
    try {
      const data = await getSystemLogSummary(buildSystemLogFilterParams(currentFilters(), Date.now()))
      if (requestId !== latestSummaryRequestId) return
      summary.value = data
    } catch (error: unknown) {
      if (requestId !== latestSummaryRequestId) return
      summary.value = null
      summaryError.value = describeError(error, t("adminStatistics.systemLogs.toast.loadFailedFallback"))
    } finally {
      if (requestId === latestSummaryRequestId) {
        summaryLoading.value = false
      }
    }
  }

  async function showDetail(id: number | string) {
    const requestId = ++latestDetailRequestId
    detailId.value = String(id)
    detailOpen.value = true
    detailLoading.value = true
    detailError.value = null
    detailLog.value = null
    try {
      const detail = await getSystemLogDetail(String(id))
      if (requestId !== latestDetailRequestId) return
      detailLog.value = detail
    } catch (error: unknown) {
      if (requestId !== latestDetailRequestId) return
      detailLog.value = null
      detailError.value = describeError(error, t("adminStatistics.systemLogs.toast.loadFailedFallback"))
    } finally {
      if (requestId !== latestDetailRequestId) return
      detailLoading.value = false
    }
  }

  function retryDetail() {
    if (detailId.value) void showDetail(detailId.value)
  }

  async function copyDetail() {
    const text = detailText.value
    if (!text || !isClipboardSupported()) {
      toast.error(t("adminStatistics.systemLogs.detail.copyFailed"))
      return
    }
    const copied = await copyTextToClipboard(text)
    if (copied) {
      toast.success(t("adminStatistics.systemLogs.detail.copied"))
    } else {
      toast.error(t("adminStatistics.systemLogs.detail.copyFailed"))
    }
  }

  async function handleExport() {
    try {
      const blob = await exportSystemLogs(buildSystemLogFilterParams(currentFilters(), Date.now()))
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `system-logs-${formatDateKey(new Date())}.json`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 0)
      toast.success(t("adminStatistics.systemLogs.toast.exportSuccess"))
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminStatistics.systemLogs.toast.exportFailedTitle"),
        error,
        t("adminStatistics.systemLogs.toast.exportFailedFallback")
      )
    }
  }

  function formatTime(iso?: string) {
    return formatLocalizedDateTime(iso, "dateTimeSeconds", t("adminStatistics.common.fallback"))
  }

  /** "from – to" of the window the figures cover: the summary's, or the list's while that is missing. */
  const rangeLabel = computed(() => {
    const from = summary.value?.from || listFrom.value
    const to = summary.value?.to || listTo.value
    if (!from || !to) return ""
    const fallback = t("adminStatistics.common.fallback")
    return `${formatLocalizedDateTime(from, "dateTime", fallback)} – ${formatLocalizedDateTime(to, "dateTime", fallback)}`
  })

  function reloadFromFirstPage() {
    resetPage()
    void loadLogs()
    void loadSummary()
  }

  /** Enter in the search box: query now instead of waiting for the debounce. */
  function applySearch() {
    reloadFromFirstPage()
  }

  function resetSearch() {
    search.value = ""
    applySearch()
  }

  /** Back to the default view: no search, every result and actor, the last 24 hours. */
  function resetFilters() {
    const defaults = createDefaultSystemLogFilters()
    // One load for the whole reset: the select watcher below would otherwise add its own.
    skipSelectWatch = result.value !== defaults.result
      || actorType.value !== defaults.actorType
      || range.value !== defaults.range
    search.value = defaults.search
    result.value = defaults.result
    actorType.value = defaults.actorType
    range.value = defaults.range
    reloadFromFirstPage()
  }

  /** Reloads the page of rows and the figures above it. */
  function reload() {
    void loadLogs()
    void loadSummary()
  }

  useDebouncedWatch(
    search,
    () => {
      if (search.value.trim() === loadedSearch) return
      reloadFromFirstPage()
    },
    400
  )

  watch([result, actorType, range], () => {
    if (skipSelectWatch) {
      skipSelectWatch = false
      return
    }
    reloadFromFirstPage()
  })

  watch(pageSize, () => {
    resetPage()
    void loadLogs()
  })

  useRouteQuerySync(QUERY_KEYS, () => ({
    q: writeQueryValue(search.value.trim()),
    result: writeQueryValue(result.value, "all"),
    actor: writeQueryValue(actorType.value, "all"),
    range: writeQueryValue(range.value, DEFAULT_SYSTEM_LOG_RANGE),
    page: writeQueryValue(page.value, 1),
    size: writeQueryValue(pageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

  onMounted(() => {
    void loadLogs()
    void loadSummary()
  })

  return {
    loading,
    loadError,
    logs,
    page,
    pageSize,
    total,
    totalPages,
    search,
    result,
    actorType,
    range,
    activeFilterCount,
    rangeLabel,
    summary,
    summaryLoading,
    summaryError,
    detailOpen,
    detailLog,
    detailLoading,
    detailError,
    detailText,
    showDetail,
    retryDetail,
    copyDetail,
    handleExport,
    applySearch,
    resetSearch,
    resetFilters,
    reload,
    loadSummary,
    prevPage,
    nextPage,
    goToPage,
    formatTime,
  }
}
