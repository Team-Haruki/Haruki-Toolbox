import { ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import type { InheritServer, UploadDataType } from "@/types"
import { extractErrorMessage } from "@/lib/error-utils"
import { uploadManualData } from "@/modules/user-settings/api/file-upload"
import { submitInherit } from "@/modules/user-settings/api/inherit"
import { useUploadDataAccounts } from "@/modules/tools/composables/useUploadDataAccounts"
import {
  clearInheritStorage,
  loadInheritFromStorage,
  saveInheritToStorage,
} from "@/modules/tools/lib/inherit-storage"

export function useUploadDataTool() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const fileDataType = ref<UploadDataType>("mysekai")
  const inheritDataType = ref<UploadDataType>("mysekai")
  const selectedFile = ref<File | null>(null)
  const inheritServer = ref<InheritServer>("jp")
  const inheritId = ref("")
  const inheritPassword = ref("")
  const rememberInherit = ref(false)
  const isSubmittingFile = ref(false)
  const isSubmittingInherit = ref(false)
  const uploadProgress = ref(0)
  const uploadStatus = ref("")
  const fileInputElement = ref<HTMLInputElement | null>(null)

  const {
    selectedAccountKey,
    boundAccounts,
    selectedAccount,
    disabledReason,
    isCNMySekaiForbidden,
  } = useUploadDataAccounts(userStore, fileDataType)

  const savedInherit = loadInheritFromStorage()
  if (savedInherit) {
    inheritId.value = savedInherit.inherit_id || ""
    inheritPassword.value = savedInherit.inherit_password || ""
    inheritServer.value = savedInherit.server
    inheritDataType.value = savedInherit.type
    rememberInherit.value = true
  }

  function setRememberInherit(value: boolean) {
    rememberInherit.value = value
    if (!value) {
      clearInheritStorage()
    }
  }

  function onFileChange(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      fileInputElement.value = null
      selectedFile.value = null
      return
    }
    fileInputElement.value = target
    uploadProgress.value = 0
    uploadStatus.value = ""
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
    if (isSubmittingFile.value) return
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
      dataType: dataTypeLabel(fileDataType.value),
    })

    try {
      const response = await uploadManualData(
        account.server,
        String(account.uid),
        fileDataType.value,
        file,
        (progress) => {
          uploadProgress.value = progress
        },
        { skipErrorToast: true }
      )

      uploadStatus.value = t("tools.uploadData.uploadStatus.success")
      uploadProgress.value = 100
      selectedFile.value = null
      if (fileInputElement.value) {
        fileInputElement.value.value = ""
      }
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
    if (isSubmittingInherit.value) return
    const normalizedInheritId = inheritId.value.trim()
    const normalizedInheritPassword = inheritPassword.value.trim()

    if (!normalizedInheritId || !normalizedInheritPassword) {
      toast.warning(t("tools.uploadData.toast.inheritIncompleteTitle"), {
        description: t("tools.uploadData.toast.inheritIncompleteDescription"),
      })
      return
    }

    if (inheritServer.value === "cn" && inheritDataType.value === "mysekai" && userStore.allowCNMysekai !== true) {
      toast.error(t("tools.uploadData.toast.operationForbiddenTitle"), {
        description: t("tools.uploadData.toast.operationForbiddenDescription"),
      })
      return
    }

    isSubmittingInherit.value = true
    try {
      const response = await submitInherit(
        inheritServer.value,
        inheritDataType.value,
        normalizedInheritId,
        normalizedInheritPassword,
        { skipErrorToast: true }
      )

      toast.success(t("tools.uploadData.toast.uploadSuccessTitle"), {
        description: response?.message || t("tools.uploadData.toast.uploadSuccessInheritFallback"),
      })

      if (rememberInherit.value) {
        saveInheritToStorage({
          inherit_id: normalizedInheritId,
          inherit_password: normalizedInheritPassword,
          server: inheritServer.value,
          type: inheritDataType.value,
        })
      } else {
        clearInheritStorage()
      }
    } catch (error: unknown) {
      toast.error(t("tools.uploadData.toast.uploadFailedTitle"), {
        description: extractErrorMessage(error, t("tools.uploadData.toast.uploadFailedFallback")),
      })
    } finally {
      isSubmittingInherit.value = false
    }
  }

  return {
    fileDataType,
    inheritDataType,
    inheritServer,
    inheritId,
    inheritPassword,
    rememberInherit,
    isSubmittingFile,
    isSubmittingInherit,
    uploadProgress,
    uploadStatus,
    boundAccounts,
    selectedAccountKey,
    disabledReason,
    isCNMySekaiForbidden,
    onFileChange,
    setRememberInherit,
    submitFileUpload,
    submitInheritUpload,
  }
}
