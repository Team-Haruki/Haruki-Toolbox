import { computed, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { resetPassword } from "@/modules/auth/api/reset-password"
import { extractErrorMessage } from "@/lib/error-utils"
import { DEFAULT_MIN_PASSWORD_LENGTH, hasMinPasswordLength } from "@/lib/validation"
import { redirectToLogin } from "@/core/router/navigation"

export function useResetPasswordForm() {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()

  const verifyHash = computed(() => String(route.params.verifyHash ?? ""))
  const email = ref("")
  const newPassword = ref("")
  const confirmPassword = ref("")
  const isSubmitting = ref(false)

  watch(
    () => route.query.email,
    (nextEmail) => {
      email.value = String(nextEmail ?? "")
    },
    { immediate: true }
  )

  function validateForm(): string | null {
    if (!email.value.trim() || !verifyHash.value) {
      return t("auth.resetPassword.toast.invalidLink")
    }

    if (!newPassword.value || !confirmPassword.value) {
      return t("auth.resetPassword.toast.incompleteInfo")
    }

    if (newPassword.value !== confirmPassword.value) {
      return t("auth.resetPassword.toast.passwordMismatch")
    }

    if (!hasMinPasswordLength(newPassword.value, DEFAULT_MIN_PASSWORD_LENGTH)) {
      return t("auth.resetPassword.toast.passwordMinLength", { min: DEFAULT_MIN_PASSWORD_LENGTH })
    }

    return null
  }

  async function handleSubmit() {
    if (isSubmitting.value) return
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    isSubmitting.value = true
    try {
      await resetPassword(email.value.trim(), verifyHash.value, newPassword.value)
      toast.success(t("auth.resetPassword.toast.resetSuccessTitle"), {
        description: t("auth.resetPassword.toast.resetSuccessDescription"),
      })
      await redirectToLogin(router)
    } catch (error: unknown) {
      toast.error(t("auth.resetPassword.toast.resetFailedTitle"), {
        description: extractErrorMessage(error, t("auth.resetPassword.toast.resetFailedDescription")),
      })
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    email,
    newPassword,
    confirmPassword,
    isSubmitting,
    handleSubmit,
  }
}
