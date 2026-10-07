import { onBeforeUnmount, onMounted, ref } from "vue"
import { isAxiosError } from "axios"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { registerAdminReauthPrompt } from "@/core/http/admin-reauth"
import { classifyAdminReauthFailure } from "@/lib/admin-reauth"
import { reauthenticateAdmin } from "@/modules/admin/api/reauth"

/**
 * Backs the admin password prompt. While mounted it is the prompt `request()`
 * opens when an admin route answers "reauthentication required"; the promise
 * it hands back settles true after a successful POST /api/admin/me/reauth and
 * false when the admin cancels or the check cannot be completed.
 *
 * The password only lives in `password` while the dialog is open: it is never
 * logged or stored, and it is cleared whenever the dialog closes.
 */
export function useAdminReauthDialog() {
  const { t } = useI18n()
  const open = ref(false)
  const password = ref("")
  const submitting = ref(false)
  const inlineError = ref("")
  let settle: ((reauthenticated: boolean) => void) | null = null

  function reset() {
    password.value = ""
    inlineError.value = ""
    submitting.value = false
  }

  function finish(reauthenticated: boolean) {
    const resolve = settle
    settle = null
    open.value = false
    reset()
    resolve?.(reauthenticated)
  }

  function prompt(): Promise<boolean> {
    settle?.(false)
    reset()
    open.value = true
    return new Promise<boolean>((resolve) => {
      settle = resolve
    })
  }

  function setOpen(next: boolean) {
    // Only `prompt()` opens the dialog; every way of closing it counts as cancel.
    if (!next) finish(false)
  }

  async function submit() {
    if (submitting.value || !settle) return
    if (!password.value.trim()) {
      inlineError.value = t("admin.reauth.passwordRequired")
      return
    }

    const attempt = settle
    submitting.value = true
    inlineError.value = ""
    try {
      await reauthenticateAdmin(password.value)
      if (settle === attempt) finish(true)
    } catch (error: unknown) {
      // Cancelled (or replaced) while the check was in flight.
      if (settle !== attempt) return
      submitting.value = false
      switch (classifyAdminReauthFailure(error)) {
        case "passwordMismatch":
          password.value = ""
          inlineError.value = t("admin.reauth.passwordMismatch")
          return
        case "rejected":
          password.value = ""
          inlineError.value = t("admin.reauth.rejected")
          return
        case "passwordRequired":
          inlineError.value = t("admin.reauth.passwordRequired")
          return
        case "invalidInput":
          inlineError.value = t("admin.reauth.invalidInput")
          return
        case "fatal": {
          const sessionInvalid = isAxiosError(error) && error.response?.status === 401
          finish(false)
          toast.error(t("admin.reauth.failedTitle"), {
            description: sessionInvalid ? t("admin.reauth.sessionInvalid") : t("admin.reauth.failedDescription"),
          })
        }
      }
    }
  }

  let unregister: (() => void) | null = null
  onMounted(() => {
    unregister = registerAdminReauthPrompt(prompt)
  })
  onBeforeUnmount(() => {
    unregister?.()
    unregister = null
    finish(false)
  })

  return { open, password, submitting, inlineError, setOpen, submit }
}
