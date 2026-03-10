import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion, UploadDataType } from "@/types"
import { extractErrorMessage } from "@/lib/error-utils"
import { uploadManualData } from "@/modules/user-settings/api/file-upload"
import { submitInherit } from "@/modules/user-settings/api/inherit"
import { useUploadDataAccounts } from "@/modules/tools/composables/useUploadDataAccounts"
import { loadInheritFromStorage, saveInheritToStorage } from "@/modules/tools/lib/inherit-storage"

export function useUploadDataTool() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const dataType = ref<UploadDataType>("mysekai")
  const selectedFile = ref<File | null>(null)
  const inheritServer = ref<SekaiRegion>("jp")
  const inheritId = ref("")
  const inheritPassword = ref("")
  const isSubmittingFile = ref(false)
  const isSubmittingInherit = ref(false)
  const uploadProgress = ref(0)
  const uploadStatus = ref("")

  const {
    selectedAccountKey,
    boundAccounts,
    selectedAccount,
    disabledReason,
    isCNMySekaiForbidden,
  } = useUploadDataAccounts(userStore, dataType)

  const savedInherit = loadInheritFromStorage()
  if (savedInherit) {
    inheritId.value = savedInherit.inherit_id || ""
    inheritPassword.value = savedInherit.inherit_password || ""
    inheritServer.value = savedInherit.server
    dataType.value = savedInherit.type
  }

  function onFileChange(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      selectedFile.value = null
      return
    }
    selectedFile.value = target.files?.[0] ?? null
  }

  function dataTypeLabel(value: UploadDataType): string {
    switch (value) {
      case "suite":
        return t("tools.uploadData.dataTypes.suite")
      case "mysekai":
        return t("tools.uploadData.dataTypes.mysekai")
    }
  }

  async function submitFileUpload() {
    if (disabledReason.value) {
      toast.warning(disabledReason.value)
      return
    }

    const account = selectedAccount.value
    if (!account) {
      toast.warning(t("tools.uploadData.toast.selectAccount"))
      return
    }

    const file = selectedFile.value
    if (!file) {
      toast.warning(t("tools.uploadData.toast.selectFile"))
      return
    }

    if (isCNMySekaiForbidden.value) {
      toast.error(t("tools.uploadData.toast.operationForbiddenTitle"), {
        description: t("tools.uploadData.toast.operationForbiddenDescription"),
      })
      return
    }

    isSubmittingFile.value = true
    uploadProgress.value = 0
    uploadStatus.value = t("tools.uploadData.uploadStatus.uploading", {
      dataType: dataTypeLabel(dataType.value),
    })

    try {
      const response = await uploadManualData(
        account.server,
        String(account.uid),
        dataType.value,
        file,
        (progress) => {
          uploadProgress.value = progress
        },
        { skipErrorToast: true }
      )

      uploadStatus.value = t("tools.uploadData.uploadStatus.success")
      toast.success(t("tools.uploadData.toast.uploadSuccessTitle"), {
        description: response?.message || t("tools.uploadData.toast.uploadSuccessFileFallback"),
      })
    } catch (error: unknown) {
      uploadStatus.value = t("tools.uploadData.uploadStatus.failed")
      toast.error(t("tools.uploadData.toast.uploadFailedTitle"), {
        description: extractErrorMessage(error, t("tools.uploadData.toast.uploadFailedFallback")),
      })
    } finally {
      isSubmittingFile.value = false
    }
  }

  async function submitInheritUpload() {
    const normalizedInheritId = inheritId.value.trim()
    const normalizedInheritPassword = inheritPassword.value.trim()

    if (!normalizedInheritId || !normalizedInheritPassword) {
      toast.warning(t("tools.uploadData.toast.inheritIncompleteTitle"), {
        description: t("tools.uploadData.toast.inheritIncompleteDescription"),
      })
      return
    }

    isSubmittingInherit.value = true
    try {
      const response = await submitInherit(
        inheritServer.value,
        dataType.value,
        normalizedInheritId,
        normalizedInheritPassword,
        { skipErrorToast: true }
      )

      toast.success(t("tools.uploadData.toast.uploadSuccessTitle"), {
        description: response?.message || t("tools.uploadData.toast.uploadSuccessInheritFallback"),
      })

      saveInheritToStorage({
        inherit_id: normalizedInheritId,
        inherit_password: normalizedInheritPassword,
        server: inheritServer.value,
        type: dataType.value,
      })
    } catch (error: unknown) {
      toast.error(t("tools.uploadData.toast.uploadFailedTitle"), {
        description: extractErrorMessage(error, t("tools.uploadData.toast.uploadFailedFallback")),
      })
    } finally {
      isSubmittingInherit.value = false
    }
  }

  return {
    dataType,
    inheritServer,
    inheritId,
    inheritPassword,
    isSubmittingFile,
    isSubmittingInherit,
    uploadProgress,
    uploadStatus,
    boundAccounts,
    selectedAccountKey,
    disabledReason,
    isCNMySekaiForbidden,
    onFileChange,
    submitFileUpload,
    submitInheritUpload,
  }
}
