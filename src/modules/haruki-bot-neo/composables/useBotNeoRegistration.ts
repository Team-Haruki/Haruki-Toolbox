import { computed, onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { isAxiosError } from "axios"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import {
  getBotNeoStatus,
  sendBotNeoVerificationMail,
  registerBotNeo,
  type BotNeoRegistrationResult,
} from "@/modules/haruki-bot-neo/api/registration"

type Step = "input" | "verify" | "result"

function parseRetryAfterSeconds(error: unknown): number | null {
  if (!isAxiosError(error) || error.response?.status !== 429) return null
  const header = error.response.headers?.["retry-after"]
  if (!header) return null
  const seconds = Number(header)
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null
}

export function useBotNeoRegistration() {
  const { t } = useI18n()

  const statusLoading = ref(false)
  const registrationEnabled = ref<boolean | null>(null)
  const step = ref<Step>("input")
  const qqNumber = ref("")
  const verificationCode = ref("")
  const sending = ref(false)
  const registering = ref(false)
  const result = ref<BotNeoRegistrationResult | null>(null)

  const cooldownSeconds = ref(0)
  let cooldownTimer: ReturnType<typeof setInterval> | null = null

  const isCooldown = computed(() => cooldownSeconds.value > 0)

  function startCooldown(seconds: number) {
    stopCooldown()
    cooldownSeconds.value = seconds
    cooldownTimer = setInterval(() => {
      cooldownSeconds.value -= 1
      if (cooldownSeconds.value <= 0) {
        stopCooldown()
      }
    }, 1000)
  }

  function stopCooldown() {
    cooldownSeconds.value = 0
    if (cooldownTimer) {
      clearInterval(cooldownTimer)
      cooldownTimer = null
    }
  }

  onUnmounted(stopCooldown)

  async function checkStatus() {
    const response = await runAsyncAction(
      statusLoading,
      () => getBotNeoStatus(),
      {
        errorTitle: t("botNeo.toast.statusCheckFailed"),
        fallbackError: t("botNeo.toast.statusCheckFailed"),
      },
    )
    if (response) {
      registrationEnabled.value = response.updatedData?.enabled ?? false
    }
  }

  async function handleSendCode() {
    const qq = Number(qqNumber.value.trim())
    if (!qq || qq <= 0) {
      toast.error(t("botNeo.toast.sendFailedTitle"), {
        description: t("botNeo.toast.invalidQQNumber"),
      })
      return
    }

    const response = await runAsyncAction(
      sending,
      () => sendBotNeoVerificationMail(qq),
      {
        errorTitle: t("botNeo.toast.sendFailedTitle"),
        fallbackError: t("botNeo.toast.sendFailedTitle"),
        onError(error) {
          const retryAfter = parseRetryAfterSeconds(error)
          if (retryAfter) {
            startCooldown(retryAfter)
            toast.error(t("botNeo.toast.rateLimitedTitle"), {
              description: t("botNeo.toast.rateLimitedDescription", { seconds: retryAfter }),
            })
            return
          }

          if (isAxiosError(error) && error.response?.status === 409) {
            toast.error(t("botNeo.toast.alreadyRegisteredTitle"), {
              description: t("botNeo.toast.alreadyRegisteredDescription"),
            })
            return
          }

          if (isAxiosError(error) && error.response?.status === 403) {
            toast.error(t("botNeo.toast.registrationDisabledTitle"), {
              description: t("botNeo.toast.registrationDisabledDescription"),
            })
            registrationEnabled.value = false
            return
          }

          const message = isAxiosError(error)
            ? (error.response?.data as { message?: string })?.message ?? error.message
            : t("botNeo.toast.sendFailedTitle")
          toast.error(t("botNeo.toast.sendFailedTitle"), { description: message })
        },
      },
    )
    if (!response) return

    toast.success(t("botNeo.toast.codeSentTitle"), {
      description: t("botNeo.toast.codeSentDescription", { qq: qqNumber.value.trim() }),
    })
    step.value = "verify"
  }

  async function handleRegister() {
    const qq = Number(qqNumber.value.trim())
    const code = verificationCode.value.trim()
    if (!code) {
      toast.error(t("botNeo.toast.registerFailedTitle"), {
        description: t("botNeo.toast.missingVerificationCode"),
      })
      return
    }

    const response = await runAsyncAction(
      registering,
      () => registerBotNeo(qq, code),
      {
        errorTitle: t("botNeo.toast.registerFailedTitle"),
        fallbackError: t("botNeo.toast.registerFailedTitle"),
        onError(error) {
          const retryAfter = parseRetryAfterSeconds(error)
          if (retryAfter) {
            startCooldown(retryAfter)
            toast.error(t("botNeo.toast.rateLimitedTitle"), {
              description: t("botNeo.toast.rateLimitedDescription", { seconds: retryAfter }),
            })
            return
          }

          if (isAxiosError(error) && error.response?.status === 409) {
            toast.error(t("botNeo.toast.alreadyRegisteredTitle"), {
              description: t("botNeo.toast.alreadyRegisteredDescription"),
            })
            return
          }

          const message = isAxiosError(error)
            ? (error.response?.data as { message?: string })?.message ?? error.message
            : t("botNeo.toast.registerFailedTitle")
          toast.error(t("botNeo.toast.registerFailedTitle"), { description: message })
        },
      },
    )
    if (!response) return

    const data = response.updatedData
    if (!data?.bot_id || !data?.credential) {
      toast.error(t("botNeo.toast.registerFailedTitle"), {
        description: t("botNeo.toast.incompleteResponse"),
      })
      return
    }

    result.value = data
    step.value = "result"
    toast.success(t("botNeo.toast.registerSuccessTitle"))
  }

  async function handleCopy(text: string, label: string) {
    if (!isClipboardSupported()) {
      toast.error(t("botNeo.toast.clipboardUnsupported"))
      return
    }
    const ok = await copyTextToClipboard(text)
    if (ok) {
      toast.success(t("botNeo.toast.copySuccess", { label }))
    } else {
      toast.error(t("botNeo.toast.copyFailed"))
    }
  }

  function handleReset() {
    step.value = "input"
    verificationCode.value = ""
    result.value = null
    stopCooldown()
  }

  function handleBackToInput() {
    step.value = "input"
    verificationCode.value = ""
  }

  return {
    statusLoading,
    registrationEnabled,
    step,
    qqNumber,
    verificationCode,
    sending,
    registering,
    result,
    isCooldown,
    cooldownSeconds,
    checkStatus,
    handleSendCode,
    handleRegister,
    handleCopy,
    handleReset,
    handleBackToInput,
  }
}
