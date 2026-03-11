<template>
  <router-view></router-view>
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
import {
  computed,
  onBeforeUnmount,
  ref,
  watch
} from "vue"
import {Toaster} from "@/components/ui/sonner";

const userStore = useUserStore()
const isLoggedIn = computed(() => userStore.isLoggedIn)
const syncingUserId = ref<string | null>(null)
const syncedUserId = ref<string | null>(null)
const latestSyncRequestId = ref(0)
const syncRetryTimer = ref<ReturnType<typeof setTimeout> | null>(null)
const syncRetryUserId = ref<string | null>(null)
const syncRetryCount = ref(0)
const MAX_SYNC_RETRIES = 3
const { t } = useI18n()
const logger = createLogger("app-settings-sync")

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
    const response = await getSettings(userId)
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
      if (syncRetryUserId.value && syncRetryUserId.value !== userId) {
        clearSyncRetryState()
      }
      void syncUserSettings(userId)
    } else {
      latestSyncRequestId.value += 1
      syncingUserId.value = null
      syncedUserId.value = null
      userStore.setSettingsSyncState("idle")
      clearSyncRetryState()
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  clearSyncRetryState()
})
</script>
