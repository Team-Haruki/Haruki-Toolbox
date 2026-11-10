import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { createPageQuery, type QueryParams } from "@/core/http/query"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { focusInvalidField } from "@/lib/form-focus"
import { readQueryEnum, writeQueryValue } from "@/lib/query-codec"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  createRiskEvent,
  getRiskEvents,
  getRiskEventTotal,
  resolveRiskEvent,
} from "@/modules/admin-risk/api/event"
import type { RiskEventItem, RiskEventPage } from "@/modules/admin-risk/api/types"
import {
  countRiskEventSources,
  RISK_EVENT_DEFAULT_RANGE,
  RISK_EVENT_RANGES,
  RISK_EVENT_STATUSES,
  RISK_SEVERITIES,
  type RiskEventRange,
  riskEventRangeStart,
  type RiskSeverity,
} from "@/modules/admin-risk/lib/event-stats"

export const RISK_EVENT_SOURCE_OPTIONS = ["dashboard", "manual", "automated", "other"] as const
export const RISK_EVENT_FIELD_IDS = {
  action: "risk-event-action",
  reason: "risk-event-reason",
} as const
/** Select value for "no filter"; never sent to the backend. */
export const RISK_EVENT_FILTER_ALL = "all"

export type RiskEventCreateErrors = Partial<Record<"action" | "reason", string>>

/**
 * Counts over the whole time window, each one the `total` of the list with
 * that filter. null: that count could not be loaded.
 */
export type RiskEventStats = {
  open: number | null
  resolved: number | null
  openBySeverity: Record<RiskSeverity, number | null>
}

const QUERY_KEYS = ["range", "status", "severity", "page", "size"] as const
const STATUS_FILTER_VALUES: readonly string[] = [RISK_EVENT_FILTER_ALL, ...RISK_EVENT_STATUSES]
const SEVERITY_FILTER_VALUES: readonly string[] = [RISK_EVENT_FILTER_ALL, ...RISK_SEVERITIES]

function emptyStats(): RiskEventStats {
  return { open: null, resolved: null, openBySeverity: { critical: null, high: null, medium: null, low: null } }
}

export function useRiskEvents() {
  const { t } = useI18n()
  const route = useRoute()

  // The three selects apply at once: each is a single choice, so there is no
  // half-edited state to guard against.
  const range = ref<RiskEventRange>(readQueryEnum(route.query.range, RISK_EVENT_RANGES) ?? RISK_EVENT_DEFAULT_RANGE)
  const statusFilter = ref(readQueryEnum(route.query.status, STATUS_FILTER_VALUES) ?? RISK_EVENT_FILTER_ALL)
  const severityFilter = ref(readQueryEnum(route.query.severity, SEVERITY_FILTER_VALUES) ?? RISK_EVENT_FILTER_ALL)

  function windowQuery(): QueryParams {
    return { from: riskEventRangeStart(range.value, new Date()).toISOString() }
  }

  const actionLoading = ref(false)
  const eventsError = ref<ErrorDescription | null>(null)
  const {
    loading: eventsLoading,
    items: events,
    total: totalEvents,
    page: eventPage,
    pageSize: eventPageSize,
    totalPages,
    resetPage,
    load: loadEvents,
    prevPage,
    nextPage,
    goToPage,
  } = usePagedList<RiskEventItem, RiskEventPage>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: ({ page, pageSize }) => {
      const params: QueryParams = { ...createPageQuery(page, pageSize), ...windowQuery() }
      if (statusFilter.value !== RISK_EVENT_FILTER_ALL) params.status = statusFilter.value
      if (severityFilter.value !== RISK_EVENT_FILTER_ALL) params.severity = severityFilter.value
      return getRiskEvents(params)
    },
    onBeforeLoad: () => {
      eventsError.value = null
    },
    onError: (error) => {
      eventsError.value = describeError(error, t("adminRisk.toast.loadFailedFallback"))
    },
  })

  // Whole-window figures. They ignore the status and severity selects (which
  // only narrow the list) and never hold the list back.
  const stats = ref<RiskEventStats>(emptyStats())
  const statsLoading = ref(true)
  let statsRequestId = 0

  async function loadStats() {
    const requestId = ++statsRequestId
    statsLoading.value = true
    const timeWindow = windowQuery()
    const [open, resolved, ...bySeverity] = await Promise.allSettled([
      getRiskEventTotal({ ...timeWindow, status: "open" }),
      getRiskEventTotal({ ...timeWindow, status: "resolved" }),
      ...RISK_SEVERITIES.map((severity) => getRiskEventTotal({ ...timeWindow, status: "open", severity })),
    ])
    if (requestId !== statsRequestId) return

    const next = emptyStats()
    next.open = open.status === "fulfilled" ? open.value : null
    next.resolved = resolved.status === "fulfilled" ? resolved.value : null
    RISK_SEVERITIES.forEach((severity, index) => {
      const result = bySeverity[index]
      next.openBySeverity[severity] = result?.status === "fulfilled" ? result.value : null
    })
    stats.value = next
    statsLoading.value = false
  }

  // Sources of the rows on screen only; the page labels them as such.
  const pageSources = computed(() => countRiskEventSources(events.value))

  async function refreshEventsStrict() {
    void loadStats()
    await loadEvents({ throwOnError: true, notifyOnError: false })
  }

  function reloadEvents() {
    void loadEvents()
    void loadStats()
  }

  watch([statusFilter, severityFilter], () => {
    resetPage()
    void loadEvents()
  })
  watch(range, () => {
    resetPage()
    reloadEvents()
  })

  // Create dialog.
  const createOpen = ref(false)
  const newSeverity = ref("medium")
  const newSource = ref<string>("dashboard")
  const newAction = ref("")
  const newReason = ref("")
  const newTargetUserId = ref("")
  const createErrors = ref<RiskEventCreateErrors>({})
  const creating = ref(false)

  function resetCreateForm() {
    newSeverity.value = "medium"
    newSource.value = "dashboard"
    newAction.value = ""
    newReason.value = ""
    newTargetUserId.value = ""
    createErrors.value = {}
  }

  function setCreateOpen(open: boolean) {
    createOpen.value = open
    if (!open) {
      resetCreateForm()
    }
  }

  // A corrected field drops its own message right away.
  watch(newAction, () => {
    if (createErrors.value.action) createErrors.value = { ...createErrors.value, action: undefined }
  })
  watch(newReason, () => {
    if (createErrors.value.reason) createErrors.value = { ...createErrors.value, reason: undefined }
  })

  function validateCreateForm(): boolean {
    const errors: RiskEventCreateErrors = {}
    if (!newAction.value.trim()) errors.action = t("adminRisk.events.validation.actionRequired")
    if (!newReason.value.trim()) errors.reason = t("adminRisk.events.validation.reasonRequired")
    createErrors.value = errors
    const firstInvalid = errors.action ? RISK_EVENT_FIELD_IDS.action : errors.reason ? RISK_EVENT_FIELD_IDS.reason : null
    if (firstInvalid) {
      focusInvalidField(firstInvalid)
      return false
    }
    return true
  }

  async function handleCreate() {
    if (!validateCreateForm()) return
    const action = newAction.value.trim()
    const reason = newReason.value.trim()

    await runAsyncAction(creating, () => createRiskEvent({
        severity: newSeverity.value,
        source: newSource.value.trim() || "dashboard",
        action,
        reason,
        targetUserId: newTargetUserId.value.trim() || undefined,
      }), {
      successMessage: t("adminRisk.toast.createSuccess"),
      successAfterOnSuccess: true,
      errorTitle: t("adminRisk.toast.createFailedTitle"),
      fallbackError: t("adminRisk.toast.createFailedFallback"),
      onSuccess: async () => {
        createOpen.value = false
        resetCreateForm()
        await refreshEventsStrict()
      },
    })
  }

  // Detail dialog.
  const detailOpen = ref(false)
  const detailEvent = ref<RiskEventItem | null>(null)

  function openDetail(event: RiskEventItem) {
    detailEvent.value = event
    detailOpen.value = true
  }

  // Resolve confirmation. Dialogs do not stack: asking from the detail dialog closes it first.
  const resolveConfirmOpen = ref(false)
  // Kept after the dialog closes so its text does not change mid fade-out.
  const eventToResolve = ref<RiskEventItem | null>(null)

  function requestResolve(event: RiskEventItem) {
    detailOpen.value = false
    eventToResolve.value = event
    resolveConfirmOpen.value = true
  }

  /**
   * Runs from the ConfirmDialog: rethrows so the dialog shows the failure
   * inline and stays open instead of toasting.
   */
  async function confirmResolve() {
    const event = eventToResolve.value
    if (!event) return
    await runAsyncAction(actionLoading, () => resolveRiskEvent(event.id), {
      successMessage: t("adminRisk.toast.resolveSuccess"),
      successAfterOnSuccess: true,
      errorTitle: t("adminRisk.toast.actionFailedTitle"),
      fallbackError: t("adminRisk.toast.actionFailedFallback"),
      throwOnError: true,
      onSuccess: refreshEventsStrict,
    })
  }

  function formatDate(value?: string | null) {
    return formatLocalizedDateTime(value, "dateTime", t("adminRisk.common.fallback"))
  }

  watch(eventPageSize, () => {
    resetPage()
    void loadEvents()
  })

  useRouteQuerySync(QUERY_KEYS, () => ({
    range: writeQueryValue(range.value, RISK_EVENT_DEFAULT_RANGE),
    status: writeQueryValue(statusFilter.value, RISK_EVENT_FILTER_ALL),
    severity: writeQueryValue(severityFilter.value, RISK_EVENT_FILTER_ALL),
    page: writeQueryValue(eventPage.value, 1),
    size: writeQueryValue(eventPageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

  onMounted(reloadEvents)

  return {
    range,
    statusFilter,
    severityFilter,
    eventsLoading,
    eventsError,
    events,
    totalEvents,
    eventPage,
    eventPageSize,
    totalPages,
    stats,
    statsLoading,
    pageSources,
    actionLoading,
    createOpen,
    newSeverity,
    newSource,
    newAction,
    newReason,
    newTargetUserId,
    createErrors,
    creating,
    detailOpen,
    detailEvent,
    openDetail,
    resolveConfirmOpen,
    eventToResolve,
    requestResolve,
    confirmResolve,
    setCreateOpen,
    handleCreate,
    reloadEvents,
    prevPage,
    nextPage,
    goToPage,
    formatDate,
  }
}
