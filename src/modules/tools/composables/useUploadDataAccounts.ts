import { computed, ref, watch, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import type { SekaiRegion, UploadDataType } from "@/types"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { isSekaiRegion } from "@/lib/sekai-region"
import { useSettingsStore } from "@/shared/stores/settings"

export interface BoundAccount {
  key: string
  server: SekaiRegion
  uid: string
  label: string
}

type UploadAccountStore = {
  isLoggedIn: boolean
  allowCNMysekai: boolean | null
  gameAccountBindings?: Array<{ server: SekaiRegion; userId: string | number }> | null
}

export function useUploadDataAccounts(userStore: UploadAccountStore, dataType: Ref<UploadDataType>) {
  const { t } = useI18n()
  const settingsStore = useSettingsStore()
  const selectedAccountKey = ref<string | null>(null)

  function regionLabel(server: SekaiRegion): string {
    switch (server) {
      case "jp":
        return t("tools.uploadData.region.jp")
      case "en":
        return t("tools.uploadData.region.en")
      case "tw":
        return t("tools.uploadData.region.tw")
      case "kr":
        return t("tools.uploadData.region.kr")
      case "cn":
        return t("tools.uploadData.region.cn")
    }
  }

  const boundAccounts = computed<BoundAccount[]>(() => {
    const raw = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []

    return raw.map((account) => {
      const server = account.server
      const uid = String(account.userId)

      return {
        key: `${server}:${uid}`,
        server,
        uid,
        label: formatGameAccountLabel({
          regionLabel: regionLabel(server),
          uid,
          hideUid: settingsStore.hideGameUserId,
        }),
      }
    })
  })

  const selectedAccount = computed(() => {
    const key = selectedAccountKey.value
    if (!key) return null

    const [server, uid] = key.split(":")
    if (!server || !uid || !isSekaiRegion(server)) return null

    return { server, uid }
  })

  const disabledReason = computed(() => {
    if (!userStore.isLoggedIn) return t("tools.uploadData.disabledReason.loginRequired")
    if (boundAccounts.value.length === 0) return t("tools.uploadData.disabledReason.noBoundAccount")
    return null
  })

  const isCNMySekaiForbidden = computed(() => {
    return selectedAccount.value?.server === "cn" && userStore.allowCNMysekai !== true && dataType.value === "mysekai"
  })

  const canSelectMySekaiDataType = computed(() => {
    return selectedAccount.value?.server !== "cn" || userStore.allowCNMysekai === true
  })

  watch(
    [canSelectMySekaiDataType, dataType],
    () => {
      if (!canSelectMySekaiDataType.value && dataType.value === "mysekai") {
        dataType.value = "suite"
      }
    },
    { immediate: true }
  )

  watch(
    boundAccounts,
    (accounts) => {
      if (accounts.length === 0) {
        selectedAccountKey.value = null
        return
      }

      const currentKey = selectedAccountKey.value
      if (!currentKey || !accounts.some((item) => item.key === currentKey)) {
        selectedAccountKey.value = accounts[0].key
      }
    },
    { immediate: true }
  )

  return {
    selectedAccountKey,
    boundAccounts,
    selectedAccount,
    disabledReason,
    isCNMySekaiForbidden,
    canSelectMySekaiDataType,
  }
}
