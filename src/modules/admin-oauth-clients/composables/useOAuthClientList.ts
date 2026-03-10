import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import type { OAuthClient } from "@/types/admin"
import { extractErrorMessage } from "@/lib/error-utils"
import { getOAuthClients } from "@/modules/admin-oauth-clients/api/client"

export function useOAuthClientList() {
  const { t } = useI18n()
  const loading = ref(true)
  const clients = ref<OAuthClient[]>([])

  async function loadClients() {
    loading.value = true
    try {
      clients.value = await getOAuthClients()
    } catch (error: unknown) {
      toast.error(t("adminOAuthClients.toast.loadClientsFailedTitle"), {
        description: extractErrorMessage(error, t("adminOAuthClients.toast.actionFailedFallback")),
      })
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    clients,
    loadClients,
  }
}
