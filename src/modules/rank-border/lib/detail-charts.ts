import type { RankBorderTracePoint } from "./rank-border"
import {
  buildSpeedTrendRecords,
  chartMetricValue,
  chartMetricY,
  chartRecordsForTimeDomain,
  chartTimestampX,
  numericExtent,
  resolveChartTickValues,
  sampleTraceRecords,
  sparklinePath,
} from "./rank-border-chart"
import {
  DETAIL_CHART_HEIGHT,
  DETAIL_CHART_MAX_POINTS,
  DETAIL_CHART_WIDTH,
  DETAIL_CHART_X_PADDING,
  DETAIL_CHART_Y_BOTTOM_PADDING,
  DETAIL_CHART_Y_PADDING,
} from "./rank-border-constants"
import type {
  RankBorderChartMetric,
  RankBorderChartPoint,
  RankBorderChartReferenceLine,
  RankBorderChartTimeDomain,
  RankBorderChartTimeTick,
  RankBorderScoreOverlayLine,
} from "./rank-border-types"

/**
 * Pure chart-series building for the detail page. The primary trace plus up to
 * a handful of comparison traces are folded into one shared value domain per
 * metric, so every overlay lands on the same axis as the main series.
 */
export type DetailChartComparisonSeries = {
  key: string
  records: RankBorderTracePoint[]
}

export type DetailChartOverlayValue = {
  key: "target" | "planned"
  value: number
}

export type DetailChartComparisonPath = {
  key: string
  path: string
}

export type DetailMetricChart = {
  referenceLines: RankBorderChartReferenceLine[]
  points: RankBorderChartPoint[]
  path: string
  comparisonPaths: DetailChartComparisonPath[]
}

export type DetailChartsResult = {
  rank: DetailMetricChart
  score: DetailMetricChart
  speed: DetailMetricChart
  timeTicks: RankBorderChartTimeTick[]
  plannerLines: RankBorderScoreOverlayLine[]
}

export type BuildDetailChartsInput = {
  records: RankBorderTracePoint[]
  comparisons: DetailChartComparisonSeries[]
  timeDomain: RankBorderChartTimeDomain | null
  /** Score axis starts at zero unless a zoomed window is active. */
  scoreZeroBaseline: boolean
  /** "detailed" (the expanded dialog) samples more points and denser ticks. */
  density?: "compact" | "detailed"
  plannerValues: DetailChartOverlayValue[]
  formatTick: (value: number, metric: RankBorderChartMetric) => string
  formatPoint: (record: RankBorderTracePoint, metric: RankBorderChartMetric) => string
  formatTimeTick: (timestamp: number, timeDomain: RankBorderChartTimeDomain) => string
  plannerLabel: (key: "target" | "planned") => string
}

export function buildDetailCharts(input: BuildDetailChartsInput): DetailChartsResult {
  const {
    records,
    comparisons,
    timeDomain,
    scoreZeroBaseline,
    density = "compact",
    plannerValues,
    formatTick,
    formatPoint,
    formatTimeTick,
    plannerLabel,
  } = input
  const maxPoints = density === "detailed" ? 360 : DETAIL_CHART_MAX_POINTS
  const referenceTickCount = density === "detailed" ? 6 : 3

  const chartRecords = chartRecordsForTimeDomain(records, timeDomain)
  const comparisonRecords = comparisons.map((series) => ({
    key: series.key,
    records: chartRecordsForTimeDomain(series.records, timeDomain),
  }))

  const plannerNumbers = plannerValues.map((line) => line.value)
  const scoreValues = [
    ...chartRecords.map((record) => record.score),
    ...comparisonRecords.flatMap((series) => series.records.map((record) => record.score)),
    ...plannerNumbers,
  ]
  const scoreExtent = numericExtent(scoreValues)
  const scoreDomain = scoreExtent
    ? {
        min: scoreZeroBaseline ? 0 : scoreExtent.min,
        max: scoreExtent.max,
      }
    : null

  const rankValues = [
    ...chartRecords.map((record) => record.rank),
    ...comparisonRecords.flatMap((series) => series.records.map((record) => record.rank)),
  ]
  const rankExtent = numericExtent(rankValues)
  const rankDomain = rankExtent ? { min: rankExtent.min, max: rankExtent.max } : null

  const speedRecords = dropUnfinishedSpeedBucket(buildSpeedTrendRecords(chartRecords), chartRecords)
  const comparisonSpeedRecords = comparisonRecords.map((series) => ({
    key: series.key,
    records: dropUnfinishedSpeedBucket(buildSpeedTrendRecords(series.records), series.records),
  }))
  const speedValues = [
    ...speedRecords.map((record) => record.score),
    ...comparisonSpeedRecords.flatMap((series) => series.records.map((record) => record.score)),
  ]
  const speedExtent = numericExtent(speedValues)
  const speedDomain = speedExtent
    ? { min: Math.min(0, speedExtent.min), max: speedExtent.max }
    : null

  const plannerLines: RankBorderScoreOverlayLine[] = scoreDomain == null || chartRecords.length < 2
    ? []
    : plannerValues.map((line) => ({
        key: line.key,
        value: line.value,
        y: Number(chartMetricY(line.value, scoreDomain.min, scoreDomain.max, "score", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, DETAIL_CHART_Y_BOTTOM_PADDING).toFixed(2)),
        label: plannerLabel(line.key),
        tone: line.key,
      }))

  function metricChart(
    metric: RankBorderChartMetric,
    mainRecords: RankBorderTracePoint[],
    comparisonSeries: Array<{ key: string; records: RankBorderTracePoint[] }>,
    valueDomain: { min: number; max: number } | null,
    zeroBaseline: boolean,
  ): DetailMetricChart {
    return {
      referenceLines: chartReferenceLines(mainRecords, metric, valueDomain, zeroBaseline, formatTick, referenceTickCount),
      points: chartPoints(mainRecords, metric, timeDomain, valueDomain, zeroBaseline, formatPoint, maxPoints),
      path: sparklinePath(mainRecords, metric, DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, maxPoints, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, zeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, valueDomain),
      comparisonPaths: comparisonSeries
        .map((series) => ({
          key: series.key,
          path: sparklinePath(series.records, metric, DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, maxPoints, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, zeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, valueDomain),
        }))
        .filter((series) => series.path !== ""),
    }
  }

  return {
    rank: metricChart("rank", chartRecords, comparisonRecords, rankDomain, false),
    score: metricChart("score", chartRecords, comparisonRecords, scoreDomain, scoreZeroBaseline),
    speed: metricChart("speed", speedRecords, comparisonSpeedRecords, speedDomain, false),
    timeTicks: chartTimeTicks(timeDomain, formatTimeTick, density),
    plannerLines,
  }
}

/**
 * The bucket covering the in-progress hour is systematically undercounted and
 * would render as a misleading cliff at the chart's right edge, so it is
 * dropped until the hour completes. (Speed buckets are keyed by their
 * midpoint; the source trace's last timestamp tells how far the hour got.)
 */
function dropUnfinishedSpeedBucket(
  speedRecords: RankBorderTracePoint[],
  sourceRecords: RankBorderTracePoint[],
): RankBorderTracePoint[] {
  const latest = sourceRecords[sourceRecords.length - 1]
  const last = speedRecords[speedRecords.length - 1]
  if (!latest || !last) {
    return speedRecords
  }

  const bucketEnd = last.timestamp + 1800
  return latest.timestamp < bucketEnd - 60 ? speedRecords.slice(0, -1) : speedRecords
}

function chartReferenceLines(
  records: RankBorderTracePoint[],
  metric: RankBorderChartMetric,
  valueDomain: { min: number; max: number } | null,
  zeroBaseline: boolean,
  formatTick: (value: number, metric: RankBorderChartMetric) => string,
  tickCount: number,
): RankBorderChartReferenceLine[] {
  const values = records.map((record) => chartMetricValue(record, metric))
  if (values.length === 0) {
    return []
  }

  const { min: valuesMin, max: valuesMax } = numericExtent(values) ?? { min: 0, max: 0 }
  const minValue = valueDomain?.min ?? (zeroBaseline && metric === "score" ? 0 : valuesMin)
  const maxValue = valueDomain?.max ?? valuesMax
  const tickValues = tickCount <= 3
    ? resolveChartTickValues(minValue, maxValue)
    : spreadChartTickValues(minValue, maxValue, tickCount)
  return tickValues
    .map((value) => ({
      value,
      y: Number(chartMetricY(value, minValue, maxValue, metric, DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, DETAIL_CHART_Y_BOTTOM_PADDING).toFixed(2)),
      label: formatTick(value, metric),
    }))
    .sort((a, b) => a.y - b.y)
}

function spreadChartTickValues(minValue: number, maxValue: number, count: number): number[] {
  if (maxValue === minValue) {
    return [minValue]
  }

  const step = (maxValue - minValue) / (count - 1)
  const values = new Set<number>()
  for (let index = 0; index < count; index += 1) {
    values.add(Math.round(minValue + step * index))
  }
  return Array.from(values)
}

function chartPoints(
  records: RankBorderTracePoint[],
  metric: RankBorderChartMetric,
  timeDomain: RankBorderChartTimeDomain | null,
  valueDomain: { min: number; max: number } | null,
  zeroBaseline: boolean,
  formatPoint: (record: RankBorderTracePoint, metric: RankBorderChartMetric) => string,
  maxPoints: number,
): RankBorderChartPoint[] {
  const sampledRecords = sampleTraceRecords(records, maxPoints)
  const values = sampledRecords.map((record) => chartMetricValue(record, metric))
  if (values.length < 2) {
    return []
  }

  const { min: valuesMin, max: valuesMax } = numericExtent(values) ?? { min: 0, max: 0 }
  const minValue = valueDomain?.min ?? (zeroBaseline && metric === "score" ? 0 : valuesMin)
  const maxValue = valueDomain?.max ?? valuesMax
  const usableWidth = Math.max(1, DETAIL_CHART_WIDTH - DETAIL_CHART_X_PADDING * 2)
  const xStep = usableWidth / Math.max(1, values.length - 1)
  const points = sampledRecords.map((record, index) => {
    const value = values[index]
    const x = timeDomain
      ? chartTimestampX(record.timestamp, timeDomain, DETAIL_CHART_WIDTH, DETAIL_CHART_X_PADDING)
      : DETAIL_CHART_X_PADDING + index * xStep
    return {
      key: `${metric}:${record.timestamp}:${index}`,
      x: Number(x.toFixed(2)),
      y: Number(chartMetricY(value, minValue, maxValue, metric, DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, DETAIL_CHART_Y_BOTTOM_PADDING).toFixed(2)),
      label: formatPoint(record, metric),
    }
  })

  const collapsedPoints: RankBorderChartPoint[] = []
  for (const point of points) {
    const previous = collapsedPoints[collapsedPoints.length - 1]
    if (previous && Math.abs(previous.x - point.x) < 0.5) {
      collapsedPoints[collapsedPoints.length - 1] = point
    } else {
      collapsedPoints.push(point)
    }
  }
  return collapsedPoints
}

function chartTimeTicks(
  timeDomain: RankBorderChartTimeDomain | null,
  formatTimeTick: (timestamp: number, timeDomain: RankBorderChartTimeDomain) => string,
  density: "compact" | "detailed",
): RankBorderChartTimeTick[] {
  if (!timeDomain) {
    return []
  }

  const duration = Math.max(1, timeDomain.end - timeDomain.start)
  const segments = density === "detailed" ? 8 : 4
  const anchors: Array<{ timestamp: number; minor: boolean }> = Array.from(
    { length: segments + 1 },
    (_, index) => ({
      timestamp: index === segments
        ? timeDomain.end
        : Math.round(timeDomain.start + (duration * index) / segments),
      minor: density === "detailed" ? index % 2 === 1 : index % 2 === 1,
    }),
  )
  const seen = new Set<number>()
  return anchors
    .filter((anchor) => {
      if (seen.has(anchor.timestamp)) {
        return false
      }
      seen.add(anchor.timestamp)
      return true
    })
    .map((anchor, index, kept) => {
      const x = chartTimestampX(anchor.timestamp, timeDomain, DETAIL_CHART_WIDTH, DETAIL_CHART_X_PADDING)
      return {
        key: `time:${anchor.timestamp}:${index}`,
        left: `${(x / DETAIL_CHART_WIDTH) * 100}%`,
        label: formatTimeTick(anchor.timestamp, timeDomain),
        minor: anchor.minor,
        align: index === 0 ? "start" as const : index === kept.length - 1 ? "end" as const : "center" as const,
      }
    })
}
