import { ref } from "vue"
import { useI18n } from "vue-i18n"
import type { OAuthClient } from "@/types/admin"
import { describeError, type ErrorDescription } from "@/lib/error-utils"
import { getOAuthClients } from "@/modules/admin-oauth-clients/api/client"

type LoadClientsOptions = {
  throwOnError?: boolean
}

export function useOAuthClientList() {
  const { t } = useI18n()
  const loading = ref(true)
  const clients = ref<OAuthClient[]>([])
  // A failed list load renders inline (LoadErrorState + retry) in place of
  // the list: an empty state would read as "no clients".
  const loadError = ref<ErrorDescription | null>(null)
  let latestLoadRequestId = 0

  async function loadClients(options: LoadClientsOptions = {}) {
    const requestId = ++latestLoadRequestId
    loading.value = true
    loadError.value = null
    try {
      const data = await getOAuthClients({ page_size: 200 })
      if (requestId !== latestLoadRequestId) return
      clients.value = data.items
    } catch (error: unknown) {
      if (requestId !== latestLoadRequestId) return
      if (options.throwOnError) {
        // A refresh after a row action: the action's dialog reports it.
        throw error
      }
      loadError.value = describeError(error, t("adminOAuthClients.toast.actionFailedFallback"))
    } finally {
      if (requestId !== latestLoadRequestId) return
      loading.value = false
    }
  }

  return {
    loading,
    loadError,
    clients,
    loadClients,
  }
}
