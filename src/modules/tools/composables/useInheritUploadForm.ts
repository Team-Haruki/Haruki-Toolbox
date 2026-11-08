import { computed, nextTick, reactive, ref, watch, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { InheritServer, UploadDataType } from "@/types"
import {
  INHERIT_ID_PATTERN,
  isReusableInheritPassword,
  type InheritNewPasswordMode,
} from "@/modules/tools/lib/inherit-job"
import type { CreateInheritJobInput } from "@/modules/tools/api/inherit"
import { parseInheritPaste } from "@/modules/tools/lib/inherit-paste"

export type InheritField = "inheritId" | "inheritPassword" | "inheritText"

/** DOM ids of the inherit form fields; validation focuses the first invalid one. */
export const INHERIT_FIELD_IDS: Record<InheritField, string> = {
  inheritId: "inherit-id",
  inheritPassword: "inherit-password",
  inheritText: "inherit-text",
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
  const inheritText = ref("")
  const newPasswordMode = ref<InheritNewPasswordMode>("reuse")
  const fieldErrors = reactive<Record<InheritField, string>>({ inheritId: "", inheritPassword: "", inheritText: "" })
  // Pasted text is an alternative to the two manual fields, never a partial
  // source to mix with them. An invalid paste must not submit stale values.
  const usesPastedText = computed(() => inheritText.value.trim() !== "")
  const credentials = computed(() => usesPastedText.value
    ? parseInheritPaste(inheritText.value)
    : { inheritId: inheritId.value.trim(), inheritPassword: inheritPassword.value })

  // MySekai needs a verified QQ binding; the option is hidden without one.
  watch(
    [hasVerifiedQQ, dataType],
    () => {
      if (!hasVerifiedQQ.value && dataType.value === "mysekai") dataType.value = "suite"
    },
    { immediate: true },
  )

  /** The entered password cannot become the new code's password: suggest "random". */
  const reuseBlocked = computed(() => {
    const password = credentials.value?.inheritPassword ?? ""
    return password !== "" && !isReusableInheritPassword(password)
  })

  function clearFieldError(field: InheritField) {
    fieldErrors[field] = ""
  }

  function validate(): boolean {
    fieldErrors.inheritId = ""
    fieldErrors.inheritPassword = ""
    fieldErrors.inheritText = ""
    const parsed = credentials.value
    if (!parsed) {
      fieldErrors.inheritText = t("tools.uploadData.inheritTab.paste.invalid")
      void nextTick(() => document.getElementById(INHERIT_FIELD_IDS.inheritText)?.focus())
      return false
    }
    const idField = usesPastedText.value ? "inheritText" : "inheritId"
    const passwordField = usesPastedText.value ? "inheritText" : "inheritPassword"
    const { inheritId: id, inheritPassword: password } = parsed
    fieldErrors[idField] = !id
      ? t("tools.uploadData.toast.inheritIdRequired")
      : !INHERIT_ID_PATTERN.test(id)
        ? t("tools.uploadData.toast.inheritIdInvalidDescription")
        : ""
    // The password is sent as typed (the backend does not trim it).
    fieldErrors[passwordField] = !password
      ? t("tools.uploadData.toast.inheritPasswordRequired")
      : new TextEncoder().encode(password).length > 64
        ? t("tools.uploadData.inheritTab.newPassword.tooLong")
        : newPasswordMode.value === "reuse" && !isReusableInheritPassword(password)
          ? t("tools.uploadData.inheritTab.newPassword.reuseBlocked")
          : ""
    const firstInvalid = (["inheritId", "inheritPassword", "inheritText"] as const).find((field) => fieldErrors[field])
    if (firstInvalid) {
      void nextTick(() => document.getElementById(INHERIT_FIELD_IDS[firstInvalid])?.focus())
      return false
    }
    return true
  }

  function toCreateInput(): CreateInheritJobInput {
    const parsed = credentials.value
    if (!parsed) throw new Error("Transfer information must be validated before submission")
    return {
      server: server.value,
      uploadType: dataType.value,
      inheritId: parsed.inheritId,
      inheritPassword: parsed.inheritPassword,
      newPasswordMode: newPasswordMode.value,
    }
  }

  /** Forgets the entered code once the job holds it. */
  function clearSecrets() {
    inheritId.value = ""
    inheritPassword.value = ""
    inheritText.value = ""
    fieldErrors.inheritId = ""
    fieldErrors.inheritPassword = ""
    fieldErrors.inheritText = ""
  }

  return {
    server,
    dataType,
    inheritId,
    inheritPassword,
    inheritText,
    usesPastedText,
    newPasswordMode,
    fieldErrors,
    reuseBlocked,
    clearFieldError,
    validate,
    toCreateInput,
    clearSecrets,
  }
}
