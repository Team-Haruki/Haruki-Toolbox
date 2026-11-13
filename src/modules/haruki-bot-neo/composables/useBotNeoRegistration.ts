import { computed, nextTick, onUnmounted, ref } from "vue"
import { useI18n } from "vue-i18n"
import { toast } from "vue-sonner"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { copyTextToClipboard, isClipboardSupported } from "@/lib/clipboard"
import { describeError } from "@/lib/error-utils"
import {
  getBotNeoStatus,
  sendBotNeoVerificationMail,
  registerBotNeo,
  type BotNeoRegistrationResult,
} from "@/modules/haruki-bot-neo/api/registration"
import {
  checkQQNumber,
  checkVerificationCode,
  parseRetryAfterSeconds,
  readErrorStatus,
  type BotNeoStep,
} from "@/modules/haruki-bot-neo/lib/registration"

/** DOM ids of the form fields; validation focuses the invalid one. */
export const BOT_NEO_QQ_INPUT_ID = "bot-neo-qq"
export const BOT_NEO_CODE_INPUT_ID = "bot-neo-code"

export function useBotNeoRegistration() {
  const { t } = useI18n()

  const statusLoading = ref(false)
  const registrationEnabled = ref<boolean | null>(null)
  /** The last status check failed, so it is unknown whether registration is open. */
  const statusCheckFailed = ref(false)
  const step = ref<BotNeoStep>("input")
  const qqNumber = ref("")
  const verificationCode = ref("")
  const sending = ref(false)
  const registering = ref(false)
  const result = ref<BotNeoRegistrationResult | null>(null)
  /** Inline errors under the QQ and code fields; empty when valid. */
  const qqError = ref("")
  const codeError = ref("")
  /** A failed request that no single field explains, shown above the step's buttons. */
  const formError = ref("")

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
    let failed = false
    const response = await runAsyncAction(
      statusLoading,
      async () => {
        try {
          return await getBotNeoStatus()
        } catch (error) {
          failed = true
          throw error
        }
      },
      {
        errorTitle: t("botNeo.toast.statusCheckFailed"),
        fallbackError: t("botNeo.toast.statusCheckFailedHint"),
      },
    )
    statusCheckFailed.value = failed
    if (response) {
      registrationEnabled.value = response.updatedData?.enabled ?? false
    }
  }

  /** Validates the QQ field inline; returns the number or null. */
  function validateQQ(): number | null {
    const check = checkQQNumber(qqNumber.value)
    if (!check.ok) {
      qqError.value = check.issue === "missing"
        ? t("botNeo.toast.missingQQNumber")
        : t("botNeo.toast.invalidQQNumber")
      focusField(BOT_NEO_QQ_INPUT_ID)
      return null
    }
    qqError.value = ""
    return check.value
  }

  async function handleSendCode() {
    const qq = validateQQ()
    if (qq === null) return

    formError.value = ""
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

          if (readErrorStatus(error) === 409) {
            qqError.value = t("botNeo.toast.alreadyRegisteredDescription")
            toast.error(t("botNeo.toast.alreadyRegisteredTitle"), {
              description: t("botNeo.toast.alreadyRegisteredDescription"),
            })
            return
          }

          if (readErrorStatus(error) === 403) {
            toast.error(t("botNeo.toast.registrationDisabledTitle"), {
              description: t("botNeo.toast.registrationDisabledDescription"),
            })
            registrationEnabled.value = false
            return
          }

          const message = describeError(error, t("botNeo.toast.sendFailedFallback")).message
          formError.value = message
          toast.error(t("botNeo.toast.sendFailedTitle"), { description: message })
        },
      },
    )
    if (!response) return

    toast.success(t("botNeo.toast.codeSentTitle"), {
      description: t("botNeo.toast.codeSentDescription", { qq: qqNumber.value.trim() }),
    })
    codeError.value = ""
    step.value = "verify"
    focusField(BOT_NEO_CODE_INPUT_ID)
  }

  /** Validates the code field inline; returns the code or null. */
  function validateCode(): string | null {
    const check = checkVerificationCode(verificationCode.value)
    if (!check.ok) {
      codeError.value = check.issue === "missing"
        ? t("botNeo.toast.missingVerificationCode")
        : t("botNeo.toast.invalidVerificationCode")
      focusField(BOT_NEO_CODE_INPUT_ID)
      return null
    }
    codeError.value = ""
    return check.value
  }

  async function handleRegister() {
    const qq = Number(qqNumber.value.trim())
    const code = validateCode()
    if (!code) return

    formError.value = ""
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

          if (readErrorStatus(error) === 409) {
            formError.value = t("botNeo.toast.alreadyRegisteredDescription")
            toast.error(t("botNeo.toast.alreadyRegisteredTitle"), {
              description: t("botNeo.toast.alreadyRegisteredDescription"),
            })
            return
          }

          const message = describeError(error, t("botNeo.toast.registerFailedFallback")).message
          // A wrong code is the usual reason: say so next to the field too.
          if (readErrorStatus(error) === 400) {
            codeError.value = message
            focusField(BOT_NEO_CODE_INPUT_ID)
          } else {
            formError.value = message
          }
          toast.error(t("botNeo.toast.registerFailedTitle"), { description: message })
        },
      },
    )
    if (!response) return

    const data = response.updatedData
    if (!data?.bot_id || !data?.credential) {
      formError.value = t("botNeo.toast.incompleteResponse")
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
    formError.value = ""
    stopCooldown()
  }

  function handleBackToInput() {
    step.value = "input"
    verificationCode.value = ""
    codeError.value = ""
    formError.value = ""
  }

  return {
    statusLoading,
    registrationEnabled,
    statusCheckFailed,
    step,
    qqNumber,
    verificationCode,
    qqError,
    codeError,
    formError,
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
