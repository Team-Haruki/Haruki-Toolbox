import { ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { readFileAsDataUrl } from "@/lib/file-reader"
import { useUserStore } from "@/shared/stores/user"
import { updateUserProfile } from "@/modules/user-settings/api/account"
import { extractErrorMessage } from "@/lib/error-utils"

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024

export function useAccountSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()
  const nameDraft = ref("")
  const selectedFile = ref<File | null>(null)
  const previewAvatar = ref<string | null>(null)
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const isSaving = ref(false)

  watch(
    () => userStore.name,
    (name) => {
      nameDraft.value = name
    },
    { immediate: true }
  )

  function triggerFileInput() {
    fileInputRef.value?.click()
  }

  async function onAvatarChange(event: Event) {
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

    selectedFile.value = file
    try {
      previewAvatar.value = await readFileAsDataUrl(file)
    } catch {
      selectedFile.value = null
      previewAvatar.value = null
      toast.error(t("userSettings.account.toast.previewFailedTitle"), {
        description: t("userSettings.account.toast.previewFailedDescription"),
      })
    } finally {
      target.value = ""
    }
  }

  async function saveChanges() {
    if (isSaving.value) return
    if (!userStore.userId) {
      toast.error(t("userSettings.common.actionFailedTitle"), {
        description: t("userSettings.common.missingUserDescription"),
      })
      return
    }

    isSaving.value = true
    try {
      const nextName = nameDraft.value.trim()
      if (!nextName) {
        toast.error(t("userSettings.account.toast.nameRequiredTitle"), {
          description: t("userSettings.account.toast.nameRequiredDescription"),
        })
        return
      }

      let avatarPath = userStore.avatarPath
      const result = await updateUserProfile(
        userStore.userId,
        nextName,
        selectedFile.value,
        { skipErrorToast: true }
      )
      const updatedData = unwrapUpdatedData(result, t("userSettings.account.title"))

      if (Object.prototype.hasOwnProperty.call(updatedData, "avatarPath")) {
        avatarPath = updatedData.avatarPath ?? ""
        previewAvatar.value = null
      }

      userStore.setUser({
        name: updatedData.name,
        avatarPath,
      })
      selectedFile.value = null
      if (fileInputRef.value) {
        fileInputRef.value.value = ""
      }

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
    nameDraft,
    previewAvatar,
    fileInputRef,
    isSaving,
    triggerFileInput,
    onAvatarChange,
    saveChanges,
  }
}
