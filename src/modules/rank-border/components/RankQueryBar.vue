<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { Activity, RefreshCcw, Server, Trophy } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Combobox } from "@/components/ui/combobox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { useRankBorderContext } from "../composables/rank-border-context"

const { t } = useI18n()

const { query, live } = useRankBorderContext()
const {
  selectedRegion,
  selectedEventId,
  mode,
  selectedWorldBloomCharacterId,
  intervalSeconds,
  masterOptions,
  eventComboboxOptions,
  selectedWorldBloomCharacter,
  modeOptions,
  intervalOptions,
  updateRegion,
  updateMode,
  updateInterval,
  updateEvent,
  updateWorldBloomCharacter,
} = query
const {
  liveRefreshing,
  canRefresh,
  trackerStatusTone,
  trackerStatusLabel,
  refreshData,
} = live
</script>

<template>
  <Card class="gap-2 rounded-lg py-2 sm:gap-3 sm:py-3 xl:rounded-xl xl:py-5">
    <CardHeader class="gap-2 px-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-4 xl:px-5">
      <div class="min-w-0 space-y-1.5">
        <CardTitle class="flex flex-wrap items-center gap-2 text-lg">
          <Trophy class="size-5" />
          {{ t("rankBorder.title") }}
        </CardTitle>
        <CardDescription class="hidden sm:block">{{ t("rankBorder.description") }}</CardDescription>
        <p class="hidden items-start gap-1.5 text-xs text-muted-foreground sm:flex">
          <Server class="mt-0.5 size-3.5 shrink-0" />
          <span>{{ t("rankBorder.notice.description") }}</span>
        </p>
      </div>
    </CardHeader>

    <CardContent class="grid gap-2 px-2 pb-2 sm:gap-3 sm:px-4 sm:pb-4 xl:px-5 xl:pb-5">
      <div class="rank-border-query-bar rounded-md border bg-muted/10 p-2.5">
        <div class="rank-border-query-field rank-border-query-field--region">
          <Label id="rank-query-region-label" for="rank-query-region">{{ t("rankBorder.fields.region") }}</Label>
          <Select id="rank-query-region" :model-value="selectedRegion" :disabled="masterOptions.loading.value" @update:model-value="updateRegion">
            <SelectTrigger class="w-full" aria-labelledby="rank-query-region-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                {{ resolveSekaiRegionLabel(option.value, t) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="rank-border-query-field rank-border-query-field--mode">
          <Label id="rank-query-mode-label" for="rank-query-mode">{{ t("rankBorder.fields.mode") }}</Label>
          <Select id="rank-query-mode" :model-value="mode" @update:model-value="updateMode">
            <SelectTrigger class="w-full" aria-labelledby="rank-query-mode-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in modeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="rank-border-query-field rank-border-query-field--event">
          <Label for="rank-query-event">{{ t("rankBorder.fields.event") }}</Label>
          <Combobox
            trigger-id="rank-query-event"
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
            @update:model-value="updateEvent"
          />
        </div>

        <div v-if="mode === 'world_bloom'" class="rank-border-query-field rank-border-query-field--world-bloom">
          <Label id="rank-query-world-bloom-label" for="rank-query-world-bloom">{{ t("rankBorder.fields.worldBloomCharacter") }}</Label>
          <Select id="rank-query-world-bloom" :model-value="selectedWorldBloomCharacterId ?? undefined" @update:model-value="updateWorldBloomCharacter">
            <SelectTrigger class="rank-border-world-bloom-select-trigger w-full" aria-labelledby="rank-query-world-bloom-label">
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
        </div>

        <div class="rank-border-query-field rank-border-query-field--interval">
          <Label id="rank-query-interval-label" for="rank-query-interval">{{ t("rankBorder.fields.interval") }}</Label>
          <Select id="rank-query-interval" :model-value="intervalSeconds" @update:model-value="updateInterval">
            <SelectTrigger class="w-full" aria-labelledby="rank-query-interval-label">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in intervalOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="rank-border-query-actions">
          <span
            :class="[
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
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
          <Button type="button" :disabled="!canRefresh || liveRefreshing" @click="refreshData(true)">
            <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
            {{ liveRefreshing ? t("rankBorder.actions.refreshing") : t("rankBorder.actions.refresh") }}
          </Button>
        </div>
      </div>

      <p v-if="masterOptions.error.value" class="text-xs text-destructive">{{ masterOptions.error.value }}</p>
    </CardContent>
  </Card>
</template>

<style scoped>
.rank-border-query-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.625rem;
}

.rank-border-query-field {
  display: grid;
  min-width: 0;
  gap: 0.375rem;
  flex: 1 1 12rem;
}

.rank-border-query-field .text-sm,
.rank-border-query-field label {
  min-width: 0;
}

.rank-border-query-field--region {
  flex: 1 1 7rem;
}

.rank-border-query-field--mode {
  flex: 1 1 8rem;
}

.rank-border-query-field--event {
  flex: 4 1 16rem;
}

.rank-border-query-field--world-bloom {
  flex: 3 1 14rem;
}

.rank-border-query-field--interval {
  flex: 1 1 7rem;
}

.rank-border-query-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}

.rank-border-event-combobox-trigger {
  min-width: 0;
}

.rank-border-event-combobox-content {
  width: min(92vw, 42rem);
}

.rank-border-world-bloom-select-trigger {
  min-width: 0;
  height: auto;
  min-height: 2.25rem;
}

.rank-border-world-bloom-select-trigger :deep([data-slot="select-value"]) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.25;
  text-align: left;
}

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

@media (min-width: 768px) {
  .rank-border-query-actions {
    align-self: flex-end;
  }
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
