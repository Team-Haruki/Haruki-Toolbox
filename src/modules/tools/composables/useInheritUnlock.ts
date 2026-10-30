import { reactive } from "vue"
import { useI18n } from "vue-i18n"
import type { InheritApiError } from "@/modules/tools/api/inherit"
import { isValidVaultPin, type InheritUnlockKind } from "@/modules/tools/lib/inherit-job"
import type { InheritUnlockInput } from "@/modules/tools/lib/inherit-vault"
import { describeInheritApiError } from "@/modules/tools/lib/inherit-messages"

export interface InheritUnlockState {
  kind: InheritUnlockKind
  /** No vault key yet: a PIN is chosen now and typed twice. */
  creating: boolean
  secret: string
  repeat: string
  previousPassword: string
  /** The password changed since the vault was made: ask for the old one once. */
  needsPrevious: boolean
  secretError: string
  repeatError: string
  previousError: string
  /** A refusal that is not about one field. */
  formError: string
}

/**
 * The step-up secret of the job confirmation and every vault action: the
 * Toolbox password, or the vault PIN for identities without one, and the
 * "your password changed, type the old one" detour.
 */
export function useInheritUnlock() {
  const { t } = useI18n()
  const state = reactive<InheritUnlockState>({
    kind: "password",
    creating: false,
    secret: "",
    repeat: "",
    previousPassword: "",
    needsPrevious: false,
    secretError: "",
    repeatError: "",
    previousError: "",
    formError: "",
  })

  function configure(kind: InheritUnlockKind, initialized: boolean) {
    state.kind = kind
    state.creating = kind === "pin" && !initialized
  }

  function clearErrors() {
    state.secretError = ""
    state.repeatError = ""
    state.previousError = ""
    state.formError = ""
  }

  function reset() {
    state.secret = ""
    state.repeat = ""
    state.previousPassword = ""
    state.needsPrevious = false
    clearErrors()
  }

  function validate(): boolean {
    clearErrors()
    if (state.kind === "pin") {
      if (!isValidVaultPin(state.secret)) state.secretError = t("tools.uploadData.inheritJob.confirm.pinFormat")
      else if (state.creating && state.secret !== state.repeat) state.repeatError = t("tools.uploadData.inheritJob.confirm.pinMismatch")
    } else if (!state.secret) {
      state.secretError = t("tools.uploadData.inheritJob.confirm.passwordRequired")
    }
    if (state.needsPrevious && !state.previousPassword) {
      state.previousError = t("tools.uploadData.inheritErrors.password_required")
    }
    return !state.secretError && !state.repeatError && !state.previousError
  }

  function toInput(): InheritUnlockInput {
    if (state.kind === "pin") return { vaultPin: state.secret }
    return state.needsPrevious && state.previousPassword
      ? { password: state.secret, previousPassword: state.previousPassword }
      : { password: state.secret }
  }

  /** Puts a refusal next to the field it is about; true when it asks for the old password. */
  function absorb(error: InheritApiError): void {
    clearErrors()
    const message = describeInheritApiError(t, error)
    switch (error.code) {
      case "vault_password_changed":
        state.needsPrevious = true
        return
      case "previous_password_invalid":
        state.previousError = message
        return
      case "password_invalid":
      case "password_required":
      case "vault_pin_invalid":
      case "vault_pin_required":
      case "vault_pin_invalid_format":
        state.secretError = message
        return
      default:
        state.formError = message
    }
  }

  return { state, configure, reset, validate, toInput, absorb }
}

export type InheritUnlockController = ReturnType<typeof useInheritUnlock>
