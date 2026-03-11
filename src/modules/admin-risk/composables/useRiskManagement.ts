import { onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { usePagedList } from "@/composables/usePagedList"
import { createPageQuery } from "@/core/http/query"
import { formatLocalizedDateTime } from "@/lib/date-time"
import {
  createRiskEvent,
  getRiskEvents,
  resolveRiskEvent,
} from "@/modules/admin-risk/api/event"
import { getRiskRules, updateRiskRules } from "@/modules/admin-risk/api/rule"
import { isJsonRecord } from "@/lib/json-utils"
import type { RiskEvent, RiskRule } from "@/types/admin"
import { toastErrorWithExtractedMessage } from "@/lib/toast-utils"
import { asRecord } from "@/lib/record-utils"

export function useRiskManagement() {
  const userStore = useUserStore()
  const { t } = useI18n()

  const actionLoading = ref(false)
  const {
    loading: eventsLoading,
    items: events,
    total: totalEvents,
    page: eventPage,
    pageSize: eventPageSize,
    totalPages,
    load: loadEvents,
    prevPage,
    nextPage,
  } = usePagedList<RiskEvent>({
    initialPage: 1,
    initialPageSize: 20,
    fetchPage: ({ page, pageSize }) => getRiskEvents(createPageQuery(page, pageSize)),
    onError: (error) => {
      toastErrorWithExtractedMessage(
        t("adminRisk.toast.loadEventsFailedTitle"),
        error,
        t("adminRisk.toast.loadFailedFallback")
      )
    },
  })

  const createOpen = ref(false)
  const newSeverity = ref("medium")
  const newSource = ref("dashboard")
  const newAction = ref("")
  const newReason = ref("")
  const newTargetUserId = ref("")
  const creating = ref(false)

  const rulesLoading = ref(true)
  const rules = ref<RiskRule[]>([])
  const rulesJson = ref("")
  const rulesSaving = ref(false)

  function parseRiskRules(raw: string): RiskRule[] | null {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }

    const rules: RiskRule[] = []
    for (const item of parsed) {
      const record = asRecord(item)
      if (!record) {
        return null
      }

      const { id, name, description, enabled, config } = record
      if (
        typeof id !== "string" ||
        typeof name !== "string" ||
        typeof description !== "string" ||
        typeof enabled !== "boolean"
      ) {
        return null
      }

      if (config !== undefined && config !== null && !isJsonRecord(config)) {
        return null
      }

      rules.push({
        id,
        name,
        description,
        enabled,
        config: config ? config : undefined,
      })
    }

    return rules
  }

  async function refreshEventsStrict() {
    await loadEvents({ throwOnError: true, notifyOnError: false })
  }

  async function loadRules() {
    rulesLoading.value = true
    try {
      rules.value = await getRiskRules()
      rulesJson.value = JSON.stringify(rules.value, null, 2)
    } catch (error: unknown) {
      toastErrorWithExtractedMessage(
        t("adminRisk.toast.loadRulesFailedTitle"),
        error,
        t("adminRisk.toast.loadFailedFallback")
      )
    } finally {
      rulesLoading.value = false
    }
  }

  async function handleCreate() {
    const action = newAction.value.trim()
    const reason = newReason.value.trim()
    if (!action || !reason) {
      toast.error(t("adminRisk.toast.actionReasonRequired"))
      return
    }

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
        newAction.value = ""
        newReason.value = ""
        newTargetUserId.value = ""
        await refreshEventsStrict()
      },
    })
  }

  async function handleResolve(eventId: string) {
    await runAsyncAction(actionLoading, () => resolveRiskEvent(eventId), {
      successMessage: t("adminRisk.toast.resolveSuccess"),
      successAfterOnSuccess: true,
      errorTitle: t("adminRisk.toast.actionFailedTitle"),
      fallbackError: t("adminRisk.toast.actionFailedFallback"),
      onSuccess: refreshEventsStrict,
    })
  }

  async function saveRules() {
    rulesSaving.value = true
    try {
      const parsed = parseRiskRules(rulesJson.value)
      if (!parsed) {
        toast.error(t("adminRisk.toast.invalidJson"))
        return
      }

      await updateRiskRules(parsed)
      toast.success(t("adminRisk.toast.rulesUpdated"))
      rules.value = parsed
      rulesJson.value = JSON.stringify(parsed, null, 2)
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        toast.error(t("adminRisk.toast.invalidJson"))
      } else {
        toastErrorWithExtractedMessage(
          t("adminRisk.toast.saveFailedTitle"),
          error,
          t("adminRisk.toast.saveFailedFallback")
        )
      }
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

  onMounted(() => {
    void loadEvents()
    void loadRules()
  })

  return {
    userStore,
    eventsLoading,
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
    creating,
    rulesLoading,
    rules,
    rulesJson,
    rulesSaving,
    handleCreate,
    handleResolve,
    saveRules,
    eventTotalPages,
    prevPage,
    nextPage,
    formatDate,
  }
}
