import { reactive } from "vue"
import { useI18n } from "vue-i18n"
import type { InheritApiError } from "@/modules/tools/api/inherit"
import { isValidVaultPin, type InheritUnlockKind } from "@/modules/tools/lib/inherit-job"
import type { InheritUnlockInput } from "@/modules/tools/lib/inherit-vault"
import { describeInheritApiError } from "@/modules/tools/lib/inherit-messages"

export interface InheritUnlockState {
  kind: InheritUnlockKind
  /** The vault key exists; false means this step-up creates it. */
  initialized: boolean
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

type Translate = (key: string, params?: Record<string, unknown>) => string

/**
 * The step-up secret of the job confirmation and every vault action: the
 * Toolbox sign-in password, or the vault PIN for identities without one, and
 * the "your password changed, type the old one" detour.
 */
export function useInheritUnlock() {
  const { t } = useI18n()
  return createInheritUnlock(t)
}

/** useInheritUnlock with the translator passed in (for tests). */
export function createInheritUnlock(t: Translate) {
  const state = reactive<InheritUnlockState>({
    kind: "password",
    initialized: true,
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
    state.initialized = initialized
    state.creating = kind === "pin" && !initialized
    // Without a key (a reset just discarded it) there is no old password to
    // carry over: the next step-up creates a new key.
    if (!initialized) {
      state.needsPrevious = false
      state.previousPassword = ""
      state.previousError = ""
    }
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
      state.previousError = t("tools.uploadData.inheritJob.confirm.previousPasswordRequired")
    }
    return !state.secretError && !state.repeatError && !state.previousError
  }

  function toInput(): InheritUnlockInput {
    if (state.kind === "pin") return { vaultPin: state.secret }
    return state.needsPrevious && state.previousPassword
      ? { password: state.secret, previousPassword: state.previousPassword }
      : { password: state.secret }
  }

  /** Puts a refusal next to the field it is about (and asks for the old password when needed). */
  function absorb(error: InheritApiError): void {
    clearErrors()
    const message = describeInheritApiError(t, error)
    // The backend asked for the other secret than the one on screen (a
    // stale hint): switch the field over, with the refusal next to it.
    if (error.code === "vault_pin_required" && state.kind === "password") configure("pin", state.initialized)
    else if (error.code === "password_required" && state.kind === "pin") configure("password", state.initialized)
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
