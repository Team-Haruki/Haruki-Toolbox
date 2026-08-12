import { computed, nextTick, ref, watch, type ComputedRef, type Ref } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import { formatNumberCN } from "@/lib/number-format"
import {
  buildPlannerPlanKey,
  parseEventPlannerPointInput,
  summarizePlannerCells,
  useEventPlannerStore,
} from "@/modules/deck-recommend"
import { getI18nLocale } from "@/shared/i18n"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion } from "@/types"
import {
  fetchRankBorderPrivateWebUserDetailV2,
  fetchRankBorderPublicUserProfile,
  isRankBorderTrackerUnauthorizedError,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
  type RankBorderTrackerScope,
} from "../api/rank-border"
import {
  buildRankBorderTraceHeatmapBuckets,
  normalizeRankBorderTraceTimeline,
  parseRankBorderRankQuery,
  resolveRankBorderTraceRoundCount,
  resolveRankBorderTraceGrowth,
  isSameRankBorderTraceTimeline,
  resolveRankBorderDetailTraceKey,
  shouldCacheRankBorderDetailTraceByRank,
  type RankBorderGrowth,
  type RankBorderLatest,
  type RankBorderLine,
  type RankBorderMode,
  type RankBorderTracePoint,
  type RankBorderUserProfile,
} from "../lib/rank-border"
import {
  DETAIL_CHART_HEIGHT,
  DETAIL_CHART_MAX_POINTS,
  DETAIL_CHART_WIDTH,
  DETAIL_CHART_X_PADDING,
  DETAIL_CHART_Y_BOTTOM_PADDING,
  DETAIL_CHART_Y_PADDING,
  DETAIL_CSB_WINDOW_SECONDS,
  DETAIL_HEATMAP_HOURS_PER_DAY,
  DETAIL_RECENT_POINT_COUNT,
  DETAIL_UPDATE_RECORD_LIMIT,
  FULL_TRACE_LIMIT,
  HEATMAP_ACTIVE_ROUND_BASELINE,
  HEATMAP_ACTIVE_ROUND_SPAN,
  HEATMAP_MYSEKAI_ROUND_THRESHOLD,
  PERSONAL_COLLECTION_LIMIT,
} from "../lib/rank-border-constants"
import {
  buildSpeedTrendRecords,
  chartMetricValue,
  chartMetricY,
  chartRecordsForTimeDomain,
  chartTimestampX,
  findLatestTraceAtTimestamp,
  findPreviousTracePoint,
  heatmapDayStarts,
  heatmapTextColor,
  isSameLocalDay,
  resolveChartTickValues,
  resolveLatestTraceDelta,
  resolveRecentAverageDelta,
  resolveTraceGrowthForWindow,
  resolveTraceRoundRate,
  sampleTraceRecords,
  sparklinePath,
  startOfLocalDay,
  traceRecordsForWindow,
} from "../lib/rank-border-chart"
import type {
  AccountOption,
  DetailState,
  LineDetailState,
  PlayerDetailState,
  RankBorderChartMetric,
  RankBorderChartPoint,
  RankBorderChartReferenceLine,
  RankBorderChartTimeDomain,
  RankBorderChartTimeTick,
  RankBorderDetailCharts,
  RankBorderHeatmapCell,
  RankBorderHeatmapDay,
  RankBorderHeatmapWindow,
  RankBorderScoreOverlayLine,
  RankBorderUpdateRecord,
  RichNameSegment,
} from "../lib/rank-border-types"

/**
 * DETAIL SUBSYSTEM for the rank-border view.
 *
 * Owns the `detail` spine (loaders, traces, caches), the comparison target,
 * the heatmap-window selection, the detail charts/stats, the planner overlay,
 * and the detail-only formatters. The central `detail` ref stays declared in
 * the view (the live engine reads it too) and is passed in as a dep; the live
 * engine reaches this subsystem via the `refreshActiveDetail` / `resetDetailData`
 * callbacks it receives through a late-bound bridge. Everything returned keeps
 * the original declaration names so the view's <template> references them
 * unchanged.
 */
export interface UseRankBorderDetailDeps {
  detail: Ref<DetailState | null>
  playbackAt: Ref<number | null>
  publicProfileByUserId: Ref<Map<string, RankBorderUserProfile>>
  detailScoreChanged: Ref<boolean>
  profileAssetsLoading: Ref<boolean>
  trackerEndpoint: Ref<string>
  selectedRegion: Ref<SekaiRegion>
  selectedEventId: Ref<string | null>
  mode: Ref<RankBorderMode>
  selectedWorldBloomCharacterId: Ref<string | null>
  selectedEventIdNumber: ComputedRef<number>
  selectedWorldBloomCharacterIdNumber: ComputedRef<number>
  selectedIntervalSeconds: ComputedRef<number>
  intervalSeconds: Ref<string>
  intervalOptions: ComputedRef<Array<{ value: string; label: string }>>
  selectedActivityStartAt: ComputedRef<number | null>
  selectedAccount: ComputedRef<AccountOption | null>
  switchRegion: (region: SekaiRegion) => void
  tracker: { lines: Ref<RankBorderLine[]> }
  currentUnixSecond: Ref<number>
  top100Details: Ref<Map<number, RankBorderLatest>>
  top100GrowthByRank: Ref<Map<number, RankBorderGrowth>>
  top100RankGrowthByRank: Ref<Map<number, RankBorderGrowth>>
  top100GrowthIntervalSeconds: Ref<number | null>
  top100TraceByRank: Ref<Map<number, RankBorderTracePoint[]>>
  segmentTraceByRank: Ref<Map<number, RankBorderTracePoint[]>>
  canRefresh: ComputedRef<boolean>
  selectedTrackerGrowthByRank: ComputedRef<Map<number, RankBorderGrowth>>
  latestTrackerTimestamp: ComputedRef<number | null>
  refreshTop100GrowthsFromCachedTraces: (previousGrowths: Map<number, RankBorderGrowth>) => void
  scheduleNumberFlashReset: () => void
  normalizeTextValue: (value: unknown) => string | null
  mergeLatestWithProfile: (
    latest: RankBorderLatest,
    profile: RankBorderUserProfile | null,
  ) => RankBorderLatest
  hasProfileFields: (latest: RankBorderLatest) => boolean
  isLocalMockTrackerEndpoint: (endpoint: string) => boolean
  formatRank: (value: number | null | undefined) => string
  formatPt: (value: number | null | undefined) => string
  formatGrowth: (value: number | null | undefined) => string
  formatTargetRank: (value: number | null | undefined) => string
  formatPerHour: (value: number | null | undefined) => string
  formatLoopCount: (value: number | null | undefined) => string
  formatHeatmapRoundCount: (value: number) => string
  formatUserLabel: (result: { name: string | null } | null) => string
  parseRichNameSegments: (value: string) => RichNameSegment[]
  clampNumber: (value: number | null | undefined, min: number, max: number) => number
}

export function useRankBorderDetail(deps: UseRankBorderDetailDeps) {
  const {
    detail,
    playbackAt,
    publicProfileByUserId,
    detailScoreChanged,
    profileAssetsLoading,
    trackerEndpoint,
    selectedRegion,
    selectedEventId,
    mode,
    selectedWorldBloomCharacterId,
    selectedEventIdNumber,
    selectedWorldBloomCharacterIdNumber,
    selectedIntervalSeconds,
    intervalSeconds,
    intervalOptions,
    selectedActivityStartAt,
    selectedAccount,
    switchRegion,
    tracker,
    currentUnixSecond,
    top100Details,
    top100GrowthByRank,
    top100RankGrowthByRank,
    top100GrowthIntervalSeconds,
    top100TraceByRank,
    segmentTraceByRank,
    canRefresh,
    selectedTrackerGrowthByRank,
    latestTrackerTimestamp,
    refreshTop100GrowthsFromCachedTraces,
    scheduleNumberFlashReset,
    normalizeTextValue,
    mergeLatestWithProfile,
    hasProfileFields,
    isLocalMockTrackerEndpoint,
    formatRank,
    formatPt,
    formatGrowth,
    formatTargetRank,
    formatPerHour,
    formatLoopCount,
    formatHeatmapRoundCount,
    formatUserLabel,
    parseRichNameSegments,
    clampNumber,
  } = deps

  const { t } = useI18n()
  const userStore = useUserStore()
  const plannerStore = useEventPlannerStore()

  // Declared before the reactive derivations below so the immediate live watch
  // (which resets detail state via resetDetailData) does not read them in their
  // temporal dead zone.
  let detailRequestToken = 0
  let activeDetailTraceKey = ""

  const detailTrace = ref<RankBorderTracePoint[]>([])
  const detailTraceLoading = ref(false)
  const detailDialogOpen = ref(false)
  const detailDialogTab = ref<"player" | "border">("player")
  const selectedHeatmapWindow = ref<RankBorderHeatmapWindow | null>(null)
  const mobileExpandedDetail = ref<{ source: "rank" | "line", rank: number } | null>(null)
  const mobileLocateOpen = ref(false)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)
  const detailTraceByKey = ref<Map<string, RankBorderTracePoint[]>>(new Map())
  const comparisonRankInput = ref("")
  const comparisonRank = ref<number | null>(null)
  const comparisonTrace = ref<RankBorderTracePoint[]>([])
  const comparisonTraceLoading = ref(false)
  const comparisonTraceByKey = ref<Map<string, RankBorderTracePoint[]>>(new Map())

  function resetDetailData() {
    detailRequestToken += 1
    activeDetailTraceKey = ""
    detail.value = null
    detailTrace.value = []
    selectedHeatmapWindow.value = null
    detailLoading.value = false
    detailError.value = null
    mobileExpandedDetail.value = null
    mobileLocateOpen.value = false
    detailTraceByKey.value = new Map()
    publicProfileByUserId.value = new Map()
    profileAssetsLoading.value = false
  }

  function normalizeTraceForPlayback(records: RankBorderTracePoint[]): RankBorderTracePoint[] {
    const timeline = normalizeRankBorderTraceTimeline(records)
    const cutoff = playbackAt.value
    return cutoff == null
      ? timeline
      : timeline.filter((record) => record.timestamp <= cutoff)
  }

  const detailScope = computed<RankBorderTrackerScope>(() => ({
    endpoint: trackerEndpoint.value,
    region: selectedRegion.value,
    eventId: selectedEventIdNumber.value,
    mode: mode.value,
    worldBloomCharacterId: selectedWorldBloomCharacterIdNumber.value || null,
    cacheBust: true,
    playbackAt: playbackAt.value,
    useWebSocket: false,
  }))

  const selectedAccountDetail = computed(() =>
    selectedAccount.value && detail.value?.source === "user" && detail.value.query === selectedAccount.value.userId
      ? detail.value
      : null,
  )

  // --- Detail comparison (any queryable rank or border line) -------------------

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

  const scopedDetailTrace = computed(() =>
    selectedHeatmapWindow.value
      ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
      : detailTrace.value,
  )

  const chartDetailTrace = computed(() =>
    selectedHeatmapWindow.value
      ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
      : detailTrace.value,
  )

  const detailTraceScopeLabel = computed(() =>
    selectedHeatmapWindow.value?.label
    ?? intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label
    ?? "-",
  )

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

  type RankBorderComparisonStatLine = {
    value: string
    diff: string | null
    tone: "up" | "down" | null
  }

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

  async function locateSelectedAccount() {
    const account = selectedAccount.value
    if (!account) {
      detailRequestToken += 1
      detail.value = null
      detailTrace.value = []
      detailLoading.value = false
      detailError.value = t("rankBorder.result.noBoundAccount")
      return
    }

    if (!canRefresh.value) {
      return
    }

    if (account.server !== selectedRegion.value) {
      switchRegion(account.server)
      await nextTick()
    }

    mobileLocateOpen.value = true
    await openUserDetail(account.userId, { privateLookup: true })
  }

  function isMobileDetailExpanded(source: "rank" | "line", rank: number) {
    return mobileExpandedDetail.value?.source === source
      && mobileExpandedDetail.value.rank === rank
      && detail.value?.result.rank === rank
      && (source === "line" ? detail.value.source === "line" : detail.value.source !== "line")
  }

  function isMobileExpandedTarget(source: "rank" | "line", rank: number) {
    return mobileExpandedDetail.value?.source === source
      && mobileExpandedDetail.value.rank === rank
  }

  async function openMobileRankDetail(rank: number) {
    if (isMobileExpandedTarget("rank", rank)) {
      mobileExpandedDetail.value = null
      return
    }

    mobileExpandedDetail.value = { source: "rank", rank }
    await openRankDetail(rank)
  }

  function openMobileLineDetail(rank: number) {
    if (isMobileExpandedTarget("line", rank)) {
      mobileExpandedDetail.value = null
      return
    }

    mobileExpandedDetail.value = { source: "line", rank }
    openLineDetail(rank)
  }

  function openDetailFromMobileFact() {
    if (detail.value) {
      detailDialogTab.value = "player"
      detailDialogOpen.value = true
    }
  }

  async function openRankDetail(rank: number) {
    const requestToken = ++detailRequestToken
    const cachedDetail = top100Details.value.get(rank)
    if (cachedDetail) {
      const previousScore = detail.value?.result.score ?? null
      const nextDetail: PlayerDetailState = {
        source: "rank",
        query: String(rank),
        trackedUserId: resolveTrackedPlayerId(cachedDetail),
        result: cachedDetail,
        previous: rank > 1 ? top100Details.value.get(rank - 1) ?? null : null,
        next: top100Details.value.get(rank + 1) ?? null,
      }
      detail.value = nextDetail
      detailDialogTab.value = "player"
      detailError.value = null
      detailLoading.value = false
      refreshDetailTrace(nextDetail)
      markDetailScoreChange(previousScore, cachedDetail.score)
      void loadRankDetail(rank, true, requestToken, { trackedUserId: nextDetail.trackedUserId })
      return
    }

    await loadRankDetail(rank, false, requestToken)
  }

  async function loadRankDetail(
    rank: number,
    silent: boolean,
    requestToken = detailRequestToken,
    options: { trackedUserId?: string | null } = {},
  ) {
    if (!rank || !canRefresh.value) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    if (!silent) {
      detailLoading.value = true
    }
    detailError.value = null
    try {
      const trackedUserId = normalizeTextValue(options.trackedUserId)
      const rankDetail = trackedUserId
        ? null
        : await fetchRankBorderWebRankDetailV2({
            ...detailScope.value,
            rank,
            intervalSeconds: selectedIntervalSeconds.value,
          }).catch(() => null)
      const result = rankDetail?.current
        ? await maybeEnrichLatestProfile(rankDetail.current, { enrichProfile: true })
        : trackedUserId
          ? await fetchLatestPublicUser(trackedUserId, { enrichProfile: true })
          : await fetchLatestPublicRank(rank, { enrichProfile: true })
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!result) {
        throw new Error(t("rankBorder.result.rankNotFound"))
      }

      const [previous, next] = await resolveDetailNeighbors(result.rank, rankDetail?.previous ?? null, rankDetail?.next ?? null)
      if (requestToken !== detailRequestToken) {
        return
      }

      detail.value = {
        source: "rank",
        query: String(rank),
        trackedUserId: trackedUserId ?? resolveTrackedPlayerId(result),
        result,
        previous,
        next,
      }
      detailDialogTab.value = "player"
      refreshDetailTrace(detail.value)
      markDetailScoreChange(previousScore, result.score)
    } catch (error) {
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!silent) {
        detail.value = null
        detailError.value = error instanceof Error ? error.message : String(error)
      }
    } finally {
      if (!silent && requestToken === detailRequestToken) {
        detailLoading.value = false
      }
    }
  }

  function openLineDetail(rank: number) {
    const requestToken = ++detailRequestToken
    void loadLineDetail(rank, false, requestToken)
  }

  async function loadLineDetail(rank: number, silent: boolean, requestToken = detailRequestToken) {
    if (!rank || !canRefresh.value) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    if (!silent) {
      detailLoading.value = true
    }
    detailError.value = null
    try {
      let nextDetail = resolveLineDetail(rank)
      if (!nextDetail) {
        nextDetail = await fetchFallbackLineDetail(rank)
      }
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!nextDetail) {
        throw new Error(t("rankBorder.result.lineNotFound"))
      }

      detail.value = nextDetail
      detailDialogTab.value = "border"
      refreshDetailTrace(nextDetail)
      markDetailScoreChange(previousScore, nextDetail.result.score)
    } catch (error) {
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!silent) {
        detail.value = null
      }
      detailError.value = error instanceof Error ? error.message : String(error)
    } finally {
      if (!silent && requestToken === detailRequestToken) {
        detailLoading.value = false
      }
    }
  }

  async function openUserDetail(userId: string, options: { privateLookup?: boolean } = {}) {
    await loadUserDetail(userId, false, ++detailRequestToken, options)
  }

  async function updateDetailDialogTab(value: AcceptableValue) {
    if (value !== "player" && value !== "border") {
      return
    }
    if (detailDialogTab.value === value) {
      return
    }

    const activeDetail = detail.value
    if (!activeDetail) {
      detailDialogTab.value = value
      return
    }

    detailDialogTab.value = value
    const rank = activeDetail.result.rank
    if (value === "border") {
      await loadLineDetail(rank, false, ++detailRequestToken)
      detailDialogTab.value = "border"
      return
    }

    await loadRankDetail(rank, false, ++detailRequestToken, {
      trackedUserId: activeDetail.source === "line" ? null : activeDetail.trackedUserId,
    })
    detailDialogTab.value = "player"
  }

  async function loadUserDetail(
    userId: string,
    silent: boolean,
    requestToken = detailRequestToken,
    options: { privateLookup?: boolean } = {},
  ) {
    if (!userId || !canRefresh.value) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    if (!silent) {
      detailLoading.value = true
    }
    detailError.value = null
    try {
      const webDetail = options.privateLookup
        ? null
        : await fetchRankBorderWebUserDetailV2({
            ...detailScope.value,
            userId,
            includeProfile: true,
          })
      const result = options.privateLookup
        ? await fetchPrivateLatestByUser(userId)
        : webDetail?.current ?? null
      if (!result) {
        throw new Error(t("rankBorder.result.accountOutOfRange"))
      }
      if (!options.privateLookup && shouldRejectMismatchedAccountLookup(userId, result)) {
        throw new Error(t("rankBorder.result.accountOutOfRange"))
      }

      const [previous, next] = await resolveDetailNeighbors(result.rank, webDetail?.previous ?? null, webDetail?.next ?? null)
      if (requestToken !== detailRequestToken) {
        return
      }
      detail.value = {
        source: "user",
        query: userId,
        trackedUserId: normalizeTextValue(result.userId),
        result,
        previous,
        next,
      }
      detailDialogTab.value = "player"
      refreshDetailTrace(detail.value)
      markDetailScoreChange(previousScore, result.score)
    } catch (error) {
      if (requestToken !== detailRequestToken) {
        return
      }
      if (silent && options.privateLookup && isRankBorderTrackerUnauthorizedError(error)) {
        await refreshUserDetailFromPublicFallback(userId, requestToken)
        return
      }
      if (!silent) {
        detail.value = null
      }
      detailError.value = resolveDetailErrorMessage(error, options.privateLookup)
    } finally {
      if (!silent && requestToken === detailRequestToken) {
        detailLoading.value = false
      }
    }
  }

  async function fetchPrivateLatestByUser(userId: string) {
    if (!userStore.isLoggedIn) {
      throw new Error(t("rankBorder.result.privateLookupLoginRequired"))
    }

    const detail = await fetchRankBorderPrivateWebUserDetailV2({
      ...detailScope.value,
      userId,
      ownerId: userStore.kratosIdentityId,
      includeProfile: true,
    })
    return mergeLatestWithProfile(detail.current ?? null, detail.profile)
  }

  async function refreshUserDetailFromPublicFallback(userId: string, requestToken: number) {
    const fallbackUserId = normalizeTextValue(detail.value?.trackedUserId) ?? normalizeTextValue(detail.value?.result.userId) ?? userId
    const result = await fetchLatestPublicUser(fallbackUserId, { enrichProfile: true }).catch(() => null)
    if (requestToken !== detailRequestToken || !result) {
      return
    }

    const [previous, next] = await resolveDetailNeighbors(result.rank)
    if (requestToken !== detailRequestToken) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    detail.value = {
      source: "user",
      query: userId,
      trackedUserId: normalizeTextValue(result.userId) ?? fallbackUserId,
      result,
      previous,
      next,
    }
    detailError.value = null
    refreshDetailTrace(detail.value)
    markDetailScoreChange(previousScore, result.score)
  }

  async function fetchLatestPublicRank(
    rank: number,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    const cached = top100Details.value.get(rank)
    if (cached) {
      return await maybeEnrichLatestProfile(cached, options)
    }

    const rankDetail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
    }).catch(() => null)
    const latest = rankDetail?.current ?? null
    return await maybeEnrichLatestProfile(latest, options)
  }

  async function maybeEnrichLatestProfile(
    latest: RankBorderLatest | null,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    if (!latest || !options.enrichProfile || !shouldEnrichDetailProfile(latest)) {
      return latest
    }

    return mergeLatestWithProfile(latest, await fetchPublicProfile(latest.userId).catch(() => null))
  }

  async function fetchLatestPublicUser(
    userId: string,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    const cached = findTop100DetailByUserId(userId)
    if (cached) {
      if (!options.enrichProfile || !shouldEnrichDetailProfile(cached)) {
        return cached
      }

      return mergeLatestWithProfile(cached, await fetchPublicProfile(cached.userId).catch(() => null))
    }

    const detail = await fetchRankBorderWebUserDetailV2({
      ...detailScope.value,
      userId,
      includeProfile: options.enrichProfile,
    }).catch(() => null)
    const latest = mergeLatestWithProfile(detail?.current ?? null, detail?.profile)
    if (!latest) {
      return null
    }

    if (!options.enrichProfile || !shouldEnrichDetailProfile(latest)) {
      return latest
    }

    return mergeLatestWithProfile(latest, await fetchPublicProfile(latest.userId).catch(() => null))
  }

  async function resolveDetailNeighbors(
    rank: number,
    previous: RankBorderLatest | null = null,
    next: RankBorderLatest | null = null,
  ): Promise<[RankBorderLatest | null, RankBorderLatest | null]> {
    if (rank > PERSONAL_COLLECTION_LIMIT) {
      return [previous, next]
    }

    const previousResult = previous ?? (rank > 1 ? await fetchLatestPublicRank(rank - 1).catch(() => null) : null)
    const nextResult = next ?? (rank === PERSONAL_COLLECTION_LIMIT
      ? await fetchLineBoundaryResult(200)
      : await fetchLatestPublicRank(rank + 1).catch(() => null))
    return [previousResult, nextResult]
  }

  async function fetchLineBoundaryResult(rank: number): Promise<RankBorderLatest | null> {
    const cached = resolveLineDetail(rank)
    if (cached) {
      return cached.result
    }

    const fallback = await fetchFallbackLineDetail(rank).catch(() => null)
    return fallback?.result ?? null
  }

  function resolveTrackedPlayerId(result: RankBorderLatest | null | undefined) {
    return normalizeTextValue(result?.userId)
  }

  function findTop100DetailByUserId(userId: string | null | undefined): RankBorderLatest | null {
    const normalizedUserId = normalizeTextValue(userId)
    if (!normalizedUserId) {
      return null
    }

    for (const detail of top100Details.value.values()) {
      if (normalizeTextValue(detail.userId) === normalizedUserId) {
        return detail
      }
    }

    return null
  }

  async function fetchFallbackLineDetail(rank: number): Promise<LineDetailState | null> {
    const rankDetail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
    }).catch(() => null)
    const latest = rankDetail?.current ?? null
    if (!latest) {
      return null
    }

    return createLineDetailFromLine({
      rank: latest.rank,
      score: latest.score,
      timestamp: latest.timestamp,
    })
  }

  async function fetchPublicProfile(userId: string | null | undefined): Promise<RankBorderUserProfile | null> {
    if (!userId || !isPublicUniqueId(userId)) {
      return null
    }

    const cached = publicProfileByUserId.value.get(userId)
    if (cached) {
      return cached
    }

    const profile = await fetchRankBorderPublicUserProfile({
      ...detailScope.value,
      uniqueId: userId,
      limit: 1,
    })
    if (profile) {
      const nextProfiles = new Map(publicProfileByUserId.value)
      nextProfiles.set(userId, profile)
      publicProfileByUserId.value = nextProfiles
    }
    return profile
  }

  function shouldEnrichDetailProfile(latest: RankBorderLatest) {
    return !!latest.userId && !hasProfileFields(latest) && !publicProfileByUserId.value.has(latest.userId)
  }

  function shouldRejectMismatchedAccountLookup(requestedUserId: string, result: RankBorderLatest) {
    if (isLocalMockTrackerEndpoint(trackerEndpoint.value)) {
      return false
    }

    const requested = normalizeTextValue(requestedUserId)
    const returned = normalizeTextValue(result.userId)
    if (!requested || !returned || requested === returned) {
      return false
    }

    return true
  }

  function resolveDetailErrorMessage(error: unknown, privateLookup = false) {
    if (privateLookup && isRankBorderTrackerUnauthorizedError(error)) {
      return t("rankBorder.result.privateLookupLoginRequired")
    }

    return error instanceof Error ? error.message : String(error)
  }

  async function refreshActiveDetail() {
    const activeDetail = detail.value
    if (!activeDetail || detailLoading.value) {
      return
    }

    if (activeDetail.source === "user") {
      await loadUserDetail(activeDetail.query, true, detailRequestToken, { privateLookup: true })
      return
    }

    if (activeDetail.source === "line") {
      loadLineDetail(parseRankBorderRankQuery(activeDetail.query) ?? 0, true)
      return
    }

    await loadRankDetail(
      parseRankBorderRankQuery(activeDetail.query) ?? activeDetail.result.rank,
      true,
      detailRequestToken,
      { trackedUserId: activeDetail.trackedUserId ?? resolveTrackedPlayerId(activeDetail.result) },
    )
  }

  function refreshDetailTrace(value: DetailState) {
    const nextDetailTraceKey = detailTraceKey(value)
    const detailChanged = nextDetailTraceKey !== activeDetailTraceKey
    if (nextDetailTraceKey !== activeDetailTraceKey) {
      activeDetailTraceKey = nextDetailTraceKey
      selectedHeatmapWindow.value = null
    }

    const cachedTrace = readCachedTrace(value, nextDetailTraceKey)
    if (cachedTrace.length > 0) {
      detailTrace.value = cachedTrace
    } else if (detailChanged || detailTrace.value.length === 0) {
      detailTrace.value = []
    }

    void loadDetailTrace(value, nextDetailTraceKey)
  }

  function readCachedTrace(value: DetailState, key: string) {
    const detailCachedTrace = detailTraceByKey.value.get(key)
    if (detailCachedTrace) {
      return detailCachedTrace
    }

    if (resolveDetailTraceUserId(value)) {
      return []
    }

    if (value.source === "line") {
      return value.result.rank <= PERSONAL_COLLECTION_LIMIT
        ? top100TraceByRank.value.get(value.result.rank) ?? []
        : segmentTraceByRank.value.get(value.result.rank) ?? []
    }

    if (shouldCacheRankBorderDetailTraceByRank(value)) {
      return top100TraceByRank.value.get(value.result.rank) ?? []
    }

    return []
  }

  function detailTraceKey(value: DetailState) {
    const userId = resolveDetailTraceUserId(value)
    if (value.source === "rank" && userId) {
      return `rank:user:${userId}:${value.query}`
    }

    return resolveRankBorderDetailTraceKey(value)
  }

  async function loadDetailTrace(value: DetailState, expectedKey = detailTraceKey(value)) {
    if (!canRefresh.value) {
      return
    }

    const shouldShowLoading = detailTrace.value.length === 0
    if (shouldShowLoading) {
      detailTraceLoading.value = true
    }
    try {
      const records = await fetchDetailTrace(value)
      if (detail.value?.query === value.query && detail.value.source === value.source && detailTraceKey(detail.value) === expectedKey) {
        const nextTrace = normalizeTraceForPlayback(records)
        if (nextTrace.length === 0) {
          return
        }
        cacheDetailTrace(expectedKey, value, nextTrace)
        if (!isSameRankBorderTraceTimeline(detailTrace.value, nextTrace)) {
          detailTrace.value = nextTrace
        }
      }
    } finally {
      if (shouldShowLoading) {
        detailTraceLoading.value = false
      }
    }
  }

  function cacheDetailTrace(key: string, value: DetailState, records: RankBorderTracePoint[]) {
    const nextDetailTraces = new Map(detailTraceByKey.value)
    nextDetailTraces.set(key, records)
    detailTraceByKey.value = nextDetailTraces

    if (!resolveDetailTraceUserId(value) && shouldCacheRankBorderDetailTraceByRank(value)) {
      cacheTrace(value.result.rank, records)
    }
  }

  async function fetchDetailTrace(value: DetailState): Promise<RankBorderTracePoint[]> {
    if (value.source === "user") {
      if (!userStore.isLoggedIn) {
        const detail = await fetchRankBorderWebUserDetailV2({
          ...detailScope.value,
          userId: value.query,
          includeTrace: true,
          limit: FULL_TRACE_LIMIT,
        }).catch(() => null)
        return detail?.playerTrace ?? []
      }
      return await fetchRankBorderPrivateWebUserDetailV2({
        ...detailScope.value,
        userId: value.query,
        ownerId: userStore.kratosIdentityId,
        includeTrace: true,
        limit: FULL_TRACE_LIMIT,
      }).then((detail) => detail.playerTrace).catch(() => [])
    }

    if (value.source === "rank") {
      const traceUserId = resolveDetailTraceUserId(value)
      const detail = await fetchRankBorderWebRankDetailV2({
        ...detailScope.value,
        rank: value.result.rank,
        includeTrace: !traceUserId,
        includePlayerTrace: traceUserId != null,
        limit: FULL_TRACE_LIMIT,
      }).catch(() => null)
      if (detail) {
        if (traceUserId) {
          return detail.playerTrace
        }

        if (detail.rankTrace.length > 0 || value.result.rank <= PERSONAL_COLLECTION_LIMIT) {
          return detail.rankTrace
        }
      }
    }

    return await fetchFullRankTrace(value.result.rank).catch(() => [])
  }

  function resolveDetailTraceUserId(value: DetailState) {
    if (value.source === "user") {
      return normalizeTextValue(value.query)
    }

    if (value.source === "rank") {
      return normalizeTextValue(value.trackedUserId) ?? normalizeTextValue(value.result.userId)
    }

    return null
  }

  function cacheTrace(rank: number, records: RankBorderTracePoint[]) {
    if (rank <= PERSONAL_COLLECTION_LIMIT) {
      const next = new Map(top100TraceByRank.value)
      next.set(rank, records)
      top100TraceByRank.value = next
      refreshTop100GrowthsFromCachedTraces(top100GrowthByRank.value)
      return
    }

    const next = new Map(segmentTraceByRank.value)
    next.set(rank, records)
    segmentTraceByRank.value = next
  }

  async function fetchFullRankTrace(rank: number): Promise<RankBorderTracePoint[]> {
    const detail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
      includeTrace: true,
      limit: FULL_TRACE_LIMIT,
    }).catch(() => null)
    return detail?.rankTrace ?? []
  }

  function resolveLineDetail(rank: number): LineDetailState | null {
    const lines = resolveComparableLinePoints()
    const index = lines.findIndex((line) => line.rank === rank)
    if (index < 0) {
      return null
    }

    return createLineDetailFromLine(lines[index], lines)
  }

  function createLineDetailFromLine(result: RankBorderLine, comparableLines = resolveComparableLinePoints()): LineDetailState {
    const lines = comparableLines.some((line) => line.rank === result.rank)
      ? comparableLines
      : [...comparableLines, result].sort((a, b) => a.rank - b.rank)
    const index = lines.findIndex((line) => line.rank === result.rank)
    return {
      source: "line",
      query: String(result.rank),
      result,
      growth: selectedTrackerGrowthByRank.value.get(result.rank) ?? null,
      previous: index > 0 ? lines[index - 1] : null,
      next: index + 1 < lines.length ? lines[index + 1] : null,
    }
  }

  function resolveComparableLinePoints() {
    const linesByRank = new Map<number, RankBorderLine>()
    for (const detail of top100Details.value.values()) {
      linesByRank.set(detail.rank, {
        rank: detail.rank,
        score: detail.score,
        timestamp: detail.timestamp,
      })
    }

    for (const line of tracker.lines.value) {
      if (line.rank >= PERSONAL_COLLECTION_LIMIT) {
        linesByRank.set(line.rank, line)
      }
    }

    const top100Detail = top100Details.value.get(PERSONAL_COLLECTION_LIMIT)
    if (top100Detail && !linesByRank.has(PERSONAL_COLLECTION_LIMIT)) {
      linesByRank.set(PERSONAL_COLLECTION_LIMIT, {
        rank: PERSONAL_COLLECTION_LIMIT,
        score: top100Detail.score,
        timestamp: top100Detail.timestamp,
      })
    }

    return Array.from(linesByRank.values()).sort((a, b) => a.rank - b.rank)
  }

  function markDetailScoreChange(previousScore: number | null, nextScore: number) {
    if (previousScore == null || previousScore !== nextScore) {
      restartDetailScoreFlash()
    }
  }

  function restartDetailScoreFlash() {
    detailScoreChanged.value = false
    requestAnimationFrame(() => {
      detailScoreChanged.value = true
      scheduleNumberFlashReset()
    })
  }

  function isPublicUniqueId(value: string) {
    return /^[a-f0-9]{64}$/i.test(value.trim())
  }

  function formatDetailTitle(value: DetailState, result = value.result) {
    if (value.source === "line") {
      return t("rankBorder.result.borderLineTitle", { rank: formatTargetRank(result.rank) })
    }

    return formatUserLabel(value.result)
  }

  function formatDetailRank(value: DetailState, result = value.result) {
    return value.source === "line" ? formatTargetRank(result.rank) : formatRank(result.rank)
  }

  function formatDetailBadge(value: DetailState, result = value.result) {
    if (value.source === "line") {
      return t("rankBorder.result.lineTracked")
    }

    return result.rank <= PERSONAL_COLLECTION_LIMIT
      ? t("rankBorder.result.inTop100")
      : t("rankBorder.result.outsideTop100")
  }

  function detailBadgeClass(value: DetailState, result = value.result) {
    if (value.source === "line") {
      return "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100"
    }

    return result.rank <= PERSONAL_COLLECTION_LIMIT
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
      : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
  }

  function detailGrowth(value: DetailState) {
    if (value.source === "line") {
      return selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth ?? value.growth?.growth ?? null
    }

    if (value.source === "user") {
      return detailTraceStats.value.growth?.growth ?? null
    }

    const localGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
      ? top100GrowthByRank.value.get(value.result.rank)?.growth
      : null
    return localGrowth
      ?? detailTraceStats.value.growth?.growth
      ?? null
  }

  function detailRankGrowth(value: DetailState) {
    if (value.source === "line") {
      return selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth ?? value.growth?.growth ?? null
    }

    if (value.source === "user") {
      return null
    }

    const localGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
      ? top100RankGrowthByRank.value.get(value.result.rank)?.growth
      : null
    return localGrowth
      ?? selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth
      ?? null
  }

  function previousDetailLabel(value: DetailState) {
    return value.source === "line" ? t("rankBorder.result.previousLine") : t("rankBorder.result.previousRank")
  }

  function nextDetailLabel(value: DetailState) {
    return value.source === "line" ? t("rankBorder.result.nextLine") : t("rankBorder.result.nextRank")
  }

  function richDetailTitleSegments(value: DetailState): RichNameSegment[] {
    return parseRichNameSegments(formatDetailTitle(value))
  }

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

  function formatHourPoint(timestamp: number | null | undefined) {
    if (!timestamp) {
      return "-"
    }

    return new Date(timestamp * 1000).toLocaleTimeString(getI18nLocale(), {
      hour: "2-digit",
      minute: "2-digit",
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

  function formatHourRange(startTimestamp: number, endTimestamp: number) {
    return `${formatHourPoint(startTimestamp)}-${formatHourPoint(endTimestamp)}`
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

  function formatCompactNumber(value: number) {
    return new Intl.NumberFormat(getI18nLocale(), {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value)
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

  function detailDelta(from: { score: number } | null, to: { score: number } | null) {
    if (!from || !to) {
      return null
    }
    return from.score - to.score
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
        time: formatHourPoint(record.timestamp),
        rank: formatRank(record.rank),
        score: formatPt(record.score),
        growth: formatGrowth(delta),
      })
    }
    return result
  }

  return {
    detail,
    detailTrace,
    detailTraceLoading,
    detailDialogOpen,
    detailDialogTab,
    selectedHeatmapWindow,
    mobileExpandedDetail,
    mobileLocateOpen,
    detailLoading,
    detailError,
    detailTraceByKey,
    comparisonRankInput,
    comparisonRank,
    comparisonTrace,
    comparisonTraceLoading,
    comparisonTraceByKey,
    resetDetailData,
    normalizeTraceForPlayback,
    detailScope,
    selectedAccountDetail,
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
    plannerScoreLineValues,
    scopedDetailTrace,
    chartDetailTrace,
    detailTraceScopeLabel,
    activeDetailPreviousGap,
    activeDetailNextGap,
    resolveTraceMetricStats,
    detailTraceStats,
    comparisonTraceStats,
    comparisonStatLines,
    detailHeatmapDays,
    hasDetailHeatmap,
    detailUpdateRecords,
    detailCharts,
    locateSelectedAccount,
    isMobileDetailExpanded,
    isMobileExpandedTarget,
    openMobileRankDetail,
    openMobileLineDetail,
    openDetailFromMobileFact,
    openRankDetail,
    loadRankDetail,
    openLineDetail,
    loadLineDetail,
    openUserDetail,
    updateDetailDialogTab,
    loadUserDetail,
    refreshActiveDetail,
    refreshDetailTrace,
    markDetailScoreChange,
    restartDetailScoreFlash,
    formatDetailTitle,
    formatDetailRank,
    formatDetailBadge,
    detailBadgeClass,
    detailGrowth,
    detailRankGrowth,
    previousDetailLabel,
    nextDetailLabel,
    richDetailTitleSegments,
    chartReferenceLines,
    chartPointStyle,
    chartPoints,
    chartTimeTicks,
    selectHeatmapWindow,
    heatmapColor,
    heatmapRoundIntensity,
    detailDelta,
    traceUpdateRecords,
  }
}
