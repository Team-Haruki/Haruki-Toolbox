import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import type { OAuthClientStatistics } from "@/types/admin"
import { extractErrorMessage } from "@/lib/error-utils"
import { getOAuthClientStatistics } from "@/modules/admin-oauth-clients/api/client"
import type { QueryParams } from "@/core/http/query"

type StatsBucket = "hour" | "day"

export function useOAuthClientStats() {
  const { t } = useI18n()
  const statsOpen = ref(false)
  const statsLoading = ref(false)
  const statsClientId = ref("")
  const stats = ref<OAuthClientStatistics | null>(null)
  const statsFrom = ref<Date>()
  const statsTo = ref<Date>()
  const statsBucket = ref<StatsBucket>("hour")
  let latestStatsRequestId = 0

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
    stats.value = null

    try {
      const response = await getOAuthClientStatistics(clientId, buildParams())
      if (requestId !== latestStatsRequestId) return
      stats.value = response
    } catch (error: unknown) {
      if (requestId !== latestStatsRequestId) return
      toast.error(t("adminOAuthClients.toast.loadStatsFailedTitle"), {
        description: extractErrorMessage(error, t("adminOAuthClients.toast.actionFailedFallback")),
      })
    } finally {
      if (requestId !== latestStatsRequestId) return
      statsLoading.value = false
    }
  }

  async function showStats(clientId: string) {
    statsOpen.value = true
    await loadStats(clientId)
  }

  async function applyStatsFilters() {
    if (!statsClientId.value) return
    if (hasInvalidTimeRange()) {
      toast.error(t("adminOAuthClients.statsDialog.invalidTimeRange"))
      return
    }

    await loadStats(statsClientId.value)
  }

  async function resetStatsFilters() {
    statsFrom.value = undefined
    statsTo.value = undefined
    statsBucket.value = "hour"
    if (!statsClientId.value) return
    await loadStats(statsClientId.value)
  }

  return {
    statsOpen,
    statsLoading,
    statsClientId,
    stats,
    statsFrom,
    statsTo,
    statsBucket,
    showStats,
    applyStatsFilters,
    resetStatsFilters,
  }
}
