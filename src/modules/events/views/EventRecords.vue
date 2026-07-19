<script setup lang="ts">
import { computed } from "vue"
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
import {
  buildEventPointTrend,
  buildEventRecordRows,
  buildWorldBloomGroups,
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

const trend = computed(() => buildEventPointTrend(rows.value))
const summary = computed(() => summarizeEventRecords(userEvents.value))

const summaryChips = computed(() => [
  { key: "participated", label: t("eventRecords.summary.participated"), value: formatNumberCN(summary.value.participated) },
  { key: "bestPoint", label: t("eventRecords.summary.bestPoint"), value: formatNumberCN(summary.value.bestPoint) },
  { key: "averagePoint", label: t("eventRecords.summary.averagePoint"), value: formatNumberCN(summary.value.averagePoint) },
])

const uploadTimeText = computed(() =>
  formatLocalizedDateTime(
    suite.uploadTime.value,
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

function formatRecordDateTime(value: number | null) {
  return formatLocalizedDateTime(
    value,
    { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" },
    t("events.common.dateFallback"),
  )
}

const trendX = (_point: EventPointTrendPoint, index: number) => index
const trendY = (point: EventPointTrendPoint) => point.eventPoint

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
  </div>`
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-4">
    <div>
      <h1 class="text-2xl font-bold">{{ t("eventRecords.title") }}</h1>
      <p class="text-sm text-muted-foreground">{{ t("eventRecords.description") }}</p>
    </div>

    <GameAccountSelect />

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
      <!-- Snapshot freshness -->
      <div class="flex flex-wrap items-center justify-between gap-2">
        <p class="text-xs text-muted-foreground">{{ t("eventRecords.dataAsOf", { time: uploadTimeText }) }}</p>
        <Button variant="ghost" size="sm" @click="reloadAll">
          <LucideRefreshCcw class="mr-1 h-4 w-4" /> {{ t("eventRecords.refresh") }}
        </Button>
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
      <Card>
        <CardHeader>
          <CardTitle class="text-base">{{ t("eventRecords.trend.title") }}</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="trend.length >= 2" class="h-60">
            <VisXYContainer :data="trend" :height="240">
              <VisArea :x="trendX" :y="trendY" color="#8b5cf6" :opacity="0.15" curve-type="monotoneX" />
              <VisLine :x="trendX" :y="trendY" color="#8b5cf6" curve-type="monotoneX" />
              <VisScatter :x="trendX" :y="trendY" color="#8b5cf6" :size="4" />
              <VisCrosshair :template="crosshairTemplate" />
              <VisTooltip />
              <VisAxis type="x" :tick-format="xTickFormat" />
              <VisAxis type="y" :tick-format="yTickFormat" />
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
          <p v-if="rows.length === 0" class="text-sm text-muted-foreground">
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
                <TableRow v-for="row in rows" :key="row.eventId">
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
                  <TableCell class="text-right tabular-nums">{{ formatNumberCN(row.eventPoint) }}</TableCell>
                  <TableCell class="text-right tabular-nums">{{ formatNumberCN(row.rank) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <!-- World Link chapter records -->
      <Card v-if="worldGroups.length > 0">
        <CardHeader>
          <CardTitle class="text-base">{{ t("eventRecords.worldLink.title") }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-4">
          <div v-for="group in worldGroups" :key="group.eventId" class="flex flex-col gap-2">
            <RouterLink
              v-if="group.event"
              :to="`/events/${group.eventId}`"
              class="w-fit text-sm font-semibold underline-offset-4 hover:underline"
            >
              {{ group.name }}
            </RouterLink>
            <span v-else class="text-sm font-semibold">{{ group.name }}</span>
            <div
              v-for="chapter in group.chapters"
              :key="worldBloomChapterKey(group.eventId, chapter.gameCharacterId)"
              class="flex flex-col gap-2 rounded-md border border-border/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex min-w-0 items-center gap-3">
                <img
                  v-if="chapter.gameCharacterId != null"
                  :src="resolveCharacterIconUrl(chapter.gameCharacterId)"
                  :alt="characterName(chapter.gameCharacterId)"
                  class="h-9 w-9 shrink-0 rounded-full ring-1 ring-border"
                  loading="lazy"
                >
                <div class="min-w-0">
                  <div class="truncate text-sm font-medium">{{ characterName(chapter.gameCharacterId) }}</div>
                  <div class="text-xs text-muted-foreground">
                    <template v-if="chapter.chapterNo != null">
                      {{ t("eventRecords.worldLink.chapterLabel", { no: chapter.chapterNo }) }} ·
                    </template>
                    {{ t("eventRecords.worldLink.updatedAt") }}: {{ formatRecordDateTime(chapter.updatedAt) }}
                  </div>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-4 text-sm tabular-nums">
                <span>
                  <span class="text-xs text-muted-foreground">{{ t("eventRecords.worldLink.point") }}</span>
                  {{ formatNumberCN(chapter.chapterPoint) }}
                </span>
                <span>
                  <span class="text-xs text-muted-foreground">{{ t("eventRecords.worldLink.rank") }}</span>
                  {{ formatNumberCN(chapter.rank) }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
