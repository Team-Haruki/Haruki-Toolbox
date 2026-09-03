<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { RefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useRankBorderContext } from "../composables/rank-border-context"
import {
  buildProfileHonorViews,
  resolveLeaderVisual,
  sanitizeDomId,
  type RankBorderLeaderVisual,
} from "../lib/honor-visuals"
import { PERSONAL_COLLECTION_LIMIT } from "../lib/rank-border-constants"
import type {
  RankBorderHonorView,
  RankBorderQuickFacts,
  RichNameSegment,
} from "../lib/rank-border-types"
import HonorBadge from "./HonorBadge.vue"
import LeaderCard from "./LeaderCard.vue"
import RankQuickFacts from "./RankQuickFacts.vue"
import RelativeTime from "./RelativeTime.vue"

const { t } = useI18n()

const { query, live, honors, ui } = useRankBorderContext()

const { selectedEvent, intervalOptions, intervalSeconds } = query
const {
  tracker,
  liveRefreshing,
  canRefresh,
  top100Rows,
  hasTop100Data,
  top100GrowthByRank,
  segmentRows,
  refreshData,
} = live
const { honorContext } = honors
const {
  shouldRenderProfileAssets,
  expandedRank,
  toggleRowExpansion,
  reportVisibleRank,
  formatRank,
  formatTargetRank,
  formatPt,
  formatGrowth,
  formatPerHour,
  richUserLabelSegments,
  richNameSegmentStyle,
} = ui

/**
 * Per-row view model, resolved ONCE per data refresh (and once per master-map
 * change). The template renders plain values with no function calls, so live
 * ticks and image loads never re-run honor/URL resolution.
 */
type LeaderRowVM = {
  rank: number
  timestamp: number | null
  scoreLabel: string
  scoreChanged: boolean
  growthLabel: string | null
  growthPositive: boolean
  rankGrowthLabel: string | null
  rankGrowthPositive: boolean
  growthChanged: boolean
  nameSegments: RichNameSegment[]
  leader: RankBorderLeaderVisual | null
  honorViews: RankBorderHonorView[]
}

const rowViewModels = computed<LeaderRowVM[]>(() => {
  const renderAssets = shouldRenderProfileAssets.value
  const ctx = honorContext.value
  return top100Rows.value.map((row) => ({
    rank: row.rank,
    timestamp: row.timestamp,
    scoreLabel: formatPt(row.score),
    scoreChanged: row.scoreChanged,
    growthLabel: row.displayGrowth != null ? formatGrowth(row.displayGrowth) : null,
    growthPositive: (row.displayGrowth ?? 0) > 0,
    rankGrowthLabel: row.displayRankGrowth != null ? formatGrowth(row.displayRankGrowth) : null,
    rankGrowthPositive: (row.displayRankGrowth ?? 0) > 0,
    growthChanged: row.growthChanged,
    nameSegments: richUserLabelSegments(row.detail, t("rankBorder.result.noPlayer")),
    leader: renderAssets ? resolveLeaderVisual(row.detail, ctx) : null,
    honorViews: renderAssets
      ? buildProfileHonorViews(row.detail, ctx, 3, `row-${row.rank}-${sanitizeDomId(row.detail?.userId ?? "line")}`)
      : [],
  }))
})

const intervalLabel = computed(() =>
  intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label ?? "-",
)

// --- Quick-facts (inline expansion) ------------------------------------------
// Derived entirely from the overview payload already in memory: neighbors come
// from the comparable-points list, speed from the interval growth. Zero fetches.

const comparablePoints = computed<ComparablePoint[]>(() => {
  const points: ComparablePoint[] = []
  for (const row of top100Rows.value) {
    if (row.score != null) {
      points.push({ rank: row.rank, score: row.score })
    }
  }
  for (const row of segmentRows.value) {
    points.push({ rank: row.rank, score: row.score })
  }
  return points.sort((a, b) => a.rank - b.rank)
})

type ComparablePoint = { rank: number; score: number }

/** The expanded point with its nearest comparable neighbours on either side. */
type PointNeighbours = {
  point: ComparablePoint
  previous: ComparablePoint | null
  next: ComparablePoint | null
}

function hourlySpeedLabel(growth: { growth: number | null; timeDiff: number | null } | null): string | null {
  return growth?.growth != null && growth.timeDiff
    ? formatPerHour(Math.round((growth.growth / growth.timeDiff) * 3600))
    : null
}

function buildSeatFacts(rank: number, { point, previous, next }: PointNeighbours): RankBorderQuickFacts {
  const row = top100Rows.value[rank - 1]
  return {
    kind: "rank",
    rank,
    scoreLabel: formatPt(point.score),
    timestamp: row?.timestamp ?? null,
    playerGrowthLabel: row?.displayGrowth != null ? formatGrowth(row.displayGrowth) : null,
    playerGrowthPositive: (row?.displayGrowth ?? 0) > 0,
    rankGrowthLabel: row?.displayRankGrowth != null ? formatGrowth(row.displayRankGrowth) : null,
    rankGrowthPositive: (row?.displayRankGrowth ?? 0) > 0,
    hourlySpeedLabel: hourlySpeedLabel(top100GrowthByRank.value.get(rank) ?? null),
    prevGapLabel: previous ? formatGrowth(previous.score - point.score) : null,
    prevLabel: t("rankBorder.result.previousRank"),
    nextGapLabel: next ? formatGrowth(point.score - next.score) : null,
    nextLabel: t("rankBorder.result.nextRank"),
  }
}

function buildLineFacts(rank: number, { point, previous, next }: PointNeighbours): RankBorderQuickFacts {
  const segment = segmentRows.value.find((row) => row.rank === rank) ?? null
  const growth = segment?.growth ?? null
  return {
    kind: "line",
    rank,
    scoreLabel: formatPt(point.score),
    timestamp: segment?.timestamp ?? null,
    playerGrowthLabel: null,
    playerGrowthPositive: false,
    rankGrowthLabel: growth?.growth != null ? formatGrowth(growth.growth) : null,
    rankGrowthPositive: (growth?.growth ?? 0) > 0,
    hourlySpeedLabel: hourlySpeedLabel(growth),
    prevGapLabel: previous ? formatGrowth(previous.score - point.score) : null,
    prevLabel: t("rankBorder.result.previousLine"),
    nextGapLabel: next ? formatGrowth(point.score - next.score) : null,
    nextLabel: t("rankBorder.result.nextLine"),
  }
}

const expandedFacts = computed<RankBorderQuickFacts | null>(() => {
  const rank = expandedRank.value
  if (rank == null) {
    return null
  }

  const points = comparablePoints.value
  const index = points.findIndex((point) => point.rank === rank)
  if (index < 0) {
    return null
  }

  const neighbours: PointNeighbours = {
    point: points[index],
    previous: index > 0 ? points[index - 1] : null,
    next: index + 1 < points.length ? points[index + 1] : null,
  }
  return rank <= PERSONAL_COLLECTION_LIMIT ? buildSeatFacts(rank, neighbours) : buildLineFacts(rank, neighbours)
})

// --- Visible-rank tracking (jump-rail sync) via IntersectionObserver ---------

const listRoot = ref<HTMLElement | null>(null)
let rowObserver: IntersectionObserver | null = null
const visibleRankSet = new Set<number>()
let reportFrame: number | null = null

function scheduleVisibleRankReport() {
  if (reportFrame != null) {
    return
  }
  reportFrame = requestAnimationFrame(() => {
    reportFrame = null
    if (visibleRankSet.size === 0) {
      reportVisibleRank(null)
      return
    }
    const sorted = Array.from(visibleRankSet).sort((a, b) => a - b)
    reportVisibleRank(sorted[Math.floor(sorted.length / 2)])
  })
}

function observeRows() {
  if (!listRoot.value) {
    return
  }
  rowObserver?.disconnect()
  visibleRankSet.clear()
  rowObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const rank = Number((entry.target as HTMLElement).dataset.rankBorderRow)
      if (!Number.isFinite(rank)) {
        continue
      }
      if (entry.isIntersecting) {
        visibleRankSet.add(rank)
      } else {
        visibleRankSet.delete(rank)
      }
    }
    scheduleVisibleRankReport()
  }, { rootMargin: "-64px 0px 0px 0px" })
  for (const row of listRoot.value.querySelectorAll<HTMLElement>("[data-rank-border-row]")) {
    rowObserver.observe(row)
  }
}

onMounted(() => {
  void nextTick(observeRows)
})

watch([hasTop100Data, () => segmentRows.value.length], () => {
  void nextTick(observeRows)
})

onBeforeUnmount(() => {
  rowObserver?.disconnect()
  rowObserver = null
  if (reportFrame != null) {
    cancelAnimationFrame(reportFrame)
    reportFrame = null
  }
})
</script>

<template>
  <section ref="listRoot" class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="truncate text-base font-semibold">{{ selectedEvent?.label ?? t("rankBorder.sections.lines") }}</h2>
        <p class="text-sm text-muted-foreground">
          {{ t("rankBorder.sections.linesDescription") }}
        </p>
      </div>
    </div>

    <div v-if="tracker.error.value" class="flex flex-col gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-1">
        <p class="text-sm font-medium text-destructive">{{ t("rankBorder.result.loadErrorTitle") }}</p>
        <p class="text-xs text-muted-foreground">{{ t("rankBorder.result.loadErrorHint") }}</p>
        <p class="break-all text-xs text-destructive/70">{{ tracker.error.value }}</p>
      </div>
      <Button variant="outline" size="sm" class="shrink-0" :disabled="!canRefresh || liveRefreshing" @click="refreshData(true)">
        <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
        {{ t("rankBorder.actions.retry") }}
      </Button>
    </div>

    <div v-if="!hasTop100Data" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
      {{ t("rankBorder.result.emptyLines") }}
    </div>
    <div v-else class="rank-border-table-shell rounded-md border bg-background/80">
      <div class="rank-border-table-header rank-border-top-header">
        <span>{{ t("rankBorder.table.rank") }}</span>
        <span>{{ t("rankBorder.table.player") }}</span>
        <span class="text-right">{{ t("rankBorder.table.score") }}</span>
      </div>

      <div class="rank-border-top-list">
        <div
          v-for="row in rowViewModels"
          :key="row.rank"
          :data-rank-border-row="row.rank"
          class="rank-border-top-item border-b"
        >
          <button
            type="button"
            :class="[
              'rank-border-table-row rank-border-top-row text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
              row.rank <= 3 ? 'bg-cyan-50/55 dark:bg-cyan-500/10' : 'bg-background/80',
              expandedRank === row.rank ? 'ring-1 ring-cyan-500/50' : '',
            ]"
            :aria-expanded="expandedRank === row.rank"
            @click="toggleRowExpansion(row.rank)"
          >
            <div class="rank-border-rank-cell">
              <span
                :class="[
                  'inline-flex min-w-10 justify-center rounded-md border px-1.5 py-1 text-xs font-semibold tabular-nums sm:min-w-12 sm:px-2 sm:text-sm',
                  row.rank === 1 ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100' : '',
                  row.rank === 2 ? 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-100' : '',
                  row.rank === 3 ? 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100' : '',
                  row.rank > 3 ? 'bg-background text-foreground' : '',
                ]"
              >
                {{ formatRank(row.rank) }}
              </span>
            </div>

            <div class="rank-border-player-scroll">
              <div
                :class="[
                  'rank-border-player-track',
                  shouldRenderProfileAssets ? 'rank-border-player-track--assets' : 'rank-border-player-track--plain',
                ]"
              >
                <LeaderCard v-if="shouldRenderProfileAssets" :leader="row.leader" variant="row" />
                <div class="rank-border-player-copy">
                  <p class="rank-border-player-name">
                    <span
                      v-for="segment in row.nameSegments"
                      :key="segment.key"
                      :style="richNameSegmentStyle(segment)"
                    >
                      {{ segment.text }}
                    </span>
                  </p>
                  <div v-if="row.honorViews.length > 0" class="rank-border-honor-strip rank-border-honor-strip--row">
                    <HonorBadge
                      v-for="honor in row.honorViews"
                      :key="honor.key"
                      :honor="honor"
                      variant="row"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="rank-border-score-cell">
              <span
                :key="`score:${row.scoreLabel}`"
                :class="[
                  'rank-border-live-number rank-border-row-score',
                  row.scoreChanged ? 'rank-border-live-number--changed' : '',
                ]"
              >
                {{ row.scoreLabel }}
              </span>
              <div class="rank-border-score-meta flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[0.6875rem] leading-4 text-muted-foreground sm:gap-2 sm:text-xs">
                <span
                  v-if="row.growthLabel"
                  :key="`growth:${row.growthLabel}`"
                  :class="[
                    'rank-border-live-number inline-flex items-center gap-1',
                    row.growthChanged ? 'rank-border-live-number--changed' : '',
                    row.growthPositive ? 'text-emerald-600 dark:text-emerald-300' : '',
                  ]"
                >
                  <span class="text-muted-foreground">{{ t("rankBorder.result.playerGrowthShort") }}</span>
                  <span>{{ row.growthLabel }}</span>
                </span>
                <span
                  v-if="row.rankGrowthLabel"
                  :key="`rank-growth:${row.rankGrowthLabel}`"
                  :class="[
                    'rank-border-live-number inline-flex items-center gap-1',
                    row.growthChanged ? 'rank-border-live-number--changed' : '',
                    row.rankGrowthPositive ? 'text-emerald-600 dark:text-emerald-300' : '',
                  ]"
                >
                  <span class="text-muted-foreground">{{ t("rankBorder.result.rankGrowthShort") }}</span>
                  <span>{{ row.rankGrowthLabel }}</span>
                </span>
                <RelativeTime :timestamp="row.timestamp" />
              </div>
            </div>
          </button>

          <RankQuickFacts v-if="expandedRank === row.rank && expandedFacts" :facts="expandedFacts" />
        </div>
      </div>

      <div v-if="segmentRows.length > 0" class="rank-border-segment-divider">
        <span>{{ t("rankBorder.sections.segmentLines") }}</span>
        <span class="text-muted-foreground/80">{{ t("rankBorder.sections.segmentLinesDescription", { interval: intervalLabel }) }}</span>
      </div>

      <div
        v-for="row in segmentRows"
        :key="row.rank"
        :data-rank-border-row="row.rank"
        class="border-b last:border-b-0"
      >
        <button
          type="button"
          :class="[
            'rank-border-table-row rank-border-segment-row bg-background/80 text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
            expandedRank === row.rank ? 'ring-1 ring-cyan-500/50' : '',
          ]"
          :aria-expanded="expandedRank === row.rank"
          @click="toggleRowExpansion(row.rank)"
        >
          <div class="rank-border-rank-cell">
            <span class="inline-flex min-w-12 justify-center rounded-md border bg-background px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
              {{ formatTargetRank(row.rank) }}
            </span>
          </div>

          <div class="rank-border-player-scroll">
            <div class="rank-border-player-track rank-border-player-track--plain">
              <p class="rank-border-player-name">
              {{ t("rankBorder.result.borderLine") }}
              </p>
            </div>
          </div>

          <div class="rank-border-score-cell">
            <span
              :key="`score:${row.score}`"
              :class="[
                'rank-border-live-number rank-border-row-score',
                row.scoreChanged ? 'rank-border-live-number--changed' : '',
              ]"
            >
              {{ formatPt(row.score) }}
            </span>
            <div class="rank-border-score-meta flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
              <span
                v-if="row.growth?.growth != null"
                :key="`growth:${row.growth.growth}`"
                :class="[
                  'rank-border-live-number',
                  row.growthChanged ? 'rank-border-live-number--changed' : '',
                  row.growth.growth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                ]"
              >
                {{ formatGrowth(row.growth.growth) }}
              </span>
              <RelativeTime :timestamp="row.timestamp" />
            </div>
          </div>
        </button>

        <RankQuickFacts v-if="expandedRank === row.rank && expandedFacts" :facts="expandedFacts" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.rank-border-live-number {
  display: inline-block;
  align-items: baseline;
  backface-visibility: hidden;
  transform-origin: center;
  transition: color 180ms ease, opacity 180ms ease;
}

.rank-border-live-number--changed {
  color: rgb(5 150 105);
  animation: rank-border-number-lift 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.rank-border-table-shell {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
}

.rank-border-table-header,
.rank-border-table-row {
  display: grid;
  min-width: 0;
  align-items: center;
}

.rank-border-table-header {
  position: sticky;
  top: 0;
  z-index: 3;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--muted) 45%, var(--background));
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
}

.rank-border-segment-divider {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.625rem;
  border-block: 1px solid var(--border);
  background: color-mix(in oklab, var(--muted) 45%, var(--background));
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.4rem 0.75rem;
}

.rank-border-segment-divider > span:last-child {
  font-weight: 400;
}

.rank-border-table-row {
  width: 100%;
  min-height: 4.375rem;
  border: 0;
  padding: 0.5rem 0.75rem;
}

.rank-border-top-list {
  position: relative;
}

/* Off-screen rows skip layout/paint entirely; the placeholder size keeps the
   scrollbar stable. */
.rank-border-top-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 4.4375rem;
}

.rank-border-top-header,
.rank-border-top-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.85rem, 13vw, 10.25rem);
  column-gap: 0.75rem;
}

.rank-border-segment-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.75rem, 12vw, 9.25rem);
  column-gap: 0.75rem;
}

.rank-border-rank-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.rank-border-player-scroll {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.rank-border-player-scroll::-webkit-scrollbar {
  display: none;
}

.rank-border-player-track {
  display: grid;
  width: max-content;
  min-width: 100%;
  align-items: center;
  justify-content: start;
  gap: 0.5rem;
  padding-block: 0.125rem;
  padding-inline-end: 0.75rem;
}

.rank-border-player-track--assets {
  grid-template-columns: max-content max-content;
}

.rank-border-player-track--plain {
  width: max-content;
  min-width: 100%;
}

.rank-border-player-copy {
  display: grid;
  width: max-content;
  min-width: 0;
  justify-items: start;
  gap: 0.375rem;
  text-align: left;
}

.rank-border-player-name {
  display: inline-flex;
  width: max-content;
  justify-self: start;
  min-width: max-content;
  max-width: none;
  align-items: baseline;
  justify-content: flex-start;
  overflow: visible;
  color: var(--foreground);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  text-align: left;
  white-space: nowrap;
}

.rank-border-score-cell {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: min-content;
  justify-items: end;
  gap: 0.25rem;
  align-self: stretch;
  align-content: center;
  padding-inline-start: 0.25rem;
  text-align: right;
}

.rank-border-row-score {
  min-width: 0;
  max-width: 100%;
  overflow: visible;
  font-size: clamp(0.9375rem, 1.65vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.15;
  white-space: nowrap;
}

.rank-border-honor-strip {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow: visible;
}

.rank-border-honor-strip--row {
  flex-wrap: nowrap;
  gap: 0.25rem 0.375rem;
  width: max-content;
  max-width: none;
  overflow-x: visible;
  overflow-y: hidden;
  scrollbar-width: none;
}

.rank-border-honor-strip--row::-webkit-scrollbar {
  display: none;
}

@keyframes rank-border-number-lift {
  0% {
    transform: translateY(0);
    filter: brightness(1);
  }

  38% {
    transform: translateY(-0.12rem);
    filter: brightness(1.12);
  }

  100% {
    transform: translateY(0);
    filter: brightness(1);
  }
}

@media (max-width: 767px) {
  .rank-border-table-header {
    display: none;
  }

  .rank-border-table-row {
    min-height: 3.75rem;
    padding: 0.5rem 0.625rem;
  }

  .rank-border-top-item {
    contain-intrinsic-size: auto 3.8125rem;
  }

  .rank-border-top-row {
    grid-template-columns: 3.1rem minmax(0, 1fr) minmax(6.9rem, 7.65rem);
    column-gap: 0.375rem;
  }

  .rank-border-segment-row {
    grid-template-columns: 4.2rem minmax(0, 1fr) minmax(6.45rem, 7rem);
    column-gap: 0.375rem;
  }

  .rank-border-player-track {
    gap: 0.5rem;
    padding-inline-end: 0.5rem;
  }

  .rank-border-player-track--assets {
    grid-template-columns: auto max-content;
  }

  .rank-border-player-name {
    font-size: 0.8125rem;
  }

  .rank-border-honor-strip--row {
    gap: 0.1875rem;
    max-width: none;
    overflow-x: visible;
  }

  .rank-border-score-cell {
    gap: 0.15rem;
    min-width: 0;
    padding-inline-start: 0.125rem;
  }

  .rank-border-row-score {
    font-size: clamp(0.765rem, 2.95vw, 0.9375rem);
    letter-spacing: 0;
  }

  .rank-border-score-meta {
    display: grid;
    justify-items: end;
    gap: 0.0625rem;
    font-size: 0.75rem;
    line-height: 1.15;
  }

  .rank-border-score-meta span {
    min-width: 0;
    max-width: 100%;
    white-space: nowrap;
  }

  .rank-border-segment-row .rank-border-score-meta {
    font-size: 0.8125rem;
  }
}
</style>
