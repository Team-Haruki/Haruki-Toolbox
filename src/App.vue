<template>
  <router-view></router-view>
  <PointerEffects />
  <Toaster position="top-right" richColors/>
</template>

<script setup lang="ts">
import 'vue-sonner/style.css'
import { toast } from "vue-sonner"
import { useUserStore } from "@/shared/stores/user"
import { getSettings } from "@/modules/user-settings/api/get-settings"
import { useI18n } from "vue-i18n"
import { extractErrorMessage } from "@/lib/error-utils"
import { createLogger } from "@/lib/logger"
import { claimSessionOnce } from "@/lib/session-once"
import { useRoute, useRouter } from "vue-router"
import {
  refreshDeckRecommendProfilesForBoundAccounts,
  refreshDeckRecommendSuitesForBoundAccounts,
} from "@/modules/deck-recommend/lib/user-data"
import type { SekaiRegion } from "@/types/store"
import { consumeLoginSuccessPendingFlag } from "@/modules/auth/lib/login-success"
import {
  computed,
  onBeforeUnmount,
  ref,
  watch
} from "vue"
import {Toaster} from "@/components/ui/sonner";
import PointerEffects from "@/shared/components/PointerEffects.vue"

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const syncingUserId = ref<string | null>(null)
const syncedUserId = ref<string | null>(null)
const latestSyncRequestId = ref(0)
const syncRetryTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const syncRetryUserId = ref<string | null>(null)
const syncRetryCount = ref(0)
const profileRefreshSignature = ref("")
const MAX_SYNC_RETRIES = 3
const BOUND_ACCOUNT_PREFETCH_TTL_MS = 5 * 60_000
const { t } = useI18n()
const logger = createLogger("app-settings-sync")
const hasLoginSuccessFlag = ref(false)
const boundGameAccountSignature = computed(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts
    .map((account) => `${account.server}:${String(account.userId).trim()}`)
    .sort((left, right) => left.localeCompare(right))
    .join("|")
})

function consumeLoginSuccessFlag() {
  return consumeLoginSuccessPendingFlag(route.query._login_success === "1")
}

function clearSyncRetryState(resetCount = true) {
  if (syncRetryTimer.value !== null) {
    clearTimeout(syncRetryTimer.value)
    syncRetryTimer.value = null
  }
  if (resetCount) {
    syncRetryUserId.value = null
    syncRetryCount.value = 0
  }
}

function clearLoginSuccessFlag() {
  hasLoginSuccessFlag.value = false
}

function clearLegacyLoginSuccessQuery() {
  if (route.query._login_success !== "1") {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery._login_success
  void router.replace({
    path: route.path,
    query: nextQuery,
    hash: route.hash,
  })
}

hasLoginSuccessFlag.value = consumeLoginSuccessFlag()

watch(
  () => route.query._login_success,
  () => {
    if (!hasLoginSuccessFlag.value) {
      hasLoginSuccessFlag.value = consumeLoginSuccessFlag()
    }
    clearLegacyLoginSuccessQuery()
  },
  { immediate: true }
)

function scheduleSyncRetry(userId: string) {
  if (syncRetryUserId.value !== userId) {
    syncRetryUserId.value = userId
    syncRetryCount.value = 0
  }

  if (syncRetryCount.value >= MAX_SYNC_RETRIES) {
    return false
  }

  const attempt = syncRetryCount.value + 1
  syncRetryCount.value = attempt
  const delayMs = 1000 * 2 ** (attempt - 1)

  clearSyncRetryState(false)
  syncRetryTimer.value = setTimeout(() => {
    syncRetryTimer.value = null
    if (!userStore.isLoggedIn || userStore.userId !== userId || syncedUserId.value === userId) {
      return
    }
    void syncUserSettings(userId)
  }, delayMs)

  return true
}

async function syncUserSettings(userId: string) {
  if (syncedUserId.value === userId || syncingUserId.value === userId) return

  clearSyncRetryState(false)
  const requestId = ++latestSyncRequestId.value
  const shouldNotifyRecovery = syncRetryCount.value > 0
  userStore.setSettingsSyncState("loading")
  syncingUserId.value = userId
  try {
    const response = await getSettings(userId, { skipAuthRedirect: true })
    if (requestId !== latestSyncRequestId.value) return
    if (!userStore.isLoggedIn || userStore.userId !== userId) return

    if (response.status !== 200) {
      throw new Error(t("core.sync.unexpectedStatusDescription", { status: response.status }))
    }

    if (!response.updatedData) {
      throw new Error(t("core.sync.missingUpdatedDataDescription"))
    }

    userStore.setUser(response.updatedData)
    userStore.setSettingsSyncState("synced")
    syncedUserId.value = userId
    clearSyncRetryState()
    if (shouldNotifyRecovery) {
      toast.success(t("core.sync.successTitle"), {
        description: t("core.sync.successDescription"),
      })
    }
  } catch (e) {
    if (requestId !== latestSyncRequestId.value) return
    if (!userStore.isLoggedIn || userStore.userId !== userId) return
    const willRetry = scheduleSyncRetry(userId)
    if (willRetry) {
      return
    }
    userStore.setSettingsSyncState("failed")
    logger.error("Failed to sync settings", e)
    toast.warning(t("core.sync.failedTitle"), {
      description: extractErrorMessage(e, t("core.sync.failedDescription")),
    })
  } finally {
    if (requestId !== latestSyncRequestId.value) return
    syncingUserId.value = null
  }
}

watch(
  [isLoggedIn, () => userStore.userId],
  ([loggedIn, userId]) => {
    if (loggedIn && userId) {
      if (userStore.settingsSyncState === "synced" && syncedUserId.value === null) {
        syncedUserId.value = userId
        clearSyncRetryState()
        return
      }
      if (syncRetryUserId.value && syncRetryUserId.value !== userId) {
        clearSyncRetryState()
      }
      void syncUserSettings(userId)
    } else if (loggedIn) {
      latestSyncRequestId.value += 1
      syncingUserId.value = null
      syncedUserId.value = null
      clearSyncRetryState()
      if (userStore.settingsSyncState === "idle") {
        userStore.setSettingsSyncState("loading")
      }
    } else {
      latestSyncRequestId.value += 1
      syncingUserId.value = null
      syncedUserId.value = null
      userStore.setSettingsSyncState("idle")
      clearSyncRetryState()
      clearLoginSuccessFlag()
    }
  },
  { immediate: true }
)

watch(
  [isLoggedIn, () => userStore.userId, () => userStore.settingsSyncState, boundGameAccountSignature],
  ([loggedIn, userId, settingsSyncState, accountSignature]) => {
    if (!loggedIn || !userId) {
      profileRefreshSignature.value = ""
      return
    }
    if (settingsSyncState !== "synced") {
      return
    }
    if (!accountSignature) {
      return
    }

    const signature = `${userId}:${accountSignature}`
    if (profileRefreshSignature.value === signature) {
      return
    }

    profileRefreshSignature.value = signature
    // The boot refresh is a cache warm-up: pages re-check on demand, so a
    // reload within a few minutes need not hit /profile and /suite again.
    if (!claimSessionOnce(`bound-account-prefetch:${signature}`, { ttlMs: BOUND_ACCOUNT_PREFETCH_TTL_MS })) {
      return
    }
    const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
    void refreshDeckRecommendProfilesForBoundAccounts({
      toolboxUserId: userId,
      accounts,
    })
    void prefetchBoundAccountSuites(userId, accounts, signature)
  },
  { immediate: true },
)

/**
 * Warms the suite cache for every bound account. Silent by design: a
 * loading/success toast on every page load is noise, and the "no uploaded
 * data" case is already explained inline by the pages that need the data.
 * Only a genuine failure surfaces, once per session per account set.
 */
async function prefetchBoundAccountSuites(
  toolboxUserId: string,
  accounts: readonly { server: SekaiRegion; userId: string | number }[],
  signature: string,
) {
  if (accounts.length === 0) {
    return
  }

  let failed: number
  try {
    const result = await refreshDeckRecommendSuitesForBoundAccounts({
      toolboxUserId,
      accounts,
    })
    failed = result.failed

    if (failed === 0 && result.updated > 0 && route.path === "/") {
      toast.success(t("core.suitePrefetch.successTitle"), {
        description: t("core.suitePrefetch.successDescription", { updated: result.updated, total: result.total }),
        duration: 3000,
      })
    }
  } catch (e) {
    logger.error("Failed to prefetch bound account suites", e)
    failed = accounts.length
  }

  if (failed > 0 && claimSessionOnce(`bound-account-prefetch-failed:${signature}`)) {
    toast.warning(t("core.suitePrefetch.partialTitle"), {
      description: t("core.suitePrefetch.partialDescription", { failed, total: accounts.length }),
    })
  }
}

watch(
  [hasLoginSuccessFlag, () => userStore.settingsSyncState],
  ([enabled, settingsSyncState]) => {
    if (!enabled) {
      return
    }

    if (!userStore.isLoggedIn || settingsSyncState === "failed" || settingsSyncState === "idle") {
      clearLoginSuccessFlag()
      return
    }

    if (settingsSyncState !== "synced") {
      return
    }

    toast.success(t("auth.login.toast.loginSuccessTitle"), {
      description: t("auth.login.toast.loginSuccessDescription"),
    })

    clearLoginSuccessFlag()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearSyncRetryState()
})
</script>
