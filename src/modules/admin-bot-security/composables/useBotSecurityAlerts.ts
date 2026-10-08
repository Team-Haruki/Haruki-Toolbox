import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { usePagedList } from "@/composables/usePagedList"
import { isNarrowViewport } from "@/composables/useCatalogViewPreference"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import {
  getBotSecurityAlerts,
  getBotSecuritySummary,
  updateBotSecurityAlert,
} from "@/modules/admin-bot-security/api/alerts"
import {
  BOT_SECURITY_ACTION_TARGET,
  BOT_SECURITY_PAGE_SIZE,
  type BotSecurityAlertAction,
  type BotSecurityAlertFilters,
  buildBotSecurityAlertQuery,
  buildBotSecurityAlertUpdatePayload,
  createDefaultBotSecurityFilters,
  getBotSecurityKindOptions,
  getBotSecurityStatusOptions,
  hasInvalidBotSecurityTimeRange,
  resolveBotSecurityKindLabel,
  resolveBotSecurityStatusLabel,
} from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert, BotSecurityAlertListResponse, BotSecuritySummary } from "@/types/admin"

const SHORT_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

export function useBotSecurityAlerts() {
  const { t } = useI18n()

  // `filters` is what the form shows; `appliedFilters` is what the list was
  // loaded with, so paging never picks up half-edited filters.
  const filters = ref<BotSecurityAlertFilters>(createDefaultBotSecurityFilters())
  const appliedFilters = ref<BotSecurityAlertFilters>(createDefaultBotSecurityFilters())
  // Collapsed on phones so the list is visible without scrolling past the form.
  const filtersExpanded = ref(!isNarrowViewport())
  const loadError = ref(false)

  const {
    loading,
    items: alerts,
    total,
    page,
    pageSize,
    totalPages,
    resetPage,
    load: loadAlerts,
    prevPage,
    nextPage,
  } = usePagedList<BotSecurityAlert, BotSecurityAlertListResponse>({
    initialPage: 1,
    initialPageSize: BOT_SECURITY_PAGE_SIZE,
    fetchPage: ({ page, pageSize }) => getBotSecurityAlerts(buildBotSecurityAlertQuery(appliedFilters.value, page, pageSize)),
    onBeforeLoad: () => {
      loadError.value = false
    },
    onSuccess: () => {
      loadError.value = false
    },
    onError: (error) => {
      loadError.value = true
      toastErrorWithExtractedMessage(
        t("adminBotSecurity.toast.loadFailedTitle"),
        error,
        t("adminBotSecurity.toast.loadFailedFallback"),
      )
    },
  })

  const summary = ref<BotSecuritySummary | null>(null)
  const summaryLoading = ref(true)

  async function loadSummary() {
    summaryLoading.value = true
    try {
      summary.value = await getBotSecuritySummary()
    } catch (error: unknown) {
      summary.value = null
      toastErrorWithExtractedMessage(
        t("adminBotSecurity.toast.loadSummaryFailedTitle"),
        error,
        t("adminBotSecurity.toast.loadFailedFallback"),
      )
    } finally {
      summaryLoading.value = false
    }
  }

  const statusOptions = computed(() => getBotSecurityStatusOptions(t))
  const kindOptions = computed(() => getBotSecurityKindOptions(t, [
    ...(summary.value?.byKind.map((entry) => entry.kind) ?? []),
    ...alerts.value.map((alert) => alert.kind),
    filters.value.kind,
  ]))

  function applyFilters() {
    if (hasInvalidBotSecurityTimeRange(filters.value)) {
      toast.error(t("adminBotSecurity.toast.filterFailedTitle"), {
        description: t("adminBotSecurity.toast.invalidTimeRange"),
      })
      return
    }

    appliedFilters.value = { ...filters.value }
    resetPage()
    void loadAlerts()
  }

  function resetFilters() {
    filters.value = createDefaultBotSecurityFilters()
    applyFilters()
  }

  /** Summary chip: show the open alerts of one kind. */
  function filterByOpenKind(kind: string) {
    filters.value = { ...createDefaultBotSecurityFilters(), kind }
    applyFilters()
  }

  function refresh() {
    void loadAlerts()
    void loadSummary()
  }

  // Detail dialog.
  const detailOpen = ref(false)
  const detailAlert = ref<BotSecurityAlert | null>(null)

  function openDetail(alert: BotSecurityAlert) {
    detailAlert.value = alert
    detailOpen.value = true
  }

  // Status change dialog.
  const actionOpen = ref(false)
  const actionAlert = ref<BotSecurityAlert | null>(null)
  const actionKind = ref<BotSecurityAlertAction>("resolve")
  const noteDraft = ref("")
  const actionSaving = ref(false)

  function openAction(alert: BotSecurityAlert, action: BotSecurityAlertAction) {
    actionAlert.value = alert
    actionKind.value = action
    noteDraft.value = alert.note
    actionOpen.value = true
  }

  function replaceAlert(updated: BotSecurityAlert) {
    // The row stays in place even when it no longer matches the status filter,
    // so the admin sees the result; the next load drops it.
    alerts.value = alerts.value.map((item) => item.id === updated.id ? updated : item)
    if (detailAlert.value?.id === updated.id) {
      detailAlert.value = updated
    }
  }

  async function submitAction() {
    const alert = actionAlert.value
    if (!alert) return

    const action = actionKind.value
    const payload = buildBotSecurityAlertUpdatePayload(alert, BOT_SECURITY_ACTION_TARGET[action], noteDraft.value)
    await runAsyncAction(actionSaving, () => updateBotSecurityAlert(alert.id, payload), {
      successMessage: t(`adminBotSecurity.toast.${action}Success`),
      successAfterOnSuccess: true,
      errorTitle: t("adminBotSecurity.toast.updateFailedTitle"),
      fallbackError: t("adminBotSecurity.toast.updateFailedFallback"),
      onSuccess: async (updated) => {
        actionOpen.value = false
        if (updated) {
          replaceAlert(updated)
        } else {
          await loadAlerts({ throwOnError: true, notifyOnError: false })
        }
        void loadSummary()
      },
    })
  }

  function kindLabel(kind: string) {
    return resolveBotSecurityKindLabel(kind, t)
  }

  function statusLabel(status: string) {
    return resolveBotSecurityStatusLabel(status, t)
  }

  function formatTime(value?: string | null) {
    return formatLocalizedDateTime(value, undefined, t("adminBotSecurity.common.fallback"))
  }

  /** Table cells: minutes precision; the full time is in the cell title and the detail dialog. */
  function formatShortTime(value?: string | null) {
    return formatLocalizedDateTime(value, SHORT_DATE_TIME, t("adminBotSecurity.common.fallback"))
  }

  onMounted(() => {
    void loadAlerts()
    void loadSummary()
  })

  return {
    filters,
    filtersExpanded,
    statusOptions,
    kindOptions,
    applyFilters,
    resetFilters,
    filterByOpenKind,
    refresh,
    loading,
    loadError,
    alerts,
    total,
    page,
    pageSize,
    totalPages,
    prevPage,
    nextPage,
    reload: () => void loadAlerts(),
    summary,
    summaryLoading,
    detailOpen,
    detailAlert,
    openDetail,
    actionOpen,
    actionAlert,
    actionKind,
    noteDraft,
    actionSaving,
    openAction,
    submitAction,
    kindLabel,
    statusLabel,
    formatTime,
    formatShortTime,
  }
}
