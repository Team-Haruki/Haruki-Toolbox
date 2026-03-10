import { computed, ref } from "vue"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { runAsyncAction } from "@/composables/useAsyncAction"
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

type DialogMode = "qq" | "other"

const QQ_PLATFORM: SocialPlatform = "qq"

export function useIMBindingSettings() {
  const { t } = useI18n()
  const userStore = useUserStore()

  const current = computed(() => userStore.socialPlatformInfo)
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
  const {
    turnstileToken,
    turnstileRef,
    onTurnstileVerify,
    onTurnstileInvalid,
    resetTurnstileState,
    triggerTurnstile,
  } = useIMBindingTurnstile()

  function requireUserId(actionTitle = t("userSettings.common.actionFailedTitle")): string | null {
    return resolveRequiredUserId(userStore.userId, actionTitle)
  }

  async function sendQQVerificationCode(userId: string, accountId: string) {
    if (!turnstileToken.value) {
      toast.error(t("userSettings.imBinding.toast.sendFailedTitle"), {
        description: t("userSettings.imBinding.toast.completeCaptchaDescription"),
      })
      triggerTurnstile()
      return
    }

    const challengeToken = turnstileToken.value
    const response = await runAsyncAction(
      sending,
      () => sendQQMailVerificationCode(userId, accountId, challengeToken),
      {
        errorTitle: t("userSettings.imBinding.toast.sendFailedTitle"),
        fallbackError: t("userSettings.imBinding.toast.sendFailedTitle"),
      }
    )
    resetTurnstileState()
    if (!response) return

    toast.success(t("userSettings.imBinding.toast.verificationCodeSentTitle"), {
      description: t("userSettings.imBinding.toast.verificationCodeSentDescription", { account: accountId }),
    })
    dialogMode.value = "qq"
    qqInputCode.value = ""
    showCodeDialog.value = true
  }

  async function generateVerificationCode(userId: string, accountId: string) {
    const response = await runAsyncAction(
      sending,
      () => generateSocialPlatformVerificationCode(userId, platform.value, accountId),
      {
        errorTitle: t("userSettings.imBinding.toast.generateFailedTitle"),
        fallbackError: t("userSettings.imBinding.toast.generateFailedTitle"),
      }
    )
    if (!response) return

    const { statusToken: token, oneTimePassword } = extractGeneratedCodeResult(response)
    if (!token || !oneTimePassword) {
      toast.error(t("userSettings.imBinding.toast.generateFailedTitle"), {
        description: t("userSettings.imBinding.toast.incompleteResponseDescription"),
      })
      return
    }

    statusToken.value = token
    generatedCode.value = oneTimePassword
    dialogMode.value = "other"
    showCodeDialog.value = true
    toast.success(t("userSettings.imBinding.toast.codeGeneratedTitle"))
  }

  async function handleVerify() {
    const userId = requireUserId()
    if (!userId) return

    const accountId = account.value.trim()
    if (!accountId) {
      toast.error(
        platform.value === QQ_PLATFORM
          ? t("userSettings.imBinding.toast.sendFailedTitle")
          : t("userSettings.imBinding.toast.generateFailedTitle"),
        {
          description:
            platform.value === QQ_PLATFORM
              ? t("userSettings.imBinding.toast.missingQQAccountDescription")
              : t("userSettings.imBinding.toast.missingAccountDescription"),
        }
      )
      return
    }

    if (platform.value === QQ_PLATFORM) {
      await sendQQVerificationCode(userId, accountId)
      return
    }

    await generateVerificationCode(userId, accountId)
  }

  async function handleRetryCurrentVerification() {
    const userId = requireUserId()
    const currentBinding = current.value
    if (!userId || !currentBinding || currentBinding.verified) return

    const accountId = currentBinding.userId.trim()
    if (!accountId) {
      toast.error(t("userSettings.imBinding.toast.verifyFailedTitle"), {
        description: t("userSettings.imBinding.toast.missingAccountDescription"),
      })
      return
    }

    account.value = accountId

    if (currentBinding.platform === QQ_PLATFORM) {
      platform.value = QQ_PLATFORM
      await sendQQVerificationCode(userId, accountId)
      return
    }

    if (!isSocialPlatform(currentBinding.platform)) {
      toast.error(t("userSettings.imBinding.toast.generateFailedTitle"), {
        description: t("userSettings.imBinding.toast.missingAccountDescription"),
      })
      return
    }

    platform.value = currentBinding.platform
    await generateVerificationCode(userId, accountId)
  }

  async function handleQQDialogVerify(userId: string) {
    const inputCode = qqInputCode.value.trim()
    if (!inputCode) {
      toast.error(t("userSettings.imBinding.toast.verifyFailedTitle"), {
        description: t("userSettings.imBinding.toast.inputQQCodeDescription"),
      })
      return
    }

    const response = await runAsyncAction(
      verifying,
      () => verifyQQ(userId, account.value.trim(), inputCode),
      {
        errorTitle: t("userSettings.imBinding.toast.verifyFailedTitle"),
        fallbackError: t("userSettings.imBinding.toast.verifyFailedTitle"),
      }
    )
    if (!response) return

    const updated = extractUpdatedSocial(response)
    if (!updated) {
      toast.error(t("userSettings.imBinding.toast.verifyFailedTitle"), {
        description: t("userSettings.imBinding.toast.incompleteResponseDescription"),
      })
      return
    }
    userStore.setUser({ socialPlatformInfo: updated })

    toast.success(t("userSettings.imBinding.toast.verifySuccessTitle"), {
      description: response?.message || t("userSettings.imBinding.toast.verifySuccessDefaultDescription"),
    })
    showCodeDialog.value = false
    resetTurnstileState()
  }

  async function handleStatusDialogVerify(userId: string) {
    if (!statusToken.value) {
      toast.error(t("userSettings.imBinding.toast.verifyFailedTitle"), {
        description: t("userSettings.imBinding.toast.missingStatusTokenDescription"),
      })
      return
    }

    const response = await runAsyncAction(
      verifying,
      () => getSocialPlatformVerificationStatus(userId, statusToken.value as string),
      {
        errorTitle: t("userSettings.imBinding.toast.verifyFailedTitle"),
        fallbackError: t("userSettings.imBinding.toast.verifyFailedTitle"),
      }
    )
    if (!response) return

    const responseStatus = response?.status
    const responseMessage = response?.message

    if (responseStatus === 400 && isNotVerifiedMessage(responseMessage)) {
      toast.error(t("userSettings.imBinding.toast.notVerifiedTitle"), {
        description: t("userSettings.imBinding.toast.notVerifiedDescription"),
      })
      return
    }

    const updated = extractUpdatedSocial(response)
    if (updated) {
      userStore.setUser({ socialPlatformInfo: updated })
      toast.success(t("userSettings.imBinding.toast.verifySuccessTitle"), {
        description: responseMessage || t("userSettings.imBinding.toast.verifySuccessDefaultDescription"),
      })
      showCodeDialog.value = false
      return
    }

    const description = responseMessage || t("userSettings.imBinding.toast.notVerifiedFallbackDescription")
    if (isNotVerifiedMessage(responseMessage)) {
      toast.error(t("userSettings.imBinding.toast.notVerifiedTitle"), {
        description: t("userSettings.imBinding.toast.notVerifiedDescription"),
      })
    } else {
      toast.error(t("userSettings.imBinding.toast.notVerifiedTitle"), { description })
    }
  }

  async function handleDialogVerify() {
    const userId = requireUserId()
    if (!userId) return

    if (dialogMode.value === "qq") {
      await handleQQDialogVerify(userId)
      return
    }

    await handleStatusDialogVerify(userId)
  }

  async function handleUnbind() {
    const userId = requireUserId()
    if (!userId) return

    const response = await runAsyncAction(clearing, () => clearSocialPlatformBinding(userId), {
      errorTitle: t("userSettings.common.actionFailedTitle"),
      fallbackError: t("userSettings.common.actionFailedTitle"),
    })
    if (!response) return

    userStore.setUser({ socialPlatformInfo: null })
    toast.success(t("userSettings.imBinding.toast.unboundSuccessTitle"), {
      description: response?.message || t("userSettings.imBinding.toast.unboundSuccessDescription"),
    })
  }

  return {
    current,
    canRetryCurrentVerification,
    isCurrentQQBinding,
    sending,
    clearing,
    qqInputCode,
    verifying,
    generatedCode,
    account,
    showCodeDialog,
    platform,
    statusToken,
    dialogMode,
    turnstileToken,
    turnstileRef,
    onTurnstileVerify,
    onTurnstileInvalid,
    handleVerify,
    handleRetryCurrentVerification,
    handleDialogVerify,
    handleUnbind,
  }
}
