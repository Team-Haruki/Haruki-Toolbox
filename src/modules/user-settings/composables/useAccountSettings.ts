import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { useUserStore } from "@/shared/stores/user"
import { updateUserProfile } from "@/modules/user-settings/api/account"
import { extractErrorMessage } from "@/lib/error-utils"
import { prepareAvatarImageDataUrl } from "@/lib/avatar-image"

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

export function useAccountSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const previewAvatar = ref<string | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isSaving = ref(false)

  function triggerFileInput() {
    fileInputRef.value?.click()
  }

  async function onAvatarChange(event: Event) {
    if (isSaving.value) return

    const target = event.target
    if (!(target instanceof HTMLInputElement)) return

    const file = target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      target.value = ""
      toast.error(t("userSettings.account.toast.invalidAvatarTypeTitle"), {
        description: t("userSettings.account.toast.invalidAvatarTypeDescription"),
      })
      return
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      target.value = ""
      toast.error(t("userSettings.account.toast.avatarTooLargeTitle"), {
        description: t("userSettings.account.toast.avatarTooLargeDescription", { sizeMb: 5 }),
      })
      return
    }

    try {
      previewAvatar.value = await prepareAvatarImageDataUrl(file)
    } catch {
      previewAvatar.value = null
      toast.error(t("userSettings.account.toast.previewFailedTitle"), {
        description: t("userSettings.account.toast.previewFailedDescription"),
      })
      target.value = ""
      return
    }

    try {
      await uploadAvatar(previewAvatar.value)
    } finally {
      target.value = ""
    }
  }

  async function uploadAvatar(avatarBase64: string | null) {
    if (isSaving.value) return
    if (!userStore.userId) {
      toast.error(t("userSettings.common.actionFailedTitle"), {
        description: t("userSettings.common.missingUserDescription"),
      })
      return
    }
    if (!avatarBase64) {
      toast.error(t("userSettings.account.toast.previewFailedTitle"), {
        description: t("userSettings.account.toast.previewFailedDescription"),
      })
      return
    }

    isSaving.value = true
    try {
      const result = await updateUserProfile(
        userStore.userId,
        avatarBase64,
        { skipErrorToast: true }
      )
      const updatedData = unwrapUpdatedData(result, t("userSettings.account.title"))

      let avatarPath = userStore.avatarPath
      if (Object.prototype.hasOwnProperty.call(updatedData, "avatarPath")) {
        avatarPath = updatedData.avatarPath ?? ""
      }

      userStore.setUser({
        avatarPath,
      })
      previewAvatar.value = null
      if (fileInputRef.value) {
        fileInputRef.value.value = ""
      }

      toast.success(t("userSettings.account.toast.savedTitle"), {
        description: t("userSettings.account.toast.savedDescription"),
      })
    } catch (error: unknown) {
      previewAvatar.value = null
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
  }
}
