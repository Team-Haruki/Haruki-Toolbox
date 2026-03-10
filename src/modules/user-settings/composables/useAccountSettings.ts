import { ref, watch } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { unwrapUpdatedData } from "@/core/http/call-api"
import { readFileAsDataUrl } from "@/lib/file-reader"
import { useUserStore } from "@/shared/stores/user"
import { updateUserProfile } from "@/modules/user-settings/api/account"
import { extractErrorMessage } from "@/lib/error-utils"

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
        name: typeof updatedData.name === "string" ? updatedData.name : nextName,
        avatarPath,
      })
      selectedFile.value = null

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
