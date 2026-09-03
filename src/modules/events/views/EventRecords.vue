<script setup lang="ts">
import { computed, reactive } from "vue"
import { RouterLink } from "vue-router"
import { useI18n } from "vue-i18n"
import { isAxiosError } from "axios"
import type { AcceptableValue } from "reka-ui"
import { LucideCloudUpload, LucideRefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { formatLocalizedDate, formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import GameAccountSelect from "@/shared/components/GameAccountSelect.vue"
import CatalogFilterPanel from "@/shared/components/catalog/CatalogFilterPanel.vue"
import type { CatalogActiveChip } from "@/shared/components/catalog/CatalogFilterPanel.vue"
import { useCatalogViewPreference } from "@/composables/useCatalogViewPreference"
import { resolveCharacterIconUrl } from "@/shared/sekai/data-sources"
import { resolveSekaiUnitLabel } from "@/shared/sekai/labels"
import { useGameAccountSelection, useUserSuite } from "@/shared/sekai/user-snapshot/use-user-suite"
import { useSettingsStore } from "@/shared/stores/settings"
import type { SekaiRegion } from "@/types"
import EventPointTrendChart from "../components/EventPointTrendChart.vue"
import EventRecordRow, { type EventRecordChapterView } from "../components/EventRecordRow.vue"
import EventRecordsFilterFields, { type EventRecordsFilterState } from "../components/EventRecordsFilterFields.vue"
import EventRecordsSummary, { type EventRecordsSummaryItem } from "../components/EventRecordsSummary.vue"
import { useEventRecordsMaster } from "../composables/useEventRecordsMaster"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import {
  EVENT_RECORD_SORTS,
  buildDerivedRankMap,
  buildEventPointTrend,
  buildEventRecordRows,
  buildWorldBloomGroups,
  derivedChapterRankKey,
  derivedEventRankKey,
  filterEventRecordTableRows,
  formatDerivedRankTier,
  isEventRecordSort,
  mergeWorldBloomIntoRows,
  normalizeUserEventRecords,
  normalizeUserHonorIds,
  normalizeUserWorldBloomRecords,
  sortEventRecordTableRows,
  summarizeEventRecordTableRows,
  worldBloomChapterKey,
  type EventRecordSort,
  type EventRecordTableRow,
} from "../lib/event-records"

const { t, te } = useI18n()
const labels = { t, te }
const settingsStore = useSettingsStore()

const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const { selectedAccount } = useGameAccountSelection({ capability: "suite" })
const suite = useUserSuite(["userEvents", "userWorldBlooms", "userHonors"], selectedAccount)

const region = computed<SekaiRegion | null>(() => selectedAccount.value?.server ?? null)
// Only used inside the ready branch, where an account is always selected.
const bannerRegion = computed<SekaiRegion>(() => region.value ?? "jp")

const master = useEventRecordsMaster(region)
const suiteDataMissing = computed(
  () => isAxiosError(suite.error.value) && suite.error.value.response?.status === 404,
)

const state = computed<"idle" | "loading" | "error" | "ready">(() => {
  if (suite.status.value === "idle") {
    return "idle"
  }

  // A missing/failed account snapshot is actionable immediately; don't hide
  // it behind an unrelated masterdata download that may still be running.
  if (suite.status.value === "error") {
    return "error"
  }

  if (suite.status.value === "loading" || master.loading.value) {
    return "loading"
  }

  if (master.error.value != null) {
    return "error"
  }

  return "ready"
})

// --- Filters + view options ------------------------------------------------------------
const filters = reactive<EventRecordsFilterState>({ time: "year", from: undefined, to: undefined, types: [], units: [] })

function patchFilters(next: Partial<EventRecordsFilterState>) {
  Object.assign(filters, next)
}
const sort = useCatalogViewPreference<EventRecordSort>("event-records", "sort", () => "time", EVENT_RECORD_SORTS)

const timeWindow = computed<{ from: number | null; to: number | null }>(() => {
  if (filters.time === "all") {
    return { from: null, to: null }
  }
  if (filters.time === "year") {
    return { from: Date.now() - 365 * 24 * 60 * 60 * 1000, to: null }
  }
  return { from: filters.from?.getTime() ?? null, to: filters.to?.getTime() ?? null }
})

const activeFilterCount = computed(() =>
  [filters.time !== "year", filters.types.length > 0, filters.units.length > 0].filter(Boolean).length)

const activeChips = computed<CatalogActiveChip[]>(() => [
  ...(filters.time === "year" ? [] : [{ key: "time", label: t(`eventRecords.filters.${filters.time}`) }]),
  ...filters.types.map((type) => ({ key: `type:${type}`, label: t(`events.type.${type}`) })),
  ...filters.units.map((unit) => ({ key: `unit:${unit}`, label: resolveSekaiUnitLabel(labels, unit) })),
])

function removeChip(key: string) {
  const [kind, value] = key.split(":")
  if (kind === "time") {
    filters.time = "year"
  } else if (kind === "type") {
    filters.types = filters.types.filter((type) => type !== value)
  } else if (kind === "unit") {
    filters.units = filters.units.filter((unit) => unit !== value)
  }
}

function resetFilters() {
  filters.time = "year"
  filters.from = undefined
  filters.to = undefined
  filters.types = []
  filters.units = []
}

function setSort(value: AcceptableValue | AcceptableValue[] | undefined) {
  if (typeof value === "string" && isEventRecordSort(value)) {
    sort.value = value
  }
}

// --- Data pipeline -------------------------------------------------------------------
const userEvents = computed(() => normalizeUserEventRecords(suite.data.value?.userEvents))
const rows = computed(() => buildEventRecordRows(userEvents.value, master.eventsById.value))

/** Rank brackets reverse-derived from owned event ranking honors (badges). */
const derivedRanks = computed(() => buildDerivedRankMap(
  normalizeUserHonorIds(suite.data.value?.userHonors),
  master.honorRankIndex.value,
))

const worldGroups = computed(() =>
  buildWorldBloomGroups(
    normalizeUserWorldBloomRecords(suite.data.value?.userWorldBlooms),
    master.eventsById.value,
    master.chapterNoIndex.value,
  ),
)

// World Link chapters merge first so standalone chapter rows obey the same filters.
const mergedRows = computed(() => mergeWorldBloomIntoRows(rows.value, worldGroups.value))
const filteredRows = computed(() => filterEventRecordTableRows(mergedRows.value, {
  from: timeWindow.value.from,
  to: timeWindow.value.to,
  types: filters.types,
  units: filters.units,
}))

function rankOf(row: EventRecordTableRow): number | null {
  return row.rank ?? derivedRanks.value.get(derivedEventRankKey(row.eventId))?.toRank ?? null
}

const sortedRows = computed(() => sortEventRecordTableRows(filteredRows.value, sort.value, rankOf))

const trend = computed(() => buildEventPointTrend(
  filteredRows.value.flatMap((row) => row.eventPoint == null ? [] : [{ ...row, eventPoint: row.eventPoint }]),
  derivedRanks.value,
))

const summary = computed(() => summarizeEventRecordTableRows(filteredRows.value))

const summaryItems = computed<EventRecordsSummaryItem[]>(() => [
  { key: "participated", label: t("eventRecords.summary.participated"), value: formatNumberCN(summary.value.participated) },
  { key: "bestPoint", label: t("eventRecords.summary.bestPoint"), value: formatNumberCN(summary.value.bestPoint) },
  { key: "averagePoint", label: t("eventRecords.summary.averagePoint"), value: formatNumberCN(summary.value.averagePoint) },
  ...(summary.value.rankedCount > 0
    ? [
        { key: "bestRank", label: t("eventRecords.summary.bestRank"), value: formatNumberCN(summary.value.bestRank) },
        { key: "ranked", label: t("eventRecords.summary.ranked"), value: formatNumberCN(summary.value.rankedCount) },
      ]
    : []),
])

const countLabel = computed(() => t("eventRecords.table.count", { count: filteredRows.value.length }))

// --- Row presentation ------------------------------------------------------------------
function eventRankText(row: EventRecordTableRow): { text: string; fromHonor: boolean } {
  if (row.rank != null) {
    return { text: formatNumberCN(row.rank), fromHonor: false }
  }

  const tier = derivedRanks.value.get(derivedEventRankKey(row.eventId))
  return tier != null ? { text: formatDerivedRankTier(tier), fromHonor: true } : { text: "—", fromHonor: false }
}

function chapterViews(row: EventRecordTableRow): EventRecordChapterView[] {
  return row.chapters.map((chapter) => {
    const tier = chapter.rank == null ? derivedRanks.value.get(derivedChapterRankKey(row.eventId, chapter.gameCharacterId)) : null
    return {
      key: worldBloomChapterKey(row.eventId, chapter.gameCharacterId),
      name: chapter.gameCharacterId == null
        ? t("eventRecords.worldLink.finale")
        : master.characterMap.value.get(chapter.gameCharacterId)?.name ?? `#${chapter.gameCharacterId}`,
      iconUrl: chapter.gameCharacterId == null ? null : resolveCharacterIconUrl(chapter.gameCharacterId),
      chapterLabel: chapter.chapterNo != null ? t("eventRecords.worldLink.chapterLabel", { no: chapter.chapterNo }) : null,
      pointText: formatNumberCN(chapter.chapterPoint),
      rankText: chapter.rank != null ? formatNumberCN(chapter.rank) : tier != null ? formatDerivedRankTier(tier) : "—",
      rankFromHonor: chapter.rank == null && tier != null,
    }
  })
}

function formatRecordDate(value: number | null) {
  return formatLocalizedDate(value, { year: "numeric", month: "2-digit", day: "2-digit" }, t("events.common.dateFallback"))
}

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
</script>

<template>
  <div class="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col justify-center gap-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t("eventRecords.title") }}</h1>
        <p class="text-sm text-muted-foreground">{{ t("eventRecords.description") }}</p>
      </div>
      <div class="flex flex-col items-start gap-1.5 sm:items-end">
        <GameAccountSelect capability="suite" />
        <div v-if="state !== 'idle'" class="flex items-center gap-1 text-xs text-muted-foreground">
          <span v-if="state === 'ready'">{{ t("eventRecords.dataAsOf", { time: uploadTimeText }) }}</span>
          <Button variant="ghost" size="sm" class="h-6 gap-1 px-1.5 text-xs text-muted-foreground" :disabled="state === 'loading'" @click="reloadAll">
            <LucideRefreshCcw class="size-3.5" />
            {{ t("eventRecords.refresh") }}
          </Button>
        </div>
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
      <div class="grid gap-2 rounded-md border bg-muted/20 p-3">
        <p class="text-xs text-muted-foreground">{{ t("eventRecords.loading") }}</p>
        <Progress :model-value="master.regionState.value?.progress ?? 0" />
      </div>
      <Skeleton class="h-12 w-full" />
      <Skeleton class="h-64 w-full" />
      <Skeleton class="h-96 w-full" />
    </template>

    <!-- Error -->
    <Card v-else-if="state === 'error'">
      <CardContent class="flex flex-col items-center gap-3 py-10 text-center">
        <!-- A grantee cannot upload the owner's data, so no upload CTA there. -->
        <template v-if="suiteDataMissing && selectedAccount?.ownership === 'granted'">
          <LucideCloudUpload class="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p class="max-w-md text-sm text-muted-foreground">{{ t("eventRecords.missingGrantedData") }}</p>
        </template>
        <template v-else-if="suiteDataMissing">
          <LucideCloudUpload class="size-6 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p class="max-w-md text-sm text-muted-foreground">{{ t("eventRecords.missingUserData") }}</p>
          <Button as-child size="sm">
            <RouterLink to="/upload-data">
              <LucideCloudUpload class="size-4" aria-hidden="true" />
              {{ t("eventRecords.uploadData") }}
            </RouterLink>
          </Button>
        </template>
        <template v-else>
          <p class="text-sm text-muted-foreground">{{ t("eventRecords.loadFailed") }}</p>
          <Button variant="outline" size="sm" @click="reloadAll">
            <LucideRefreshCcw class="mr-1 h-4 w-4" /> {{ t("eventRecords.retry") }}
          </Button>
        </template>
      </CardContent>
    </Card>

    <template v-else>
      <CatalogFilterPanel
        :title="t('catalog.filters.title')"
        :reset-label="t('catalog.filters.reset')"
        :count-label="countLabel"
        page-key="event-records"
        :active-count="activeFilterCount"
        :active-chips="activeChips"
        content-class="flex flex-col gap-3"
        @reset="resetFilters"
        @remove-chip="removeChip"
      >
        <EventRecordsFilterFields :state="filters" :unit-color-map="null" @patch="patchFilters" />
      </CatalogFilterPanel>

      <EventRecordsSummary :items="summaryItems" />

      <EventPointTrendChart :trend="trend" />

      <!-- History -->
      <div class="flex flex-wrap items-center gap-x-6 gap-y-2">
        <h2 class="text-base font-semibold">{{ t("eventRecords.table.title") }}</h2>
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="mr-1 text-xs font-medium text-muted-foreground">{{ t("catalog.sort.label") }}</span>
          <ToggleGroup type="single" variant="segment" size="sm" :model-value="sort" :aria-label="t('catalog.sort.label')" @update:model-value="setSort">
            <ToggleGroupItem v-for="option in EVENT_RECORD_SORTS" :key="option" :value="option">
              {{ t(`eventRecords.sort.${option}`) }}
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <span class="text-xs tabular-nums text-muted-foreground">{{ countLabel }}</span>
      </div>

      <p v-if="sortedRows.length === 0" class="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {{ t("eventRecords.noData") }}
      </p>
      <div v-else class="flex flex-col gap-2">
        <!-- Column captions for the numbers; phones label each row instead. -->
        <div class="hidden items-center gap-3 px-3 text-xs text-muted-foreground sm:flex">
          <span class="flex-1">{{ t("eventRecords.table.event") }}</span>
          <span class="grid w-56 grid-cols-2 gap-x-6 text-right">
            <span>{{ t("eventRecords.table.point") }}</span>
            <span>{{ t("eventRecords.table.rank") }}</span>
          </span>
        </div>
        <EventRecordRow
          v-for="row in sortedRows"
          :key="row.eventId"
          :row="row"
          :region="bannerRegion"
          :preference="assetEndpoint"
          :date-text="formatRecordDate(row.event?.startAt ?? null)"
          :point-text="row.eventPoint != null ? formatNumberCN(row.eventPoint) : '—'"
          :rank-text="eventRankText(row).text"
          :rank-from-honor="eventRankText(row).fromHonor"
          :chapters="chapterViews(row)"
        />
      </div>
    </template>
  </div>
</template>
