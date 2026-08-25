import {
  buildRankBorderTraceHeatmapBuckets,
  resolveRankBorderTraceRoundCount,
  type RankBorderTracePoint,
} from "./rank-border"
import {
  DETAIL_CHART_HEIGHT,
  ROW_SPARKLINE_MAX_POINTS,
} from "./rank-border-constants"
import type {
  RankBorderChartMetric,
  RankBorderChartReferenceLine,
  RankBorderChartTimeDomain,
} from "./rank-border-types"

/**
 * Loop-based min/max. Complete traces can exceed 100k points, which
 * overflows the engine argument limit (and mobile stacks first) when
 * spread into Math.min/Math.max.
 */
export function numericExtent(values: number[]): { min: number; max: number } | null {
  if (values.length === 0) {
    return null
  }
  let min = values[0]
  let max = values[0]
  for (const value of values) {
    if (value < min) {
      min = value
    }
    if (value > max) {
      max = value
    }
  }
  return { min, max }
}

export function sampleTraceRecords(records: RankBorderTracePoint[], maxPoints: number) {
  if (records.length <= maxPoints || maxPoints < 3) {
    return records
  }

  const step = (records.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => records[Math.round(index * step)])
}

export function collapseChartCoordinates(points: Array<{ x: number; y: number }>) {
  const collapsed: Array<{ x: number; y: number }> = []
  for (const point of points) {
    const previous = collapsed[collapsed.length - 1]
    if (previous && Math.abs(previous.x - point.x) < 0.5) {
      collapsed[collapsed.length - 1] = point
    } else {
      collapsed.push(point)
    }
  }
  return collapsed
}

export function dedupeChartRecordsByTimestamp(records: RankBorderTracePoint[]) {
  if (records.length < 2) {
    return records
  }

  const byTimestamp = new Map<number, RankBorderTracePoint>()
  for (const record of records) {
    byTimestamp.set(record.timestamp, record)
  }

  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp)
}

export function findPreviousTracePoint(records: RankBorderTracePoint[], timestamp: number) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (records[index].timestamp < timestamp) {
      return records[index]
    }
  }
  return null
}

export function findLatestTraceAtTimestamp(records: RankBorderTracePoint[], timestamp: number) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index]
    if (record.timestamp === timestamp) {
      return record
    }
  }
  return null
}

export function chartRecordsForTimeDomain(records: RankBorderTracePoint[], timeDomain: RankBorderChartTimeDomain | null) {
  const visibleRecords = timeDomain
    ? records.filter((record) => record.timestamp >= timeDomain.start && record.timestamp <= timeDomain.end)
    : records
  if (!timeDomain || visibleRecords.length === records.length) {
    return dedupeChartRecordsByTimestamp(visibleRecords)
  }

  const anchor = findPreviousTracePoint(records, timeDomain.start)
  return dedupeChartRecordsByTimestamp(anchor ? [anchor, ...visibleRecords] : visibleRecords)
}

// Speed trend records reuse the trace point shape with pt/h stored in `score`.
export function chartMetricValue(record: RankBorderTracePoint, metric: RankBorderChartMetric) {
  return metric === "rank" ? record.rank : record.score
}

export function chartMetricY(
  value: number,
  minValue: number,
  maxValue: number,
  metric: RankBorderChartMetric,
  height: number,
  yPadding = 0,
  yBottomPadding = yPadding,
) {
  const usableHeight = Math.max(1, height - yPadding - yBottomPadding)
  if (maxValue === minValue) {
    return yPadding + usableHeight / 2
  }

  const span = maxValue - minValue
  const normalized = metric === "rank"
    ? (maxValue - value) / span
    : (value - minValue) / span
  return yPadding + (1 - normalized) * usableHeight
}

export function chartTimestampX(timestamp: number, timeDomain: RankBorderChartTimeDomain, width: number, xPadding = 0) {
  const usableWidth = Math.max(1, width - xPadding * 2)
  const duration = Math.max(1, timeDomain.end - timeDomain.start)
  const ratio = Math.max(0, Math.min(1, (timestamp - timeDomain.start) / duration))
  return xPadding + ratio * usableWidth
}

export function resolveChartTickValues(minValue: number, maxValue: number) {
  if (maxValue === minValue) {
    return [minValue]
  }

  const middleValue = Math.round((minValue + maxValue) / 2)
  return Array.from(new Set([minValue, middleValue, maxValue]))
}

export function sparklinePath(
  records: RankBorderTracePoint[],
  metric: RankBorderChartMetric,
  width = 112,
  height = 32,
  maxPoints = ROW_SPARKLINE_MAX_POINTS,
  xPadding = 0,
  yPadding = 0,
  timeDomain: RankBorderChartTimeDomain | null = null,
  zeroBaseline = false,
  yBottomPadding = yPadding,
  valueDomain: { min: number; max: number } | null = null,
) {
  const sampledRecords = sampleTraceRecords(records, maxPoints)
  const values = sampledRecords.map((record) => chartMetricValue(record, metric))
  if (values.length < 2) {
    return ""
  }

  const { min: valuesMin, max: valuesMax } = numericExtent(values) ?? { min: 0, max: 0 }
  const minValue = valueDomain?.min ?? (zeroBaseline && metric === "score" ? 0 : valuesMin)
  const maxValue = valueDomain?.max ?? valuesMax
  const usableWidth = Math.max(1, width - xPadding * 2)
  const xStep = usableWidth / Math.max(1, values.length - 1)
  return collapseChartCoordinates(sampledRecords.map((record, index) => {
    const metricValue = values[index]
    const x = Number((timeDomain
      ? chartTimestampX(record.timestamp, timeDomain, width, xPadding)
      : xPadding + index * xStep).toFixed(2))
    const y = Number(chartMetricY(metricValue, minValue, maxValue, metric, height, yPadding, yBottomPadding).toFixed(2))
    return { x, y }
  }))
    .map((record, index) => {
      return `${index === 0 ? "M" : "L"} ${record.x} ${record.y}`
    })
    .join(" ")
}

export function chartLabelTop(line: RankBorderChartReferenceLine) {
  return `${(line.y / DETAIL_CHART_HEIGHT) * 100}%`
}

export function resolveLatestTraceDelta(records: RankBorderTracePoint[]) {
  if (records.length < 2) {
    return null
  }

  const previous = records[records.length - 2]
  const latest = records[records.length - 1]
  return {
    growth: latest.score - previous.score,
    timeDiff: latest.timestamp - previous.timestamp,
  }
}

export function resolveRecentAverageDelta(records: RankBorderTracePoint[], count: number) {
  const recentRecords = records.slice(-Math.max(2, count + 1))
  if (recentRecords.length < 2) {
    return null
  }

  const deltas = recentRecords.slice(1).map((record, index) =>
    record.score - recentRecords[index].score,
  )
  return Math.round(deltas.reduce((sum, value) => sum + value, 0) / deltas.length)
}

export function resolveTraceGrowthForWindow(records: RankBorderTracePoint[], seconds: number) {
  if (records.length < 2) {
    return null
  }

  const latest = records[records.length - 1]
  const startTime = latest.timestamp - seconds
  const earlier = records.find((record) => record.timestamp >= startTime) ?? records[0]
  if (!earlier || earlier.timestamp === latest.timestamp) {
    return null
  }

  return {
    growth: latest.score - earlier.score,
    timeDiff: latest.timestamp - earlier.timestamp,
  }
}

export function resolveTraceRoundRate(records: RankBorderTracePoint[], startTimestamp: number, endTimestamp: number) {
  if (records.length < 2 || endTimestamp <= startTimestamp) {
    return null
  }

  const roundCount = resolveRankBorderTraceRoundCount(records, startTimestamp, endTimestamp)
  const hours = (endTimestamp - startTimestamp) / 3600
  return hours > 0 ? roundCount / hours : null
}

export function isSameLocalDay(leftTimestamp: number, rightTimestamp: number) {
  const left = new Date(leftTimestamp * 1000)
  const right = new Date(rightTimestamp * 1000)
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
}

export function traceRecordsForWindow(
  records: RankBorderTracePoint[],
  startTimestamp: number,
  endTimestamp: number,
  includeAnchor = false,
) {
  if (records.length === 0) {
    return []
  }

  const windowRecords = records.filter((record) => record.timestamp >= startTimestamp && record.timestamp < endTimestamp)
  if (!includeAnchor || windowRecords.length === 0) {
    return windowRecords
  }

  const anchor = findPreviousTracePoint(records, startTimestamp)
  if (!anchor || anchor.timestamp === windowRecords[0]?.timestamp) {
    return windowRecords
  }

  return [anchor, ...windowRecords]
}

export function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000)
}

export function heatmapDayStarts(startDay: number, endDay: number) {
  const starts: number[] = []
  const cursor = new Date(startDay * 1000)
  while (Math.floor(cursor.getTime() / 1000) <= endDay) {
    starts.push(Math.floor(cursor.getTime() / 1000))
    cursor.setDate(cursor.getDate() + 1)
  }
  return starts.length > 0 ? starts : [startDay]
}

export function heatmapTextColor() {
  return "rgb(15 23 42)"
}

/** Hourly pt/h buckets from a trace, stored in `score` for the chart helpers. */
export function buildSpeedTrendRecords(records: RankBorderTracePoint[]): RankBorderTracePoint[] {
  if (records.length < 2) {
    return []
  }

  const hourSeconds = 3600
  const start = Math.floor(records[0].timestamp / hourSeconds) * hourSeconds
  const buckets = buildRankBorderTraceHeatmapBuckets(records, start, records[records.length - 1].timestamp + 1, hourSeconds)
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([bucketStart, bucket]) => ({
      timestamp: bucketStart + hourSeconds / 2,
      score: Math.round(bucket.value),
      rank: 0,
      userId: null,
      characterId: null,
    }))
}
