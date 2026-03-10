import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"

export function useOAuthClientSecretDialog() {
  const { t } = useI18n()
  const secretDisplayOpen = ref(false)
  const displayedSecret = ref("")

  function showSecret(secret: string) {
    const normalized = secret.trim()
    if (!normalized) return

    displayedSecret.value = normalized
    secretDisplayOpen.value = true
  }

  async function copySecret() {
    if (!displayedSecret.value.trim()) {
      toast.error(t("adminOAuthClients.toast.copyFailedTitle"), {
        description: t("adminOAuthClients.toast.copyFailedSecretEmpty"),
      })
      return
    }

    if (!isClipboardSupported()) {
      toast.error(t("adminOAuthClients.toast.copyFailedTitle"), {
        description: t("adminOAuthClients.toast.copyFailedClipboardUnsupported"),
      })
      return
    }

    if (await copyTextToClipboard(displayedSecret.value)) {
      toast.success(t("adminOAuthClients.toast.copied"))
      return
    }

    toast.error(t("adminOAuthClients.toast.copyFailedTitle"))
  }

  return {
    secretDisplayOpen,
    displayedSecret,
    showSecret,
    copySecret,
  }
}
