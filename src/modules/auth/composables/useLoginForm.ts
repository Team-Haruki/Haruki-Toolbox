import { ref } from "vue"
import { isAxiosError } from "axios"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { extractErrorMessage } from "@/lib/error-utils"
import { isAccountBannedMessage } from "@/lib/account-status"
import { login } from "@/modules/auth/api/login"
import { sendResetPasswordEmail } from "@/modules/auth/api/reset-password"
import { resolveSafeRedirectTarget } from "@/core/router/navigation"

interface TurnstileExpose {
  reset: () => void
}

interface LoginErrorToast {
  title: string
  message: string
}

export function useLoginForm() {
  const route = useRoute()
  const router = useRouter()
  const { t } = useI18n()
  const userStore = useUserStore()

  const email = ref("")
  const password = ref("")
  const resetEmail = ref("")

  const loginChallengeToken = ref<string | null>(null)
  const loginTurnstileRef = ref<TurnstileExpose | null>(null)
  const resetChallengeToken = ref<string | null>(null)
  const resetTurnstileRef = ref<TurnstileExpose | null>(null)

  const isLoggingIn = ref(false)
  const isSendingResetEmail = ref(false)

  function resolveLoginError(error: unknown): LoginErrorToast {
    const defaultMessage = t("auth.toast.networkError")
    if (!isAxiosError(error)) {
      return {
        title: t("auth.toast.loginFailedTitle"),
        message: extractErrorMessage(error, defaultMessage),
      }
    }

    if (error.response?.status !== 403) {
      return {
        title: t("auth.toast.loginFailedTitle"),
        message: extractErrorMessage(error, defaultMessage),
      }
    }

    const apiMessage = extractErrorMessage(error, t("auth.toast.permissionDenied"))
    const isBanned = isAccountBannedMessage(apiMessage)
    return {
      title: isBanned ? t("auth.toast.accountBannedTitle") : t("auth.toast.loginFailedTitle"),
      message: apiMessage || t("auth.toast.permissionDenied"),
    }
  }

  function onLoginTurnstileVerified(token: string) {
    loginChallengeToken.value = token
  }

  function onLoginTurnstileInvalid() {
    loginChallengeToken.value = null
  }

  function onResetTurnstileVerified(token: string) {
    resetChallengeToken.value = token
  }

  function onResetTurnstileInvalid() {
    resetChallengeToken.value = null
  }

  async function handleResetPassword() {
    const normalizedResetEmail = resetEmail.value.trim()
    if (!normalizedResetEmail) {
      toast.error(t("auth.login.toast.enterEmail"))
      return
    }

    if (!resetChallengeToken.value) {
      toast.error(t("auth.login.toast.completeCaptcha"))
      return
    }

    isSendingResetEmail.value = true
    try {
      await sendResetPasswordEmail(normalizedResetEmail, resetChallengeToken.value, {
        skipErrorToast: true,
      })
      toast.success(t("auth.login.toast.resetEmailSentTitle"), {
        description: t("auth.login.toast.resetEmailSentDescription", { email: normalizedResetEmail }),
      })
      resetChallengeToken.value = null
    } catch (error: unknown) {
      toast.error(t("auth.login.toast.resetFailedTitle"), {
        description: extractErrorMessage(error, t("auth.toast.networkError")),
      })
    } finally {
      isSendingResetEmail.value = false
      resetChallengeToken.value = null
      resetTurnstileRef.value?.reset()
    }
  }

  async function handleLogin() {
    if (!loginChallengeToken.value) {
      toast.error(t("auth.login.toast.completeLoginCaptcha"))
      return
    }

    const normalizedEmail = email.value.trim()
    isLoggingIn.value = true
    try {
      const response = await login(normalizedEmail, password.value, loginChallengeToken.value, {
        skipErrorToast: true,
      })

      if (response.status !== 200) {
        toast.error(t("auth.toast.loginFailedTitle"), {
          description: response.message || t("auth.toast.tryLater"),
        })
        return
      }

      if (response.userData) {
        userStore.setUser(response.userData)
      }
      toast.success(t("auth.login.toast.loginSuccessTitle"), {
        description: t("auth.login.toast.loginSuccessDescription"),
      })
      loginChallengeToken.value = null
      await router.push(resolveSafeRedirectTarget(route.query.redirect) ?? "/")
    } catch (error: unknown) {
      const { title, message } = resolveLoginError(error)
      toast.error(title, { description: message })
    } finally {
      isLoggingIn.value = false
      loginChallengeToken.value = null
      loginTurnstileRef.value?.reset()
    }
  }

  return {
    email,
    password,
    resetEmail,
    loginTurnstileRef,
    resetTurnstileRef,
    isLoggingIn,
    isSendingResetEmail,
    onLoginTurnstileVerified,
    onLoginTurnstileInvalid,
    onResetTurnstileVerified,
    onResetTurnstileInvalid,
    handleResetPassword,
    handleLogin,
  }
}
