<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { LucideChevronRight } from "lucide-vue-next"
import { formatCompactNumber } from "@/lib/number-format"
import EmptyState from "@/shared/components/EmptyState.vue"
import { useRankBorderContext } from "../composables/rank-border-context"
import { resolveQuickFactsDetailTarget } from "../lib/detail-link"
import {
  buildOverviewLineRows,
  projectFinalScore,
  resolveEventProgress,
  resolveHourlySpeed,
  type OverviewPoint,
} from "../lib/overview-stats"
import { PERSONAL_COLLECTION_LIMIT } from "../lib/rank-border-constants"
import RelativeTime from "./RelativeTime.vue"

/**
 * The lines people actually chase, in one table: the key seats of the top
 * 100 and every border line below it, each with its score, its growth and
 * pace over the selected window, how far it is behind the line above, and a
 * straight-line projection to the end of the ranking period. A row opens
 * that line's detail page.
 *
 * It sits beside the top 100 on a wide page and above it on a narrow one, so
 * the columns follow its own width: a wide table shows every column on one
 * line, a narrow one keeps line, score and pace and folds the rest under.
 */
const { t, locale } = useI18n()
const { query, live, ui } = useRankBorderContext()
const { intervalOptions, intervalSeconds, selectedActivityStartAt, selectedActivityEndAt } = query
const { top100Rows, segmentRows, hasTop100Data, hasSegmentData } = live
const { nowSecond, expandedRank, openDetailPage, formatPt, formatGrowth, formatPerHour, formatTargetRank } = ui

const intervalLabel = computed(() =>
  intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label ?? "-",
)

const remainingSeconds = computed(() => {
  const progress = resolveEventProgress(selectedActivityStartAt.value, selectedActivityEndAt.value, nowSecond.value)
  return progress?.state === "running" ? progress.remainingSeconds : null
})

type LineView = {
  rank: number
  label: string
  seat: boolean
  /** First border line after the seats: gets a rule above it. */
  startsBorders: boolean
  userId: string | null
  timestamp: number | null
  scoreLabel: string
  scoreChanged: boolean
  growthLabel: string | null
  speedLabel: string | null
  gapLabel: string | null
  gapTitle: string | null
  projectedLabel: string | null
  /** The projection in compact notation, for the narrow table's second line. */
  projectedShort: string | null
}

const rows = computed<LineView[]>(() => {
  const seats: OverviewPoint[] = []
  for (const row of top100Rows.value) {
    if (row.score != null) {
      seats.push({
        rank: row.rank,
        score: row.score,
        timestamp: row.timestamp,
        growth: row.rankGrowth?.growth ?? null,
        speed: resolveHourlySpeed(row.rankGrowth),
      })
    }
  }
  const borders: OverviewPoint[] = segmentRows.value.map((row) => ({
    rank: row.rank,
    score: row.score,
    timestamp: row.timestamp,
    growth: row.growth?.growth ?? null,
    speed: resolveHourlySpeed(row.growth),
  }))

  const changed = new Set<number>()
  for (const row of top100Rows.value) {
    if (row.scoreChanged) changed.add(row.rank)
  }
  for (const row of segmentRows.value) {
    if (row.scoreChanged) changed.add(row.rank)
  }

  let bordersStarted = false
  return buildOverviewLineRows(seats, borders).map((row) => {
    const seat = row.rank <= PERSONAL_COLLECTION_LIMIT
    const startsBorders = !seat && !bordersStarted
    if (startsBorders) {
      bordersStarted = true
    }
    const projected = projectFinalScore(row.score, row.speed, remainingSeconds.value)
    return {
      rank: row.rank,
      label: formatTargetRank(row.rank),
      seat,
      startsBorders,
      userId: seat ? top100Rows.value[row.rank - 1]?.detail?.userId?.trim() || null : null,
      timestamp: row.timestamp,
      scoreLabel: formatPt(row.score),
      scoreChanged: changed.has(row.rank),
      growthLabel: row.growth != null ? formatGrowth(row.growth) : null,
      speedLabel: row.speed != null ? formatPerHour(row.speed) : null,
      gapLabel: row.gapToPrevious != null ? formatGrowth(-row.gapToPrevious) : null,
      gapTitle: row.gapToPrevious != null && row.previousRank != null
        ? t("rankBorder.overview.lines.gapTo", { line: formatTargetRank(row.previousRank), gap: formatPt(row.gapToPrevious) })
        : null,
      projectedLabel: projected != null ? formatPt(projected) : null,
      projectedShort: projected != null ? formatCompactNumber(projected, locale.value) : null,
    }
  })
})

const hasProjection = computed(() => rows.value.some((row) => row.projectedLabel != null))

function openLine(row: LineView) {
  openDetailPage(resolveQuickFactsDetailTarget({ kind: row.seat ? "rank" : "line", rank: row.rank, userId: row.userId }))
}
</script>

<template>
  <section class="@container flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card" data-testid="rank-border-lines">
    <header class="border-b border-border/60 px-4 py-3">
      <h2 class="text-sm font-semibold">{{ t("rankBorder.overview.lines.title") }}</h2>
      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("rankBorder.overview.lines.description", { interval: intervalLabel }) }}</p>
    </header>

    <EmptyState
      v-if="rows.length === 0"
      :title="hasTop100Data || hasSegmentData ? t('rankBorder.result.emptySegments') : t('rankBorder.result.emptyLines')"
      size="sm"
    />

    <template v-else>
      <div class="flex items-center gap-2 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span class="w-14 shrink-0">{{ t("rankBorder.table.border") }}</span>
        <span class="min-w-0 flex-1 text-right">{{ t("rankBorder.table.score") }}</span>
        <span class="hidden w-24 shrink-0 text-right @min-[44rem]:block">{{ t("rankBorder.result.intervalGrowth", { interval: intervalLabel }) }}</span>
        <span class="w-28 shrink-0 text-right">{{ t("rankBorder.table.hourlySpeed") }}</span>
        <span class="hidden w-28 shrink-0 text-right @min-[36rem]:block">{{ t("rankBorder.result.previousLine") }}</span>
        <span
          v-if="hasProjection"
          class="hidden w-32 shrink-0 text-right @min-[52rem]:block"
          :title="t('rankBorder.overview.lines.projectedHint')"
        >
          {{ t("rankBorder.overview.lines.projected") }}
        </span>
        <span class="hidden w-16 shrink-0 text-right @min-[44rem]:block">{{ t("rankBorder.result.updatedAgo") }}</span>
        <span class="w-4 shrink-0" />
      </div>

      <ul class="divide-y divide-border/60" role="list">
        <li
          v-for="row in rows"
          :key="row.rank"
          :data-rank-border-row="row.seat ? undefined : row.rank"
          :class="row.startsBorders ? 'border-t-2 border-border' : ''"
        >
          <button
            type="button"
            :class="[
              'flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 px-3 py-1.5 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 dark:hover:bg-accent/30',
              !row.seat && expandedRank === row.rank ? 'bg-primary/5' : '',
            ]"
            :data-line="row.rank"
            @click="openLine(row)"
          >
            <span class="w-14 shrink-0">
              <span
                :class="[
                  'inline-flex min-w-11 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                  row.seat ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground',
                ]"
              >
                {{ row.label }}
              </span>
            </span>
            <span
              :key="`score:${row.scoreLabel}`"
              :class="['min-w-0 flex-1 truncate text-right text-sm font-semibold tabular-nums', row.scoreChanged ? 'rank-border-flash' : '']"
            >
              {{ row.scoreLabel }}
            </span>
            <span class="hidden w-24 shrink-0 text-right text-xs tabular-nums text-emerald-600 @min-[44rem]:block dark:text-emerald-400">
              {{ row.growthLabel ?? "—" }}
            </span>
            <span class="w-28 shrink-0 text-right text-xs tabular-nums">{{ row.speedLabel ?? "—" }}</span>
            <span class="hidden w-28 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[36rem]:block" :title="row.gapTitle ?? undefined">
              {{ row.gapLabel ?? "—" }}
            </span>
            <span
              v-if="hasProjection"
              class="hidden w-32 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[52rem]:block"
              :title="t('rankBorder.overview.lines.projectedHint')"
            >
              {{ row.projectedLabel ?? "—" }}
            </span>
            <span class="hidden w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground @min-[44rem]:block">
              <RelativeTime :timestamp="row.timestamp" />
            </span>
            <LucideChevronRight class="size-4 shrink-0 text-muted-foreground/60" aria-hidden="true" />

            <!-- Narrow table: what the hidden columns hold, as one quiet line with short labels. -->
            <span class="flex basis-full flex-wrap gap-x-2.5 pl-16 text-[11px] tabular-nums text-muted-foreground @min-[52rem]:hidden">
              <span v-if="row.gapLabel" class="@min-[36rem]:hidden" :title="row.gapTitle ?? undefined">
                {{ t("rankBorder.overview.lines.gapShort") }} {{ row.gapLabel }}
              </span>
              <span v-if="row.growthLabel" class="@min-[44rem]:hidden">
                {{ t("rankBorder.overview.lines.growthShort") }} <span class="text-emerald-600 dark:text-emerald-400">{{ row.growthLabel }}</span>
              </span>
              <span v-if="row.projectedShort" :title="`${t('rankBorder.overview.lines.projected')} ${row.projectedLabel}`">
                {{ t("rankBorder.overview.lines.projectedShort") }} {{ row.projectedShort }}
              </span>
              <span class="ml-auto @min-[44rem]:hidden"><RelativeTime :timestamp="row.timestamp" /></span>
            </span>
          </button>
        </li>
      </ul>

      <p v-if="hasProjection" class="border-t border-border/60 px-4 py-2 text-[11px] text-muted-foreground">
        {{ t("rankBorder.overview.lines.projectedHint") }}
      </p>
    </template>
  </section>
</template>

<style scoped>
/* A score that just changed lifts once; the key on the node replays it. */
.rank-border-flash {
  color: rgb(5 150 105);
  animation: rank-border-flash 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes rank-border-flash {
  38% {
    transform: translateY(-0.12rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rank-border-flash {
    animation: none;
  }
}
</style>
