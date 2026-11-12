<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideTriangleAlert } from "lucide-vue-next"
import { formatNumberCN } from "@/lib/number-format"
import { useRankBorderContext } from "../composables/rank-border-context"
import { formatDurationLabel } from "../lib/duration-label"
import {
  ACTIVE_SEAT_THRESHOLD_SECONDS,
  findFastestHolder,
  resolveEventProgress,
  resolveHourlySpeed,
  summarizeTopActivity,
} from "../lib/overview-stats"
import { plainNameText } from "../lib/rich-name"

/**
 * The event at a glance, above the lists: where the ranking period stands,
 * then a line of figures read off the data already on the page (the top
 * score and its lead, the T100 line and its pace, how many of the top 100
 * are playing right now, who is gaining fastest, how many people are
 * watching). Nothing here fetches.
 */
const { t } = useI18n()
const { query, live, ui } = useRankBorderContext()
const { selectedEvent, selectedActivityStartAt, selectedActivityEndAt, intervalOptions, intervalSeconds } = query
const { top100Rows, hasTop100Data, realtimeOnline, tracker } = live
const { nowSecond, formatPt, formatPerHour, formatGrowth, formatReplayTick, formatUserLabel } = ui

const progress = computed(() => resolveEventProgress(selectedActivityStartAt.value, selectedActivityEndAt.value, nowSecond.value))

const progressLabel = computed(() => {
  const current = progress.value
  if (!current) {
    return null
  }
  if (current.state === "ended") {
    return t("rankBorder.overview.ended")
  }
  if (current.state === "upcoming") {
    return t("rankBorder.overview.upcoming", { duration: formatDurationLabel(t, current.remainingSeconds) })
  }
  return t("rankBorder.overview.progress", {
    elapsed: formatDurationLabel(t, current.elapsedSeconds),
    remaining: formatDurationLabel(t, current.remainingSeconds),
  })
})

const intervalLabel = computed(() =>
  intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label ?? "-",
)

type SummaryStat = { key: string; label: string; value: string; detail: string | null }

const stats = computed<SummaryStat[]>(() => {
  const rows = top100Rows.value
  const first = rows[0]
  const second = rows[1]
  const hundredth = rows[99]
  const items: SummaryStat[] = []

  if (first?.score != null) {
    items.push({
      key: "top",
      label: t("rankBorder.overview.stats.top"),
      value: formatPt(first.score),
      detail: second?.score != null ? t("rankBorder.overview.stats.topLead", { gap: formatGrowth(first.score - second.score) }) : null,
    })
  }
  if (hundredth?.score != null) {
    const speed = resolveHourlySpeed(hundredth.rankGrowth)
    items.push({
      key: "t100",
      label: t("rankBorder.overview.stats.t100"),
      value: formatPt(hundredth.score),
      detail: speed != null ? t("rankBorder.overview.stats.pace", { speed: formatPerHour(speed) }) : null,
    })
  }

  const activity = summarizeTopActivity(
    rows.map((row) => ({ timestamp: row.timestamp, hasHolder: row.detail != null })),
    nowSecond.value,
  )
  if (activity.total > 0) {
    items.push({
      key: "active",
      label: t("rankBorder.overview.stats.active"),
      value: `${activity.active} / ${activity.total}`,
      detail: t("rankBorder.overview.stats.activeDetail", { minutes: Math.round(ACTIVE_SEAT_THRESHOLD_SECONDS / 60) }),
    })
  }

  const fastest = findFastestHolder(rows.map((row) => ({ rank: row.rank, holderSpeed: resolveHourlySpeed(row.growth) })))
  if (fastest) {
    const holder = rows[fastest.rank - 1]?.detail ?? null
    items.push({
      key: "fastest",
      label: t("rankBorder.overview.stats.fastest", { interval: intervalLabel.value }),
      value: formatPerHour(fastest.speed),
      detail: `#${fastest.rank} ${plainNameText(formatUserLabel(holder))}`,
    })
  }

  if (realtimeOnline.value && realtimeOnline.value.topic > 0) {
    items.push({
      key: "viewers",
      label: t("rankBorder.overview.stats.viewers"),
      value: formatNumberCN(realtimeOnline.value.topic),
      detail: t("rankBorder.overview.stats.viewersDetail", { total: formatNumberCN(realtimeOnline.value.total) }),
    })
  }
  return items
})

/** The tracker's own status: 0 is fine, anything else means its upstream is failing. */
const upstreamError = computed(() => {
  const status = tracker.status.value?.status
  return status != null && status !== 0
})
</script>

<template>
  <section
    v-if="selectedEvent && (progress || hasTop100Data)"
    class="@container rounded-xl border bg-card"
    data-testid="rank-overview-summary"
  >
    <div v-if="progress" class="flex flex-col gap-1.5 px-4 pt-3" :class="stats.length > 0 ? 'pb-3' : 'pb-3.5'">
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h2 class="min-w-0 truncate text-sm font-semibold" :title="selectedEvent.label">{{ selectedEvent.label }}</h2>
        <p v-if="progressLabel" class="text-xs tabular-nums text-muted-foreground" data-testid="rank-overview-progress">{{ progressLabel }}</p>
      </div>
      <div
        class="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        :aria-label="t('rankBorder.overview.progressLabel')"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress.ratio * 100)"
      >
        <div class="h-full rounded-full bg-primary transition-[width] duration-500" :style="{ width: `${progress.ratio * 100}%` }" />
      </div>
      <div class="flex justify-between text-[11px] tabular-nums text-muted-foreground" :title="t('rankBorder.result.localTimeHint')">
        <span>{{ formatReplayTick(selectedActivityStartAt) }}</span>
        <span>{{ t("rankBorder.overview.settlesAt", { time: formatReplayTick(selectedActivityEndAt) }) }}</span>
      </div>
    </div>

    <dl
      v-if="stats.length > 0"
      :class="[
        'grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 @min-[40rem]:grid-cols-3 @min-[60rem]:flex @min-[60rem]:gap-x-8',
        progress ? 'border-t border-border/60' : '',
      ]"
    >
      <div v-for="stat in stats" :key="stat.key" class="flex min-w-0 flex-col @min-[60rem]:flex-1" :data-stat="stat.key">
        <dt class="truncate text-[11px] text-muted-foreground">{{ stat.label }}</dt>
        <dd class="truncate text-base leading-tight font-semibold tabular-nums">{{ stat.value }}</dd>
        <dd v-if="stat.detail" class="truncate text-[11px] tabular-nums text-muted-foreground" :title="stat.detail">{{ stat.detail }}</dd>
      </div>
    </dl>

    <p
      v-if="upstreamError"
      role="status"
      class="flex items-start gap-2 border-t border-border/60 px-4 py-2 text-xs text-amber-800 dark:text-amber-200"
    >
      <LucideTriangleAlert class="mt-0.5 size-3.5 shrink-0" />
      {{ t("rankBorder.overview.upstreamError") }}
    </p>
  </section>
</template>
