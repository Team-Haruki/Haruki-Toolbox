import { computed, type ComputedRef } from "vue"
import { formatNumberCN } from "@/lib/number-format"
import {
  resolveRankBorderTraceRoundCount,
  resolveRankBorderTraceGrowth,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import {
  DETAIL_CSB_WINDOW_SECONDS,
  DETAIL_RECENT_POINT_COUNT,
} from "../lib/rank-border-constants"
import {
  findLatestTraceAtTimestamp,
  resolveLatestTraceDelta,
  resolveRecentAverageDelta,
  resolveTraceGrowthForWindow,
  resolveTraceRoundRate,
} from "../lib/rank-border-chart"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

export type RankBorderComparisonStatLine = {
  value: string
  diff: string | null
  tone: "up" | "down" | null
}

/**
 * Per-trace metric stats for the active detail and the comparison target
 * (hourly speed, recent averages, loop counts, neighbor gaps), plus the
 * second-row comparison stat lines shown on the detail stat cards.
 */
export function useRankBorderDetailStats(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
  shared: { comparisonChartTrace: ComputedRef<RankBorderTracePoint[]> },
) {
  const {
    detail,
    currentUnixSecond,
    selectedIntervalSeconds,
    formatPt,
    formatGrowth,
    formatPerHour,
    formatLoopCount,
  } = deps
  const {
    detailTrace,
    selectedHeatmapWindow,
    comparisonRank,
    comparisonTrace,
    scopedDetailTrace,
  } = state
  const { comparisonChartTrace } = shared

  const activeDetailPreviousGap = computed(() =>
    detail.value?.previous
      ? detailDelta(detail.value.previous, detail.value.result)
      : null,
  )

  const activeDetailNextGap = computed(() =>
    detail.value?.next
      ? detailDelta(detail.value.result, detail.value.next)
      : null,
  )

  // Shared per-trace metrics so the comparison target reports the same numbers
  // as the primary detail trace.
  function resolveTraceMetricStats(records: RankBorderTracePoint[], fullRecords: RankBorderTracePoint[]) {
    const latestTrace = records[records.length - 1] ?? null
    const startTime = (latestTrace?.timestamp ?? currentUnixSecond.value) - selectedIntervalSeconds.value
    const growth = resolveRankBorderTraceGrowth(records, startTime)
    const latestInterval = resolveLatestTraceDelta(records)
    const recentAverage = resolveRecentAverageDelta(records, DETAIL_RECENT_POINT_COUNT)
    const threeWindowGrowth = resolveTraceGrowthForWindow(records, DETAIL_CSB_WINDOW_SECONDS)
    const roundWindowStart = selectedHeatmapWindow.value?.start ?? startTime
    const roundWindowEnd = selectedHeatmapWindow.value?.end ?? latestTrace?.timestamp ?? currentUnixSecond.value
    const roundRate = selectedHeatmapWindow.value
      ? resolveRankBorderTraceRoundCount(fullRecords, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end)
      : resolveTraceRoundRate(fullRecords, roundWindowStart, roundWindowEnd)
    return {
      latest: latestTrace,
      growth,
      hourlySpeed: growth?.growth != null && growth.timeDiff
        ? Math.round((growth.growth / growth.timeDiff) * 3600)
        : null,
      latestPointGrowth: latestInterval?.growth ?? null,
      latestPointSeconds: latestInterval?.timeDiff ?? null,
      recentAveragePt: recentAverage,
      threeWindowGrowth: threeWindowGrowth?.growth ?? null,
      threeWindowSpeed: threeWindowGrowth?.growth != null && threeWindowGrowth.timeDiff
        ? Math.round((threeWindowGrowth.growth / threeWindowGrowth.timeDiff) * 3600)
        : null,
      loopCount: roundRate,
      hasChart: records.length >= 2,
    }
  }

  const detailTraceStats = computed(() => {
    const records = scopedDetailTrace.value
    const stats = resolveTraceMetricStats(records, detailTrace.value)
    const growth = stats.growth
    const earlier = growth?.timestampEarlier != null
      ? records.find((record) => record.timestamp === growth.timestampEarlier) ?? null
      : null
    const latest = growth?.timestampLatest != null
      ? findLatestTraceAtTimestamp(records, growth.timestampLatest)
      : null
    return {
      records,
      ...stats,
      rankShift: earlier && latest ? earlier.rank - latest.rank : null,
      previousGap: activeDetailPreviousGap.value,
      nextGap: activeDetailNextGap.value,
    }
  })

  const comparisonTraceStats = computed(() =>
    comparisonRank.value == null
      ? null
      : resolveTraceMetricStats(comparisonChartTrace.value, comparisonTrace.value),
  )

  /**
   * Second-row values for the detail stats cards while a comparison target is
   * active: the target's value plus the signed gap versus the current detail.
   */
  const comparisonStatLines = computed<Record<string, RankBorderComparisonStatLine> | null>(() => {
    const stats = comparisonTraceStats.value
    if (stats == null) {
      return null
    }

    const own = detailTraceStats.value
    const line = (
      ownValue: number | null | undefined,
      targetValue: number | null | undefined,
      format: (value: number | null | undefined) => string,
    ): RankBorderComparisonStatLine => ({
      value: format(targetValue),
      diff: typeof ownValue === "number" && typeof targetValue === "number" && ownValue !== targetValue
        ? formatNumberCN(Math.abs(ownValue - targetValue))
        : null,
      tone: typeof ownValue === "number" && typeof targetValue === "number"
        ? ownValue > targetValue ? "up" : ownValue < targetValue ? "down" : null
        : null,
    })
    return {
      hourlySpeed: line(own.hourlySpeed, stats.hourlySpeed, formatPerHour),
      recentAveragePt: line(own.recentAveragePt, stats.recentAveragePt, formatPt),
      latestPointGrowth: line(own.latestPointGrowth, stats.latestPointGrowth, formatGrowth),
      threeWindowSpeed: line(own.threeWindowSpeed, stats.threeWindowSpeed, formatPerHour),
      loopCount: line(own.loopCount, stats.loopCount, formatLoopCount),
    }
  })

  function detailDelta(from: { score: number } | null, to: { score: number } | null) {
    if (!from || !to) {
      return null
    }
    return from.score - to.score
  }

  return {
    activeDetailPreviousGap,
    activeDetailNextGap,
    resolveTraceMetricStats,
    detailTraceStats,
    comparisonTraceStats,
    comparisonStatLines,
    detailDelta,
  }
}
