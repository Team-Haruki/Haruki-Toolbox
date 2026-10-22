import { computed, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { usePagedList } from "@/composables/usePagedList"
import { useRouteQuerySync } from "@/composables/useRouteQuerySync"
import { createPageQuery } from "@/core/http/query"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { focusInvalidField } from "@/lib/form-focus"
import { writeQueryValue } from "@/lib/query-codec"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { ADMIN_DEFAULT_PAGE_SIZE, readAdminPage, readAdminPageSize } from "@/modules/admin/lib/pagination"
import {
  createRiskEvent,
  getRiskEvents,
  resolveRiskEvent,
} from "@/modules/admin-risk/api/event"
import { getRiskRules, updateRiskRules } from "@/modules/admin-risk/api/rule"
import { formatRiskRules, parseRiskRules } from "@/modules/admin-risk/lib/rules"
import type { RiskEvent, RiskRule } from "@/types/admin"

export const RISK_EVENT_SOURCE_OPTIONS = ["dashboard", "manual", "automated", "other"] as const
export const RISK_EVENT_FIELD_IDS = {
  action: "risk-event-action",
  reason: "risk-event-reason",
} as const

export type RiskEventCreateErrors = Partial<Record<"action" | "reason", string>>

const QUERY_KEYS = ["page", "size"] as const

export function useRiskManagement() {
  const userStore = useUserStore()
  const { t } = useI18n()
  const route = useRoute()

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
  } = usePagedList<RiskEvent>({
    initialPage: readAdminPage(route.query.page),
    initialPageSize: readAdminPageSize(route.query.size),
    fetchPage: ({ page, pageSize }) => getRiskEvents(createPageQuery(page, pageSize)),
    onBeforeLoad: () => {
      eventsError.value = null
    },
    onError: (error) => {
      eventsError.value = describeError(error, t("adminRisk.toast.loadFailedFallback"))
    },
  })

  const createOpen = ref(false)
  const newSeverity = ref("medium")
  const newSource = ref<string>("dashboard")
  const newAction = ref("")
  const newReason = ref("")
  const newTargetUserId = ref("")
  const createErrors = ref<RiskEventCreateErrors>({})
  const creating = ref(false)

  const rulesLoading = ref(true)
  const rulesLoadError = ref<ErrorDescription | null>(null)
  const rules = ref<RiskRule[]>([])
  const rulesJson = ref("")
  const rulesSaving = ref(false)

  // Validated while typing: the editor shows the first problem inline and the
  // save button stays disabled until the text is a valid rule array again.
  const rulesParse = computed(() => parseRiskRules(rulesJson.value))
  const rulesError = computed(() => {
    const result = rulesParse.value
    if (result.ok) return null
    const { error } = result
    return error.kind === "invalidRule"
      ? t("adminRisk.rules.validation.invalidRule", { index: error.index })
      : t(`adminRisk.rules.validation.${error.kind}`)
  })
  const rulesPreview = computed(() => (rulesParse.value.ok ? rulesParse.value.rules : []))
  const rulesDirty = computed(() => rulesJson.value !== formatRiskRules(rules.value))

  async function refreshEventsStrict() {
    await loadEvents({ throwOnError: true, notifyOnError: false })
  }

  function reloadEvents() {
    void loadEvents()
  }

  async function loadRules() {
    rulesLoading.value = true
    rulesLoadError.value = null
    try {
      rules.value = await getRiskRules()
      rulesJson.value = formatRiskRules(rules.value)
    } catch (error: unknown) {
      rulesLoadError.value = describeError(error, t("adminRisk.toast.loadFailedFallback"))
    } finally {
      rulesLoading.value = false
    }
  }

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

  /**
   * Runs from the events panel's ConfirmDialog: rethrows so the dialog shows
   * the failure inline and stays open instead of toasting.
   */
  async function handleResolve(eventId: string) {
    await runAsyncAction(actionLoading, () => resolveRiskEvent(eventId), {
      successMessage: t("adminRisk.toast.resolveSuccess"),
      successAfterOnSuccess: true,
      errorTitle: t("adminRisk.toast.actionFailedTitle"),
      fallbackError: t("adminRisk.toast.actionFailedFallback"),
      throwOnError: true,
      onSuccess: refreshEventsStrict,
    })
  }

  async function saveRules() {
    const result = rulesParse.value
    if (!result.ok || rulesSaving.value) return
    rulesSaving.value = true
    try {
      await updateRiskRules(result.rules)
      toast.success(t("adminRisk.toast.rulesUpdated"))
      rules.value = result.rules
      rulesJson.value = formatRiskRules(result.rules)
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminRisk.toast.saveFailedTitle"),
        error,
        t("adminRisk.toast.saveFailedFallback")
      )
    } finally {
      rulesSaving.value = false
    }
  }

  function eventTotalPages() {
    return totalPages.value
  }

  function formatDate(value: string) {
    return formatLocalizedDateTime(value, undefined, t("adminRisk.common.fallback"))
  }

  watch(eventPageSize, () => {
    resetPage()
    void loadEvents()
  })

  useRouteQuerySync(QUERY_KEYS, () => ({
    page: writeQueryValue(eventPage.value, 1),
    size: writeQueryValue(eventPageSize.value, ADMIN_DEFAULT_PAGE_SIZE),
  }))

  onMounted(() => {
    void loadEvents()
    if (userStore.isSuperAdmin) {
      void loadRules()
    } else {
      rulesLoading.value = false
    }
  })

  return {
    userStore,
    eventsLoading,
    eventsError,
    events,
    totalEvents,
    eventPage,
    eventPageSize,
    actionLoading,
    createOpen,
    newSeverity,
    newSource,
    newAction,
    newReason,
    newTargetUserId,
    createErrors,
    creating,
    rulesLoading,
    rulesLoadError,
    rules,
    rulesJson,
    rulesError,
    rulesPreview,
    rulesDirty,
    rulesSaving,
    setCreateOpen,
    handleCreate,
    handleResolve,
    loadRules,
    saveRules,
    reloadEvents,
    eventTotalPages,
    prevPage,
    nextPage,
    goToPage,
    formatDate,
  }
}
