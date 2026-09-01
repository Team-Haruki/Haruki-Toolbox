<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatNumberCN } from "@/lib/number-format"
import { getI18nLocale } from "@/shared/i18n"
import { buildRankBorderTraceHeatmapBuckets } from "../lib/rank-border"
import type { RankBorderTracePoint } from "../lib/rank-border"
import {
  findPreviousTracePoint,
  heatmapDayStarts,
  heatmapTextColor,
  isSameLocalDay,
  startOfLocalDay,
  traceRecordsForWindow,
} from "../lib/rank-border-chart"
import {
  DETAIL_HEATMAP_HOURS_PER_DAY,
  DETAIL_UPDATE_RECORD_LIMIT,
  HEATMAP_ACTIVE_ROUND_BASELINE,
  HEATMAP_ACTIVE_ROUND_SPAN,
  HEATMAP_MYSEKAI_ROUND_THRESHOLD,
} from "../lib/rank-border-constants"
import type {
  RankBorderHeatmapCell,
  RankBorderHeatmapDay,
  RankBorderHeatmapWindow,
  RankBorderUpdateRecord,
} from "../lib/rank-border-types"

/**
 * Hourly activity heatmap + update log for the detail page. Self-contained:
 * takes the raw trace and the event start, owns cell building; the selected
 * hour window is a v-model so the page can scope charts/stats/log to it.
 */
const props = defineProps<{
  trace: RankBorderTracePoint[]
  eventStartAt: number | null
  scopeLabel: string
  window: RankBorderHeatmapWindow | null
  showTooltip: (event: MouseEvent, label: string) => void
  moveTooltip: (event: MouseEvent) => void
  hideTooltip: () => void
}>()
const emit = defineEmits<{ "update:window": [RankBorderHeatmapWindow | null] }>()

const { t } = useI18n()

const MIN_HEATMAP_ROWS = 6

const heatmapDays = computed<RankBorderHeatmapDay[]>(() => {
  const records = props.trace
  if (records.length < 2) {
    return []
  }

  const hourSeconds = 60 * 60
  const eventStart = props.eventStartAt ?? records[0]?.timestamp
  const latest = records[records.length - 1]
  if (!eventStart || latest.timestamp < eventStart) {
    return []
  }

  const startDay = startOfLocalDay(eventStart)
  const latestHour = Math.floor(latest.timestamp / hourSeconds) * hourSeconds
  const latestDay = startOfLocalDay(latest.timestamp)
  const dayStarts = heatmapDayStarts(startDay, latestDay)
  // Row floor for the wide layout: short/young events get gray future rows up
  // to MIN_HEATMAP_ROWS so the card keeps a stable height. The padded rows are
  // hidden again in the stacked (mobile) layout via CSS.
  while (dayStarts.length < MIN_HEATMAP_ROWS) {
    const lastDay = new Date(dayStarts[dayStarts.length - 1] * 1000)
    lastDay.setDate(lastDay.getDate() + 1)
    dayStarts.push(Math.floor(lastDay.getTime() / 1000))
  }
  const buckets = buildRankBorderTraceHeatmapBuckets(records, eventStart, latest.timestamp + 1, hourSeconds)

  return dayStarts.map((dayStart) => ({
    key: `day:${dayStart}`,
    label: formatHeatmapDay(dayStart),
    padded: dayStart > latestDay,
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
      const selected = props.window?.start === start && props.window.end === end
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
          rounds: formatRoundCount(roundCount),
        }),
        value,
        roundCount,
        sampleCount,
        displayLabel: status === "active" && bucket ? formatRoundCount(roundCount) : "",
        intensity,
        color: status === "active" ? heatmapColor(roundCount) : "rgb(148 163 184)",
        textColor: status === "active" ? heatmapTextColor() : "rgb(100 116 139)",
        status,
        selectable,
        selected,
      }
    }),
  }))
})

const hasHeatmap = computed(() => heatmapDays.value.length > 0)

const updateRecords = computed<RankBorderUpdateRecord[]>(() => {
  const window = props.window
  const records = window
    ? traceRecordsForWindow(props.trace, window.start, window.end, window.anchorTimestamp != null)
    : props.trace
  const limit = window ? Number.POSITIVE_INFINITY : DETAIL_UPDATE_RECORD_LIMIT

  if (records.length < 2) {
    return []
  }

  const result: RankBorderUpdateRecord[] = []
  for (let index = records.length - 1; index >= 1 && result.length < limit; index -= 1) {
    const record = records[index]
    if (window && (record.timestamp < window.start || record.timestamp >= window.end)) {
      continue
    }

    const previousRecord = records[index - 1]
    if (window && previousRecord.timestamp >= window.end) {
      continue
    }
    const delta = record.score - previousRecord.score
    if (delta <= 0) {
      continue
    }

    result.push({
      key: `${record.timestamp}:${record.rank}:${index}`,
      time: formatRecordTime(record.timestamp),
      rank: `#${formatNumberCN(record.rank)}`,
      score: `${formatNumberCN(record.score)} pt`,
      growth: formatGrowth(delta),
    })
  }
  return result
})

function selectHeatmapWindow(cell: RankBorderHeatmapCell) {
  if (!cell.selectable) {
    return
  }

  if (props.window?.start === cell.start && props.window.end === cell.end) {
    emit("update:window", null)
    return
  }

  emit("update:window", {
    start: cell.start,
    end: cell.end,
    label: t("rankBorder.result.selectedHourWindow", {
      time: formatDateHourRange(cell.start, cell.end),
    }),
    anchorTimestamp: findPreviousTracePoint(props.trace, cell.start)?.timestamp ?? null,
  })
}

function formatGrowth(value: number) {
  const sign = value > 0 ? "+" : ""
  return `${sign}${formatNumberCN(value)}`
}

function formatRoundCount(value: number) {
  return new Intl.NumberFormat(getI18nLocale(), {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))
}

function formatHourPoint(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatHourRange(startTimestamp: number, endTimestamp: number) {
  return `${formatHourPoint(startTimestamp)}-${formatHourPoint(endTimestamp)}`
}

function formatRecordTime(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
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
  const ratio = (roundCount - HEATMAP_ACTIVE_ROUND_BASELINE) / HEATMAP_ACTIVE_ROUND_SPAN
  return Math.min(1, Math.max(0, ratio))
}

/**
 * Two-segment fill scale so activity level is visible across the whole range:
 * 0..baseline rounds fade from a near-white blue up to the full blue, and
 * baseline..baseline+span shifts blue toward red. Elapsed hours therefore
 * always show a fill proportional to activity; unreached hours stay gray.
 */
function heatmapColor(roundCount: number) {
  if (roundCount <= 0) {
    return "rgb(226 232 240)"
  }

  if (roundCount > HEATMAP_MYSEKAI_ROUND_THRESHOLD) {
    return "rgb(204 255 204)"
  }

  const faintBlue = { r: 224, g: 242, b: 254 }
  const fullBlue = { r: 184, g: 216, b: 255 }
  const hotRed = { r: 255, g: 181, b: 181 }
  if (roundCount <= HEATMAP_ACTIVE_ROUND_BASELINE) {
    return mixHeatmapColor(faintBlue, fullBlue, roundCount / HEATMAP_ACTIVE_ROUND_BASELINE)
  }

  return mixHeatmapColor(fullBlue, hotRed, heatmapRoundIntensity(roundCount))
}

function mixHeatmapColor(
  from: { r: number; g: number; b: number },
  to: { r: number; g: number; b: number },
  ratio: number,
) {
  const clamped = Math.min(1, Math.max(0, ratio))
  const r = Math.round(from.r + (to.r - from.r) * clamped)
  const g = Math.round(from.g + (to.g - from.g) * clamped)
  const b = Math.round(from.b + (to.b - from.b) * clamped)
  return `rgb(${r} ${g} ${b})`
}
</script>

<template>
  <div class="rank-border-detail-history">
    <div class="rank-border-detail-history__grid">
    <section class="rank-border-heatmap-section grid min-w-0 content-start gap-2 rounded-md border bg-muted/15 p-3">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t("rankBorder.result.heatmapTitle") }}</h3>
        <span class="text-right text-xs text-muted-foreground">
          {{ t("rankBorder.result.dailyHours") }} · {{ t("rankBorder.result.heatmapHint") }}
        </span>
      </div>
      <div v-if="hasHeatmap" class="rank-border-heatmap-panel" :style="{ '--rank-border-heatmap-days': heatmapDays.length }">
        <div class="rank-border-heatmap-row rank-border-heatmap-row--header" aria-hidden="true">
          <span class="rank-border-heatmap-corner" />
          <div class="rank-border-heatmap-hours">
            <span v-for="hour in DETAIL_HEATMAP_HOURS_PER_DAY" :key="`heatmap-hour-${hour}`">{{ hour - 1 }}</span>
          </div>
        </div>
        <div
          v-for="day in heatmapDays"
          :key="day.key"
          :class="['rank-border-heatmap-row', day.padded ? 'rank-border-heatmap-row--padded' : '']"
        >
          <span class="rank-border-heatmap-day-label">
            <span>{{ day.label }}</span>
          </span>
          <div class="rank-border-heatmap">
            <button
              v-for="cell in day.cells"
              :key="cell.key"
              type="button"
              :class="[
                'rank-border-heatmap-cell',
                `rank-border-heatmap-cell--${cell.status}`,
                cell.selectable ? 'rank-border-heatmap-cell--selectable' : '',
                cell.selected ? 'rank-border-heatmap-cell--selected' : '',
              ]"
              :disabled="!cell.selectable"
              :style="{ backgroundColor: cell.color, color: cell.textColor }"
              :aria-pressed="cell.selected"
              :aria-label="cell.label"
              @click="selectHeatmapWindow(cell)"
              @mouseenter="showTooltip($event, cell.label)"
              @mousemove="moveTooltip($event)"
              @mouseleave="hideTooltip"
            >
              {{ cell.displayLabel }}
            </button>
          </div>
        </div>
      </div>
      <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
        {{ t("rankBorder.result.heatmapEmpty") }}
      </div>
    </section>

    <section v-if="updateRecords.length > 0" class="rank-border-update-section grid min-w-0 content-start gap-2 rounded-md border bg-muted/15 p-3">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h3 class="text-sm font-semibold">{{ t("rankBorder.result.updateLog") }}</h3>
        <span class="text-xs text-muted-foreground">{{ scopeLabel }}</span>
      </div>
      <div class="rank-border-update-log">
        <div class="rank-border-update-log__header">
          <span>{{ t("rankBorder.table.hourPoint") }}</span>
          <span>{{ t("rankBorder.table.rank") }}</span>
          <span>{{ t("rankBorder.table.growth") }}</span>
          <span>{{ t("rankBorder.table.pt") }}</span>
        </div>
        <div class="rank-border-update-log__rows">
          <div
            v-for="record in updateRecords"
            :key="record.key"
            class="rank-border-update-log__row"
          >
            <span>{{ record.time }}</span>
            <span>{{ record.rank }}</span>
            <span>{{ record.growth }}</span>
            <span>{{ record.score }}</span>
          </div>
        </div>
      </div>
    </section>
    </div>
  </div>
</template>

<style scoped>
/* The outer div is the size container; the inner grid is what the container
   query lays out (a container query can't restyle the container itself). */
.rank-border-detail-history {
  min-width: 0;
  container-type: inline-size;
}

.rank-border-detail-history__grid {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  align-content: start;
  gap: 0.75rem;
}

@container (min-width: 56rem) {
  .rank-border-detail-history__grid {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
    grid-auto-rows: minmax(14rem, auto);
    align-items: stretch;
  }

  /* Side by side, the heatmap alone decides the row height; the log column
     opts out of row sizing (height: 0) and stretches back to match, scrolling
     internally instead of ending at its own arbitrary height. */
  .rank-border-update-section {
    height: 0;
    min-height: 100%;
    grid-template-rows: auto minmax(0, 1fr);
    align-content: stretch;
    overflow: hidden;
  }

  .rank-border-update-section .rank-border-update-log {
    height: auto;
    max-height: none;
    min-height: 0;
  }

}

.rank-border-heatmap {
  display: grid;
  width: var(--rank-border-heatmap-grid-width);
  min-width: 0;
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  justify-content: stretch;
  overflow: visible;
}

.rank-border-heatmap-panel {
  display: grid;
  --rank-border-heatmap-label-width: 2.75rem;
  --rank-border-heatmap-gap: 0.125rem;
  --rank-border-heatmap-min-cell-size: 1.08rem;
  --rank-border-heatmap-cell-size: clamp(1.08rem, 2.6cqw, 1.6rem);
  --rank-border-heatmap-grid-width: max(
    calc(100% - var(--rank-border-heatmap-label-width) - 0.375rem),
    calc(var(--rank-border-heatmap-min-cell-size) * 24 + var(--rank-border-heatmap-gap) * 23)
  );
  min-width: 0;
  min-height: 0;
  max-height: 16.5rem;
  gap: 0.25rem;
  overflow: auto;
  overscroll-behavior: contain;
  padding-block: 0.0625rem 0.625rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.rank-border-heatmap-row {
  display: grid;
  width: 100%;
  min-width: 100%;
  grid-template-columns: var(--rank-border-heatmap-label-width) var(--rank-border-heatmap-grid-width);
  gap: 0.375rem;
  align-items: center;
  min-height: var(--rank-border-heatmap-cell-size);
}

.rank-border-heatmap-row--header {
  color: var(--muted-foreground);
}

/* Filler rows exist only for the wide layout's row floor; the stacked
   (mobile) layout drops them and shows just the tracked days. */
.rank-border-heatmap-row--padded {
  display: none;
}

.rank-border-heatmap-day-label {
  position: sticky;
  left: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  overflow: visible;
  padding-right: 0.125rem;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

.rank-border-heatmap-day-label span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  height: 1.1rem;
  border: 1px solid color-mix(in oklab, var(--border) 70%, transparent);
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.06);
}

.rank-border-heatmap-corner {
  position: sticky;
  left: 0;
  z-index: 3;
  background: linear-gradient(90deg, var(--background) 72%, color-mix(in oklab, var(--background) 0%, transparent));
}

.rank-border-heatmap-hours {
  display: grid;
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  justify-content: stretch;
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  text-align: center;
}

.rank-border-heatmap-cell {
  appearance: none;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: var(--rank-border-heatmap-cell-size);
  aspect-ratio: 1;
  min-height: var(--rank-border-heatmap-min-cell-size);
  min-width: 0;
  border-radius: 2px;
  background-clip: padding-box;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.16);
  cursor: default;
  font-size: 0.56rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  overflow: hidden;
  text-align: center;
  transition: box-shadow 120ms ease, filter 120ms ease;
  user-select: none;
}

.rank-border-heatmap-cell--selectable {
  cursor: pointer;
}

.rank-border-heatmap-cell--selectable:hover {
  filter: brightness(1.05);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.32), 0 0 0 0.125rem color-mix(in oklab, currentColor 16%, transparent);
}

.rank-border-heatmap-cell--selectable:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 70%, transparent);
  outline-offset: 2px;
}

.rank-border-heatmap-cell--selected {
  filter: saturate(1.12) brightness(1.04);
  box-shadow:
    0 0 0 1px rgb(255 255 255 / 0.55),
    0 0 0 0.1875rem color-mix(in oklab, var(--primary) 40%, transparent),
    inset 0 0 0 1px rgb(15 23 42 / 0.28);
}

.rank-border-heatmap-cell--before,
.rank-border-heatmap-cell--future {
  cursor: default;
  filter: grayscale(0.2);
}

.rank-border-heatmap-cell:disabled {
  opacity: 0.75;
}

.rank-border-update-log {
  display: grid;
  align-self: stretch;
  max-height: 24rem;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-update-log__header,
.rank-border-update-log__row {
  display: grid;
  grid-template-columns: 4.6rem 3.5rem 5.5rem minmax(7.25rem, 1fr);
  gap: 0.5rem;
  align-items: center;
  min-width: 0;
  padding: 0.26rem 0.5rem;
  line-height: 1.2;
}

.rank-border-update-log__header {
  border-bottom: 1px solid var(--border);
  color: var(--muted-foreground);
  font-weight: 600;
}

.rank-border-update-log__rows {
  min-height: 0;
  padding-bottom: 0.375rem;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
}

.rank-border-update-log__row {
  color: var(--foreground);
}

.rank-border-update-log__row span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-update-log__header span:last-child,
.rank-border-update-log__row span:last-child {
  text-align: right;
}

.rank-border-update-log__row:nth-child(odd) {
  background: color-mix(in oklab, var(--muted) 42%, transparent);
}

/* Wide layout: hour cells fill the card's width, but their size also scales
   inversely with the number of tracked days so a long event (10+ days)
   doesn't grow the card sky-high — the ~15rem budget divided by the day count
   wins over the width-based size, and past ~20rem the panel scrolls. Kept
   after the base rules so these overrides actually win the cascade. */
@container (min-width: 56rem) {
  .rank-border-heatmap-panel {
    --rank-border-heatmap-label-width: 3rem;
    --rank-border-heatmap-min-cell-size: 1.08rem;
    --rank-border-heatmap-cell-size: clamp(
      1.08rem,
      min(3.1cqw, calc(15rem / (var(--rank-border-heatmap-days, 7) + 1))),
      2.1rem
    );
    max-height: 20rem;
  }

  .rank-border-heatmap-cell {
    font-size: 0.66rem;
  }

  .rank-border-heatmap-row--padded {
    display: grid;
  }
}
</style>
