import { nextTick, reactive, ref, watch } from "vue"
import { isAxiosError } from "axios"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import type { InheritServer, UploadDataType } from "@/types"
import { extractErrorMessage } from "@/lib/error-utils"
import { uploadManualData } from "@/modules/user-settings/api/file-upload"
import {
  markDeckRecommendUserDataAvailable,
  resetDeckRecommendUserDataAvailability,
} from "@/modules/deck-recommend/lib/user-data-availability"
import { submitInherit } from "@/modules/user-settings/api/inherit"
import { useUploadDataAccounts } from "@/modules/tools/composables/useUploadDataAccounts"
import {
  clearInheritStorage,
  loadInheritFromStorage,
  saveInheritToStorage,
} from "@/modules/tools/lib/inherit-storage"

export type InheritField = "inheritId" | "inheritPassword"

/** DOM ids of the inherit form fields; validation focuses the first invalid one. */
export const INHERIT_FIELD_IDS: Record<InheritField, string> = {
  inheritId: "inherit-id",
  inheritPassword: "inherit-password",
}

export function useUploadDataTool() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const fileDataType = ref<UploadDataType>("mysekai")
  const inheritDataType = ref<UploadDataType>("mysekai")
  const selectedFile = ref<File | null>(null)
  const selectedFileName = ref("")
  const inheritServer = ref<InheritServer>("jp")
  const inheritId = ref("")
  const inheritPassword = ref("")
  const rememberInherit = ref(false)
  const isSubmittingFile = ref(false)
  const isSubmittingInherit = ref(false)
  const isInheritConfirmOpen = ref(false)
  const uploadProgress = ref(0)
  const uploadStatus = ref("")
  const fileInputElement = ref<HTMLInputElement | null>(null)
  /** Inline validation messages for the inherit form; empty when valid. */
  const inheritFieldErrors = reactive<Record<InheritField, string>>({ inheritId: "", inheritPassword: "" })

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

  const savedInherit = loadInheritFromStorage()
  if (savedInherit) {
    inheritId.value = savedInherit.inherit_id || ""
    inheritPassword.value = savedInherit.inherit_password || ""
    inheritServer.value = savedInherit.server
    inheritDataType.value = savedInherit.type
    rememberInherit.value = true
  }

  // Without a verified QQ binding every mysekai option is hidden — force any
  // (defaulted or restored) mysekai selection back to suite.
  watch(
    [hasVerifiedQQ, inheritDataType, fileDataType],
    () => {
      if (hasVerifiedQQ.value) {
        return
      }
      if (inheritDataType.value === "mysekai") {
        inheritDataType.value = "suite"
      }
      if (fileDataType.value === "mysekai") {
        fileDataType.value = "suite"
      }
    },
    { immediate: true },
  )

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

  function clearInheritFieldError(field: InheritField) {
    inheritFieldErrors[field] = ""
  }

  function focusInheritField(field: InheritField) {
    void nextTick(() => {
      document.getElementById(INHERIT_FIELD_IDS[field])?.focus()
    })
  }

  /** Validates the inherit form inline; focuses the first invalid field. */
  function validateInheritForm(): boolean {
    const normalizedInheritId = inheritId.value.trim()
    const normalizedInheritPassword = inheritPassword.value.trim()

    inheritFieldErrors.inheritId = !normalizedInheritId
      ? t("tools.uploadData.toast.inheritIdRequired")
      : !/^[a-zA-Z0-9]{16}$/.test(normalizedInheritId)
        ? t("tools.uploadData.toast.inheritIdInvalidDescription")
        : ""
    inheritFieldErrors.inheritPassword = normalizedInheritPassword ? "" : t("tools.uploadData.toast.inheritPasswordRequired")

    const firstInvalid = (["inheritId", "inheritPassword"] as const).find((field) => inheritFieldErrors[field])
    if (firstInvalid) {
      focusInheritField(firstInvalid)
      return false
    }
    return true
  }

  function requestInheritUpload() {
    if (isSubmittingInherit.value) return
    if (!validateInheritForm()) return
    isInheritConfirmOpen.value = true
  }

  async function confirmInheritUpload() {
    if (isSubmittingInherit.value) return
    const normalizedInheritId = inheritId.value.trim()
    const normalizedInheritPassword = inheritPassword.value.trim()

    isInheritConfirmOpen.value = false
    isSubmittingInherit.value = true
    try {
      await submitInherit(
        inheritServer.value,
        inheritDataType.value,
        normalizedInheritId,
        normalizedInheritPassword,
        { skipErrorToast: true }
      )

      toast.success(t("tools.uploadData.toast.uploadSuccessTitle"), {
        description: t("tools.uploadData.toast.uploadSuccessInheritFallback"),
      })
      // The uid is resolved server-side: drop the deck page's "no data
      // uploaded" flags for this server so its next run re-probes.
      resetDeckRecommendUserDataAvailability(inheritServer.value)

      // Only a successful submission is worth remembering (the hint says so).
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
    inheritFieldErrors,
    rememberInherit,
    isSubmittingFile,
    isSubmittingInherit,
    isInheritConfirmOpen,
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
    clearInheritFieldError,
    setRememberInherit,
    submitFileUpload,
    requestInheritUpload,
    confirmInheritUpload,
  }
}
