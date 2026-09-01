import {
  resolveRankBorderTraceGrowth,
  resolveRankBorderTraceRoundCount,
  type RankBorderGrowth,
  type RankBorderTracePoint,
} from "./rank-border"
import {
  findLatestTraceAtTimestamp,
  resolveLatestTraceDelta,
  resolveRecentAverageDelta,
  resolveTraceGrowthForWindow,
  resolveTraceRoundRate,
} from "./rank-border-chart"
import {
  DETAIL_CSB_WINDOW_SECONDS,
  DETAIL_RECENT_POINT_COUNT,
} from "./rank-border-constants"

export type TraceWindow = {
  start: number
  end: number
}

export type TraceMetricStats = {
  latest: RankBorderTracePoint | null
  growth: RankBorderGrowth | null
  hourlySpeed: number | null
  latestPointGrowth: number | null
  latestPointSeconds: number | null
  recentAveragePt: number | null
  threeWindowGrowth: number | null
  threeWindowSpeed: number | null
  loopCount: number | null
  rankShift: number | null
  hasChart: boolean
}

/**
 * Pure per-trace metric stats (hourly speed, recent averages, loop counts,
 * rank shift) shared by the detail page's primary target and every comparison
 * target, so all series report identical numbers for identical data.
 */
export function resolveTraceMetricStats(
  records: RankBorderTracePoint[],
  fullRecords: RankBorderTracePoint[],
  intervalSeconds: number,
  window: TraceWindow | null = null,
  nowSecond = Math.floor(Date.now() / 1000),
): TraceMetricStats {
  const latestTrace = records[records.length - 1] ?? null
  const startTime = (latestTrace?.timestamp ?? nowSecond) - intervalSeconds
  const growth = resolveRankBorderTraceGrowth(records, startTime)
  const latestInterval = resolveLatestTraceDelta(records)
  const recentAverage = resolveRecentAverageDelta(records, DETAIL_RECENT_POINT_COUNT)
  const threeWindowGrowth = resolveTraceGrowthForWindow(records, DETAIL_CSB_WINDOW_SECONDS)
  const roundWindowStart = window?.start ?? startTime
  const roundWindowEnd = window?.end ?? latestTrace?.timestamp ?? nowSecond
  const roundRate = window
    ? resolveRankBorderTraceRoundCount(fullRecords, window.start, window.end)
    : resolveTraceRoundRate(fullRecords, roundWindowStart, roundWindowEnd)

  const earlier = growth?.timestampEarlier != null
    ? records.find((record) => record.timestamp === growth.timestampEarlier) ?? null
    : null
  const latestAtGrowth = growth?.timestampLatest != null
    ? findLatestTraceAtTimestamp(records, growth.timestampLatest)
    : null

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
    rankShift: earlier && latestAtGrowth ? earlier.rank - latestAtGrowth.rank : null,
    hasChart: records.length >= 2,
  }
}
