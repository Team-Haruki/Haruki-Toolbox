import { ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import type { OAuthClientStatistics } from "@/types/admin"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getOAuthClientStatistics } from "@/modules/admin-oauth-clients/api/client"
import type { QueryParams } from "@/core/http/query"

type StatsBucket = "hour" | "day"

/**
 * The client statistics dialog: summary counters and a per-bucket trend for
 * an optional time range. A failed load renders inline in the dialog (with a
 * retry) instead of toasting; an inverted time range is reported under the
 * pickers and clears as soon as either picker changes.
 */
export function useOAuthClientStats() {
  const { t } = useI18n()
  const statsOpen = ref(false)
  const statsLoading = ref(false)
  const statsClientId = ref("")
  const stats = ref<OAuthClientStatistics | null>(null)
  const statsError = ref<ErrorDescription | null>(null)
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

  function buildParams(): QueryParams | undefined {
    const params: QueryParams = {}
    if (statsFrom.value) params.from = statsFrom.value.toISOString()
    if (statsTo.value) params.to = statsTo.value.toISOString()
    params.bucket = statsBucket.value
    return Object.keys(params).length > 0 ? params : undefined
  }

  async function loadStats(clientId: string) {
    const requestId = ++latestStatsRequestId
    statsClientId.value = clientId
    statsLoading.value = true
    statsError.value = null
    stats.value = null

    try {
      const response = await getOAuthClientStatistics(clientId, buildParams())
      if (requestId !== latestStatsRequestId) return
      stats.value = response
    } catch (error: unknown) {
      if (requestId !== latestStatsRequestId) return
      statsError.value = describeError(error, t("adminOAuthClients.toast.loadStatsFailedTitle"))
    } finally {
      if (requestId === latestStatsRequestId) {
        statsLoading.value = false
      }
    }
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
    statsFrom,
    statsTo,
    statsBucket,
    statsTimeRangeError,
    showStats,
    applyStatsFilters,
    resetStatsFilters,
  }
}
