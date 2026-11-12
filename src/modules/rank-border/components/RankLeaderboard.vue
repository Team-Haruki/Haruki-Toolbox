<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import EmptyState from "@/shared/components/EmptyState.vue"
import LoadErrorState from "@/shared/components/LoadErrorState.vue"
import { useRankBorderContext } from "../composables/rank-border-context"
import {
  buildProfileHonorViews,
  resolveLeaderVisual,
  sanitizeDomId,
  type RankBorderLeaderVisual,
} from "../lib/honor-visuals"
import { formatDurationLabel } from "../lib/duration-label"
import { resolveCatchUpSeconds, resolveHourlySpeed } from "../lib/overview-stats"
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

const { intervalOptions, intervalSeconds } = query
const {
  tracker,
  liveRefreshing,
  canRefresh,
  top100Rows,
  hasTop100Data,
  refreshData,
} = live
const { honorContext } = honors
const {
  shouldRenderProfileAssets,
  expandedRank,
  toggleRowExpansion,
  reportVisibleRank,
  formatRank,
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
  empty: boolean
  timestamp: number | null
  scoreLabel: string
  scoreChanged: boolean
  /** pt behind the seat above, as "-12,345"; null for #1 or an unknown neighbour. */
  gapLabel: string | null
  growthLabel: string | null
  growthPositive: boolean
  /** The holder's own pt/h over the window. */
  speedLabel: string | null
  growthChanged: boolean
  nameSegments: RichNameSegment[]
  leader: RankBorderLeaderVisual | null
  honorViews: RankBorderHonorView[]
}

const rowViewModels = computed<LeaderRowVM[]>(() => {
  const renderAssets = shouldRenderProfileAssets.value
  const ctx = honorContext.value
  const rows = top100Rows.value
  return rows.map((row, index) => {
    const above = index > 0 ? rows[index - 1] : null
    const speed = resolveHourlySpeed(row.growth)
    return {
      rank: row.rank,
      empty: row.detail == null,
      timestamp: row.timestamp,
      scoreLabel: formatPt(row.score),
      scoreChanged: row.scoreChanged,
      gapLabel: above?.score != null && row.score != null ? formatGrowth(row.score - above.score) : null,
      growthLabel: row.displayGrowth != null ? formatGrowth(row.displayGrowth) : null,
      growthPositive: (row.displayGrowth ?? 0) > 0,
      speedLabel: speed != null ? formatPerHour(speed) : null,
      growthChanged: row.growthChanged,
      nameSegments: richUserLabelSegments(row.detail, t("rankBorder.result.noPlayer")),
      leader: renderAssets ? resolveLeaderVisual(row.detail, ctx) : null,
      // Honors show in the expanded row and, on a wide list, beside the name.
      honorViews: renderAssets
        ? buildProfileHonorViews(row.detail, ctx, 3, `row-${row.rank}-${sanitizeDomId(row.detail?.userId ?? "line")}`)
        : [],
    }
  })
})

const intervalLabel = computed(() =>
  intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label ?? "-",
)

// --- Quick-facts (inline expansion) ------------------------------------------
// Derived entirely from the overview payload already in memory: the seats on
// either side, the holder's and the seat's pace over the window, and how long
// the gaps would take to close at those paces. Zero fetches.

function catchUpLabel(key: "catchUp" | "caughtBy", gap: number | null, chaser: number | null, leader: number | null): string | null {
  const seconds = resolveCatchUpSeconds(gap, chaser, leader)
  return seconds != null ? t(`rankBorder.overview.facts.${key}`, { duration: formatDurationLabel(t, seconds) }) : null
}

const expandedFacts = computed<RankBorderQuickFacts | null>(() => {
  const rank = expandedRank.value
  const rows = top100Rows.value
  const row = rank != null ? rows[rank - 1] : null
  if (rank == null || !row || row.score == null) {
    return null
  }

  const above = rank > 1 ? rows[rank - 2] : null
  const below = rows[rank] ?? null
  const holderSpeed = resolveHourlySpeed(row.growth)
  const seatSpeed = resolveHourlySpeed(row.rankGrowth)
  const aboveGap = above?.score != null ? above.score - row.score : null
  const belowGap = below?.score != null ? row.score - below.score : null

  return {
    kind: "rank",
    rank,
    userId: row.detail?.userId?.trim() || null,
    scoreLabel: formatPt(row.score),
    timestamp: row.timestamp,
    playerGrowthLabel: row.displayGrowth != null ? formatGrowth(row.displayGrowth) : null,
    playerGrowthPositive: (row.displayGrowth ?? 0) > 0,
    rankGrowthLabel: row.displayRankGrowth != null ? formatGrowth(row.displayRankGrowth) : null,
    rankGrowthPositive: (row.displayRankGrowth ?? 0) > 0,
    hourlySpeedLabel: holderSpeed != null ? formatPerHour(holderSpeed) : null,
    seatSpeedLabel: seatSpeed != null ? formatPerHour(seatSpeed) : null,
    prevGapLabel: aboveGap != null ? formatGrowth(-aboveGap) : null,
    prevLabel: t("rankBorder.result.previousRank"),
    prevNote: catchUpLabel("catchUp", aboveGap, holderSpeed, resolveHourlySpeed(above?.growth)),
    nextGapLabel: belowGap != null ? formatGrowth(belowGap) : null,
    nextLabel: t("rankBorder.result.nextRank"),
    nextNote: catchUpLabel("caughtBy", belowGap, resolveHourlySpeed(below?.growth), holderSpeed),
    profileWord: row.detail?.profileWord?.trim() || null,
  }
})

const expandedHonors = computed(() =>
  expandedRank.value != null ? rowViewModels.value[expandedRank.value - 1]?.honorViews ?? [] : [],
)

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

watch(hasTop100Data, () => {
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
  <section ref="listRoot" class="@container flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card" data-testid="rank-leaderboard">
    <header class="border-b border-border/60 px-4 py-3">
      <h2 class="text-sm font-semibold">{{ t("rankBorder.overview.board.title") }}</h2>
      <p class="mt-0.5 text-xs text-muted-foreground">{{ t("rankBorder.overview.board.description", { interval: intervalLabel }) }}</p>
    </header>

    <div v-if="tracker.error.value" class="border-b border-border/60">
      <LoadErrorState
        :title="t('rankBorder.result.loadErrorTitle')"
        :description="tracker.error.value"
        :detail="tracker.errorDetail.value"
        :retry-label="t('rankBorder.actions.retry')"
        :retryable="canRefresh"
        :retrying="liveRefreshing"
        @retry="refreshData()"
      />
    </div>

    <!-- The empty placeholder yields to the error block: "nothing collected yet" under "could not load" would contradict it. -->
    <EmptyState v-if="!hasTop100Data && !tracker.error.value" :title="t('rankBorder.result.emptyLines')" size="sm" />

    <template v-else-if="hasTop100Data">
      <!-- Captions for the wide table; a narrow list labels nothing and folds the extras under the score. -->
      <div class="hidden items-center gap-3 bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground @min-[44rem]:flex">
        <span class="w-11 shrink-0">{{ t("rankBorder.table.rank") }}</span>
        <span class="min-w-0 flex-1">{{ t("rankBorder.table.player") }}</span>
        <span class="w-32 shrink-0 text-right">{{ t("rankBorder.table.score") }}</span>
        <span class="w-24 shrink-0 text-right">{{ t("rankBorder.result.previousRank") }}</span>
        <span class="w-24 shrink-0 text-right">{{ t("rankBorder.overview.board.holderGrowth") }}</span>
        <span class="hidden w-28 shrink-0 text-right @min-[54rem]:block">{{ t("rankBorder.table.hourlySpeed") }}</span>
        <span class="w-16 shrink-0 text-right">{{ t("rankBorder.result.updatedAgo") }}</span>
      </div>

      <ul class="divide-y divide-border/60" role="list">
        <li
          v-for="row in rowViewModels"
          :key="row.rank"
          :data-rank-border-row="row.rank"
          class="rank-border-top-item"
        >
          <button
            type="button"
            :class="[
              'flex w-full items-center gap-2 px-3 py-1.5 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/50 @min-[44rem]:gap-3 dark:hover:bg-accent/30',
              expandedRank === row.rank ? 'bg-primary/5' : '',
            ]"
            :aria-expanded="expandedRank === row.rank"
            @click="toggleRowExpansion(row.rank)"
          >
            <span class="w-11 shrink-0">
              <span
                :class="[
                  'inline-flex min-w-10 justify-center rounded-md px-1 py-0.5 text-xs font-semibold tabular-nums',
                  row.rank === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-100' : '',
                  row.rank === 2 ? 'bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-100' : '',
                  row.rank === 3 ? 'bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-100' : '',
                  row.rank > 3 ? 'bg-muted text-foreground' : '',
                ]"
              >
                {{ formatRank(row.rank) }}
              </span>
            </span>

            <span class="flex min-w-0 flex-1 items-center gap-2">
              <LeaderCard v-if="shouldRenderProfileAssets" :leader="row.leader" variant="row" class="rank-border-row-card" />
              <span
                :class="['min-w-0 truncate text-sm font-medium', row.empty ? 'text-muted-foreground' : '']"
              >
                <span
                  v-for="segment in row.nameSegments"
                  :key="segment.key"
                  :style="richNameSegmentStyle(segment)"
                >{{ segment.text }}</span>
              </span>
              <!-- Room for the honors only on a wide list; they are always in the expanded row. -->
              <span v-if="row.honorViews.length > 0" class="hidden shrink-0 items-center gap-1 @min-[72rem]:flex">
                <HonorBadge
                  v-for="honor in row.honorViews"
                  :key="honor.key"
                  :honor="honor"
                  variant="row"
                  class="rank-border-row-honor"
                />
              </span>
            </span>

            <span class="flex shrink-0 flex-col items-end @min-[44rem]:w-32">
              <span
                :key="`score:${row.scoreLabel}`"
                :class="['text-sm font-semibold tabular-nums', row.scoreChanged ? 'rank-border-flash' : '']"
              >
                {{ row.scoreLabel }}
              </span>
              <!-- Narrow list: growth and age under the score. -->
              <span class="flex items-center gap-1.5 text-[11px] tabular-nums text-muted-foreground @min-[44rem]:hidden">
                <span v-if="row.growthLabel" :class="row.growthPositive ? 'text-emerald-600 dark:text-emerald-400' : ''">{{ row.growthLabel }}</span>
                <RelativeTime :timestamp="row.timestamp" />
              </span>
            </span>

            <span class="hidden w-24 shrink-0 text-right text-xs tabular-nums text-muted-foreground @min-[44rem]:block">
              {{ row.gapLabel ?? "—" }}
            </span>
            <span
              :key="`growth:${row.growthLabel}`"
              :class="[
                'hidden w-24 shrink-0 text-right text-xs tabular-nums @min-[44rem]:block',
                row.growthPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
                row.growthChanged ? 'rank-border-flash' : '',
              ]"
            >
              {{ row.growthLabel ?? "—" }}
            </span>
            <span class="hidden w-28 shrink-0 text-right text-xs tabular-nums @min-[54rem]:block">
              {{ row.speedLabel ?? "—" }}
            </span>
            <span class="hidden w-16 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground @min-[44rem]:block">
              <RelativeTime :timestamp="row.timestamp" />
            </span>
          </button>

          <RankQuickFacts
            v-if="expandedRank === row.rank && expandedFacts"
            :facts="expandedFacts"
            :honors="expandedHonors"
          />
        </li>
      </ul>
    </template>
  </section>
</template>

<style scoped>
/* Off-screen rows skip layout and paint; the placeholder size keeps the scrollbar stable. */
.rank-border-top-item {
  content-visibility: auto;
  contain-intrinsic-size: auto 2.875rem;
}

/* The leader card and honor badges size themselves in their own stylesheets; a compact row needs them smaller. */
.rank-border-row-card {
  width: 2.25rem !important;
  height: 2.25rem !important;
}

.rank-border-row-honor {
  width: 3.6rem !important;
}

/* A number that just changed lifts once; the key on the node replays it. */
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
