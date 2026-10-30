import { ref, watch } from "vue"
import { isAxiosError } from "axios"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import type { UploadDataType } from "@/types"
import { extractErrorMessage } from "@/lib/error-utils"
import { uploadManualData } from "@/modules/user-settings/api/file-upload"
import { markDeckRecommendUserDataAvailable } from "@/modules/deck-recommend/lib/user-data-availability"
import { useUploadDataAccounts } from "@/modules/tools/composables/useUploadDataAccounts"

export function useUploadDataTool() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const fileDataType = ref<UploadDataType>("mysekai")
  const selectedFile = ref<File | null>(null)
  const selectedFileName = ref("")
  const isSubmittingFile = ref(false)
  const uploadProgress = ref(0)
  const uploadStatus = ref("")
  const fileInputElement = ref<HTMLInputElement | null>(null)

  const {
    selectedAccountKey,
    uploadAccounts,
    selectedAccount,
    targetsLoading,
    targetsFailed,
    disabledReason,
    disabledReasonKind,
    hasVerifiedQQ,
    isCNMySekaiForbidden,
    canSelectSuiteDataType,
    canSelectMySekaiDataType,
    loadUploadTargets,
  } = useUploadDataAccounts(userStore, fileDataType)

  // Without a verified QQ binding every mysekai option is hidden — force a
  // defaulted mysekai selection back to suite.
  watch(
    [hasVerifiedQQ, fileDataType],
    () => {
      if (hasVerifiedQQ.value) {
        return
      }
      if (fileDataType.value === "mysekai") {
        fileDataType.value = "suite"
      }
    },
    { immediate: true },
  )

  function onFileChange(event: Event) {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      fileInputElement.value = null
      selectedFile.value = null
      selectedFileName.value = ""
      return
    }
    fileInputElement.value = target
    uploadProgress.value = 0
    uploadStatus.value = ""
    selectedFile.value = target.files?.[0] ?? null
    selectedFileName.value = selectedFile.value?.name ?? ""
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
    if (!account || !account.canUpload) {
      toast.warning(t("tools.uploadData.toast.selectAccount"))
      return
    }
    if (!account.writable.has(fileDataType.value)) {
      toast.warning(t("tools.uploadData.toast.dataTypeNotWritable"))
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
      await uploadManualData(
        account.server,
        account.uid,
        fileDataType.value,
        file,
        (progress) => {
          uploadProgress.value = progress
        },
        { skipErrorToast: true }
      )

      uploadStatus.value = t("tools.uploadData.uploadStatus.success")
      uploadProgress.value = 100
      // The deck page may have this account flagged "no data uploaded".
      markDeckRecommendUserDataAvailable(account.server, account.uid, fileDataType.value)
      selectedFile.value = null
      selectedFileName.value = ""
      if (fileInputElement.value) {
        fileInputElement.value.value = ""
      }
      toast.success(t("tools.uploadData.toast.uploadSuccessTitle"), {
        description: t("tools.uploadData.toast.uploadSuccessFileFallback"),
      })
    } catch (error: unknown) {
      // A stuck bar at 100% after a 403 reads as "uploaded"; reset it.
      uploadProgress.value = 0
      uploadStatus.value = t("tools.uploadData.uploadStatus.failed")
      // A 403 means the target is no longer writable for this user (grant
      // lapsed or revoked, binding changed): the list is stale, not the
      // session. Re-read the targets once and say why; never force a login.
      if (isAxiosError(error) && error.response?.status === 403) {
        void loadUploadTargets()
        toast.error(t("tools.uploadData.toast.uploadForbiddenTitle"), {
          description: extractErrorMessage(error, t("tools.uploadData.toast.uploadForbiddenDescription")),
        })
        return
      }
      toast.error(t("tools.uploadData.toast.uploadFailedTitle"), {
        description: extractErrorMessage(error, t("tools.uploadData.toast.uploadFailedFallback")),
      })
    } finally {
      isSubmittingFile.value = false
    }
  }

  return {
    fileDataType,
    isSubmittingFile,
    uploadProgress,
    uploadStatus,
    selectedFileName,
    uploadAccounts,
    selectedAccount,
    selectedAccountKey,
    targetsLoading,
    targetsFailed,
    disabledReason,
    disabledReasonKind,
    hasVerifiedQQ,
    isCNMySekaiForbidden,
    canSelectSuiteDataType,
    canSelectMySekaiDataType,
    loadUploadTargets,
    onFileChange,
    submitFileUpload,
  }
}
