import { computed, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { formatNumberCN } from "@/lib/number-format"
import { fetchRankBorderWebRankDetailV2 } from "../api/rank-border"
import { parseRankBorderRankQuery, type RankBorderTracePoint } from "../lib/rank-border"
import { FULL_TRACE_LIMIT } from "../lib/rank-border-constants"
import { traceRecordsForWindow } from "../lib/rank-border-chart"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Detail comparison target (any queryable rank or border line): selection
 * state, trace loading/caching, and the textual summary. The comparison trace
 * feeds the stats/charts sub-composables through `comparisonChartTrace`.
 */
export function useRankBorderDetailComparison(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
) {
  const {
    playbackAt,
    trackerEndpoint,
    selectedRegion,
    selectedEventId,
    mode,
    selectedWorldBloomCharacterId,
    tracker,
    canRefresh,
    latestTrackerTimestamp,
    formatRank,
    formatPt,
  } = deps
  const {
    detailTrace,
    detailDialogOpen,
    selectedHeatmapWindow,
    comparisonRankInput,
    comparisonRank,
    comparisonTrace,
    comparisonTraceLoading,
    comparisonTraceByKey,
    detailScope,
    normalizeTraceForPlayback,
  } = state

  const { t } = useI18n()

  // Top-100 milestones stay pickable even when the tracker returns no segment
  // border lines (their traces come from the personal collection range).
  const COMPARISON_PRESET_RANKS = [1, 10, 20, 50, 100]

  const comparisonLineRanks = computed(() =>
    [...new Set([
      ...COMPARISON_PRESET_RANKS,
      ...tracker.lines.value.map((line) => line.rank),
    ])].sort((a, b) => a - b),
  )

  const comparisonSelectValue = computed(() =>
    comparisonRank.value != null && comparisonLineRanks.value.includes(comparisonRank.value)
      ? String(comparisonRank.value)
      : "none",
  )

  const comparisonScopeKey = computed(() => [
    trackerEndpoint.value,
    selectedRegion.value,
    selectedEventId.value ?? "",
    mode.value,
    selectedWorldBloomCharacterId.value ?? "",
    playbackAt.value ?? "",
  ].join(":"))

  const comparisonChartTrace = computed(() =>
    selectedHeatmapWindow.value
      ? traceRecordsForWindow(comparisonTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
      : comparisonTrace.value,
  )

  const comparisonSummary = computed(() => {
    const rank = comparisonRank.value
    if (rank == null) {
      return null
    }
    if (comparisonTraceLoading.value && comparisonTrace.value.length === 0) {
      return t("rankBorder.comparison.loading", { rank: formatRank(rank) })
    }

    const latestComparison = comparisonTrace.value[comparisonTrace.value.length - 1] ?? null
    if (latestComparison == null) {
      return t("rankBorder.comparison.empty", { rank: formatRank(rank) })
    }

    const own = detailTrace.value[detailTrace.value.length - 1] ?? null
    if (own == null) {
      return t("rankBorder.comparison.scoreOnly", { rank: formatRank(rank), score: formatPt(latestComparison.score) })
    }

    const diff = own.score - latestComparison.score
    const diffKey = diff > 0 ? "rankBorder.comparison.ahead" : diff < 0 ? "rankBorder.comparison.behind" : "rankBorder.comparison.even"
    return t(diffKey, {
      rank: formatRank(rank),
      score: formatPt(latestComparison.score),
      diff: formatNumberCN(Math.abs(diff)),
    })
  })

  function comparisonTraceCacheKey(rank: number) {
    return `${comparisonScopeKey.value}:${rank}`
  }

  async function loadComparisonTrace() {
    const rank = comparisonRank.value
    if (rank == null || !canRefresh.value) {
      return
    }

    const key = comparisonTraceCacheKey(rank)
    const cached = comparisonTraceByKey.value.get(key)
    if (cached) {
      comparisonTrace.value = cached
      return
    }

    comparisonTraceLoading.value = true
    try {
      const records = await fetchComparisonRankTrace(rank).catch(() => [])
      if (comparisonRank.value !== rank || comparisonTraceCacheKey(rank) !== key) {
        return
      }

      const timeline = normalizeTraceForPlayback(records)
      const next = new Map(comparisonTraceByKey.value)
      next.set(key, timeline)
      comparisonTraceByKey.value = next
      comparisonTrace.value = timeline
    } finally {
      comparisonTraceLoading.value = false
    }
  }

  // Top-100 ranks often ship their history as the tracked player's trace while
  // the plain rank trace stays empty; fall back so those stay comparable.
  async function fetchComparisonRankTrace(rank: number): Promise<RankBorderTracePoint[]> {
    const rankDetail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
      includeTrace: true,
      includePlayerTrace: true,
      limit: FULL_TRACE_LIMIT,
    }).catch(() => null)
    if (rankDetail == null) {
      return []
    }

    return rankDetail.rankTrace.length > 0 ? rankDetail.rankTrace : rankDetail.playerTrace
  }

  function updateComparisonSelect(value: AcceptableValue) {
    if (typeof value !== "string") {
      return
    }

    comparisonRankInput.value = ""
    if (value === "none") {
      comparisonRank.value = null
      return
    }

    const rank = Number(value)
    comparisonRank.value = Number.isInteger(rank) && rank > 0 ? rank : null
  }

  function applyComparisonInput() {
    const query = comparisonRankInput.value.trim()
    if (query === "") {
      comparisonRank.value = null
      return
    }

    const rank = parseRankBorderRankQuery(query)
    if (rank != null) {
      comparisonRank.value = rank
    }
  }

  watch(comparisonRank, () => {
    comparisonTrace.value = []
    void loadComparisonTrace()
  })

  watch(comparisonScopeKey, () => {
    comparisonTraceByKey.value = new Map()
    comparisonTrace.value = []
    void loadComparisonTrace()
  })

  // Refresh the comparison series alongside live tracker updates.
  watch(latestTrackerTimestamp, () => {
    if (comparisonRank.value == null || !detailDialogOpen.value) {
      return
    }

    const key = comparisonTraceCacheKey(comparisonRank.value)
    if (comparisonTraceByKey.value.has(key)) {
      const next = new Map(comparisonTraceByKey.value)
      next.delete(key)
      comparisonTraceByKey.value = next
    }
    void loadComparisonTrace()
  })

  return {
    comparisonLineRanks,
    comparisonSelectValue,
    comparisonScopeKey,
    comparisonChartTrace,
    comparisonSummary,
    comparisonTraceCacheKey,
    loadComparisonTrace,
    fetchComparisonRankTrace,
    updateComparisonSelect,
    applyComparisonInput,
  }
}
