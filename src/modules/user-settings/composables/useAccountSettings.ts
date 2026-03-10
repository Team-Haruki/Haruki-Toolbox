import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { readFileAsDataUrl } from "@/lib/file-reader"
import { useUserStore } from "@/shared/stores/user"
import { updateUserProfile } from "@/modules/user-settings/api/account"
import { extractErrorMessage } from "@/lib/error-utils"

export function useAccountSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const selectedFile = ref<File | null>(null)
  const previewAvatar = ref<string | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isSaving = ref(false)

  function triggerFileInput() {
    fileInputRef.value?.click()
  }

  async function onAvatarChange(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) return

    const file = target.files?.[0]
    if (!file) return

    selectedFile.value = file
    try {
      previewAvatar.value = await readFileAsDataUrl(file)
    } catch {
      previewAvatar.value = null
      toast.error(t("userSettings.account.toast.previewFailedTitle"), {
        description: t("userSettings.account.toast.previewFailedDescription"),
      })
    }
  }

  async function saveChanges() {
    if (!userStore.userId) {
      toast.error(t("userSettings.common.actionFailedTitle"), {
        description: t("userSettings.common.missingUserDescription"),
      })
      return
    }

    isSaving.value = true
    try {
      let avatarPath = userStore.avatarPath
      const result = await updateUserProfile(
        userStore.userId,
        userStore.name,
        selectedFile.value,
        { skipErrorToast: true }
      )

      if (result?.updatedData?.avatarPath) {
        avatarPath = result.updatedData.avatarPath
        previewAvatar.value = null
      }

      userStore.setUser({
        name: userStore.name,
        avatarPath,
      })

      toast.success(t("userSettings.account.toast.savedTitle"), {
        description: t("userSettings.account.toast.savedDescription"),
      })
    } catch (error: unknown) {
      toast.error(t("userSettings.account.toast.saveFailedTitle"), {
        description: extractErrorMessage(error, t("userSettings.account.toast.saveFailedDescription")),
      })
    } finally {
      isSaving.value = false
    }
  }

  return {
    userStore,
    previewAvatar,
    fileInputRef,
    isSaving,
    triggerFileInput,
    onAvatarChange,
    saveChanges,
  }
}
