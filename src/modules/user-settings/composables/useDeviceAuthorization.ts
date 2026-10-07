import { computed, ref, shallowRef, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { useI18n } from "vue-i18n"
import { useNowTick } from "@/composables/useNowTick"
import { copyTextToClipboard } from "@/lib/clipboard"
import { useUserStore } from "@/shared/stores/user"
import { logoutInPlace } from "@/modules/auth/api/logout"
import {
  approveDeviceFlow,
  denyDeviceFlow,
  lookupDeviceCode,
  readDeviceApiError,
  type DeviceApiError,
  type DeviceDenyReason,
  type DeviceLookupResult,
} from "@/modules/user-settings/api/oauth2.device"
import {
  DEVICE_PAGE_PATH,
  buildDevicePageTarget,
  formatDeviceUserCode,
  formatDeviceUserCodeInput,
  isFramedWindow,
  isInAppBrowser,
  normalizeDeviceUserCode,
  readUserCodeQuery,
  resolveApproveLabel,
  secondsUntil,
} from "@/modules/user-settings/lib/device-code"
import {
  mapDeviceErrorCode,
  type DeviceErrorMessageCode,
  type DevicePageState,
} from "@/modules/user-settings/lib/device-flow"

export type DevicePendingAction = "lookup" | "approve" | "deny" | "switchAccount"

/**
 * State of the /device page (backend design §6.8): code entry, the review card
 * of a claimed code, and the result cards. The flow handle lives only in
 * memory, inside `review`; it never reaches the URL or any storage.
 */
export function useDeviceAuthorization() {
  const route = useRoute()
  const router = useRouter()
  const userStore = useUserStore()
  const { t } = useI18n()

  const framed = typeof window !== "undefined" && isFramedWindow(window)
  const inAppBrowser = typeof navigator !== "undefined" && isInAppBrowser(navigator.userAgent)

  const state = ref<DevicePageState>("entry")
  const codeInput = ref("")
  /** The code the current review was looked up with; approve resubmits it. */
  const lookedUpCode = ref("")
  const review = shallowRef<DeviceLookupResult | null>(null)
  const labelInput = ref("")
  const acknowledged = ref(false)
  const ackHighlighted = ref(false)
  const pendingAction = ref<DevicePendingAction | null>(null)
  const errorMessage = ref<DeviceErrorMessageCode | "">("")
  /**
   * An approve call ended without a response, so the device may have been
   * authorized. Kept until the person starts over with a new code.
   */
  const approveOutcomeUnknown = ref(false)
  const approvedAccountName = ref("")
  const rateLimitedUntil = ref(0)

  const now = useNowTick(1000)
  const retryAfterSeconds = computed(() => Math.max(0, Math.ceil((rateLimitedUntil.value - now.value) / 1000)))
  const isRateLimited = computed(() => retryAfterSeconds.value > 0)
  const remainingSeconds = computed(() => (review.value ? secondsUntil(review.value.expiresAt, now.value) : null))

  /** The inline message; the page never shows the backend's English text. */
  const errorText = computed(() => {
    const code = errorMessage.value
    if (!code) {
      return ""
    }
    if (code === "rate_limited" && retryAfterSeconds.value > 0) {
      return t("oauth.device.rateLimited", { seconds: retryAfterSeconds.value })
    }
    return t(`oauth.device.error.${code}`)
  })

  const pageState = computed<DevicePageState>(() => {
    if (framed) {
      return "framed"
    }
    if (!userStore.isLoggedIn) {
      return "signedOut"
    }
    return state.value
  })

  // The code arrives as ?user_code= (verification_uri_complete). It only fills
  // an empty input, is never submitted automatically, and leaves the address
  // bar at once together with any other parameter (device_challenge included).
  watch(
    () => route.query,
    (query) => {
      if (Object.keys(query).length === 0) {
        return
      }
      const code = readUserCodeQuery(query.user_code)
      if (!framed && code && codeInput.value === "") {
        codeInput.value = code
      }
      void router.replace({ query: {} })
    },
    { immediate: true },
  )

  watch(codeInput, (value) => {
    const formatted = formatDeviceUserCodeInput(value)
    if (formatted !== value) {
      codeInput.value = formatted
    }
  })

  watch(acknowledged, (value) => {
    if (value) {
      ackHighlighted.value = false
      if (errorMessage.value === "ack_required") {
        errorMessage.value = ""
      }
    }
  })

  watch(isRateLimited, (limited) => {
    if (!limited && errorMessage.value === "rate_limited") {
      errorMessage.value = ""
    }
  })

  watch(remainingSeconds, (seconds) => {
    if (seconds === 0 && state.value === "review" && pendingAction.value === null) {
      review.value = null
      errorMessage.value = ""
      state.value = "expired"
    }
  })

  function resetReview() {
    review.value = null
    labelInput.value = ""
    acknowledged.value = false
    ackHighlighted.value = false
  }

  function applyError(error: DeviceApiError) {
    const outcome = mapDeviceErrorCode(error, { approveOutcomeUnknown: approveOutcomeUnknown.value })
    if (outcome.retryAfter) {
      // Sync the shared tick first so the countdown starts at retryAfter.
      now.value = Date.now()
      rateLimitedUntil.value = now.value + outcome.retryAfter * 1000
    }
    if (outcome.highlightAck) {
      ackHighlighted.value = true
    }
    errorMessage.value = outcome.message

    switch (outcome.target) {
      case "stay":
        return
      case "signedOut":
        // The gateway found no session: the cached user is stale.
        errorMessage.value = ""
        resetReview()
        state.value = "entry"
        userStore.clearUser()
        return
      case "review":
        if (!review.value) {
          state.value = "entry"
        }
        return
      case "entry":
        resetReview()
        state.value = "entry"
        return
      default:
        resetReview()
        state.value = outcome.target
    }
  }

  async function submitCode() {
    if (pendingAction.value || isRateLimited.value) {
      return
    }
    const code = normalizeDeviceUserCode(codeInput.value)
    if (!code) {
      errorMessage.value = "malformed_code"
      return
    }
    const formatted = formatDeviceUserCode(code)
    pendingAction.value = "lookup"
    errorMessage.value = ""
    try {
      const result = await lookupDeviceCode(formatted)
      resetReview()
      codeInput.value = formatted
      lookedUpCode.value = formatted
      review.value = result
      state.value = "review"
    } catch (error: unknown) {
      applyError(readDeviceApiError(error))
    } finally {
      pendingAction.value = null
    }
  }

  async function approve() {
    const current = review.value
    if (!current || pendingAction.value || isRateLimited.value) {
      return
    }
    if (!acknowledged.value) {
      ackHighlighted.value = true
      errorMessage.value = "ack_required"
      return
    }
    pendingAction.value = "approve"
    errorMessage.value = ""
    try {
      const result = await approveDeviceFlow({
        flowHandle: current.flowHandle,
        userCode: lookedUpCode.value,
        label: resolveApproveLabel(labelInput.value, current.deviceLabel),
      })
      resetReview()
      if (result.status === "approved") {
        approvedAccountName.value = result.accountName || current.account.name || userStore.name
        state.value = "approved"
      } else {
        state.value = "unconfirmed"
      }
    } catch (error: unknown) {
      const apiError = readDeviceApiError(error)
      if (apiError.status === null) {
        // Never retried: the chain may have completed on the server.
        approveOutcomeUnknown.value = true
      }
      applyError(apiError)
    } finally {
      pendingAction.value = null
    }
  }

  async function deny(reason: DeviceDenyReason) {
    const current = review.value
    if (!current || pendingAction.value || isRateLimited.value) {
      return
    }
    pendingAction.value = "deny"
    errorMessage.value = ""
    try {
      await denyDeviceFlow(current.flowHandle, reason)
      resetReview()
      state.value = "denied"
    } catch (error: unknown) {
      applyError(readDeviceApiError(error))
    } finally {
      pendingAction.value = null
    }
  }

  /** "Enter a new code": forgets everything about the previous flow. */
  function startOver() {
    resetReview()
    approveOutcomeUnknown.value = false
    approvedAccountName.value = ""
    lookedUpCode.value = ""
    codeInput.value = ""
    errorMessage.value = ""
    state.value = "entry"
  }

  function goToLogin() {
    void router.push({ name: "user.login", query: { redirect: buildDevicePageTarget(codeInput.value) } })
  }

  async function switchAccount() {
    if (pendingAction.value) {
      return
    }
    pendingAction.value = "switchAccount"
    const target = buildDevicePageTarget(codeInput.value)
    try {
      await logoutInPlace()
      resetReview()
      state.value = "entry"
      await router.push({ name: "user.login", query: { redirect: target } })
    } finally {
      pendingAction.value = null
    }
  }

  /** Copies the code-free /device address for opening in the system browser. */
  async function copyDevicePageLink() {
    const copied = await copyTextToClipboard(`${window.location.origin}${DEVICE_PAGE_PATH}`)
    if (copied) {
      toast.success(t("oauth.device.inAppBrowser.copied"))
    } else {
      toast.error(t("oauth.device.inAppBrowser.copyFailed"))
    }
  }

  return {
    pageState,
    inAppBrowser,
    codeInput,
    review,
    labelInput,
    acknowledged,
    ackHighlighted,
    pendingAction,
    errorMessage,
    errorText,
    approveOutcomeUnknown,
    approvedAccountName,
    retryAfterSeconds,
    isRateLimited,
    remainingSeconds,
    submitCode,
    approve,
    deny,
    startOver,
    goToLogin,
    switchAccount,
    copyDevicePageLink,
  }
}
