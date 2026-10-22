import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { createPageQuery, type QueryParams, setTrimmedQueryValue } from "@/core/http/query"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { formatDateKey, formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { readQueryString, writeQueryValue } from "@/lib/query-codec"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  exportSystemLogs,
  getSystemLogDetail,
  getSystemLogs,
  getSystemLogSummary,
} from "@/modules/admin-statistics/api/system-log"
import type { SystemLog, SystemLogSummary } from "@/types/admin"

const QUERY_KEYS = ["q", "page", "size"] as const

/** The detail JSON, pretty-printed when it parses; the raw text otherwise. */
export function formatSystemLogDetail(detail: string | null | undefined): string {
  const raw = (detail ?? "").trim()
  if (!raw) return ""
  try {
    return JSON.stringify(JSON.parse(raw), null, 2)
  } catch {
    return raw
  }
}

export function useSystemLogs() {
  const { t } = useI18n()
  const route = useRoute()
  const search = ref(readQueryString(route.query.q) ?? "")
  // The search the list was last loaded with: an Enter-triggered load must not
  // be repeated by the debounce that follows it.
  let loadedSearch = search.value.trim()
  const loadError = ref<ErrorDescription | null>(null)

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
  } = usePagedList<SystemLog>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: async ({ page, pageSize }) => {
      const params = createPageQuery(page, pageSize)
      loadedSearch = search.value.trim()
      setTrimmedQueryValue(params, "q", search.value)
      return getSystemLogs(params)
    },
    onBeforeLoad: () => {
      loadError.value = null
    },
    onError: (error) => {
      loadError.value = describeError(error, t("adminStatistics.systemLogs.toast.loadFailedFallback"))
    },
  })

  const summary = ref<SystemLogSummary | null>(null)
  const summaryLoading = ref(true)
  const summaryError = ref<ErrorDescription | null>(null)

  const detailOpen = ref(false)
  const detailLog = ref<SystemLog | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<ErrorDescription | null>(null)
  const detailId = ref<string>("")
  let latestDetailRequestId = 0

  const detailText = computed(() => formatSystemLogDetail(detailLog.value?.detail))

  async function loadSummary() {
    summaryLoading.value = true
    summaryError.value = null
    try {
      summary.value = await getSystemLogSummary()
    } catch (error: unknown) {
      summary.value = null
      summaryError.value = describeError(error, t("adminStatistics.systemLogs.toast.loadFailedFallback"))
    } finally {
      summaryLoading.value = false
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
      const params: QueryParams = {}
      setTrimmedQueryValue(params, "q", search.value)
      const blob = await exportSystemLogs(params)
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

  function resultColor(result?: string) {
    switch (result) {
      case "success":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "failure":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  function formatTime(iso?: string) {
    return formatLocalizedDateTime(iso, undefined, t("adminStatistics.common.fallback"))
  }

  function reloadFromFirstPage() {
    resetPage()
    void loadLogs()
  }

  /** Enter in the search box: query now instead of waiting for the debounce. */
  function applySearch() {
    reloadFromFirstPage()
  }

  function resetSearch() {
    search.value = ""
    applySearch()
  }

  function reload() {
    void loadLogs()
  }

  useDebouncedWatch(
    search,
    () => {
      if (search.value.trim() === loadedSearch) return
      reloadFromFirstPage()
    },
    400
  )

  watch(pageSize, () => {
    reloadFromFirstPage()
  })

  useRouteQuerySync(QUERY_KEYS, () => ({
    q: writeQueryValue(search.value.trim()),
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
    reload,
    loadSummary,
    prevPage,
    nextPage,
    goToPage,
    resultColor,
    formatTime,
  }
}
