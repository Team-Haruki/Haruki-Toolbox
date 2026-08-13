import { computed, type ComputedRef } from "vue"
import { useI18n } from "vue-i18n"
import {
  buildPlannerPlanKey,
  parseEventPlannerPointInput,
  summarizePlannerCells,
  useEventPlannerStore,
} from "@/modules/deck-recommend"
import { getI18nLocale } from "@/shared/i18n"
import type { RankBorderTracePoint } from "../lib/rank-border"
import {
  DETAIL_CHART_HEIGHT,
  DETAIL_CHART_MAX_POINTS,
  DETAIL_CHART_WIDTH,
  DETAIL_CHART_X_PADDING,
  DETAIL_CHART_Y_BOTTOM_PADDING,
  DETAIL_CHART_Y_PADDING,
} from "../lib/rank-border-constants"
import {
  buildSpeedTrendRecords,
  chartMetricValue,
  chartMetricY,
  chartRecordsForTimeDomain,
  chartTimestampX,
  isSameLocalDay,
  resolveChartTickValues,
  sampleTraceRecords,
  sparklinePath,
} from "../lib/rank-border-chart"
import type {
  RankBorderChartMetric,
  RankBorderChartPoint,
  RankBorderChartReferenceLine,
  RankBorderChartTimeDomain,
  RankBorderChartTimeTick,
  RankBorderDetailCharts,
  RankBorderScoreOverlayLine,
} from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Chart series building for the detail panel: the rank/score/speed sparkline
 * geometry, reference lines and time ticks, plus the planner overlay lines
 * folded into the shared score domain.
 */
export function useRankBorderDetailCharts(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
  shared: { comparisonChartTrace: ComputedRef<RankBorderTracePoint[]> },
) {
  const {
    detail,
    selectedRegion,
    selectedEventId,
    selectedActivityStartAt,
    selectedAccount,
    formatRank,
    formatPt,
    formatPerHour,
  } = deps
  const { selectedHeatmapWindow, chartDetailTrace } = state
  const { comparisonChartTrace } = shared

  const { t } = useI18n()
  const plannerStore = useEventPlannerStore()

  const selectedAccountDetail = computed(() =>
    selectedAccount.value && detail.value?.source === "user" && detail.value.query === selectedAccount.value.userId
      ? detail.value
      : null,
  )

  // --- Planner overlay (own realtime detail only) ------------------------------

  const plannerScoreLineValues = computed<Array<{ key: "target" | "planned"; value: number }>>(() => {
    const account = selectedAccount.value
    if (selectedAccountDetail.value == null || account == null || selectedEventId.value == null) {
      return []
    }

    const plan = plannerStore.getPlan(buildPlannerPlanKey(
      `${account.server}:${account.userId}`,
      selectedRegion.value,
      selectedEventId.value,
    ))
    if (plan == null) {
      return []
    }

    const lines: Array<{ key: "target" | "planned"; value: number }> = []
    const currentPoint = parseEventPlannerPointInput(plan.currentPointInput).value ?? 0
    const plannedPoints = summarizePlannerCells(plan.cells, plan.brushes).plannedPoints
    if (plannedPoints > 0) {
      lines.push({ key: "planned", value: currentPoint + plannedPoints })
    }

    const targetPoint = parseEventPlannerPointInput(plan.targetPointInput).value
    if (targetPoint != null && targetPoint > 0) {
      lines.push({ key: "target", value: targetPoint })
    }

    return lines
  })

  const detailCharts = computed<RankBorderDetailCharts>(() => {
    const records = chartDetailTrace.value
    const timeDomain = selectedHeatmapWindow.value
      ? { start: selectedHeatmapWindow.value.start, end: selectedHeatmapWindow.value.end }
      : resolveDetailChartTimeDomain(records)
    const chartRecords = chartRecordsForTimeDomain(records, timeDomain)
    const scoreZeroBaseline = selectedHeatmapWindow.value == null

    // Fold comparison and planner values into one shared score domain so every
    // overlay lands on the same axis as the main series.
    const comparisonRecords = chartRecordsForTimeDomain(comparisonChartTrace.value, timeDomain)
    const plannerValues = selectedHeatmapWindow.value == null
      ? plannerScoreLineValues.value.map((line) => line.value)
      : []
    const scoreValues = [
      ...chartRecords.map((record) => record.score),
      ...comparisonRecords.map((record) => record.score),
      ...plannerValues,
    ]
    const scoreDomain = scoreValues.length > 0
      ? {
          min: scoreZeroBaseline ? 0 : Math.min(...scoreValues),
          max: Math.max(...scoreValues),
        }
      : null

    const plannerLines: RankBorderScoreOverlayLine[] = scoreDomain == null || chartRecords.length < 2
      ? []
      : plannerScoreLineValues.value.map((line) => ({
          key: line.key,
          value: line.value,
          y: Number(chartMetricY(line.value, scoreDomain.min, scoreDomain.max, "score", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, DETAIL_CHART_Y_BOTTOM_PADDING).toFixed(2)),
          label: t(line.key === "target" ? "rankBorder.comparison.targetLine" : "rankBorder.comparison.plannedLine"),
          tone: line.key,
        }))

    const speedRecords = buildSpeedTrendRecords(chartRecords)
    const comparisonSpeedRecords = buildSpeedTrendRecords(comparisonRecords)
    const speedValues = [
      ...speedRecords.map((record) => record.score),
      ...comparisonSpeedRecords.map((record) => record.score),
    ]
    const speedDomain = speedValues.length > 0
      ? { min: Math.min(0, ...speedValues), max: Math.max(...speedValues) }
      : null

    return {
      rankReferenceLines: chartReferenceLines(chartRecords, "rank", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, false, DETAIL_CHART_Y_BOTTOM_PADDING),
      scoreReferenceLines: chartReferenceLines(chartRecords, "score", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, scoreDomain),
      speedReferenceLines: chartReferenceLines(speedRecords, "speed", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, false, DETAIL_CHART_Y_BOTTOM_PADDING, speedDomain),
      rankPoints: chartPoints(chartRecords, "rank", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING),
      scorePoints: chartPoints(chartRecords, "score", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, scoreDomain),
      speedPoints: chartPoints(speedRecords, "speed", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING, speedDomain),
      timeTicks: chartTimeTicks(timeDomain, DETAIL_CHART_WIDTH, DETAIL_CHART_X_PADDING),
      rankPath: sparklinePath(chartRecords, "rank", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING),
      scorePath: sparklinePath(chartRecords, "score", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, scoreDomain),
      speedPath: sparklinePath(speedRecords, "speed", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING, speedDomain),
      comparisonScorePath: sparklinePath(comparisonRecords, "score", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING, scoreDomain),
      comparisonSpeedPath: sparklinePath(comparisonSpeedRecords, "speed", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING, speedDomain),
      plannerLines,
    }
  })

  function chartReferenceLines(
    records: RankBorderTracePoint[],
    metric: RankBorderChartMetric,
    height = 96,
    yPadding = 0,
    zeroBaseline = false,
    yBottomPadding = yPadding,
    valueDomain: { min: number; max: number } | null = null,
  ): RankBorderChartReferenceLine[] {
    const values = records.map((record) => chartMetricValue(record, metric))
    if (values.length === 0) {
      return []
    }

    const minValue = valueDomain?.min ?? (zeroBaseline && metric === "score" ? 0 : Math.min(...values))
    const maxValue = valueDomain?.max ?? Math.max(...values)
    const tickValues = resolveChartTickValues(minValue, maxValue)
    return tickValues
      .map((value) => ({
        value,
        y: Number(chartMetricY(value, minValue, maxValue, metric, height, yPadding, yBottomPadding).toFixed(2)),
        label: formatChartTick(value, metric),
      }))
      .sort((a, b) => a.y - b.y)
  }

  function chartPointStyle(point: RankBorderChartPoint) {
    return {
      left: `${(point.x / DETAIL_CHART_WIDTH) * 100}%`,
      top: `${(point.y / DETAIL_CHART_HEIGHT) * 100}%`,
    }
  }

  function resolveDetailChartTimeDomain(records: RankBorderTracePoint[]): RankBorderChartTimeDomain | null {
    if (records.length < 2) {
      return null
    }

    const firstRecord = records[0]
    const latestRecord = records[records.length - 1]
    const eventStart = selectedActivityStartAt.value ?? firstRecord.timestamp
    const start = eventStart
    const end = Math.max(latestRecord.timestamp, start + 1)
    return { start, end }
  }

  function formatChartTick(value: number, metric: RankBorderChartMetric) {
    if (metric === "rank") {
      return formatRank(value)
    }

    return metric === "speed" ? `${formatCompactNumber(value)} pt/h` : `${formatCompactNumber(value)} pt`
  }

  function chartPoints(
    records: RankBorderTracePoint[],
    metric: RankBorderChartMetric,
    width = DETAIL_CHART_WIDTH,
    height = DETAIL_CHART_HEIGHT,
    maxPoints = DETAIL_CHART_MAX_POINTS,
    xPadding = 0,
    yPadding = 0,
    timeDomain: RankBorderChartTimeDomain | null = null,
    zeroBaseline = false,
    yBottomPadding = yPadding,
    valueDomain: { min: number; max: number } | null = null,
  ): RankBorderChartPoint[] {
    const sampledRecords = sampleTraceRecords(records, maxPoints)
    const values = sampledRecords.map((record) => chartMetricValue(record, metric))
    if (values.length < 2) {
      return []
    }

    const minValue = valueDomain?.min ?? (zeroBaseline && metric === "score" ? 0 : Math.min(...values))
    const maxValue = valueDomain?.max ?? Math.max(...values)
    const usableWidth = Math.max(1, width - xPadding * 2)
    const xStep = usableWidth / Math.max(1, values.length - 1)
    const points = sampledRecords.map((record, index) => {
      const value = values[index]
      const x = timeDomain
        ? chartTimestampX(record.timestamp, timeDomain, width, xPadding)
        : xPadding + index * xStep
      return {
        key: `${metric}:${record.timestamp}:${index}`,
        x: Number(x.toFixed(2)),
        y: Number(chartMetricY(value, minValue, maxValue, metric, height, yPadding, yBottomPadding).toFixed(2)),
        label: metric === "rank"
          ? t("rankBorder.result.chartPointRank", {
              time: formatChartPointTime(record.timestamp),
              value: formatRank(record.rank),
            })
          : metric === "speed"
            ? t("rankBorder.result.chartPointSpeed", {
                time: formatChartPointTime(record.timestamp),
                value: formatPerHour(record.score),
              })
            : t("rankBorder.result.chartPointScore", {
              time: formatChartPointTime(record.timestamp),
              value: formatPt(record.score),
            }),
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
    width = DETAIL_CHART_WIDTH,
    xPadding = 0,
  ): RankBorderChartTimeTick[] {
    if (!timeDomain) {
      return []
    }

    const duration = Math.max(1, timeDomain.end - timeDomain.start)
    const timestamps = Array.from(new Set([
      timeDomain.start,
      Math.round(timeDomain.start + duration / 2),
      timeDomain.end,
    ]))
    return timestamps.map((timestamp, index) => {
      const x = chartTimestampX(timestamp, timeDomain, width, xPadding)
      return {
        key: `time:${timestamp}:${index}`,
        left: `${(x / width) * 100}%`,
        label: formatChartTimeTick(timestamp, timeDomain),
      }
    })
  }

  function formatChartTimeTick(timestamp: number, timeDomain: RankBorderChartTimeDomain) {
    const options: Intl.DateTimeFormatOptions = isSameLocalDay(timeDomain.start, timeDomain.end)
      ? { hour: "2-digit", minute: "2-digit" }
      : { month: "numeric", day: "numeric", hour: "2-digit" }
    return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), options)
  }

  function formatChartPointTime(timestamp: number) {
    return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatCompactNumber(value: number) {
    return new Intl.NumberFormat(getI18nLocale(), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
  }

  return {
    selectedAccountDetail,
    plannerScoreLineValues,
    detailCharts,
    chartReferenceLines,
    chartPointStyle,
    chartPoints,
    chartTimeTicks,
  }
}
