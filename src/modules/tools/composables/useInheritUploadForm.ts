import { computed, nextTick, reactive, ref, watch, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { InheritServer, UploadDataType } from "@/types"
import {
  INHERIT_ID_PATTERN,
  isReusableInheritPassword,
  type InheritNewPasswordMode,
} from "@/modules/tools/lib/inherit-job"
import type { CreateInheritJobInput } from "@/modules/tools/api/inherit"

export type InheritField = "inheritId" | "inheritPassword"

/** DOM ids of the inherit form fields; validation focuses the first invalid one. */
export const INHERIT_FIELD_IDS: Record<InheritField, string> = {
  inheritId: "inherit-id",
  inheritPassword: "inherit-password",
}

/**
 * The transfer-code form. The code and its password stay in memory only and
 * are cleared once the job is created: the job needs them in that one
 * request, nowhere else.
 */
export function useInheritUploadForm(hasVerifiedQQ: Ref<boolean>) {
  const { t } = useI18n()

  const server = ref<InheritServer>("jp")
  const dataType = ref<UploadDataType>("suite")
  const inheritId = ref("")
  const inheritPassword = ref("")
  const newPasswordMode = ref<InheritNewPasswordMode>("reuse")
  const fieldErrors = reactive<Record<InheritField, string>>({ inheritId: "", inheritPassword: "" })

  // MySekai needs a verified QQ binding; the option is hidden without one.
  watch(
    [hasVerifiedQQ, dataType],
    () => {
      if (!hasVerifiedQQ.value && dataType.value === "mysekai") dataType.value = "suite"
    },
    { immediate: true },
  )

  /** The entered password cannot become the new code's password: suggest "random". */
  const reuseBlocked = computed(() => inheritPassword.value !== "" && !isReusableInheritPassword(inheritPassword.value))

  function clearFieldError(field: InheritField) {
    fieldErrors[field] = ""
  }

  function validate(): boolean {
    const id = inheritId.value.trim()
    fieldErrors.inheritId = !id
      ? t("tools.uploadData.toast.inheritIdRequired")
      : !INHERIT_ID_PATTERN.test(id)
        ? t("tools.uploadData.toast.inheritIdInvalidDescription")
        : ""
    // The password is sent as typed (the backend does not trim it).
    fieldErrors.inheritPassword = !inheritPassword.value
      ? t("tools.uploadData.toast.inheritPasswordRequired")
      : new TextEncoder().encode(inheritPassword.value).length > 64
        ? t("tools.uploadData.inheritTab.newPassword.tooLong")
        : newPasswordMode.value === "reuse" && !isReusableInheritPassword(inheritPassword.value)
          ? t("tools.uploadData.inheritTab.newPassword.reuseInvalid")
          : ""
    const firstInvalid = (["inheritId", "inheritPassword"] as const).find((field) => fieldErrors[field])
    if (firstInvalid) {
      void nextTick(() => document.getElementById(INHERIT_FIELD_IDS[firstInvalid])?.focus())
      return false
    }
    return true
  }

  function toCreateInput(): CreateInheritJobInput {
    return {
      server: server.value,
      uploadType: dataType.value,
      inheritId: inheritId.value.trim(),
      inheritPassword: inheritPassword.value,
      newPasswordMode: newPasswordMode.value,
    }
  }

  /** Forgets the entered code once the job holds it. */
  function clearSecrets() {
    inheritId.value = ""
    inheritPassword.value = ""
    fieldErrors.inheritId = ""
    fieldErrors.inheritPassword = ""
  }

  return {
    server,
    dataType,
    inheritId,
    inheritPassword,
    newPasswordMode,
    fieldErrors,
    reuseBlocked,
    clearFieldError,
    validate,
    toCreateInput,
    clearSecrets,
  }
}
