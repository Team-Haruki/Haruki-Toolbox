<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { Activity, LogIn, RefreshCcw, Trophy, UserSearch } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import GameAccountOption from "@/shared/components/GameAccountOption.vue"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { useUserStore } from "@/shared/stores/user"
import { useRankBorderContext } from "../composables/rank-border-context"
import TrackerFreshness from "./TrackerFreshness.vue"

const { t } = useI18n()
const userStore = useUserStore()

const { query, live, ui } = useRankBorderContext()
const {
  selectedRegion,
  selectedEventId,
  mode,
  selectedWorldBloomCharacterId,
  intervalSeconds,
  hideProfileAssets,
  masterOptions,
  eventComboboxOptions,
  selectedWorldBloomCharacter,
  modeOptions,
  isSelectedWorldBloomEvent,
  intervalOptions,
  accountOptions,
  selectedAccountKey,
  selectedAccount,
  selectedEventIdNumber,
  updateRegion,
  updateMode,
  updateInterval,
  updateEvent,
  updateWorldBloomCharacter,
  updateAccount,
} = query
const {
  liveRefreshing,
  canRefresh,
  trackerStatusTone,
  trackerStatusLabel,
  trackerStaleWarning,
  tracker,
  refreshData,
} = live
const { openDetailPage } = ui

const locateOpen = ref(false)
const locating = ref(false)
const manualUserId = ref("")
const validManualUserId = computed(() => /^[1-9]\d*$/.test(manualUserId.value.trim()))

function locateManualUser() {
  if (!validManualUserId.value || !canRefresh.value) return
  locateOpen.value = false
  openDetailPage({ kind: "user", userId: manualUserId.value.trim() })
}

const locateDisabled = computed(() =>
  accountOptions.value.length === 0 || !canRefresh.value || locating.value,
)

// Locating an account on another server first switches the region and waits
// for that region's default event to resolve, then navigates to the detail
// page with the private own-account target.
async function locateSelectedAccount() {
  const account = selectedAccount.value
  if (!account || locating.value) {
    return
  }

  locating.value = true
  try {
    if (account.server !== selectedRegion.value) {
      query.switchRegion(account.server)
      const ready = await waitForEventSelection()
      if (!ready) {
        return
      }
    }

    locateOpen.value = false
    openDetailPage({ kind: "user", userId: account.userId, own: true })
  } finally {
    locating.value = false
  }
}

function waitForEventSelection(timeoutMs = 12_000): Promise<boolean> {
  if (selectedEventIdNumber.value > 0) {
    return Promise.resolve(true)
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      stop()
      resolve(false)
    }, timeoutMs)
    const stop = watch(selectedEventIdNumber, (eventId) => {
      if (eventId > 0) {
        clearTimeout(timeout)
        stop()
        resolve(true)
      }
    })
  })
}
</script>

<template>
  <Card size="compact" class="gap-0 py-0">
    <CardContent class="grid gap-2.5 p-2.5 sm:p-3 xl:px-4 xl:py-3.5">
      <!-- Title row: the status group may wrap onto its own line on phones (and wrap inside
           itself), so a long en-US pill never pushes the refresh button off-screen. -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 class="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg">
          <Trophy class="size-5 shrink-0" />
          <span class="truncate">{{ t("rankBorder.title") }}</span>
        </h1>
        <p class="hidden min-w-0 flex-1 basis-40 text-xs leading-5 text-muted-foreground lg:block">
          {{ t("rankBorder.notice.description") }}
        </p>
        <!-- Phones: the refresh button stays beside the title (order-1) and the status group
             takes the next line; from sm the group precedes the button on the right. -->
        <div class="order-2 flex min-w-0 basis-full flex-wrap items-center gap-2 sm:order-none sm:ml-auto sm:basis-auto sm:justify-end">
          <span
            :class="[
              'inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium leading-4',
              trackerStatusTone === 'live'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                : trackerStatusTone === 'amber'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                  : trackerStatusTone === 'red'
                    ? 'border-destructive/40 bg-destructive/10 text-destructive-tint-foreground'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200',
            ]"
            role="status"
          >
            <span :class="['rank-border-live-dot', trackerStatusTone === 'live' ? 'rank-border-live-dot--pulse' : '']" />
            <span class="min-w-0">{{ trackerStatusLabel }}</span>
          </span>
          <TrackerFreshness :status-timestamp="tracker.status.value?.timestamp ?? null" :as-of="tracker.asOf.value" />
        </div>
        <!-- The label is visually hidden on phones, so the button names itself for assistive tech. -->
        <Button
          type="button"
          size="sm"
          class="order-1 ml-auto shrink-0 sm:order-none sm:ml-0"
          :disabled="!canRefresh || liveRefreshing"
          :aria-label="liveRefreshing ? t('rankBorder.actions.refreshing') : t('rankBorder.actions.refresh')"
          @click="refreshData()"
        >
          <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
          <span class="hidden sm:inline">{{ liveRefreshing ? t("rankBorder.actions.refreshing") : t("rankBorder.actions.refresh") }}</span>
        </Button>
      </div>

      <p
        v-if="trackerStaleWarning"
        role="status"
        :class="[
          'rounded-md border px-3 py-2 text-xs leading-5',
          trackerStatusTone === 'red'
            ? 'border-destructive/40 bg-destructive/5 text-destructive-tint-foreground'
            : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
        ]"
      >
        {{ trackerStaleWarning }}
      </p>

      <div class="rank-border-toolbar-controls">
        <div class="rank-border-toolbar-field rank-border-toolbar-field--event">
          <Combobox
            trigger-id="rank-toolbar-event"
            :model-value="selectedEventId"
            :options="eventComboboxOptions"
            :disabled="masterOptions.loading.value || eventComboboxOptions.length === 0"
            :clearable="false"
            trigger-class="rank-border-event-combobox-trigger"
            content-class="rank-border-event-combobox-content"
            :placeholder="masterOptions.loading.value ? t('rankBorder.fields.loadingEvents') : t('rankBorder.fields.eventPlaceholder')"
            :search-placeholder="t('rankBorder.fields.eventSearchPlaceholder')"
            :empty-text="t('rankBorder.fields.eventEmpty')"
            :icon-component="Activity"
            :aria-label="t('rankBorder.fields.event')"
            @update:model-value="updateEvent"
          />
        </div>

        <Select :model-value="selectedRegion" :disabled="masterOptions.loading.value" :aria-label="t('rankBorder.fields.region')" @update:model-value="updateRegion">
          <SelectTrigger class="rank-border-toolbar-field" :aria-label="t('rankBorder.fields.region')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
              {{ resolveSekaiRegionLabel(option.value, t) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select v-if="isSelectedWorldBloomEvent" :model-value="mode" :aria-label="t('rankBorder.fields.mode')" @update:model-value="updateMode">
          <SelectTrigger class="rank-border-toolbar-field" :aria-label="t('rankBorder.fields.mode')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in modeOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select
          v-if="isSelectedWorldBloomEvent && mode === 'world_bloom'"
          :model-value="selectedWorldBloomCharacterId ?? undefined"
          :aria-label="t('rankBorder.fields.worldBloomCharacter')"
          @update:model-value="updateWorldBloomCharacter"
        >
          <SelectTrigger class="rank-border-toolbar-field rank-border-toolbar-field--wl" :aria-label="t('rankBorder.fields.worldBloomCharacter')">
            <SelectValue :placeholder="t('rankBorder.fields.worldBloomCharacterPlaceholder')">
              {{ selectedWorldBloomCharacter?.label ?? t('rankBorder.fields.worldBloomCharacterPlaceholder') }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent class="rank-border-world-bloom-select-content">
            <SelectItem
              v-for="option in masterOptions.worldBloomCharacterOptions.value"
              :key="option.value"
              :value="option.value"
            >
              <span class="rank-border-world-bloom-select-item">
                <span>{{ option.label }}</span>
                <span v-if="option.active" class="rank-border-world-bloom-select-item__badge">{{ t("rankBorder.badges.current") }}</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="intervalSeconds" :aria-label="t('rankBorder.fields.interval')" @update:model-value="updateInterval">
          <SelectTrigger class="rank-border-toolbar-field" :aria-label="t('rankBorder.fields.interval')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in intervalOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Popover v-model:open="locateOpen">
          <PopoverTrigger as-child>
            <Button type="button" variant="outline" class="rank-border-toolbar-field shrink-0">
              <UserSearch class="size-4" />
              {{ t("rankBorder.actions.locate") }}
            </Button>
          </PopoverTrigger>
          <PopoverContent class="w-80 max-w-[92vw]" align="end">
            <div class="grid gap-3">
              <div class="grid gap-1.5">
                <Label id="rank-toolbar-account-label" for="rank-toolbar-account">{{ t("rankBorder.fields.account") }}</Label>
                <Select
                  id="rank-toolbar-account"
                  :model-value="selectedAccountKey"
                  :disabled="accountOptions.length === 0"
                  @update:model-value="updateAccount"
                >
                  <SelectTrigger class="w-full" aria-labelledby="rank-toolbar-account-label">
                    <GameAccountOption
                      v-if="selectedAccount"
                      :server="selectedAccount.server"
                      :user-id="selectedAccount.userId"
                      :verified="selectedAccount.verified"
                      :is-default="selectedAccount.isDefault"
                    />
                    <span v-else class="text-sm text-muted-foreground">
                      {{ t("rankBorder.fields.accountPlaceholder") }}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                      <GameAccountOption
                        :server="account.server"
                        :user-id="account.userId"
                        :verified="account.verified"
                        :is-default="account.isDefault"
                      />
                    </SelectItem>
                  </SelectContent>
                </Select>
                <!-- Signed out: there is no account to pick, so say "log in" rather than "nothing bound". -->
                <template v-if="!userStore.isLoggedIn">
                  <p class="text-xs leading-5 text-muted-foreground">{{ t("rankBorder.result.privateLookupLoginRequired") }}</p>
                  <Button as-child variant="outline">
                    <RouterLink :to="{ path: '/user/login', query: { redirect: '/rank-border' } }">
                      <LogIn class="size-4" />
                      {{ t("rankBorder.actions.login") }}
                    </RouterLink>
                  </Button>
                </template>
                <template v-else>
                  <p
                    :class="[
                      'text-xs leading-5',
                      accountOptions.length === 0 ? 'text-destructive-tint-foreground' : 'text-muted-foreground',
                    ]"
                  >
                    {{ accountOptions.length === 0 ? t("rankBorder.result.noBoundAccount") : t("rankBorder.sections.locateDescription") }}
                  </p>
                  <Button type="button" :disabled="locateDisabled" @click="locateSelectedAccount">
                    <UserSearch :class="['size-4', locating ? 'animate-pulse' : '']" />
                    {{ t("rankBorder.actions.locate") }}
                  </Button>
                </template>
              </div>

              <form class="grid gap-1.5 border-t pt-3" @submit.prevent="locateManualUser">
                <Label for="rank-toolbar-uid">{{ t("rankBorder.fields.gameUid") }}</Label>
                <Input id="rank-toolbar-uid" v-model="manualUserId" inputmode="numeric" :placeholder="t('rankBorder.fields.gameUidPlaceholder')" />
                <p class="text-xs leading-5 text-muted-foreground">{{ t("rankBorder.fields.gameUidHint") }}</p>
                <Button type="submit" :disabled="!validManualUserId || !canRefresh">
                  <UserSearch class="size-4" />
                  {{ t("rankBorder.actions.locate") }}
                </Button>
              </form>

              <div class="grid gap-1.5 border-t pt-3">
                <div class="flex min-w-0 items-center gap-2">
                  <Switch
                    v-model="hideProfileAssets"
                    class="shrink-0"
                    :aria-label="t('rankBorder.fields.hideProfileAssets')"
                  />
                  <p class="min-w-0 text-sm font-medium leading-5">{{ t("rankBorder.fields.hideProfileAssets") }}</p>
                </div>
                <p class="text-xs leading-5 text-muted-foreground">{{ t("rankBorder.fields.hideProfileAssetsHint") }}</p>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <p v-if="masterOptions.error.value" class="text-xs text-destructive">{{ masterOptions.error.value }}</p>
    </CardContent>
  </Card>
</template>

<style scoped>
.rank-border-toolbar-controls {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.rank-border-toolbar-field {
  min-width: 0;
  flex: 1 1 7.5rem;
}

.rank-border-toolbar-field--event {
  flex: 6 1 15rem;
}

.rank-border-toolbar-field--wl {
  flex: 3 1 12rem;
}

.rank-border-event-combobox-trigger {
  min-width: 0;
  width: 100%;
}

.rank-border-event-combobox-content,
.rank-border-world-bloom-select-content {
  width: min(92vw, 42rem);
}

.rank-border-world-bloom-select-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.35;
  white-space: normal;
}

.rank-border-world-bloom-select-item__badge {
  flex: 0 0 auto;
  border: 1px solid color-mix(in oklab, rgb(8 145 178) 34%, transparent);
  border-radius: 9999px;
  background: color-mix(in oklab, rgb(8 145 178) 10%, transparent);
  padding: 0.0625rem 0.375rem;
  color: rgb(14 116 144);
  font-size: 0.6875rem;
  font-weight: 700;
}

/* The dot takes the pill's text colour, so amber/red states are not announced by a green light. */
.rank-border-live-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  flex: 0 0 auto;
  border-radius: 9999px;
  background: currentColor;
}

.rank-border-live-dot--pulse {
  box-shadow: 0 0 0 0 color-mix(in oklab, currentColor 34%, transparent);
  animation: rank-border-live-pulse 1.6s ease-out infinite;
}

@keyframes rank-border-live-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in oklab, currentColor 34%, transparent);
  }

  70% {
    box-shadow: 0 0 0 0.45rem transparent;
  }

  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
