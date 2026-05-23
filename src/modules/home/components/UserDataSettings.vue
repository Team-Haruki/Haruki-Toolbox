<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Database, Eraser, RefreshCw, UserRound } from "lucide-vue-next"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import {
  fetchDeckRecommendProfileWithCache,
  fetchDeckRecommendUserDataWithCache,
} from "@/modules/deck-recommend/lib/user-data"
import {
  clearDeckRecommendUserDataCache,
  readDeckRecommendProfileCache,
  readDeckRecommendUserDataCache,
} from "@/modules/deck-recommend/lib/user-data-cache"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion } from "@/types"
import type { DeckRecommendUserDataMode } from "@/modules/deck-recommend/api/recommend-data"

type DeckRecommendUserCacheDataType = DeckRecommendUserDataMode | "profile"

type BoundAccountOption = {
  key: string
  server: SekaiRegion
  uid: string
  label: string
}

const { t, locale } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()

const selectedAccountKey = ref("")
const selectedDataMode = ref<DeckRecommendUserCacheDataType>("suite")
const refreshing = ref(false)
const clearing = ref(false)
const cacheUpdatedAt = ref<number | null>(null)
const cacheUploadTime = ref<number | null>(null)
const lastCacheHit = ref<boolean | null>(null)

const accountOptions = computed<BoundAccountOption[]>(() => {
  const accounts = Array.isArray(userStore.gameAccountBindings) ? userStore.gameAccountBindings : []
  return accounts.map((account) => {
    const uid = String(account.userId)
    return {
      key: `${account.server}:${uid}`,
      server: account.server,
      uid,
      label: formatGameAccountLabel({
        regionLabel: resolveSekaiRegionLabel(account.server, t),
        uid,
        hideUid: settingsStore.hideGameUserId,
      }),
    }
  })
})

const selectedAccount = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)
const selectedAccountLabel = computed(() => selectedAccount.value?.label ?? "")

const canRefresh = computed(() =>
  Boolean(userStore.userId && selectedAccount.value) && !refreshing.value && !clearing.value,
)

const canClear = computed(() =>
  Boolean(userStore.userId) && !refreshing.value && !clearing.value,
)

const dataModeOptions = computed<Array<{ value: DeckRecommendUserCacheDataType; label: string }>>(() => [
  { value: "suite", label: t("homeSettings.userData.types.suite") },
  { value: "mysekai", label: t("homeSettings.userData.types.mysekai") },
  { value: "profile", label: t("homeSettings.userData.types.profile") },
])

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
    toast.error(t("homeSettings.userData.toast.refreshFailed"), {
      description: error instanceof Error ? error.message : String(error),
    })
  } finally {
    refreshing.value = false
  }
}

async function clearUserDataCache() {
  clearing.value = true
  try {
    await clearDeckRecommendUserDataCache(userStore.userId)
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

    const record = await readDeckRecommendUserDataCache({
      toolboxUserId: userStore.userId,
      server: account.server,
      gameUserId: account.uid,
      mode: selectedDataMode.value,
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
  }).format(normalizeTimestampForDate(value))
}

function normalizeTimestampForDate(value: number) {
  return value < 1_000_000_000_000 ? value * 1000 : value
}
</script>

<template>
  <div class="space-y-5">
    <section class="space-y-4 rounded-md border bg-muted/20 p-4">
      <div class="space-y-1.5">
        <h3 class="flex items-center gap-2 text-base font-semibold">
          <Database class="size-5" />
          {{ t("homeSettings.userData.title") }}
        </h3>
        <p class="max-w-3xl text-sm text-muted-foreground">
          {{ t("homeSettings.userData.description") }}
        </p>
      </div>

      <div class="grid gap-3 md:grid-cols-2">
        <div class="grid gap-2">
          <Label>{{ t("homeSettings.userData.account") }}</Label>
          <Select v-model="selectedAccountKey" :disabled="accountOptions.length === 0 || refreshing || clearing">
            <SelectTrigger class="w-full">
              <SelectValue :key="`user-data-account-value-${selectedAccountLabel}`" :placeholder="t('homeSettings.userData.accountPlaceholder')">
                {{ selectedAccountLabel }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                {{ account.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p v-if="accountOptions.length === 0" class="text-xs text-muted-foreground">
            {{ t("homeSettings.userData.noAccount") }}
          </p>
        </div>

        <div class="grid gap-2">
          <Label>{{ t("homeSettings.userData.dataType") }}</Label>
          <Select v-model="selectedDataMode" :disabled="refreshing || clearing">
            <SelectTrigger class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in dataModeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div :class="['grid gap-2', selectedDataMode === 'profile' ? 'sm:grid-cols-2' : 'sm:grid-cols-3']">
        <div class="rounded-md border border-border/70 bg-muted/40 p-3 shadow-sm">
          <p class="text-xs text-muted-foreground">{{ t("homeSettings.userData.cacheUpdatedAt") }}</p>
          <p class="mt-1 text-sm font-medium">{{ formatTime(cacheUpdatedAt) }}</p>
        </div>
        <div v-if="selectedDataMode !== 'profile'" class="rounded-md border border-border/70 bg-muted/40 p-3 shadow-sm">
          <p class="text-xs text-muted-foreground">{{ t("homeSettings.userData.remoteUploadTime") }}</p>
          <p class="mt-1 text-sm font-medium">{{ formatTime(cacheUploadTime) }}</p>
        </div>
        <div class="rounded-md border border-border/70 bg-muted/40 p-3 shadow-sm">
          <p class="text-xs text-muted-foreground">{{ t("homeSettings.userData.lastCheck") }}</p>
          <p class="mt-1 text-sm font-medium">
            <template v-if="lastCacheHit === true">{{ t("homeSettings.userData.cacheHit") }}</template>
            <template v-else-if="lastCacheHit === false">{{ t("homeSettings.userData.cacheUpdated") }}</template>
            <template v-else>{{ t("homeSettings.userData.notChecked") }}</template>
          </p>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" :disabled="!canRefresh" @click="refreshUserData">
          <RefreshCw class="size-4" :class="{ 'animate-spin': refreshing }" />
          {{ refreshing ? t("homeSettings.userData.refreshing") : t("homeSettings.userData.refresh") }}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <Button type="button" variant="destructive" :disabled="!canClear">
              <Eraser class="size-4" />
              {{ t("homeSettings.userData.clear") }}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{ t("homeSettings.userData.clearDialog.title") }}</AlertDialogTitle>
              <AlertDialogDescription>{{ t("homeSettings.userData.clearDialog.description") }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t("common.cancel") }}</AlertDialogCancel>
              <AlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="clearUserDataCache">
                {{ t("homeSettings.userData.clearDialog.confirm") }}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>

    <section class="rounded-md border bg-muted/20 p-4">
      <p class="flex items-start gap-2 text-sm text-muted-foreground">
        <UserRound class="mt-0.5 size-4 shrink-0" />
        <span>{{ t("homeSettings.userData.logoutCleanupHint") }}</span>
      </p>
    </section>
  </div>
</template>
