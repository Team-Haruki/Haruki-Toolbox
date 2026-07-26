<script setup lang="ts">
import { computed, ref } from "vue"
import { useI18n } from "vue-i18n"
import { LucideRefreshCcw } from "lucide-vue-next"
import {
  VisArea,
  VisAxis,
  VisCrosshair,
  VisLine,
  VisScatter,
  VisTooltip,
  VisXYContainer,
} from "@unovis/vue"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
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
import EventTypeBadge from "../components/EventTypeBadge.vue"
import { useEventRecordsMaster } from "../composables/useEventRecordsMaster"
import { suiteUploadTimeToMillis } from "@/shared/sekai/user-snapshot/api"
import {
  buildEventPointTrend,
  buildEventRecordRows,
  buildWorldBloomGroups,
  mergeWorldBloomIntoRows,
  normalizeUserEventRecords,
  normalizeUserWorldBloomRecords,
  summarizeEventRecords,
  worldBloomChapterKey,
  type EventPointTrendPoint,
} from "../lib/event-records"

const { t } = useI18n()
const settingsStore = useSettingsStore()

const assetEndpoint = computed(() => settingsStore.currentAssetEndpoint)

const { selectedAccount } = useGameAccountSelection()
const suite = useUserSuite(["userEvents", "userWorldBlooms"], selectedAccount)

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

const worldGroups = computed(() =>
  buildWorldBloomGroups(
    normalizeUserWorldBloomRecords(suite.data.value?.userWorldBlooms),
    master.eventsById.value,
    master.chapterNoIndex.value,
  ),
)

const tableRows = computed(() => mergeWorldBloomIntoRows(rows.value, worldGroups.value))

const trend = computed(() => buildEventPointTrend(rows.value))
const summary = computed(() => summarizeEventRecords(userEvents.value))

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

const showPointSeries = ref(true)
const showRankSeries = ref(true)

const TREND_POINT_COLOR = "#8b5cf6"
const TREND_RANK_COLOR = "#f59e0b"

// Both stacked containers disable auto margins and share this fixed margin so
// their plot areas overlap exactly (poor man's dual y-axis for unovis).
const TREND_MARGIN = { left: 56, right: 56, top: 10, bottom: 28 }

const trendX = (_point: EventPointTrendPoint, index: number) => index
const trendY = (point: EventPointTrendPoint) => point.eventPoint
// Ranks improve as the number shrinks; negating them puts better ranks higher.
const trendRankY = (point: EventPointTrendPoint) => point.rank == null ? undefined : -point.rank

function xTickFormat(index: number) {
  if (!Number.isInteger(index)) {
    return ""
  }

  const point = trend.value[index]
  return point ? formatLocalizedDate(point.startAt, { year: "2-digit", month: "numeric" }, "") : ""
}

function yTickFormat(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`
  }

  if (Math.abs(value) >= 1000) {
    return `${Math.round(value / 1000)}k`
  }

  return String(value)
}

/** Right-axis ticks carry negated ranks; show their absolute value. */
function rankTickFormat(value: number) {
  const rank = Math.abs(value)
  return Number.isInteger(rank) ? formatNumberCN(rank) : ""
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char] ?? char,
  )
}

function crosshairTemplate(point: EventPointTrendPoint) {
  // Content only — the unovis tooltip wrapper (themed via --vis-tooltip-* CSS
  // vars) provides the box, so we must not draw a second box here.
  return `<div style="font-size:12px;line-height:1.55">
    <div style="font-weight:600;margin-bottom:2px">${escapeHtml(point.name)}</div>
    <div style="opacity:0.7">${formatRecordDate(point.startAt)}</div>
    <div>${t("eventRecords.trend.point")}: ${formatNumberCN(point.eventPoint)}</div>
    <div>${t("eventRecords.trend.rank")}: ${point.rank != null ? formatNumberCN(point.rank) : "—"}</div>
  </div>`
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
      <Card>
        <CardHeader>
          <CardTitle class="flex flex-wrap items-center justify-between gap-2 text-base">
            <span>{{ t("eventRecords.trend.title") }}</span>
            <span class="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-normal transition-colors',
                  showPointSeries ? '' : 'text-muted-foreground opacity-60',
                ]"
                :style="showPointSeries ? { borderColor: TREND_POINT_COLOR, color: TREND_POINT_COLOR } : {}"
                :aria-pressed="showPointSeries"
                @click="showPointSeries = !showPointSeries"
              >
                <span class="size-2 rounded-full" :style="{ backgroundColor: TREND_POINT_COLOR }" />
                {{ t("eventRecords.trend.point") }}
              </button>
              <button
                type="button"
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-normal transition-colors',
                  showRankSeries ? '' : 'text-muted-foreground opacity-60',
                ]"
                :style="showRankSeries ? { borderColor: TREND_RANK_COLOR, color: TREND_RANK_COLOR } : {}"
                :aria-pressed="showRankSeries"
                @click="showRankSeries = !showRankSeries"
              >
                <span class="size-2 rounded-full" :style="{ backgroundColor: TREND_RANK_COLOR }" />
                {{ t("eventRecords.trend.rank") }}
              </button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="trend.length >= 2" class="relative h-60">
            <VisXYContainer :data="trend" :height="240" :auto-margin="false" :margin="TREND_MARGIN">
              <template v-if="showPointSeries">
                <VisArea :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :opacity="0.15" curve-type="monotoneX" />
                <VisLine :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" curve-type="monotoneX" />
                <VisScatter :x="trendX" :y="trendY" :color="TREND_POINT_COLOR" :size="4" />
              </template>
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tick-format="xTickFormat" />
              <VisAxis v-if="showPointSeries" type="y" :tick-format="yTickFormat" :tick-text-color="TREND_POINT_COLOR" />
            </VisXYContainer>
            <VisXYContainer
              v-if="showRankSeries"
              class="pointer-events-none absolute inset-0"
              :data="trend"
              :height="240"
              :auto-margin="false"
              :margin="TREND_MARGIN"
            >
              <VisLine :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" curve-type="monotoneX" />
              <VisScatter :x="trendX" :y="trendRankY" :color="TREND_RANK_COLOR" :size="4" />
              <VisAxis type="y" position="right" :tick-format="rankTickFormat" :tick-text-color="TREND_RANK_COLOR" :grid-line="false" />
            </VisXYContainer>
          </div>
          <p v-else class="text-sm text-muted-foreground">{{ t("eventRecords.trend.empty") }}</p>
        </CardContent>
      </Card>

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
                          <span class="text-xs text-muted-foreground">{{ formatRecordDate(row.event?.startAt ?? null) }}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <EventTypeBadge :event-type="row.event?.eventType ?? null" />
                    </TableCell>
                    <TableCell class="text-right tabular-nums">
                      {{ row.eventPoint != null ? formatNumberCN(row.eventPoint) : "—" }}
                    </TableCell>
                    <TableCell class="text-right tabular-nums">{{ formatNumberCN(row.rank) }}</TableCell>
                  </TableRow>
                  <TableRow
                    v-for="chapter in row.chapters"
                    :key="worldBloomChapterKey(row.eventId, chapter.gameCharacterId)"
                    class="bg-muted/20"
                  >
                    <TableCell class="py-1.5">
                      <div class="flex min-w-0 items-center gap-2 pl-10">
                        <img
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
                    <TableCell class="py-1.5 text-right text-xs tabular-nums">{{ formatNumberCN(chapter.rank) }}</TableCell>
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
