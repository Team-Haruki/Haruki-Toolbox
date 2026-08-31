import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { getI18nLocale } from "@/shared/i18n"
import {
  buildRankBorderTraceHeatmapBuckets,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import {
  DETAIL_HEATMAP_HOURS_PER_DAY,
  DETAIL_UPDATE_RECORD_LIMIT,
  HEATMAP_ACTIVE_ROUND_BASELINE,
  HEATMAP_ACTIVE_ROUND_SPAN,
  HEATMAP_MYSEKAI_ROUND_THRESHOLD,
} from "../lib/rank-border-constants"
import {
  findPreviousTracePoint,
  heatmapDayStarts,
  heatmapTextColor,
  isSameLocalDay,
  startOfLocalDay,
  traceRecordsForWindow,
} from "../lib/rank-border-chart"
import type {
  RankBorderHeatmapCell,
  RankBorderHeatmapDay,
  RankBorderHeatmapWindow,
  RankBorderUpdateRecord,
} from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Hourly activity heatmap for the detail trace plus the update-log table:
 * bucketed day/hour cells, the selected hour-window state, and the per-update
 * records list scoped to that window.
 */
export function useRankBorderDetailHeatmap(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
) {
  const {
    selectedActivityStartAt,
    formatRank,
    formatPt,
    formatGrowth,
    formatHeatmapRoundCount,
    clampNumber,
  } = deps
  const { detailTrace, selectedHeatmapWindow, scopedDetailTrace } = state

  const { t } = useI18n()

  const detailHeatmapDays = computed<RankBorderHeatmapDay[]>(() => {
    const records = detailTrace.value
    if (records.length < 2) {
      return []
    }

    const hourSeconds = 60 * 60
    const eventStart = selectedActivityStartAt.value ?? records[0]?.timestamp
    const latest = records[records.length - 1]
    if (!eventStart || latest.timestamp < eventStart) {
      return []
    }

    const startDay = startOfLocalDay(eventStart)
    const latestHour = Math.floor(latest.timestamp / hourSeconds) * hourSeconds
    const latestDay = startOfLocalDay(latest.timestamp)
    const dayStarts = heatmapDayStarts(startDay, latestDay)
    const buckets = buildRankBorderTraceHeatmapBuckets(records, eventStart, latest.timestamp + 1, hourSeconds)

    return dayStarts.map((dayStart) => {
      return {
        key: `day:${dayStart}`,
        label: formatHeatmapDay(dayStart),
        cells: Array.from({ length: DETAIL_HEATMAP_HOURS_PER_DAY }, (_, hourIndex) => {
          const start = dayStart + hourIndex * hourSeconds
          const end = start + hourSeconds
          const bucket = buckets.get(start)
          const value = bucket?.value ?? 0
          const roundCount = bucket?.roundCount ?? 0
          const sampleCount = bucket?.sampleCount ?? 0
          const isBeforeEvent = end <= eventStart
          const isFuture = start > latestHour
          const selectable = !isBeforeEvent && !isFuture && bucket != null
          const selected = selectedHeatmapWindow.value?.start === start && selectedHeatmapWindow.value.end === end
          const intensity = heatmapRoundIntensity(roundCount)
          const status = isBeforeEvent ? "before" : isFuture ? "future" : "active"
          return {
            key: `hour:${start}:${hourIndex}`,
            start,
            end,
            hourLabel: String(hourIndex),
            label: t(selected
              ? "rankBorder.result.heatmapCellSelected"
              : selectable
                ? "rankBorder.result.heatmapCell"
                : "rankBorder.result.heatmapCellStatic", {
              time: formatHourRange(start, end),
              value: formatGrowth(value),
              rounds: formatHeatmapRoundCount(roundCount),
            }),
            value,
            roundCount,
            sampleCount,
            displayLabel: status === "active" && bucket ? formatHeatmapRoundCount(roundCount) : "",
            intensity,
            color: status === "active" ? heatmapColor(roundCount) : "rgb(148 163 184)",
            textColor: status === "active" ? heatmapTextColor() : "rgb(100 116 139)",
            status,
            selectable,
            selected,
          }
        }),
      }
    })
  })

  const hasDetailHeatmap = computed(() => detailHeatmapDays.value.length > 0)

  const detailUpdateRecords = computed<RankBorderUpdateRecord[]>(() =>
    traceUpdateRecords(
      selectedHeatmapWindow.value
        ? traceRecordsForWindow(
            detailTrace.value,
            selectedHeatmapWindow.value.start,
            selectedHeatmapWindow.value.end,
            selectedHeatmapWindow.value.anchorTimestamp != null,
          )
        : scopedDetailTrace.value,
      selectedHeatmapWindow.value ? Number.POSITIVE_INFINITY : DETAIL_UPDATE_RECORD_LIMIT,
      selectedHeatmapWindow.value,
    ),
  )

  function formatHourPoint(timestamp: number | null | undefined) {
    if (!timestamp) {
      return "-"
    }

    return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  function formatHourRange(startTimestamp: number, endTimestamp: number) {
    return `${formatHourPoint(startTimestamp)}-${formatHourPoint(endTimestamp)}`
  }

  function formatRecordTime(timestamp: number | null | undefined) {
    if (!timestamp) {
      return "-"
    }

    return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  function selectHeatmapWindow(cell: RankBorderHeatmapCell) {
    if (!cell.selectable) {
      return
    }

    if (selectedHeatmapWindow.value?.start === cell.start && selectedHeatmapWindow.value.end === cell.end) {
      selectedHeatmapWindow.value = null
      return
    }

    selectedHeatmapWindow.value = {
      start: cell.start,
      end: cell.end,
      label: formatHeatmapWindowLabel(cell.start, cell.end),
      anchorTimestamp: findPreviousTracePoint(detailTrace.value, cell.start)?.timestamp ?? null,
    }
  }

  function formatHeatmapWindowLabel(startTimestamp: number, endTimestamp: number) {
    return t("rankBorder.result.selectedHourWindow", {
      time: formatDateHourRange(startTimestamp, endTimestamp),
    })
  }

  function formatDateHourRange(startTimestamp: number, endTimestamp: number) {
    const sameDay = isSameLocalDay(startTimestamp, endTimestamp - 1)
    const startDate = new Date(startTimestamp * 1000)
    const endDate = new Date(endTimestamp * 1000)
    if (sameDay) {
      const date = new Intl.DateTimeFormat(getI18nLocale(), {
        month: "numeric",
        day: "numeric",
      }).format(startDate)
      return `${date} ${formatHourPoint(startTimestamp)}-${formatHourPoint(endTimestamp)}`
    }

    const options: Intl.DateTimeFormatOptions = {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
    return `${startDate.toLocaleString(getI18nLocale(), options)}-${endDate.toLocaleString(getI18nLocale(), options)}`
  }

  function formatHeatmapDay(timestamp: number) {
    return new Intl.DateTimeFormat(getI18nLocale(), {
      month: "numeric",
      day: "numeric",
    }).format(new Date(timestamp * 1000))
  }

  function heatmapRoundIntensity(roundCount: number) {
    return clampNumber(
      (roundCount - HEATMAP_ACTIVE_ROUND_BASELINE) / HEATMAP_ACTIVE_ROUND_SPAN,
      0,
      1,
    )
  }

  function heatmapColor(roundCount: number) {
    if (roundCount <= 0) {
      return "rgb(226 232 240)"
    }

    if (roundCount > HEATMAP_MYSEKAI_ROUND_THRESHOLD) {
      return "rgb(204 255 204)"
    }

    const intensity = heatmapRoundIntensity(roundCount)
    const minColor = { r: 184, g: 216, b: 255 }
    const maxColor = { r: 255, g: 181, b: 181 }
    const r = Math.round(minColor.r + (maxColor.r - minColor.r) * intensity)
    const g = Math.round(minColor.g + (maxColor.g - minColor.g) * intensity)
    const b = Math.round(minColor.b + (maxColor.b - minColor.b) * intensity)
    return `rgb(${r} ${g} ${b})`
  }

  function traceUpdateRecords(
    records: RankBorderTracePoint[],
    limit: number,
    window: RankBorderHeatmapWindow | null = null,
  ): RankBorderUpdateRecord[] {
    if (records.length < 2) {
      return []
    }

    const result: RankBorderUpdateRecord[] = []
    for (let index = records.length - 1; index >= 1 && result.length < limit; index -= 1) {
      const record = records[index]
      if (window && (record.timestamp < window.start || record.timestamp >= window.end)) {
        continue
      }

      const previous = records[index - 1]
      if (window && previous.timestamp >= window.end) {
        continue
      }
      const delta = record.score - previous.score
      if (delta <= 0) {
        continue
      }

      result.push({
        key: `${record.timestamp}:${record.rank}:${index}`,
        time: formatRecordTime(record.timestamp),
        rank: formatRank(record.rank),
        score: formatPt(record.score),
        growth: formatGrowth(delta),
      })
    }
    return result
  }

  return {
    detailHeatmapDays,
    hasDetailHeatmap,
    detailUpdateRecords,
    selectHeatmapWindow,
    heatmapColor,
    heatmapRoundIntensity,
    traceUpdateRecords,
  }
}
