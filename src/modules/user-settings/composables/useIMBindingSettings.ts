import { computed, nextTick, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
import { describeError } from "@/lib/error-utils"
import { useUserStore } from "@/shared/stores/user"
import type { SocialPlatform } from "@/types/social-platform"
import {
  clearSocialPlatformBinding,
  generateSocialPlatformVerificationCode,
  getSocialPlatformVerificationStatus,
  sendQQMailVerificationCode,
  verifyQQ,
} from "@/modules/user-settings/api/im-binding"
import { resolveRequiredUserId } from "@/modules/user-settings/lib/current-user"
import {
  extractGeneratedCodeResult,
  extractUpdatedSocial,
  isNotVerifiedMessage,
} from "@/modules/user-settings/lib/im-binding-response"
import { useIMBindingTurnstile } from "@/modules/user-settings/composables/useIMBindingTurnstile"
import { isSocialPlatform } from "@/lib/social-platform"
import { validateSocialAccountId } from "@/modules/user-settings/lib/social-account-validation"
import { CLOUDFLARE_TURNSTILE_ENABLED } from "@/config/turnstile"

type DialogMode = "qq" | "other"

const QQ_PLATFORM: SocialPlatform = "qq"

/** DOM ids of the binding form fields; validation focuses them. */
export const IM_BINDING_ACCOUNT_INPUT_ID = "im-binding-account"
export const IM_BINDING_CODE_INPUT_ID = "im-binding-code"

export function useIMBindingSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const current = computed(() => userStore.socialPlatformInfo)
  const isTurnstileEnabled = CLOUDFLARE_TURNSTILE_ENABLED
  const isEmailVerified = computed(() => userStore.emailInfo?.verified === true)
  const canRetryCurrentVerification = computed(() => !!current.value && !current.value.verified)
  const isCurrentQQBinding = computed(() => current.value?.platform === QQ_PLATFORM)
  const sending = ref(false)
  const clearing = ref(false)
  const qqInputCode = ref("")
  const verifying = ref(false)
  const generatedCode = ref("")
  const account = ref("")
  const showCodeDialog = ref(false)
  const platform = ref<SocialPlatform>(QQ_PLATFORM)
  const statusToken = ref<string | null>(null)
  const dialogMode = ref<DialogMode>("other")
  /** Inline error under the account field (card); empty when valid. */
  const accountError = ref("")
  /** Inline error under the send/generate button (card) for server failures. */
  const sendError = ref("")
  /** Inline error inside the verification dialog; the dialog stays open. */
  const dialogError = ref("")
  const {
    turnstileToken,
    onTurnstileVerify,
    onTurnstileInvalid,
    resetTurnstileState,
    triggerTurnstile,
  } = useIMBindingTurnstile()

  function requireUserId(actionTitle = t("userSettings.common.actionFailedTitle")): string | null {
    return resolveRequiredUserId(userStore.userId, actionTitle)
  }

  function ensureEmailVerified(): boolean {
    if (isEmailVerified.value) {
      return true
    }

    toast.error(t("userSettings.imBinding.toast.emailNotVerifiedTitle"), {
      description: t("userSettings.imBinding.toast.emailNotVerifiedDescription"),
    })
    return false
  }

  function focusElement(id: string) {
    void nextTick(() => {
      document.getElementById(id)?.focus()
    })
  }

  function clearAccountError() {
    accountError.value = ""
    sendError.value = ""
  }

  function clearDialogError() {
    dialogError.value = ""
  }

  async function sendQQVerificationCode(userId: string, accountId: string) {
    if (isTurnstileEnabled && !turnstileToken.value) {
      sendError.value = t("userSettings.imBinding.toast.completeCaptchaDescription")
      triggerTurnstile()
      return
    }

    const challengeToken = isTurnstileEnabled ? (turnstileToken.value ?? undefined) : undefined
    sendError.value = ""
    const response = await runAsyncAction(
      sending,
      () => sendQQMailVerificationCode(userId, accountId, challengeToken),
      {
        errorTitle: t("userSettings.imBinding.toast.sendFailedTitle"),
        onError(error) {
          sendError.value = describeError(error, t("userSettings.imBinding.toast.sendFailedFallback")).message
        },
      }
    )
    resetTurnstileState()
    if (!response) return

    toast.success(t("userSettings.imBinding.toast.verificationCodeSentTitle"), {
      description: t("userSettings.imBinding.toast.verificationCodeSentDescription", { account: accountId }),
    })
    dialogMode.value = "qq"
    qqInputCode.value = ""
    dialogError.value = ""
    showCodeDialog.value = true
  }

  async function generateVerificationCode(userId: string, accountId: string) {
    sendError.value = ""
    const response = await runAsyncAction(
      sending,
      () => generateSocialPlatformVerificationCode(userId, platform.value, accountId),
      {
        errorTitle: t("userSettings.imBinding.toast.generateFailedTitle"),
        onError(error) {
          sendError.value = describeError(error, t("userSettings.imBinding.toast.generateFailedFallback")).message
        },
      }
    )
    if (!response) return

    const { statusToken: token, oneTimePassword } = extractGeneratedCodeResult(response)
    if (!token || !oneTimePassword) {
      sendError.value = t("userSettings.imBinding.toast.incompleteResponseDescription")
      return
    }

    statusToken.value = token
    generatedCode.value = oneTimePassword
    dialogMode.value = "other"
    dialogError.value = ""
    showCodeDialog.value = true
    toast.success(t("userSettings.imBinding.toast.codeGeneratedTitle"))
  }

  /** Validates the account field inline; returns the trimmed id or null. */
  function validateAccount(accountId: string): string | null {
    if (!accountId) {
      accountError.value = platform.value === QQ_PLATFORM
        ? t("userSettings.imBinding.toast.missingQQAccountDescription")
        : t("userSettings.imBinding.toast.missingAccountDescription")
      focusElement(IM_BINDING_ACCOUNT_INPUT_ID)
      return null
    }

    const validationError = validateSocialAccountId(platform.value, accountId)
    if (validationError) {
      accountError.value = validationError === "qq-not-numeric"
        ? t("userSettings.imBinding.toast.invalidQQAccountDescription")
        : t("userSettings.imBinding.toast.invalidQQBotAccountDescription")
      focusElement(IM_BINDING_ACCOUNT_INPUT_ID)
      return null
    }
    accountError.value = ""
    return accountId
  }

  async function handleVerify() {
    if (!ensureEmailVerified()) return

    const userId = requireUserId()
    if (!userId) return

    const accountId = validateAccount(account.value.trim())
    if (!accountId) return

    if (platform.value === QQ_PLATFORM) {
      await sendQQVerificationCode(userId, accountId)
      return
    }

    await generateVerificationCode(userId, accountId)
  }

  async function handleRetryCurrentVerification() {
    if (!ensureEmailVerified()) return

    const userId = requireUserId()
    const currentBinding = current.value
    if (!userId || !currentBinding || currentBinding.verified) return

    const accountId = currentBinding.userId.trim()
    if (!accountId) {
      sendError.value = t("userSettings.imBinding.toast.missingAccountDescription")
      return
    }

    account.value = accountId

    if (currentBinding.platform === QQ_PLATFORM) {
      platform.value = QQ_PLATFORM
      await sendQQVerificationCode(userId, accountId)
      return
    }

    if (!isSocialPlatform(currentBinding.platform)) {
      sendError.value = t("userSettings.imBinding.toast.missingAccountDescription")
      return
    }

    platform.value = currentBinding.platform
    await generateVerificationCode(userId, accountId)
  }

  async function handleQQDialogVerify(userId: string) {
    const inputCode = qqInputCode.value.trim()
    if (!inputCode) {
      dialogError.value = t("userSettings.imBinding.toast.inputQQCodeDescription")
      focusElement(IM_BINDING_CODE_INPUT_ID)
      return
    }

    dialogError.value = ""
    const response = await runAsyncAction(
      verifying,
      () => verifyQQ(userId, account.value.trim(), inputCode),
      {
        errorTitle: t("userSettings.imBinding.toast.verifyFailedTitle"),
        onError(error) {
          dialogError.value = describeError(error, t("userSettings.imBinding.toast.verifyFailedFallback")).message
          focusElement(IM_BINDING_CODE_INPUT_ID)
        },
      }
    )
    if (!response) return

    const updated = extractUpdatedSocial(response)
    if (!updated) {
      dialogError.value = t("userSettings.imBinding.toast.incompleteResponseDescription")
      return
    }
    userStore.setUser({ socialPlatformInfo: updated })

    toast.success(t("userSettings.imBinding.toast.verifySuccessTitle"), {
      description: t("userSettings.imBinding.toast.verifySuccessDefaultDescription"),
    })
    showCodeDialog.value = false
    resetTurnstileState()
  }

  async function handleStatusDialogVerify(userId: string) {
    if (!statusToken.value) {
      dialogError.value = t("userSettings.imBinding.toast.missingStatusTokenDescription")
      return
    }

    dialogError.value = ""
    const response = await runAsyncAction(
      verifying,
      () => getSocialPlatformVerificationStatus(userId, statusToken.value as string),
      {
        errorTitle: t("userSettings.imBinding.toast.verifyFailedTitle"),
        onError(error) {
          dialogError.value = describeError(error, t("userSettings.imBinding.toast.verifyFailedFallback")).message
        },
      }
    )
    if (!response) return

    const responseStatus = response?.status
    const responseMessage = response?.message

    if (responseStatus === 400 && isNotVerifiedMessage(responseMessage)) {
      dialogError.value = t("userSettings.imBinding.toast.notVerifiedDescription")
      return
    }

    const updated = extractUpdatedSocial(response)
    if (updated) {
      userStore.setUser({ socialPlatformInfo: updated })
      toast.success(t("userSettings.imBinding.toast.verifySuccessTitle"), {
        description: t("userSettings.imBinding.toast.verifySuccessDefaultDescription"),
      })
      showCodeDialog.value = false
      return
    }

    dialogError.value = isNotVerifiedMessage(responseMessage)
      ? t("userSettings.imBinding.toast.notVerifiedDescription")
      : t("userSettings.imBinding.toast.notVerifiedFallbackDescription")
  }

  async function handleDialogVerify() {
    if (!ensureEmailVerified()) return

    const userId = requireUserId()
    if (!userId) return

    if (dialogMode.value === "qq") {
      await handleQQDialogVerify(userId)
      return
    }

    await handleStatusDialogVerify(userId)
  }

  /**
   * Removes the current social binding. Rejects on failure so the confirm
   * dialog stays open with the reason; never toasts the failure itself.
   */
  async function handleUnbind() {
    if (!ensureEmailVerified()) return

    const userId = requireUserId()
    if (!userId) return

    const response = await runAsyncAction(clearing, () => clearSocialPlatformBinding(userId), {
      errorTitle: t("userSettings.common.actionFailedTitle"),
      throwOnError: true,
    })
    if (!response) return

    userStore.setUser({ socialPlatformInfo: null })
    toast.success(t("userSettings.imBinding.toast.unboundSuccessTitle"), {
      description: t("userSettings.imBinding.toast.unboundSuccessDescription"),
    })
  }

  return {
    current,
    isTurnstileEnabled,
    isEmailVerified,
    canRetryCurrentVerification,
    isCurrentQQBinding,
    sending,
    clearing,
    qqInputCode,
    verifying,
    generatedCode,
    account,
    accountError,
    sendError,
    dialogError,
    showCodeDialog,
    platform,
    statusToken,
    dialogMode,
    turnstileToken,
    onTurnstileVerify,
    onTurnstileInvalid,
    clearAccountError,
    clearDialogError,
    handleVerify,
    handleRetryCurrentVerification,
    handleDialogVerify,
    handleUnbind,
  }
}
