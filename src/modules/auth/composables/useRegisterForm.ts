import { onUnmounted, ref } from "vue"
import { useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import { extractErrorMessage } from "@/lib/error-utils"
import { registerUser } from "@/modules/auth/api/register"
import { sendEmailVerificationCode } from "@/modules/user-settings/api/email"

interface TurnstileExpose {
  reset: () => void
}

const RESEND_SECONDS = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useRegisterForm() {
  const router = useRouter()
  const { t } = useI18n()
  const userStore = useUserStore()

  const email = ref("")
  const username = ref("")
  const countdown = ref(0)
  const password = ref("")
  const emailCode = ref("")

  const isSending = ref(false)
  const isRegistering = ref(false)
  const sendCodeChallengeToken = ref("")
  const sendCodeRef = ref<TurnstileExpose | null>(null)
  const registerChallengeToken = ref("")
  const registerTurnstileRef = ref<TurnstileExpose | null>(null)
  const isDialogOpen = ref(false)

  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function stopCountdown() {
    if (!countdownInterval) return
    clearInterval(countdownInterval)
    countdownInterval = null
  }

  function startCountdown() {
    countdown.value = RESEND_SECONDS
    stopCountdown()
    countdownInterval = setInterval(() => {
      if (countdown.value > 0) {
        countdown.value -= 1
      }

      if (countdown.value === 0) {
        stopCountdown()
      }
    }, 1000)
  }

  function onSendCodeTurnstileVerified(token: string) {
    sendCodeChallengeToken.value = token
  }

  function onSendCodeTurnstileInvalid() {
    sendCodeChallengeToken.value = ""
  }

  function onRegisterTurnstileVerified(token: string) {
    registerChallengeToken.value = token
  }

  function onRegisterTurnstileInvalid() {
    registerChallengeToken.value = ""
  }

  async function handleSendCode() {
    const normalizedEmail = email.value.trim()
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail)) {
      toast.error(t("auth.register.toast.invalidEmail"))
      return false
    }

    if (!sendCodeChallengeToken.value) {
      toast.error(t("auth.register.toast.completeCaptcha"))
      return false
    }

    isSending.value = true
    try {
      await sendEmailVerificationCode(normalizedEmail, sendCodeChallengeToken.value, {
        skipErrorToast: true,
      })

      toast.success(t("auth.register.toast.codeSentTitle"), {
        description: t("auth.register.toast.codeSentDescription", { email: normalizedEmail }),
      })
      sendCodeChallengeToken.value = ""
      startCountdown()
      return true
    } catch (error: unknown) {
      toast.error(t("auth.register.toast.sendCodeFailedTitle"), {
        description: extractErrorMessage(error, t("auth.register.toast.sendCodeFailedDescription")),
      })
      return false
    } finally {
      sendCodeChallengeToken.value = ""
      sendCodeRef.value?.reset()
      isSending.value = false
    }
  }

  async function handleConfirmSendCode() {
    const sent = await handleSendCode()
    if (sent) {
      isDialogOpen.value = false
    }
  }

  async function handleRegister() {
    if (!registerChallengeToken.value) {
      toast.error(t("auth.register.toast.completeRegisterCaptcha"))
      return
    }

    const normalizedUsername = username.value.trim()
    const normalizedEmail = email.value.trim()
    const normalizedEmailCode = emailCode.value.trim()
    if (!normalizedUsername || !normalizedEmail || !password.value || !normalizedEmailCode) {
      toast.error(t("auth.register.toast.registerFailedTitle"), {
        description: t("auth.register.toast.incompleteInfo"),
      })
      return
    }

    isRegistering.value = true
    try {
      const response = await registerUser(
        normalizedUsername,
        normalizedEmail,
        password.value,
        normalizedEmailCode,
        registerChallengeToken.value,
        { skipErrorToast: true }
      )
      toast.success(t("auth.register.toast.registerSuccessTitle"), {
        description: t("auth.register.toast.registerSuccessDescription"),
      })
      userStore.setUser(response.userData)
      registerChallengeToken.value = ""
      await router.push("/")
    } catch (error: unknown) {
      toast.error(t("auth.register.toast.registerFailedTitle"), {
        description: extractErrorMessage(error, t("auth.register.toast.registerFailedDescription")),
      })
    } finally {
      registerChallengeToken.value = ""
      registerTurnstileRef.value?.reset()
      isRegistering.value = false
    }
  }

  onUnmounted(stopCountdown)

  return {
    email,
    username,
    countdown,
    password,
    emailCode,
    isSending,
    isRegistering,
    sendCodeRef,
    registerTurnstileRef,
    isDialogOpen,
    onSendCodeTurnstileVerified,
    onSendCodeTurnstileInvalid,
    onRegisterTurnstileVerified,
    onRegisterTurnstileInvalid,
    handleConfirmSendCode,
    handleRegister,
  }
}
