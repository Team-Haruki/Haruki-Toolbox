import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { OAuthClientStatistics } from "@/types/admin"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getOAuthClientAuditSummary, getOAuthClientStatistics } from "@/modules/admin-oauth-clients/api/client"
import type { OAuthClientAuditSummary } from "@/modules/admin-oauth-clients/lib/client-stats"
import type { QueryParams } from "@/core/http/query"

type StatsBucket = "hour" | "day"

/**
 * The client statistics dialog: summary counters and a per-bucket trend for
 * an optional time range. A failed load renders inline in the dialog (with a
 * retry) instead of toasting; an inverted time range is reported under the
 * pickers and clears as soon as either picker changes.
 *
 * The audit summary (what admins did to the client in the same range) loads
 * alongside. It is secondary: when only it fails, the statistics still show
 * and the audit section reports its own error.
 */
export function useOAuthClientStats() {
  const { t } = useI18n()
  const statsOpen = ref(false)
  const statsLoading = ref(false)
  const statsClientId = ref("")
  const stats = ref<OAuthClientStatistics | null>(null)
  const statsError = ref<ErrorDescription | null>(null)
  const statsAudit = ref<OAuthClientAuditSummary | null>(null)
  const statsAuditError = ref<ErrorDescription | null>(null)
  const statsFrom = ref<Date>()
  const statsTo = ref<Date>()
  const statsBucket = ref<StatsBucket>("hour")
  const statsTimeRangeError = ref<string | null>(null)
  let latestStatsRequestId = 0

  watch([statsFrom, statsTo], () => {
    statsTimeRangeError.value = null
  })

  function resetFilters() {
    statsFrom.value = undefined
    statsTo.value = undefined
    statsBucket.value = "hour"
    statsTimeRangeError.value = null
  }

  function hasInvalidTimeRange() {
    return !!statsFrom.value && !!statsTo.value && statsFrom.value.getTime() > statsTo.value.getTime()
  }

  function buildRangeParams(): QueryParams {
    const params: QueryParams = {}
    if (statsFrom.value) params.from = statsFrom.value.toISOString()
    if (statsTo.value) params.to = statsTo.value.toISOString()
    return params
  }

  async function loadStats(clientId: string) {
    const requestId = ++latestStatsRequestId
    // Another client's numbers must never show under this one's name; the
    // same client's stay up (dimmed) while a new range loads.
    if (statsClientId.value !== clientId) {
      stats.value = null
      statsAudit.value = null
    }
    statsClientId.value = clientId
    statsLoading.value = true
    statsError.value = null
    statsAuditError.value = null

    const range = buildRangeParams()
    const [statistics, audit] = await Promise.allSettled([
      getOAuthClientStatistics(clientId, { ...range, bucket: statsBucket.value }),
      getOAuthClientAuditSummary(clientId, range),
    ])
    if (requestId !== latestStatsRequestId) return

    if (statistics.status === "fulfilled") {
      stats.value = statistics.value
    } else {
      stats.value = null
      statsError.value = describeError(statistics.reason, t("adminOAuthClients.toast.loadStatsFailedTitle"))
    }
    if (audit.status === "fulfilled") {
      statsAudit.value = audit.value
    } else {
      statsAudit.value = null
      statsAuditError.value = describeError(audit.reason, t("adminOAuthClients.statsDialog.audit.loadFailed"))
    }
    statsLoading.value = false
  }

  async function showStats(clientId: string) {
    if (statsClientId.value !== clientId || hasInvalidTimeRange()) {
      resetFilters()
    }
    statsOpen.value = true
    await loadStats(clientId)
  }

  /** Also the dialog's retry: it reloads with the current filters. */
  async function applyStatsFilters() {
    if (!statsClientId.value) return
    if (hasInvalidTimeRange()) {
      statsTimeRangeError.value = t("adminOAuthClients.statsDialog.invalidTimeRange")
      return
    }

    await loadStats(statsClientId.value)
  }

  async function resetStatsFilters() {
    resetFilters()
    if (!statsClientId.value) return
    await loadStats(statsClientId.value)
  }

  return {
    statsOpen,
    statsLoading,
    statsClientId,
    stats,
    statsError,
    statsAudit,
    statsAuditError,
    statsFrom,
    statsTo,
    statsBucket,
    statsTimeRangeError,
    showStats,
    applyStatsFilters,
    resetStatsFilters,
  }
}
