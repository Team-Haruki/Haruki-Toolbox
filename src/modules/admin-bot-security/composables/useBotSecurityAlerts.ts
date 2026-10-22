import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { isNarrowViewport } from "@/composables/useCatalogViewPreference"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { focusInvalidField } from "@/lib/form-focus"
import { writeQueryValue } from "@/lib/query-codec"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  getBotSecurityAlerts,
  getBotSecuritySummary,
  updateBotSecurityAlert,
} from "@/modules/admin-bot-security/api/alerts"
import {
  BOT_SECURITY_ACTION_TARGET,
  BOT_SECURITY_QUERY_KEYS,
  type BotSecurityAlertAction,
  type BotSecurityAlertFilters,
  buildBotSecurityAlertQuery,
  buildBotSecurityAlertUpdatePayload,
  createDefaultBotSecurityFilters,
  getBotSecurityKindOptions,
  getBotSecurityStatusOptions,
  hasInvalidBotSecurityTimeRange,
  parseBotSecurityFiltersQuery,
  resolveBotSecurityKindLabel,
  resolveBotSecurityStatusLabel,
  writeBotSecurityFiltersQuery,
} from "@/modules/admin-bot-security/lib/alert-meta"
import type { BotSecurityAlert, BotSecurityAlertListResponse, BotSecuritySummary } from "@/types/admin"

const SHORT_DATE_TIME: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
}

export const BOT_SECURITY_FILTER_IDS = {
  from: "bot-security-filter-from",
  to: "bot-security-filter-to",
} as const

export function useBotSecurityAlerts() {
  const { t } = useI18n()
  const route = useRoute()

  // `filters` is what the form shows; `appliedFilters` is what the list was
  // loaded with (and what the URL mirrors), so paging never picks up half-edited filters.
  const filters = ref<BotSecurityAlertFilters>(parseBotSecurityFiltersQuery(route.query))
  const appliedFilters = ref<BotSecurityAlertFilters>({ ...filters.value })
  // Collapsed on phones so the list is visible without scrolling past the form.
  const filtersExpanded = ref(!isNarrowViewport())
  const loadError = ref<ErrorDescription | null>(null)
  // The range error only shows after a query was attempted with it, and clears
  // itself as soon as the pickers are fixed, so later queries are never blocked.
  const timeRangeAttempted = ref(false)
  const timeRangeInvalid = computed(() => hasInvalidBotSecurityTimeRange(filters.value))
  const timeRangeError = computed(() =>
    timeRangeAttempted.value && timeRangeInvalid.value ? t("adminBotSecurity.toast.invalidTimeRange") : null
  )

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
    goToPage,
  } = usePagedList<BotSecurityAlert, BotSecurityAlertListResponse>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: ({ page, pageSize }) => getBotSecurityAlerts(buildBotSecurityAlertQuery(appliedFilters.value, page, pageSize)),
    onBeforeLoad: () => {
      loadError.value = null
    },
    onError: (error) => {
      loadError.value = describeError(error, t("adminBotSecurity.toast.loadFailedFallback"))
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
    if (timeRangeInvalid.value) {
      timeRangeAttempted.value = true
      focusInvalidField(BOT_SECURITY_FILTER_IDS.from)
      return
    }
    timeRangeAttempted.value = false
    appliedFilters.value = { ...filters.value }
    resetPage()
    void loadAlerts()
  }

  function resetFilters() {
    filters.value = createDefaultBotSecurityFilters()
    timeRangeAttempted.value = false
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

  watch(pageSize, () => {
    resetPage()
    void loadAlerts()
  })

  useRouteQuerySync(BOT_SECURITY_QUERY_KEYS, () => ({
    ...writeBotSecurityFiltersQuery(appliedFilters.value),
    page: writeQueryValue(page.value, 1),
    size: writeQueryValue(pageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

  onMounted(() => {
    void loadAlerts()
    void loadSummary()
  })

  return {
    filters,
    filtersExpanded,
    timeRangeError,
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
    goToPage,
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
