import { onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useDebouncedWatch } from "@/composables/useDebouncedWatch"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery, setTrimmedQueryValue } from "@/core/http/query"
import { formatDateKey, formatLocalizedDateTime } from "@/lib/date-time"
import {
  exportSystemLogs,
  getSystemLogDetail,
  getSystemLogs,
  getSystemLogSummary,
} from "@/modules/admin-statistics/api/system-log"
import type { SystemLog, SystemLogSummary } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"

export function useSystemLogs() {
  const { t } = useI18n()
  const search = ref("")
  const {
    loading,
    items: logs,
    page,
    total,
    totalPages,
    resetPage,
    load: loadLogs,
    prevPage,
    nextPage,
  } = usePagedList<SystemLog>({
    initialPage: 1,
    initialPageSize: 20,
    fetchPage: async ({ page, pageSize }) => {
      const params = createPageQuery(page, pageSize)
      setTrimmedQueryValue(params, "q", search.value)
      return getSystemLogs(params)
    },
    onError: (error) => {
      toastErrorWithExtractedMessage(
        t("adminStatistics.systemLogs.toast.loadFailedTitle"),
        error,
        t("adminStatistics.systemLogs.toast.loadFailedFallback")
      )
    },
  })

  const summary = ref<SystemLogSummary | null>(null)
  const summaryLoading = ref(true)

  const detailOpen = ref(false)
  const detailLog = ref<SystemLog | null>(null)
  const detailLoading = ref(false)
  let latestDetailRequestId = 0

  async function loadSummary() {
    summaryLoading.value = true
    try {
      summary.value = await getSystemLogSummary()
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminStatistics.systemLogs.toast.loadSummaryFailedTitle"),
        error,
        t("adminStatistics.systemLogs.toast.loadFailedFallback")
      )
    } finally {
      summaryLoading.value = false
    }
  }

  async function showDetail(id: number | string) {
    const requestId = ++latestDetailRequestId
    detailOpen.value = true
    detailLoading.value = true
    detailLog.value = null
    try {
      const detail = await getSystemLogDetail(String(id))
      if (requestId !== latestDetailRequestId) return
      detailLog.value = detail
    } catch (error: unknown) {
      if (requestId !== latestDetailRequestId) return
      detailLog.value = null
      toastErrorWithExtractedMessage(
        t("adminStatistics.systemLogs.toast.loadDetailFailedTitle"),
        error,
        t("adminStatistics.systemLogs.toast.loadFailedFallback")
      )
    } finally {
      if (requestId !== latestDetailRequestId) return
      detailLoading.value = false
    }
  }

  async function handleExport() {
    try {
      const blob = await exportSystemLogs()
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

  useDebouncedWatch(
    search,
    () => {
      resetPage()
      void loadLogs()
    },
    400
  )

  onMounted(() => {
    void loadLogs()
    void loadSummary()
  })

  return {
    loading,
    logs,
    page,
    total,
    totalPages,
    search,
    summary,
    summaryLoading,
    detailOpen,
    detailLog,
    detailLoading,
    showDetail,
    handleExport,
    prevPage,
    nextPage,
    resultColor,
    formatTime,
  }
}
