import { computed, ref, watch, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion, UploadDataType } from "@/types"
import { isVerifiedQQBinding } from "@/lib/social-platform"
import { createLogger } from "@/lib/logger"
import { fetchWritableGameAccounts } from "@/shared/sekai/user-snapshot/accessible-accounts"
import {
  buildFallbackUploadTargetAccounts,
  buildUploadTargetAccounts,
  pickUploadTargetKey,
  pickWritableDataType,
  type UploadTargetAccount,
} from "@/modules/tools/lib/upload-targets"

export type { UploadTargetAccount } from "@/modules/tools/lib/upload-targets"

const logger = createLogger("upload-targets")

type UploadAccountStore = {
  isLoggedIn: boolean
  userId?: string | null
  allowCNMysekai: boolean | null
  socialPlatformInfo?: { platform: string; verified: boolean } | null
  gameAccountBindings?: Array<{
    server: SekaiRegion
    userId: string | number
    verified?: boolean
    isDefault?: boolean
  }> | null
}

/**
 * Account + data-type gating for the manual upload tab. The selectable list is
 * the backend's write-targets listing (`accessible-game-accounts?action=write`):
 * own verified bindings and received write grants, each carrying exactly the
 * data types it may receive. Ownership is never used as an upload gate.
 */
export function useUploadDataAccounts(userStore: UploadAccountStore, dataType: Ref<UploadDataType>) {
  const { t } = useI18n()
  const selectedAccountKey = ref<string | null>(null)
  const uploadAccounts = ref<UploadTargetAccount[]>([])
  const targetsLoading = ref(false)
  const targetsFailed = ref(false)
  let loadGeneration = 0

  async function loadUploadTargets() {
    const userId = userStore.userId
    const generation = ++loadGeneration
    if (!userId) {
      uploadAccounts.value = []
      targetsFailed.value = false
      targetsLoading.value = false
      return
    }
    targetsLoading.value = true
    try {
      const accounts = await fetchWritableGameAccounts(userId)
      if (generation !== loadGeneration) return
      uploadAccounts.value = buildUploadTargetAccounts(accounts)
      targetsFailed.value = false
    } catch (error) {
      if (generation !== loadGeneration) return
      // The listing is a convenience, not the authorization: keep the page
      // usable with the session's own bindings and let the server decide.
      logger.warn("Failed to load upload targets, falling back to own bindings", error)
      uploadAccounts.value = buildFallbackUploadTargetAccounts(
        Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : [],
      )
      targetsFailed.value = true
    } finally {
      if (generation === loadGeneration) {
        targetsLoading.value = false
      }
    }
  }

  watch(
    () => userStore.userId ?? null,
    () => {
      void loadUploadTargets()
    },
    { immediate: true },
  )

  const selectedAccount = computed(() => {
    const key = selectedAccountKey.value
    if (!key) return null
    return uploadAccounts.value.find((account) => account.key === key) ?? null
  })

  const hasUploadableAccount = computed(() => uploadAccounts.value.some((account) => account.canUpload))

  const disabledReason = computed(() => {
    if (!userStore.isLoggedIn) return t("tools.uploadData.disabledReason.loginRequired")
    if (targetsLoading.value) return null
    if (uploadAccounts.value.length === 0) return t("tools.uploadData.disabledReason.noBoundAccount")
    if (!hasUploadableAccount.value) return t("tools.uploadData.disabledReason.noWritableAccount")
    return null
  })

  // MySekai upload features require a verified QQ on the HarukiBot social
  // binding; without it every mysekai option on the upload page is hidden.
  const hasVerifiedQQ = computed(() => isVerifiedQQBinding(userStore.socialPlatformInfo))

  const isCNMySekaiForbidden = computed(() => {
    return selectedAccount.value?.server === "cn" && userStore.allowCNMysekai !== true && dataType.value === "mysekai"
  })

  const canSelectSuiteDataType = computed(() => selectedAccount.value?.writable.has("suite") === true)

  const canSelectMySekaiDataType = computed(() => {
    if (!hasVerifiedQQ.value) {
      return false
    }
    if (selectedAccount.value?.writable.has("mysekai") !== true) {
      return false
    }
    return selectedAccount.value.server !== "cn" || userStore.allowCNMysekai === true
  })

  function isDataTypeSelectable(value: UploadDataType) {
    return value === "suite" ? canSelectSuiteDataType.value : canSelectMySekaiDataType.value
  }

  watch(
    [selectedAccount, canSelectSuiteDataType, canSelectMySekaiDataType, dataType],
    () => {
      const account = selectedAccount.value
      if (!account) return
      const next = pickWritableDataType(account, dataType.value, isDataTypeSelectable)
      if (next && next !== dataType.value) {
        dataType.value = next
      }
    },
    { immediate: true },
  )

  watch(
    uploadAccounts,
    (accounts) => {
      selectedAccountKey.value = pickUploadTargetKey(accounts, selectedAccountKey.value)
    },
    { immediate: true },
  )

  return {
    selectedAccountKey,
    uploadAccounts,
    selectedAccount,
    targetsLoading,
    targetsFailed,
    disabledReason,
    hasVerifiedQQ,
    isCNMySekaiForbidden,
    canSelectSuiteDataType,
    canSelectMySekaiDataType,
    loadUploadTargets,
  }
}
