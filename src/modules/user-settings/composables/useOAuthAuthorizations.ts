import { computed, onMounted, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { extractErrorMessage, readApiErrorCode } from "@/lib/error-utils"
import { useUserStore } from "@/shared/stores/user"
import {
  AUTHORIZATION_NOT_FOUND,
  REVOKE_FAILED,
  listOAuthAuthorizations,
  revokeOAuthAuthorization,
  revokeOAuthAuthorizationConsent,
  type OAuthAuthorization,
} from "@/modules/user-settings/api/oauth2"
import {
  deviceAuthorizationLabel,
  groupOAuthAuthorizations,
  type OAuthAuthorizationGroup,
} from "@/modules/user-settings/lib/oauth-authorizations"

/**
 * The authorized-apps list (backend design §6.6 / §6.8): grants grouped by
 * client, each device grant on its own row. Revoking an app removes all of
 * its grants, browser and device alike; revoking a device removes only that
 * consent session.
 */
export function useOAuthAuthorizations() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const authorizations = ref<OAuthAuthorization[]>([])
  const groups = computed(() => groupOAuthAuthorizations(authorizations.value))
  const isLoading = ref(false)
  let latestFetchRequestId = 0

  const appRevokeTarget = ref<OAuthAuthorizationGroup | null>(null)
  const showAppRevokeDialog = ref(false)
  const isRevokingApp = ref(false)

  const deviceRevokeTarget = ref<OAuthAuthorization | null>(null)
  const showDeviceRevokeDialog = ref(false)
  /** consentRequestId of the device being revoked. */
  const revokingDeviceId = ref("")

  const isRevoking = computed(() => isRevokingApp.value || revokingDeviceId.value !== "")

  /**
   * Loads the list. A silent refresh keeps the current rows on screen instead
   * of the skeleton, so the list is patched in place after a revoke.
   */
  async function fetchAuthorizations(options: { silent?: boolean } = {}) {
    const requestId = ++latestFetchRequestId
    if (!userStore.userId) {
      authorizations.value = []
      isLoading.value = false
      return
    }
    if (!options.silent) {
      isLoading.value = true
    }
    try {
      const resp = await listOAuthAuthorizations(userStore.userId, { skipErrorToast: true })
      if (requestId !== latestFetchRequestId) return
      authorizations.value = unwrapUpdatedData(resp, t("userSettings.oauthAuthorizations.title"))
    } catch (e: unknown) {
      if (requestId !== latestFetchRequestId) return
      toast.error(t("userSettings.oauthAuthorizations.toast.fetchFailedTitle"), {
        description: extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.fetchFailedFallback")),
      })
    } finally {
      if (requestId === latestFetchRequestId) {
        isLoading.value = false
      }
    }
  }

  function confirmAppRevoke(group: OAuthAuthorizationGroup) {
    appRevokeTarget.value = group
    showAppRevokeDialog.value = true
  }

  async function handleAppRevoke() {
    const target = appRevokeTarget.value
    if (!target || !userStore.userId || isRevoking.value) return
    isRevokingApp.value = true
    try {
      await revokeOAuthAuthorization(userStore.userId, target.clientId, { skipErrorToast: true })
      toast.success(t("userSettings.oauthAuthorizations.toast.revokeSuccessTitle"), {
        description: t("userSettings.oauthAuthorizations.toast.revokeSuccessDescription", {
          clientName: target.clientName,
        }),
      })
      showAppRevokeDialog.value = false
      appRevokeTarget.value = null
      await fetchAuthorizations()
    } catch (e: unknown) {
      toast.error(t("userSettings.oauthAuthorizations.toast.revokeFailedTitle"), {
        description: extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.revokeFailedFallback")),
      })
    } finally {
      isRevokingApp.value = false
    }
  }

  /** The name a device row and its dialog show. */
  function deviceName(authorization: OAuthAuthorization): string {
    return deviceAuthorizationLabel(authorization) || t("userSettings.oauthAuthorizations.devices.unnamed")
  }

  function confirmDeviceRevoke(authorization: OAuthAuthorization) {
    if (!authorization.consentRequestId?.trim()) return
    deviceRevokeTarget.value = authorization
    showDeviceRevokeDialog.value = true
  }

  function removeLocally(consentRequestId: string) {
    authorizations.value = authorizations.value.filter(
      (authorization) => authorization.consentRequestId?.trim() !== consentRequestId,
    )
  }

  async function handleDeviceRevoke() {
    const target = deviceRevokeTarget.value
    const consentRequestId = target?.consentRequestId?.trim() ?? ""
    if (!target || !consentRequestId || !userStore.userId || isRevoking.value) return
    revokingDeviceId.value = consentRequestId
    const name = deviceName(target)
    try {
      await revokeOAuthAuthorizationConsent(userStore.userId, target.clientId, consentRequestId, { skipErrorToast: true })
      toast.success(t("userSettings.oauthAuthorizations.toast.deviceRevokeSuccessTitle"), {
        description: t("userSettings.oauthAuthorizations.toast.deviceRevokeSuccessDescription", { label: name }),
      })
      closeDeviceDialog()
      removeLocally(consentRequestId)
      await fetchAuthorizations({ silent: true })
    } catch (e: unknown) {
      const code = readApiErrorCode(e)
      if (code === AUTHORIZATION_NOT_FOUND) {
        // Already gone (revoked elsewhere, or with the whole app): just refresh.
        toast.info(t("userSettings.oauthAuthorizations.toast.deviceNotFound"))
        closeDeviceDialog()
        removeLocally(consentRequestId)
        await fetchAuthorizations({ silent: true })
        return
      }
      toast.error(t("userSettings.oauthAuthorizations.toast.deviceRevokeFailedTitle"), {
        description: code === REVOKE_FAILED
          ? t("userSettings.oauthAuthorizations.toast.deviceRevokeRetry")
          : extractErrorMessage(e, t("userSettings.oauthAuthorizations.toast.deviceRevokeRetry")),
      })
    } finally {
      revokingDeviceId.value = ""
    }
  }

  function closeDeviceDialog() {
    showDeviceRevokeDialog.value = false
    deviceRevokeTarget.value = null
  }

  onMounted(() => {
    if (userStore.isLoggedIn) {
      void fetchAuthorizations()
    }
  })

  return {
    authorizations,
    groups,
    isLoading,
    isRevoking,
    isRevokingApp,
    revokingDeviceId,
    appRevokeTarget,
    showAppRevokeDialog,
    deviceRevokeTarget,
    showDeviceRevokeDialog,
    fetchAuthorizations,
    confirmAppRevoke,
    handleAppRevoke,
    confirmDeviceRevoke,
    handleDeviceRevoke,
    deviceName,
  }
}
