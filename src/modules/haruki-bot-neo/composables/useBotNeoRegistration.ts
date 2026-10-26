import { computed, nextTick, onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { isAxiosError } from "axios"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { describeError } from "@/lib/error-utils"
import {
  getBotNeoStatus,
  sendBotNeoVerificationMail,
  registerBotNeo,
  type BotNeoRegistrationResult,
} from "@/modules/haruki-bot-neo/api/registration"

type Step = "input" | "verify" | "result"

/** DOM ids of the form fields; validation focuses the invalid one. */
export const BOT_NEO_QQ_INPUT_ID = "bot-neo-qq"
export const BOT_NEO_CODE_INPUT_ID = "bot-neo-code"

const QQ_NUMBER_PATTERN = /^[1-9]\d{4,11}$/
const VERIFICATION_CODE_PATTERN = /^\d{6}$/

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
  /** Inline errors under the QQ and code fields; empty when valid. */
  const qqError = ref("")
  const codeError = ref("")

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

  function focusField(id: string) {
    void nextTick(() => {
      document.getElementById(id)?.focus()
    })
  }

  function clearQQError() {
    qqError.value = ""
  }

  function clearCodeError() {
    codeError.value = ""
  }

  async function checkStatus() {
    const response = await runAsyncAction(
      statusLoading,
      () => getBotNeoStatus(),
      {
        errorTitle: t("botNeo.toast.statusCheckFailed"),
        fallbackError: t("botNeo.toast.statusCheckFailedFallback"),
      },
    )
    if (response) {
      registrationEnabled.value = response.updatedData?.enabled ?? false
    }
  }

  /** Validates the QQ field inline; returns the number or null. */
  function validateQQ(): number | null {
    const raw = qqNumber.value.trim()
    if (!raw) {
      qqError.value = t("botNeo.toast.missingQQNumber")
      focusField(BOT_NEO_QQ_INPUT_ID)
      return null
    }
    if (!QQ_NUMBER_PATTERN.test(raw)) {
      qqError.value = t("botNeo.toast.invalidQQNumber")
      focusField(BOT_NEO_QQ_INPUT_ID)
      return null
    }
    qqError.value = ""
    return Number(raw)
  }

  async function handleSendCode() {
    const qq = validateQQ()
    if (qq === null) return

    const response = await runAsyncAction(
      sending,
      () => sendBotNeoVerificationMail(qq),
      {
        errorTitle: t("botNeo.toast.sendFailedTitle"),
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
            qqError.value = t("botNeo.toast.alreadyRegisteredDescription")
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

          toast.error(t("botNeo.toast.sendFailedTitle"), {
            description: describeError(error, t("botNeo.toast.sendFailedFallback")).message,
          })
        },
      },
    )
    if (!response) return

    toast.success(t("botNeo.toast.codeSentTitle"), {
      description: t("botNeo.toast.codeSentDescription", { qq: qqNumber.value.trim() }),
    })
    codeError.value = ""
    step.value = "verify"
  }

  /** Validates the code field inline; returns the code or null. */
  function validateCode(): string | null {
    const code = verificationCode.value.trim()
    if (!code) {
      codeError.value = t("botNeo.toast.missingVerificationCode")
      focusField(BOT_NEO_CODE_INPUT_ID)
      return null
    }
    if (!VERIFICATION_CODE_PATTERN.test(code)) {
      codeError.value = t("botNeo.toast.invalidVerificationCode")
      focusField(BOT_NEO_CODE_INPUT_ID)
      return null
    }
    codeError.value = ""
    return code
  }

  async function handleRegister() {
    const qq = Number(qqNumber.value.trim())
    const code = validateCode()
    if (!code) return

    const response = await runAsyncAction(
      registering,
      () => registerBotNeo(qq, code),
      {
        errorTitle: t("botNeo.toast.registerFailedTitle"),
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

          const message = describeError(error, t("botNeo.toast.registerFailedFallback")).message
          // A wrong code is the usual reason: say so next to the field too.
          if (isAxiosError(error) && error.response?.status === 400) {
            codeError.value = message
            focusField(BOT_NEO_CODE_INPUT_ID)
          }
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
    qqError.value = ""
    codeError.value = ""
    stopCooldown()
  }

  function handleBackToInput() {
    step.value = "input"
    verificationCode.value = ""
    codeError.value = ""
  }

  return {
    statusLoading,
    registrationEnabled,
    step,
    qqNumber,
    verificationCode,
    qqError,
    codeError,
    sending,
    registering,
    result,
    isCooldown,
    cooldownSeconds,
    checkStatus,
    clearQQError,
    clearCodeError,
    handleSendCode,
    handleRegister,
    handleCopy,
    handleReset,
    handleBackToInput,
  }
}
