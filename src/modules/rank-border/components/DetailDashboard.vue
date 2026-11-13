<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { formatNumberCN } from "@/lib/number-format"
import { getI18nLocale } from "@/shared/i18n"
import { formatDurationLabel } from "../lib/duration-label"
import { projectFinalScore } from "../lib/overview-stats"
import type { RankBorderTracePoint } from "../lib/rank-border"
import type { RankBorderHeatmapWindow } from "../lib/rank-border-types"
import {
  buildHistogram,
  histogramBinIndex,
  listGains,
  listHolderRuns,
  listSessions,
  resolveFieldPosition,
  SESSION_GAP_SECONDS,
  summarizeActivity,
  summarizeGames,
  summarizeHolders,
  summarizeHourlyPeak,
  summarizeRankHistory,
  type Histogram,
} from "../lib/trace-insights"
import type { TraceMetricStats } from "../lib/trace-stats"
import GaugeDial from "./charts/GaugeDial.vue"
import MiniHistogram, { type MiniHistogramBar } from "./charts/MiniHistogram.vue"
import RingGauge from "./charts/RingGauge.vue"
import SessionStrip from "./charts/SessionStrip.vue"

export type DashboardRival = {
  key: string
  /** "#4" for a seat, "T200" for a line. */
  label: string
  name: string | null
  score: number
  /** pt per hour over the page's interval; null when the overview has none. */
  speed: number | null
}

/**
 * The detail page's instrument panel. Each cell answers one question with a
 * picture and a few figures: how fast (a dial against the subject's own best
 * hour), how much per game (the distribution of games), how steadily (share
 * of time played and the last day's sessions), where in the ranking, how the
 * pace compares with the rest of the top 100, and where everyone lands at
 * settlement if nothing changes. A seat or a border line swaps the per-player
 * cells for its score steps and its holders.
 */
const props = defineProps<{
  /** The trace the figures are read from: the whole event, or the selected hour. */
  trace: RankBorderTracePoint[]
  /** Always the whole event (peak hour, holders). */
  fullTrace: RankBorderTracePoint[]
  stats: TraceMetricStats
  seatView: boolean
  scopeLabel: string
  window: RankBorderHeatmapWindow | null
  /** Unix seconds the data is as of. */
  dataNow: number
  eventStartAt: number | null
  eventEndAt: number | null
  score: number | null
  /** The subject's pace right now; null while a past hour is selected. */
  liveSpeed: number | null
  selfLabel: string
  rivals: readonly DashboardRival[]
  /** The top 100's holder speeds over the interval. */
  field: readonly number[]
  fieldOwn: number | null
  showTooltip: (event: MouseEvent, label: string) => void
  moveTooltip: (event: MouseEvent) => void
  hideTooltip: () => void
}>()

const { t } = useI18n()

type Stat = { key: string; label: string; value: string; note?: string | null; hint?: string | null }
type CellKey = "speed" | "games" | "activity" | "rank" | "field" | "projection" | "steps" | "holders"
type Cell = {
  key: CellKey
  title: string
  /** Three short figures sit in one row; longer ones keep two columns. */
  denseStats?: boolean
  note?: string | null
  headline?: { value: string; label: string; hint?: string | null } | null
  stats: Stat[]
}

const label = (key: string, named: Record<string, unknown> = {}) => t(`rankBorder.detail.insights.${key}`, named)
const stat = (key: string, value: string, extra: Partial<Stat> = {}): Stat => ({ key, label: label(key), value, ...extra })
const duration = (seconds: number) => formatDurationLabel(t, Math.max(0, seconds))

const eventEnded = computed(() => props.eventEndAt != null && props.dataNow >= props.eventEndAt)
const remainingSeconds = computed(() =>
  props.eventEndAt != null && !eventEnded.value ? props.eventEndAt - props.dataNow : null,
)

// --- Speed -------------------------------------------------------------------

const hourlyPeak = computed(() => summarizeHourlyPeak(props.fullTrace))
const speedScale = computed(() => Math.max(hourlyPeak.value.peak ?? 0, props.stats.hourlySpeed ?? 0))
const speedRatio = computed(() =>
  props.stats.hourlySpeed != null && speedScale.value > 0 ? props.stats.hourlySpeed / speedScale.value : null,
)
const averageRatio = computed(() =>
  hourlyPeak.value.average != null && speedScale.value > 0 ? hourlyPeak.value.average / speedScale.value : null,
)

// --- Games -------------------------------------------------------------------

const gameSummary = computed(() => summarizeGames(props.trace))
// For a player these are games; for a seat or a line, the sizes of its score steps.
const gameHistogram = computed(() => buildHistogram(listGains(props.trace), 18))

type BinEdge = "first" | "last" | null

function histogramBars(histogram: Histogram, highlight: number, binLabel: (from: string, to: string, count: number, open: BinEdge) => string): MiniHistogramBar[] {
  return histogram.bins.map((bin, index) => ({
    key: index,
    ratio: histogram.peak > 0 ? bin.count / histogram.peak : 0,
    highlighted: index === highlight,
    label: binLabel(
      formatNumberCN(Math.round(bin.from)),
      formatNumberCN(Math.round(bin.to)),
      bin.count,
      // An end bin that also holds everything beyond the axis reads as "and below" / "and up".
      histogram.underflow && index === 0 ? "first" : histogram.overflow && index === histogram.bins.length - 1 ? "last" : null,
    ),
  }))
}

const gameBars = computed(() => {
  const histogram = gameHistogram.value
  if (!histogram) {
    return []
  }
  const unit = props.seatView ? "step" : "game"
  return histogramBars(histogram, histogramBinIndex(histogram, props.stats.latestPointGrowth), (from, to, count, open) =>
    label(open === "last" ? `${unit}BinLast` : open === "first" ? `${unit}BinFirst` : `${unit}Bin`, { from, to, count: formatNumberCN(count) }),
  )
})

const gameMarkers = computed(() => {
  const histogram = gameHistogram.value
  const median = gameSummary.value.medianPt
  if (!histogram || median == null || histogram.hi <= histogram.lo) {
    return []
  }
  return [{ key: "median", position: (median - histogram.lo) / (histogram.hi - histogram.lo), label: label("medianMark") }]
})

// --- Activity ----------------------------------------------------------------

const activity = computed(() => summarizeActivity(props.trace, props.window?.end ?? props.dataNow))
const activityLive = computed(() => !props.window && !eventEnded.value && activity.value.idleSeconds != null)

const activeShare = computed(() => {
  const start = props.window?.start ?? props.eventStartAt ?? props.trace[0]?.timestamp ?? null
  const end = props.window?.end ?? props.dataNow
  if (start == null || end <= start || activity.value.sessions === 0) {
    return null
  }
  return Math.min(1, activity.value.activeSeconds / (end - start))
})

const DAY_SECONDS = 24 * 60 * 60

const sessionBand = computed(() => {
  const end = props.window?.end ?? props.dataNow
  const start = props.window?.start ?? end - DAY_SECONDS
  const segments = listSessions(props.trace)
    .filter((session) => session.end >= start && session.start <= end)
    .map((session) => ({
      key: session.start,
      from: session.start,
      to: session.end,
      label: label("sessionSegment", {
        from: formatClock(session.start),
        to: formatClock(session.end),
        duration: duration(session.end - session.start),
      }),
    }))
  const ticks = props.window
    ? [formatClock(start), formatClock(end)]
    : [formatClock(start), formatClock(start + DAY_SECONDS / 2), label("now")]
  return { start, end, segments, ticks }
})

// --- Rank --------------------------------------------------------------------

const rankHistory = computed(() => summarizeRankHistory(props.trace))
const rankPosition = computed(() => {
  const { best, worst } = rankHistory.value
  const current = props.stats.latest?.rank ?? null
  if (best == null || worst == null || current == null) {
    return null
  }
  return worst === best ? 1 : Math.min(1, Math.max(0, (worst - current) / (worst - best)))
})

// --- Pace among the top 100 --------------------------------------------------

const fieldHistogram = computed(() => buildHistogram(props.field, 14, 1))
const fieldPosition = computed(() => resolveFieldPosition(props.fieldOwn, props.field))
const fieldBars = computed(() => {
  const histogram = fieldHistogram.value
  if (!histogram) {
    return []
  }
  return histogramBars(histogram, histogramBinIndex(histogram, props.fieldOwn), (from, to, count) =>
    label("fieldBin", { from, to, count: formatNumberCN(count) }),
  )
})
const fieldMedian = computed(() => {
  const sorted = [...props.field].sort((a, b) => a - b)
  return sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)]! : null
})

// --- Projection --------------------------------------------------------------

const ownProjection = computed(() => projectFinalScore(props.score, props.liveSpeed, remainingSeconds.value))

const projectionRows = computed(() => {
  const own = ownProjection.value
  if (own == null || props.score == null) {
    return []
  }
  const rows = [
    { key: "self", label: props.selfLabel, name: null as string | null, score: props.score, projected: own, self: true },
    ...props.rivals.flatMap((rival) => {
      const projected = projectFinalScore(rival.score, rival.speed, remainingSeconds.value)
      return projected == null ? [] : [{ key: rival.key, label: rival.label, name: rival.name, score: rival.score, projected, self: false }]
    }),
  ].sort((a, b) => b.projected - a.projected)
  const top = Math.max(...rows.map((row) => row.projected))
  return rows.map((row) => {
    const gap = row.projected - own
    return {
      ...row,
      nowWidth: `${(row.score / top) * 100}%`,
      projectedWidth: `${(row.projected / top) * 100}%`,
      projectedLabel: formatShort(row.projected),
      gapLabel: row.self ? label("self") : `${gap >= 0 ? "+" : "−"}${formatShort(Math.abs(gap))}`,
      tooltip: label("projectionRow", {
        label: row.name ? `${row.label} ${row.name}` : row.label,
        now: formatNumberCN(row.score),
        final: formatNumberCN(row.projected),
      }),
    }
  })
})

// --- Seat holders ------------------------------------------------------------

const holders = computed(() => (props.seatView ? summarizeHolders(props.fullTrace, props.dataNow) : null))

/** How long each finished hold lasted, in minutes: most seats near a line change hands within minutes. */
const holdHistogram = computed(() => {
  if (!props.seatView) {
    return null
  }
  const minutes = listHolderRuns(props.fullTrace).flatMap((run) => (run.to != null ? [(run.to - run.from) / 60] : []))
  return minutes.length >= 2 ? buildHistogram(minutes, 14, 0.95) : null
})

const holdBars = computed(() => {
  const histogram = holdHistogram.value
  if (!histogram) {
    return []
  }
  const minutes = (value: number) => formatNumberCN(Math.round(value * 10) / 10)
  return histogram.bins.map((bin, index) => ({
    key: index,
    ratio: histogram.peak > 0 ? bin.count / histogram.peak : 0,
    label: label(histogram.overflow && index === histogram.bins.length - 1 ? "holdBinLast" : "holdBin", {
      from: minutes(bin.from),
      to: minutes(bin.to),
      count: formatNumberCN(bin.count),
    }),
  }))
})

// --- Cells -------------------------------------------------------------------

const cells = computed<Cell[]>(() => {
  const stats = props.stats
  const result: Cell[] = []
  const count = (key: string, value: number) => label(key, { count: formatNumberCN(value) })
  const restHint = label("restHint", { minutes: SESSION_GAP_SECONDS / 60 })

  // Speed
  const peak = hourlyPeak.value
  const speedStats: Stat[] = [
    { key: "threeWindowSpeed", label: t("rankBorder.result.twentyMinTripleSpeed"), value: formatPerHour(stats.threeWindowSpeed) },
  ]
  if (!props.seatView) {
    speedStats.push({ key: "loopCount", label: t("rankBorder.result.loopCount"), value: formatLoops(stats.loopCount) })
  }
  speedStats.push(
    stat("peak", formatPerHour(peak.peak), { note: peak.peakAt != null ? formatMoment(peak.peakAt) : null }),
    stat("average", formatPerHour(peak.average)),
  )
  result.push({
    key: "speed",
    title: label("pace"),
    note: speedRatio.value != null && peak.peak != null ? label("ofPeak", { percent: Math.round(speedRatio.value * 100) }) : null,
    stats: speedStats,
  })

  if (props.seatView) {
    const games = gameSummary.value
    result.push({
      key: "steps",
      title: label("line"),
      note: gameBars.value.length > 1 ? label("stepsLegend") : null,
      headline: { value: formatSigned(stats.latestPointGrowth), label: label("latestStep") },
      denseStats: true,
      stats: [
        stat("recentStep", formatPt(stats.recentAveragePt)),
        stat("totalGrowth", games.games > 0 ? formatSigned(games.totalPt) : "-"),
        stat("updates", count("times", games.games)),
      ],
    })
    const seat = holders.value
    if (seat) {
      result.push({
        key: "holders",
        title: label("holders"),
        note: holdBars.value.length > 1 ? label("holdLegend") : null,
        headline: {
          value: seat.heldSince != null ? duration(props.dataNow - seat.heldSince) : "-",
          label: label("heldFor"),
        },
        denseStats: true,
        stats: [
          stat("turnovers", count("times", seat.turnovers)),
          stat("holdersCount", count("people", seat.holders)),
          stat("longestHold", duration(seat.longestHoldSeconds)),
        ],
      })
    }
  } else {
    // Per game
    const games = gameSummary.value
    result.push({
      key: "games",
      title: label("games"),
      note: gameBars.value.length > 1 ? label("gamesLegend") : null,
      // The median leads: it is the typical game, and the bars below are drawn around it.
      headline: { value: formatPt(games.medianPt), label: label("medianPt") },
      stats: [
        { key: "recentAveragePt", label: t("rankBorder.result.recentAveragePt"), value: formatPt(stats.recentAveragePt) },
        stat("maxPt", formatPt(games.maxPt)),
        { key: "latest", label: t("rankBorder.result.latestPointGrowth"), value: formatSigned(stats.latestPointGrowth) },
        stat("gamesCount", count("gamesValue", games.games)),
      ],
    })

    // Activity
    const summary = activity.value
    let headline = { value: summary.sessions > 0 ? duration(summary.activeSeconds) : "-", label: label("activeTotal"), hint: restHint }
    if (activityLive.value && summary.active && summary.currentSessionStart != null) {
      headline = { value: duration(props.dataNow - summary.currentSessionStart), label: label("streak"), hint: restHint }
    } else if (activityLive.value) {
      headline = { value: duration(summary.idleSeconds ?? 0), label: label("idle"), hint: restHint }
    }
    result.push({
      key: "activity",
      title: label("activity"),
      note: props.window ? null : label("last24h"),
      headline,
      stats: [
        // Not twice: the total is already the headline when nothing live leads the cell.
        ...(headline.label === label("activeTotal")
          ? []
          : [stat("activeTotal", summary.sessions > 0 ? duration(summary.activeSeconds) : "-", { hint: restHint })]),
        stat("longestSession", summary.sessions > 0 ? duration(summary.longestSessionSeconds) : "-", { hint: restHint }),
        stat("longestRest", summary.longestRestSeconds > 0 ? duration(summary.longestRestSeconds) : "-", { hint: restHint }),
        stat("sessions", count("sessionsValue", summary.sessions), { hint: restHint }),
      ],
    })

    // Rank
    const history = rankHistory.value
    if (history.best != null) {
      result.push({
        key: "rank",
        title: label("rank"),
        note: props.scopeLabel,
        denseStats: true,
        headline: { value: formatRankShift(stats.rankShift), label: t("rankBorder.result.rankShift") },
        stats: [
          stat("bestRank", formatRank(history.best), { note: history.bestAt != null ? formatMoment(history.bestAt) : null }),
          stat("worstRank", formatRank(history.worst)),
          stat("rankChanges", count("times", history.changes)),
        ],
      })
    }

    // Pace among the top 100
    const position = fieldPosition.value
    if (!props.window && position && props.field.length >= 10) {
      result.push({
        key: "field",
        title: label("field"),
        note: props.scopeLabel,
        headline: {
          value: label("fieldPosition", { position: position.position }),
          label: label("fieldFaster", { percent: Math.round(position.slowerShare * 100) }),
        },
        stats: [
          stat("fieldOwn", formatPerHour(props.fieldOwn)),
          stat("fieldMedian", formatPerHour(fieldMedian.value)),
          stat("fieldFastest", formatPerHour(Math.max(...props.field))),
          stat("fieldScoring", count("people", props.field.filter((speed) => speed > 0).length)),
        ],
      })
    }
  }

  // Projection
  if (ownProjection.value != null && remainingSeconds.value != null) {
    result.push({
      key: "projection",
      title: label("projection"),
      note: label("remainingNote", { duration: duration(remainingSeconds.value) }),
      headline: { value: formatPt(ownProjection.value), label: label("projected"), hint: t("rankBorder.overview.lines.projectedHint") },
      stats: [],
    })
  }
  return result
})

/** Six columns when wide, so any number of cells fills its rows; two in between, with an odd last cell spanning both. */
function spanClass(index: number, total: number) {
  const wide = total === 5
    ? (index < 3 ? "@min-[64rem]:col-span-2" : "@min-[64rem]:col-span-3")
    : total === 4 || total === 2
      ? "@min-[64rem]:col-span-3"
      : total === 1
        ? "@min-[64rem]:col-span-6"
        : "@min-[64rem]:col-span-2"
  const middle = total % 2 === 1 && index === total - 1 ? "@min-[36rem]:col-span-2" : ""
  return [wide, middle]
}

// --- Formatters --------------------------------------------------------------

function formatPt(value: number | null | undefined) {
  return typeof value === "number" ? `${formatNumberCN(value)} pt` : "-"
}

function formatSigned(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }
  return `${value > 0 ? "+" : ""}${formatNumberCN(value)}`
}

function formatPerHour(value: number | null | undefined) {
  return typeof value === "number" ? `${formatNumberCN(value)} pt/h` : "-"
}

function formatRank(value: number | null | undefined) {
  return typeof value === "number" ? `#${formatNumberCN(value)}` : "-"
}

function formatLoops(value: number | null | undefined) {
  return typeof value === "number" ? `${formatNumberCN(Math.max(0, Math.round(value)))}/h` : "-"
}

/** Places climbed (↑) or lost (↓) over the interval. */
function formatRankShift(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }
  if (value === 0) {
    return label("rankSteady")
  }
  return `${value > 0 ? "↑" : "↓"} ${formatNumberCN(Math.abs(value))}`
}

function formatCompact(value: number, digits: number) {
  return new Intl.NumberFormat(getI18nLocale(), { notation: "compact", maximumFractionDigits: digits }).format(value)
}

/** Three significant digits: "4.08亿", "6490万" — short enough for a bar's value column. */
function formatShort(value: number) {
  return new Intl.NumberFormat(getI18nLocale(), { notation: "compact", maximumSignificantDigits: 3 }).format(value)
}

function formatClock(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
}

function formatMoment(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
}
</script>

<template>
  <section class="@container overflow-hidden rounded-xl border bg-card" data-testid="rank-detail-dashboard">
    <header class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 border-b border-border/60 px-4 py-3">
      <h2 class="text-sm font-semibold">{{ label("title") }}</h2>
      <p v-if="window" class="text-xs text-muted-foreground">{{ label("captionWindow", { window: window.label }) }}</p>
    </header>

    <!-- The 1px gaps over a border-coloured backdrop draw the hairlines between cells at every column count. -->
    <div class="grid gap-px bg-border/60 @min-[36rem]:grid-cols-2 @min-[64rem]:grid-cols-6">
      <div
        v-for="(cell, index) in cells"
        :key="cell.key"
        :class="['flex min-w-0 flex-col gap-3 bg-card p-4', spanClass(index, cells.length)]"
        :data-dashboard-cell="cell.key"
      >
        <div class="flex items-baseline justify-between gap-3">
          <h3 class="text-xs font-medium text-muted-foreground">{{ cell.title }}</h3>
          <span v-if="cell.note" class="truncate text-[11px] tabular-nums text-muted-foreground">{{ cell.note }}</span>
        </div>

        <!-- Speed: the current pace against the best hour, with the average marked. -->
        <GaugeDial
          v-if="cell.key === 'speed'"
          class="mx-auto w-full max-w-52"
          :ratio="speedRatio"
          :marker="averageRatio"
          min-label="0"
          :max-label="speedScale > 0 ? formatCompact(speedScale, 1) : '-'"
          :label="`${t('rankBorder.result.hourlySpeed')} ${formatPerHour(stats.hourlySpeed)}`"
        >
          <span class="text-lg leading-tight font-semibold tabular-nums">{{ typeof stats.hourlySpeed === "number" ? formatNumberCN(stats.hourlySpeed) : "-" }}</span>
          <span class="text-[11px] text-muted-foreground">pt/h · {{ scopeLabel }}</span>
        </GaugeDial>
        <p v-if="cell.key === 'speed' && averageRatio != null" class="-mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <span class="inline-block h-3 w-0.5 rounded-full bg-foreground" aria-hidden="true" />
          {{ label("averageMark") }}
        </p>

        <!-- Activity pairs its headline with the share ring. -->
        <div v-if="cell.key === 'activity' && cell.headline" class="flex items-center gap-3" :title="cell.headline.hint ?? undefined">
          <RingGauge
            class="size-16 shrink-0"
            :ratio="activeShare"
            :label="`${label('activeShare')} ${activeShare != null ? Math.round(activeShare * 100) : 0}%`"
          >
            {{ activeShare != null ? `${Math.round(activeShare * 100)}%` : "-" }}
          </RingGauge>
          <div class="flex min-w-0 flex-col">
            <p class="truncate text-xl leading-tight font-semibold tabular-nums">{{ cell.headline.value }}</p>
            <p class="truncate text-[11px] text-muted-foreground">{{ cell.headline.label }} · {{ label("activeShare") }}</p>
          </div>
        </div>
        <div v-else-if="cell.headline" class="flex min-w-0 flex-col" :title="cell.headline.hint ?? undefined">
          <p class="truncate text-xl leading-tight font-semibold tabular-nums">{{ cell.headline.value }}</p>
          <p class="truncate text-[11px] text-muted-foreground">{{ cell.headline.label }}</p>
        </div>

        <MiniHistogram
          v-if="(cell.key === 'games' || cell.key === 'steps') && gameHistogram && gameBars.length > 1"
          :bars="gameBars"
          :markers="gameMarkers"
          :axis-start="`${gameHistogram.underflow ? '≤ ' : ''}${formatCompact(gameHistogram.lo, 1)}`"
          :axis-end="`${gameHistogram.overflow ? '≥ ' : ''}${formatCompact(gameHistogram.hi, 1)}`"
          :label="cell.title"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
        />

        <MiniHistogram
          v-if="cell.key === 'holders' && holdHistogram && holdBars.length > 1"
          :bars="holdBars"
          :axis-start="label('minutes', { count: formatNumberCN(Math.round(holdHistogram.lo * 10) / 10) })"
          :axis-end="`${holdHistogram.overflow ? '≥ ' : ''}${label('minutes', { count: formatNumberCN(Math.round(holdHistogram.hi * 10) / 10) })}`"
          :label="label('holdLegend')"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
        />

        <SessionStrip
          v-if="cell.key === 'activity'"
          :start="sessionBand.start"
          :end="sessionBand.end"
          :segments="sessionBand.segments"
          :ticks="sessionBand.ticks"
          :label="label('last24h')"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
        />

        <!-- Rank: where the current rank sits between the worst and the best seen. -->
        <div v-if="cell.key === 'rank' && rankPosition != null" class="pt-5" role="img" :aria-label="`${label('rank')} ${formatRank(stats.latest?.rank)}`">
          <div class="relative h-1.5 rounded-full bg-muted">
            <span class="absolute inset-y-0 left-0 rounded-full bg-primary/30" :style="{ width: `${rankPosition * 100}%` }" />
            <span
              class="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
              :style="{ left: `${rankPosition * 100}%` }"
            >
              <span
                :class="[
                  'absolute -top-5 text-[11px] font-semibold whitespace-nowrap tabular-nums',
                  rankPosition > 0.8 ? 'right-0' : rankPosition < 0.2 ? 'left-0' : 'left-1/2 -translate-x-1/2',
                ]"
              >
                {{ formatRank(stats.latest?.rank) }}
              </span>
            </span>
          </div>
          <div class="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground" aria-hidden="true">
            <span>{{ formatRank(rankHistory.worst) }}</span>
            <span>{{ formatRank(rankHistory.best) }}</span>
          </div>
        </div>

        <MiniHistogram
          v-if="cell.key === 'field' && fieldHistogram"
          :bars="fieldBars"
          axis-start="0"
          :axis-end="formatCompact(fieldHistogram.hi, 1)"
          :label="label('field')"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
        />

        <!-- Projection: each bar is today's score plus what the current pace adds by settlement. -->
        <template v-if="cell.key === 'projection'">
          <ul class="flex flex-col gap-1.5" data-testid="rank-detail-projection">
            <li
              v-for="row in projectionRows"
              :key="row.key"
              class="grid grid-cols-[2.75rem_minmax(0,1fr)_3.75rem_3.75rem] items-center gap-x-2 text-xs tabular-nums"
              @mouseenter="showTooltip($event, row.tooltip)"
              @mousemove="moveTooltip($event)"
              @mouseleave="hideTooltip"
            >
              <span :class="['truncate', row.self ? 'font-semibold' : 'text-muted-foreground']">{{ row.label }}</span>
              <span class="relative h-2.5 overflow-hidden rounded-full bg-muted">
                <span
                  :class="['absolute inset-y-0 left-0 rounded-full', row.self ? 'bg-primary/35' : 'bg-foreground/15']"
                  :style="{ width: row.projectedWidth }"
                />
                <span
                  :class="['absolute inset-y-0 left-0 rounded-full', row.self ? 'bg-primary' : 'bg-foreground/40']"
                  :style="{ width: row.nowWidth }"
                />
              </span>
              <span :class="['text-right', row.self ? 'font-semibold' : '']">{{ row.projectedLabel }}</span>
              <span class="text-right text-[11px] text-muted-foreground">{{ row.gapLabel }}</span>
            </li>
          </ul>
          <p class="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
            <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-3 rounded-full bg-primary" aria-hidden="true" />{{ label("legendNow") }}</span>
            <span class="inline-flex items-center gap-1"><span class="inline-block h-2 w-3 rounded-full bg-primary/35" aria-hidden="true" />{{ label("legendProjected") }}</span>
          </p>
        </template>

        <dl
          v-if="cell.stats.length > 0"
          :class="['mt-auto grid gap-x-4 gap-y-2 border-t border-border/60 pt-3', cell.denseStats ? 'grid-cols-3' : 'grid-cols-2']"
        >
          <div v-for="item in cell.stats" :key="item.key" class="flex min-w-0 flex-col" :title="item.hint ?? undefined">
            <dt class="truncate text-[11px] text-muted-foreground">{{ item.label }}</dt>
            <dd class="truncate text-sm font-semibold tabular-nums">{{ item.value }}</dd>
            <dd v-if="item.note" class="truncate text-[11px] tabular-nums text-muted-foreground">{{ item.note }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>
