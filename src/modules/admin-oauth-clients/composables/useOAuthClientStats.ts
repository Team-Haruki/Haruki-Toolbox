import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import type { OAuthClientStatistics } from "@/types/admin"
import { extractErrorMessage } from "@/lib/error-utils"
import { getOAuthClientStatistics } from "@/modules/admin-oauth-clients/api/client"

export function useOAuthClientStats() {
  const { t } = useI18n()
  const statsOpen = ref(false)
  const statsLoading = ref(false)
  const statsClientId = ref("")
  const stats = ref<OAuthClientStatistics | null>(null)
  let latestStatsRequestId = 0

  async function showStats(clientId: string) {
    const requestId = ++latestStatsRequestId
    statsClientId.value = clientId
    statsOpen.value = true
    statsLoading.value = true
    stats.value = null

    try {
      const response = await getOAuthClientStatistics(clientId)
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

  return {
    statsOpen,
    statsLoading,
    statsClientId,
    stats,
    showStats,
  }
}
