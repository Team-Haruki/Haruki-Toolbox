<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import DateTimePicker24h from "@/components/ui/datetime-picker/DateTimePicker24h.vue"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import { resolveCharacterIconUrl } from "@/shared/sekai/data-sources"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import EventBannerImage from "../components/EventBannerImage.vue"
import EventPointTrendChart from "../components/EventPointTrendChart.vue"
import EventTypeBadge from "../components/EventTypeBadge.vue"
import type { SekaiEventType } from "../lib/event-filter"
import { useEventRecordsMaster } from "../composables/useEventRecordsMaster"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import {
  buildDerivedRankMap,
  buildEventPointTrend,
  buildEventRecordRows,
  buildWorldBloomGroups,
  derivedChapterRankKey,
  derivedEventRankKey,
  formatDerivedRankTier,
  mergeWorldBloomIntoRows,
  normalizeUserEventRecords,
  normalizeUserHonorIds,
  normalizeUserWorldBloomRecords,
  summarizeEventRecords,
  worldBloomChapterKey,
} from "../lib/event-records"

const { t } = useI18n()
const settingsStore = useSettingsStore()

const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const { selectedAccount } = useGameAccountSelection()
const suite = useUserSuite(["userEvents", "userWorldBlooms", "userHonors"], selectedAccount)

const region = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)
// Only used inside the ready branch, where an account is always selected.
const bannerRegion = computed<SekaiRegion>(() => region.value ?? "jp")

const master = useEventRecordsMaster(region)

const state = computed<"idle" | "loading" | "error" | "ready">(() => {
  if (suite.status.value === "idle") {
    return "idle"
  }

  if (suite.status.value === "loading" || master.loading.value) {
    return "loading"
  }

  if (suite.status.value === "error" || master.error.value != null) {
    return "error"
  }

  return "ready"
})

const userEvents = computed(() => normalizeUserEventRecords(suite.data.value?.userEvents))

const rows = computed(() => buildEventRecordRows(userEvents.value, master.eventsById.value))

/** Rank brackets reverse-derived from owned event ranking honors (badges). */
const derivedRanks = computed(() => buildDerivedRankMap(
  normalizeUserHonorIds(suite.data.value?.userHonors),
  master.honorRankIndex.value,
))

function displayEventRank(eventId: number, rank: number | null): string {
  if (rank != null) {
    return formatNumberCN(rank)
  }

  const tier = derivedRanks.value.get(derivedEventRankKey(eventId))
  return tier != null ? formatDerivedRankTier(tier) : "—"
}

function displayChapterRank(eventId: number, gameCharacterId: number | null, rank: number | null): string {
  if (rank != null) {
    return formatNumberCN(rank)
  }

  const tier = derivedRanks.value.get(derivedChapterRankKey(eventId, gameCharacterId))
  return tier != null ? formatDerivedRankTier(tier) : "—"
}

const TIME_MODES = ["year", "all", "custom"] as const
type TimeMode = (typeof TIME_MODES)[number]

const EVENT_TYPE_OPTIONS: readonly SekaiEventType[] = ["marathon", "cheerful_carnival", "world_bloom"]

const timeMode = ref<TimeMode>("year")
const customStart = ref<Date | undefined>(undefined)
const customEnd = ref<Date | undefined>(undefined)
const typeFilters = ref<SekaiEventType[]>([])

function handleTimeModeChange(value: unknown) {
  if (typeof value === "string" && (TIME_MODES as readonly string[]).includes(value)) {
    timeMode.value = value as TimeMode
  }
}

function toggleTypeFilter(value: SekaiEventType, checked: boolean) {
  const current = typeFilters.value.filter((item) => item !== value)
  typeFilters.value = checked ? [...current, value] : current
}

const timeWindow = computed<{ from: number | null; to: number | null }>(() => {
  if (timeMode.value === "all") {
    return { from: null, to: null }
  }
  if (timeMode.value === "year") {
    return { from: Date.now() - 365 * 24 * 60 * 60 * 1000, to: null }
  }
  return {
    from: customStart.value?.getTime() ?? null,
    to: customEnd.value?.getTime() ?? null,
  }
})

// Rows without a dated master event only survive the unfiltered "all" view.
const filteredRows = computed(() => rows.value.filter((row) => {
  const { from, to } = timeWindow.value
  const startAt = row.event?.startAt ?? null
  if (from != null || to != null) {
    if (startAt == null) {
      return false
    }
    if (from != null && startAt < from) {
      return false
    }
    if (to != null && startAt > to) {
      return false
    }
  }

  if (typeFilters.value.length > 0) {
    const eventType = row.event?.eventType ?? null
    if (eventType == null || !typeFilters.value.includes(eventType)) {
      return false
    }
  }

  return true
}))

const filteredEventIds = computed(() => new Set(filteredRows.value.map((row) => row.eventId)))

const worldGroups = computed(() =>
  buildWorldBloomGroups(
    normalizeUserWorldBloomRecords(suite.data.value?.userWorldBlooms),
    master.eventsById.value,
    master.chapterNoIndex.value,
  ),
)

const tableRows = computed(() => mergeWorldBloomIntoRows(filteredRows.value, worldGroups.value))

const trend = computed(() => buildEventPointTrend(filteredRows.value, derivedRanks.value))
const summary = computed(() => summarizeEventRecords(
  userEvents.value.filter((record) => filteredEventIds.value.has(record.eventId)),
))

const summaryChips = computed(() => [
  { key: "participated", label: t("eventRecords.summary.participated"), value: formatNumberCN(summary.value.participated) },
  { key: "bestPoint", label: t("eventRecords.summary.bestPoint"), value: formatNumberCN(summary.value.bestPoint) },
  { key: "averagePoint", label: t("eventRecords.summary.averagePoint"), value: formatNumberCN(summary.value.averagePoint) },
])

const uploadTimeText = computed(() =>
  formatLocalizedDateTime(
    suite.uploadTime.value == null ? null : suiteUploadTimeToMillis(suite.uploadTime.value),
    { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" },
    t("events.common.dateFallback"),
  ),
)

function reloadAll() {
  void suite.reload()
  void master.reload()
}

function characterName(gameCharacterId: number | null) {
  if (gameCharacterId == null) {
    return t("eventRecords.worldLink.finale")
  }

  return master.characterMap.value.get(gameCharacterId)?.name ?? `#${gameCharacterId}`
}

function formatRecordDate(value: number | null) {
  return formatLocalizedDate(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit" },
    t("events.common.dateFallback"),
  )
}

</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("eventRecords.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("eventRecords.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1 sm:items-end">
        <div class="flex flex-wrap items-center gap-2">
          <GameAccountSelect />
          <Button variant="ghost" size="sm" class="h-7 gap-1 text-xs text-muted-foreground" @click="reloadAll">
            <LucideRefreshCcw class="size-3.5" />
            {{ t("eventRecords.refresh") }}
          </Button>
        </div>
        <p v-if="state === 'ready'" class="text-xs text-muted-foreground">
          {{ t("eventRecords.dataAsOf", { time: uploadTimeText }) }}
        </p>
      </div>
    </div>

    <!-- No account selected / none bound -->
    <Card v-if="state === 'idle'">
      <CardContent class="py-12 text-center text-sm text-muted-foreground">
        {{ t("eventRecords.idle") }}
      </CardContent>
    </Card>

    <!-- Loading -->
    <template v-else-if="state === 'loading'">
      <Skeleton class="h-20 w-full" />
      <Skeleton class="h-64 w-full" />
      <Skeleton class="h-96 w-full" />
    </template>

    <!-- Error -->
    <Card v-else-if="state === 'error'">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <p class="text-sm text-muted-foreground">{{ t("eventRecords.loadFailed") }}</p>
        <Button variant="outline" size="sm" @click="reloadAll">
          <LucideRefreshCcw class="mr-1 h-4 w-4" /> {{ t("eventRecords.retry") }}
        </Button>
      </CardContent>
    </Card>

    <template v-else>
      <!-- Filters -->
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Tabs :model-value="timeMode" @update:model-value="handleTimeModeChange">
            <TabsList class="h-8">
              <TabsTrigger value="year" class="text-xs">{{ t("eventRecords.filters.lastYear") }}</TabsTrigger>
              <TabsTrigger value="all" class="text-xs">{{ t("eventRecords.filters.all") }}</TabsTrigger>
              <TabsTrigger value="custom" class="text-xs">{{ t("eventRecords.filters.custom") }}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div v-if="timeMode === 'custom'" class="flex flex-wrap items-center gap-2">
            <div class="w-48">
              <DateTimePicker24h v-model="customStart" :placeholder="t('eventRecords.filters.from')" :aria-label="t('eventRecords.filters.from')" />
            </div>
            <span class="text-xs text-muted-foreground">—</span>
            <div class="w-48">
              <DateTimePicker24h v-model="customEnd" :placeholder="t('eventRecords.filters.to')" :aria-label="t('eventRecords.filters.to')" />
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">{{ t("eventRecords.filters.type") }}</span>
          <label
            v-for="eventType in EVENT_TYPE_OPTIONS"
            :key="eventType"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-md border bg-background/70 px-2 py-1.5 text-xs transition-colors hover:bg-muted/40',
              typeFilters.includes(eventType)
                ? 'border-cyan-300 bg-cyan-50 text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-100'
                : '',
            ]"
          >
            <Checkbox
              :model-value="typeFilters.includes(eventType)"
              @update:model-value="checked => toggleTypeFilter(eventType, checked === true)"
            />
            {{ t(`events.type.${eventType}`) }}
          </label>
        </div>
      </div>

      <!-- Summary chips -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card v-for="chip in summaryChips" :key="chip.key">
          <CardContent class="p-4">
            <div class="text-xs text-muted-foreground">{{ chip.label }}</div>
            <div class="mt-1 text-xl font-bold tabular-nums">{{ chip.value }}</div>
          </CardContent>
        </Card>
      </div>

      <!-- PT trend -->
      <EventPointTrendChart :trend="trend" />

      <!-- Normal event records -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t("eventRecords.table.title") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <p v-if="tableRows.length === 0" class="text-sm text-muted-foreground">
            {{ t("eventRecords.noData") }}
          </p>
          <div v-else class="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t("eventRecords.table.event") }}</TableHead>
                  <TableHead>{{ t("eventRecords.table.type") }}</TableHead>
                  <TableHead class="text-right">{{ t("eventRecords.table.point") }}</TableHead>
                  <TableHead class="text-right">{{ t("eventRecords.table.rank") }}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-for="row in tableRows" :key="row.eventId">
                  <TableRow>
                    <TableCell>
                      <div class="flex min-w-0 items-center gap-3">
                        <div class="aspect-[2/1] w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                          <EventBannerImage
                            :region="bannerRegion"
                            :assetbundle-name="row.event?.assetbundleName ?? null"
                            :alt="row.name"
                            :preference="assetEndpoint"
                          />
                        </div>
                        <div class="min-w-0">
                          <RouterLink
                            v-if="row.event"
                            :to="`/events/${row.eventId}`"
                            class="block max-w-56 truncate text-sm font-medium underline-offset-4 hover:underline"
                          >
                            {{ row.name }}
                          </RouterLink>
                          <span v-else class="block max-w-56 truncate text-sm font-medium">{{ row.name }}</span>
                          <span class="text-xs text-muted-foreground">
                            <b class="font-semibold">#{{ row.eventId }}</b>
                            {{ formatRecordDate(row.event?.startAt ?? null) }}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EventTypeBadge :event-type="row.event?.eventType ?? null" />
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      {{ row.eventPoint != null ? formatNumberCN(row.eventPoint) : "—" }}
                    </TableCell>
                    <TableCell
                      class="text-right tabular-nums"
                      :title="row.rank == null && displayEventRank(row.eventId, row.rank) !== '—'
                        ? t('eventRecords.table.rankFromHonor')
                        : undefined"
                    >
                      {{ displayEventRank(row.eventId, row.rank) }}
                    </TableCell>
                  </TableRow>
                  <TableRow
                    v-for="chapter in row.chapters"
                    :key="worldBloomChapterKey(row.eventId, chapter.gameCharacterId)"
                    class="bg-muted/20"
                  >
                    <TableCell class="py-1.5">
                      <div class="flex min-w-0 items-center gap-2 pl-10">
                        <img
                          decoding="async"
                          v-if="chapter.gameCharacterId != null"
                          :src="resolveCharacterIconUrl(chapter.gameCharacterId)"
                          :alt="characterName(chapter.gameCharacterId)"
                          class="size-6 shrink-0 rounded-full ring-1 ring-border"
                          loading="lazy"
                        >
                        <span class="truncate text-xs">{{ characterName(chapter.gameCharacterId) }}</span>
                      </div>
                    </TableCell>
                    <TableCell class="py-1.5">
                      <span v-if="chapter.chapterNo != null" class="text-xs text-muted-foreground">
                        {{ t("eventRecords.worldLink.chapterLabel", { no: chapter.chapterNo }) }}
                      </span>
                    </TableCell>
                    <TableCell class="py-1.5 text-right text-xs tabular-nums">
                      {{ formatNumberCN(chapter.chapterPoint) }}
                    </TableCell>
                    <TableCell
                      class="py-1.5 text-right text-xs tabular-nums"
                      :title="chapter.rank == null && displayChapterRank(row.eventId, chapter.gameCharacterId, chapter.rank) !== '—'
                        ? t('eventRecords.table.rankFromHonor')
                        : undefined"
                    >
                      {{ displayChapterRank(row.eventId, chapter.gameCharacterId, chapter.rank) }}
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
