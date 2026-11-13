<script setup lang="ts">
import MissingGameDataNotice from "@/shared/components/MissingGameDataNotice.vue"
import { getMissingUploadDataType } from "@/shared/sekai/user-snapshot/missing-data"

import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { CloudUpload, Eraser, Gamepad2, HardDrive, History, Layers, RefreshCw } from "lucide-vue-next"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import ConfirmDialog from "@/shared/components/ConfirmDialog.vue"
import SettingsFacts, { type SettingsFact } from "@/shared/components/settings/SettingsFacts.vue"
import SettingsGroup from "@/shared/components/settings/SettingsGroup.vue"
import SettingsRow from "@/shared/components/settings/SettingsRow.vue"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import {
  fetchDeckRecommendProfileWithCache,
  fetchDeckRecommendUserDataWithCache,
} from "@/modules/deck-recommend/lib/user-data"
import {
  clearDeckRecommendUserDataCache,
  readDeckRecommendProfileCache,
} from "@/modules/deck-recommend/lib/user-data-cache"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import { clearUserSuiteSubsetCache, summarizeUserSuiteSubsetCache } from "@/shared/sekai/user-snapshot/cache"
import { useUserStore } from "@/shared/stores/user"
import {
  ensureAccessibleGameAccountsLoaded,
  getAccessibleGameAccountsRef,
} from "@/shared/sekai/user-snapshot/accessible-accounts"
import { buildSelectableGameAccounts } from "@/shared/sekai/user-snapshot/selectable-accounts"
import type { SekaiRegion } from "@/types"

// No MySekai entry: nothing in the toolbox reads a local copy of the MySekai
// upload (the deck engine's MySekai inputs are Suite tables).
type DeckRecommendUserCacheDataType = "suite" | "profile"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  verified: boolean
  isDefault: boolean
  ownership: "own" | "granted"
  ownerName: string | null
  capabilities: ReadonlySet<string>
}

const missingDataType = ref<ReturnType<typeof getMissingUploadDataType>>(null)

const { t, locale } = useI18n()
const userStore = useUserStore()

const selectedAccountKey = ref("")
const selectedDataMode = ref<DeckRecommendUserCacheDataType>("suite")
const refreshing = ref(false)
const clearing = ref(false)
const cacheUpdatedAt = ref<number | null>(null)
const cacheUploadTime = ref<number | null>(null)
const lastCacheHit = ref<boolean | null>(null)

const accessibleAccounts = getAccessibleGameAccountsRef()
watch(
  () => userStore.userId,
  (value) => {
    ensureAccessibleGameAccountsLoaded(value || null)
  },
  { immediate: true },
)

const accountOptions = computed<BoundAccountOption[]>(() => {
  // Hold until the post-login sync hydrates bindings (see selector race),
  // and only offer granted accounts holding at least one data type this
  // panel can manage a cache for (suite or profile).
  if (!Array.isArray(userStore.gameAccountBindings)) {
    return []
  }
  return buildSelectableGameAccounts(userStore.gameAccountBindings, accessibleAccounts.value)
    .filter((account) =>
      account.ownership === "own" || account.capabilities.has("suite") || account.capabilities.has("profile"))
    .map((account) => ({
    key: account.key,
    server: account.server,
    uid: String(account.userId),
    verified: account.verified === true,
    isDefault: account.isDefault === true,
    ownership: account.ownership,
    ownerName: account.owner?.name ?? null,
    capabilities: account.capabilities,
  }))
})

const selectedAccount = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)

const canRefresh = computed(() =>
  Boolean(userStore.userId && selectedAccount.value) && !refreshing.value && !clearing.value,
)

const canClear = computed(() =>
  Boolean(userStore.userId) && !refreshing.value && !clearing.value,
)

const dataModeOptions = computed<Array<{ value: DeckRecommendUserCacheDataType; label: string }>>(() => {
  const account = selectedAccount.value
  if (account?.ownership === "granted") {
    // A granted account exposes exactly the granted data types.
    return [
      ...(account.capabilities.has("suite")
        ? [{ value: "suite" as const, label: t("homeSettings.userData.types.suite") }]
        : []),
      ...(account.capabilities.has("profile")
        ? [{ value: "profile" as const, label: t("homeSettings.userData.types.profile") }]
        : []),
    ]
  }
  return [
    { value: "suite", label: t("homeSettings.userData.types.suite") },
    { value: "profile", label: t("homeSettings.userData.types.profile") },
  ]
})

watch(
  dataModeOptions,
  () => {
    if (!dataModeOptions.value.some((option) => option.value === selectedDataMode.value)) {
      selectedDataMode.value = dataModeOptions.value[0]?.value ?? "suite"
    }
  },
  { immediate: true },
)

watch(
  accountOptions,
  (accounts) => {
    if (accounts.length === 0) {
      selectedAccountKey.value = ""
      return
    }

    if (!accounts.some((account) => account.key === selectedAccountKey.value)) {
      selectedAccountKey.value = accounts[0].key
    }
  },
  { immediate: true },
)

watch(
  [selectedAccount, selectedDataMode],
  () => {
    missingDataType.value = null
    void loadCacheStatus()
  },
  { immediate: true },
)

onMounted(() => {
  void loadCacheStatus()
})

async function refreshUserData() {
  const account = selectedAccount.value
  if (!userStore.userId || !account) {
    return
  }

  const dataMode = selectedDataMode.value
  missingDataType.value = null
  refreshing.value = true
  try {
    if (selectedDataMode.value === "profile") {
      const result = await fetchDeckRecommendProfileWithCache({
        toolboxUserId: userStore.userId,
        server: account.server,
        gameUserId: account.uid,
      }, { strategy: "refresh" })
      cacheUpdatedAt.value = result.cacheUpdatedAt
      cacheUploadTime.value = null
      lastCacheHit.value = result.cacheHit
      toast.success(t("homeSettings.userData.toast.refreshed"))
      return
    }

    const result = await fetchDeckRecommendUserDataWithCache({
      toolboxUserId: userStore.userId,
      server: account.server,
      gameUserId: account.uid,
      mode: selectedDataMode.value,
    })
    cacheUpdatedAt.value = result.cacheUpdatedAt
    cacheUploadTime.value = result.remoteUploadTime
    lastCacheHit.value = result.cacheHit
    toast.success(t(result.cacheHit ? "homeSettings.userData.toast.alreadyCurrent" : "homeSettings.userData.toast.refreshed"))
  } catch (error) {
    if (selectedAccount.value?.key !== account.key || selectedDataMode.value !== dataMode) return
    missingDataType.value = getMissingUploadDataType(error)
    if (missingDataType.value) return
    toast.error(t("homeSettings.userData.toast.refreshFailed"), {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    refreshing.value = false
  }
}

const clearDialogOpen = ref(false)

async function clearUserDataCache() {
  clearing.value = true
  try {
    await clearDeckRecommendUserDataCache(userStore.userId)
    await clearUserSuiteSubsetCache(userStore.userId)
    cacheUpdatedAt.value = null
    cacheUploadTime.value = null
    lastCacheHit.value = null
    toast.info(t("homeSettings.userData.toast.cleared"))
  } catch (error) {
    toast.error(t("homeSettings.userData.toast.clearFailed"), {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    clearing.value = false
  }
}

async function loadCacheStatus() {
  const account = selectedAccount.value
  if (!userStore.userId || !account) {
    cacheUpdatedAt.value = null
    cacheUploadTime.value = null
    lastCacheHit.value = null
    return
  }

  try {
    if (selectedDataMode.value === "profile") {
      const record = await readDeckRecommendProfileCache({
        toolboxUserId: userStore.userId,
        server: account.server,
        gameUserId: account.uid,
      })
      cacheUpdatedAt.value = record?.updatedAt ?? null
      cacheUploadTime.value = null
      lastCacheHit.value = null
      return
    }

    // Suite data lives in the shared snapshot cache. Records are keyed per
    // fetched key subset, so scan every subset for this account — pages
    // fetch different subsets (deck-recommend vs the profile page's snapshot
    // source) and all of them count as cached.
    const record = await summarizeUserSuiteSubsetCache({
      toolboxUserId: userStore.userId,
      server: account.server,
      gameUserId: account.uid,
    })
    cacheUpdatedAt.value = record?.updatedAt ?? null
    cacheUploadTime.value = record?.uploadTime ?? null
    lastCacheHit.value = null
  } catch {
    cacheUpdatedAt.value = null
    cacheUploadTime.value = null
    lastCacheHit.value = null
  }
}

function formatTime(value: number | null) {
  if (!value) {
    return t("homeSettings.userData.never")
  }

  return new Intl.DateTimeFormat(locale.value, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(suiteUploadTimeToMillis(value))
}

const lastCheckLabel = computed(() => {
  if (lastCacheHit.value === true) {
    return t("homeSettings.userData.cacheHit")
  }
  if (lastCacheHit.value === false) {
    return t("homeSettings.userData.cacheUpdated")
  }
  return t("homeSettings.userData.notChecked")
})

// A profile is fetched live from the game server, so it has no upload time.
const cacheFacts = computed<SettingsFact[]>(() => [
  { key: "cached", label: t("homeSettings.userData.cacheUpdatedAt"), value: formatTime(cacheUpdatedAt.value), icon: HardDrive },
  ...(selectedDataMode.value === "profile"
    ? []
    : [{ key: "uploaded", label: t("homeSettings.userData.remoteUploadTime"), value: formatTime(cacheUploadTime.value), icon: CloudUpload }]),
  { key: "checked", label: t("homeSettings.userData.lastCheck"), value: lastCheckLabel.value, icon: History },
])
</script>

<template>
  <div class="space-y-5">
    <SettingsGroup :title="t('homeSettings.userData.groups.source')">
      <SettingsRow
        :icon="Gamepad2"
        :label="t('homeSettings.userData.account')"
        label-for="user-data-account"
        label-id="user-data-account-label"
        stack
      >
        <template v-if="accountOptions.length === 0" #note>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ t("homeSettings.userData.noAccount") }}</p>
        </template>
        <Select id="user-data-account" v-model="selectedAccountKey" :aria-label="t('homeSettings.userData.account')" :disabled="accountOptions.length === 0 || refreshing || clearing">
          <SelectTrigger class="w-full @min-[28rem]:w-56" aria-labelledby="user-data-account-label">
            <GameAccountOption
              v-if="selectedAccount"
              :server="selectedAccount.server"
              :user-id="selectedAccount.uid"
              :verified="selectedAccount.verified"
              :is-default="selectedAccount.isDefault"
              :ownership="selectedAccount.ownership"
            />
            <span v-else class="text-sm text-muted-foreground">
              {{ t("homeSettings.userData.accountPlaceholder") }}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
              <GameAccountOption
                :server="account.server"
                :user-id="account.uid"
                :verified="account.verified"
                :is-default="account.isDefault"
                :ownership="account.ownership"
                :owner-name="account.ownerName"
              />
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>

      <SettingsRow
        :icon="Layers"
        :label="t('homeSettings.userData.dataType')"
        label-for="user-data-mode"
        label-id="user-data-mode-label"
        stack
      >
        <Select id="user-data-mode" v-model="selectedDataMode" :aria-label="t('homeSettings.userData.dataType')" :disabled="refreshing || clearing">
          <SelectTrigger class="w-full @min-[28rem]:w-56" aria-labelledby="user-data-mode-label">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in dataModeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsRow>
    </SettingsGroup>

    <SettingsGroup :title="t('homeSettings.userData.groups.cache')">
      <SettingsFacts :items="cacheFacts" />

      <MissingGameDataNotice
        v-if="missingDataType"
        :data-type="missingDataType"
        :granted="selectedAccount?.ownership === 'granted'"
        class="px-4 py-6"
      />

      <template #footer>
        <Button
          type="button"
          size="sm"
          variant="outline"
          :title="t('homeSettings.userData.refreshHint')"
          :disabled="!canRefresh"
          @click="refreshUserData"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': refreshing }" />
          {{ refreshing ? t("homeSettings.userData.refreshing") : t("homeSettings.userData.refresh") }}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          class="text-destructive hover:text-destructive"
          :disabled="!canClear"
          @click="clearDialogOpen = true"
        >
          <Eraser class="size-3.5" />
          {{ t("homeSettings.userData.clear") }}
        </Button>
        <ConfirmDialog
          v-model:open="clearDialogOpen"
          :title="t('homeSettings.userData.clearDialog.title')"
          :description="t('homeSettings.userData.clearDialog.description')"
          :confirm-label="t('homeSettings.userData.clearDialog.confirm')"
          destructive
          :on-confirm="clearUserDataCache"
        />
      </template>
    </SettingsGroup>
  </div>
</template>
