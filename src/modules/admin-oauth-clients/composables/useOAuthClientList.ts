import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import type { OAuthClient } from "@/types/admin"
import { extractErrorMessage } from "@/lib/error-utils"
import { getOAuthClients } from "@/modules/admin-oauth-clients/api/client"

type LoadClientsOptions = {
  throwOnError?: boolean
  notifyOnError?: boolean
}

export function useOAuthClientList() {
  const { t } = useI18n()
  const loading = ref(true)
  const clients = ref<OAuthClient[]>([])
  let latestLoadRequestId = 0

  async function loadClients(options: LoadClientsOptions = {}) {
    const requestId = ++latestLoadRequestId
    const notifyOnError = options.notifyOnError ?? true
    loading.value = true
    try {
      const data = await getOAuthClients()
      if (requestId !== latestLoadRequestId) return
      clients.value = data
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      if (notifyOnError) {
        toast.error(t("adminOAuthClients.toast.loadClientsFailedTitle"), {
          description: extractErrorMessage(error, t("adminOAuthClients.toast.actionFailedFallback")),
        })
      }
      if (options.throwOnError) {
        throw error
      }
    } finally {
      if (requestId !== latestLoadRequestId) return
      loading.value = false
    }
  }

  return {
    loading,
    clients,
    loadClients,
  }
}
