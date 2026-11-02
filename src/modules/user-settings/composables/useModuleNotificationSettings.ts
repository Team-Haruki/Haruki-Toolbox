import { computed, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { updateIOSModuleNotifications } from "@/modules/user-settings/api/account"
import { extractErrorMessage } from "@/lib/error-utils"

export function useModuleNotificationSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const isSaving = ref(false)
  const enabled = computed(() => userStore.iosModuleNotificationsEnabled)

  async function setEnabled(next: boolean) {
    if (isSaving.value || next === enabled.value) return
    if (!userStore.userId) {
      toast.error(t("userSettings.common.actionFailedTitle"), {
        description: t("userSettings.common.missingUserDescription"),
      })
      return
    }

    isSaving.value = true
    try {
      const result = await updateIOSModuleNotifications(userStore.userId, next, { skipErrorToast: true })
      userStore.setUser({
        iosModuleNotificationsEnabled: result.updatedData?.iosModuleNotificationsEnabled ?? next,
      })
      toast.success(t(next
        ? "userSettings.moduleNotifications.toast.enabled"
        : "userSettings.moduleNotifications.toast.disabled"))
    } catch (error: unknown) {
      toast.error(t("userSettings.moduleNotifications.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.moduleNotifications.toast.saveFailedDescription")),
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    enabled,
    isSaving,
    setEnabled,
  }
}
