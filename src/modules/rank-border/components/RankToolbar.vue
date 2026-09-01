<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { Activity, RefreshCcw, Trophy, UserSearch } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
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
import { useRankBorderContext } from "../composables/rank-border-context"

const { t } = useI18n()

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
  refreshData,
} = live
const { openDetailPage } = ui

const locateOpen = ref(false)
const locating = ref(false)

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
  <Card class="gap-0 rounded-lg py-0 xl:rounded-xl">
    <CardContent class="grid gap-2.5 p-2.5 sm:p-3 xl:px-4 xl:py-3.5">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 class="flex min-w-0 items-center gap-2 text-base font-semibold sm:text-lg">
          <Trophy class="size-5 shrink-0" />
          <span class="truncate">{{ t("rankBorder.title") }}</span>
        </h1>
        <p class="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground lg:block">
          {{ t("rankBorder.notice.description") }}
        </p>
        <div class="ml-auto flex shrink-0 items-center gap-2">
          <span
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
              trackerStatusTone === 'live'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                : trackerStatusTone === 'amber'
                  ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                  : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200',
            ]"
          >
            <span class="rank-border-live-dot" />
            {{ trackerStatusLabel }}
          </span>
          <Button type="button" size="sm" :disabled="!canRefresh || liveRefreshing" @click="refreshData(true)">
            <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
            <span class="hidden sm:inline">{{ liveRefreshing ? t("rankBorder.actions.refreshing") : t("rankBorder.actions.refresh") }}</span>
          </Button>
        </div>
      </div>

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

        <Select :model-value="selectedRegion" :disabled="masterOptions.loading.value" @update:model-value="updateRegion">
          <SelectTrigger class="rank-border-toolbar-field" :aria-label="t('rankBorder.fields.region')">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
              {{ resolveSekaiRegionLabel(option.value, t) }}
            </SelectItem>
          </SelectContent>
        </Select>

        <Select :model-value="mode" @update:model-value="updateMode">
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
          v-if="mode === 'world_bloom'"
          :model-value="selectedWorldBloomCharacterId ?? undefined"
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

        <Select :model-value="intervalSeconds" @update:model-value="updateInterval">
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
                <p
                  :class="[
                    'text-xs leading-5',
                    accountOptions.length === 0 ? 'text-destructive' : 'text-muted-foreground',
                  ]"
                >
                  {{ accountOptions.length === 0 ? t("rankBorder.result.noBoundAccount") : t("rankBorder.sections.locateDescription") }}
                </p>
                <Button type="button" :disabled="locateDisabled" @click="locateSelectedAccount">
                  <UserSearch :class="['size-4', locating ? 'animate-pulse' : '']" />
                  {{ t("rankBorder.actions.locate") }}
                </Button>
              </div>

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

.rank-border-live-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: rgb(16 185 129);
  box-shadow: 0 0 0 0 rgb(16 185 129 / 0.34);
  animation: rank-border-live-pulse 1.6s ease-out infinite;
}

@keyframes rank-border-live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0.34);
  }

  70% {
    box-shadow: 0 0 0 0.45rem rgb(16 185 129 / 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0);
  }
}
</style>
