<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter, type RouteLocationRaw } from "vue-router"
import { toast } from "vue-sonner"
import { ArrowLeft, Link2, RefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  buildPlannerPlanKey,
  parseEventPlannerPointInput,
  summarizePlannerCells,
  useEventPlannerStore,
} from "@/modules/deck-recommend"
import { formatLocalizedDateTime } from "@/lib/date-time"
import { formatNumberCN } from "@/lib/number-format"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { getI18nLocale } from "@/shared/i18n"
import { useUserStore } from "@/shared/stores/user"
import type { ComboboxOption } from "@/components/ui/combobox"
import ComparisonCenter, { type ComparisonTableRow } from "../components/ComparisonCenter.vue"
import DetailHero, { type DetailHeroLine, type DetailHeroNeighbour } from "../components/DetailHero.vue"
import DetailHistoryPanel from "../components/DetailHistoryPanel.vue"
import DetailDashboard, { type DashboardRival } from "../components/DetailDashboard.vue"
import DetailTable, { type DetailTableColumn, type DetailTableRow } from "../components/DetailTable.vue"
import TrendChartCard from "../components/TrendChartCard.vue"
import { useRankBorderHonors } from "../composables/useRankBorderHonors"
import { useRankBorderMasterData } from "../composables/useRankBorderMasterData"
import {
  DETAIL_COMPARISON_LIMIT,
  useRankBorderDetailPage,
} from "../composables/useRankBorderDetailPage"
import { buildDetailCharts } from "../lib/detail-charts"
import {
  buildRankBorderDetailQuery,
  parseRankBorderDetailQuery,
  resolveQuickFactsDetailTarget,
  type RankBorderDetailTargetInput,
} from "../lib/detail-link"
import { formatDurationLabel } from "../lib/duration-label"
import {
  buildProfileHonorViews,
  isLatestResult,
  resolveLeaderVisual,
  sanitizeDomId,
} from "../lib/honor-visuals"
import { buildMasterRecordMap } from "../lib/master-data-types"
import {
  OVERVIEW_KEY_SEATS,
  resolveCatchUpSeconds,
  resolveHourlySpeed,
} from "../lib/overview-stats"
import {
  normalizeTrackerEndpoint,
  type RankBorderLatest,
  type RankBorderLine,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import { isSameLocalDay, startOfLocalDay, traceRecordsForWindow } from "../lib/rank-border-chart"
import {
  DEFAULT_TRACKER_ENDPOINT,
  LEGACY_DIRECT_TRACKER_ENDPOINTS,
  PERSONAL_COLLECTION_LIMIT,
  STORAGE_KEY,
} from "../lib/rank-border-constants"
import type {
  PersistedState,
  RankBorderChartMetric,
  RankBorderChartTimeDomain,
  RankBorderHeatmapWindow,
  RankBorderTooltipState,
} from "../lib/rank-border-types"
import {
  listHolderRuns,
  resolveCushion,
  resolveMilestones,
  summarizeDays,
} from "../lib/trace-insights"
import { resolveTraceMetricStats } from "../lib/trace-stats"
import { resolveWorldBloomModeSelection } from "../lib/world-bloom-mode"
import { parseRichNameSegments, plainNameText as stripNameTags } from "../lib/rich-name"

const COMPARISON_COLORS = [
  "rgb(168 85 247 / 0.9)",
  "rgb(249 115 22 / 0.9)",
  "rgb(236 72 153 / 0.9)",
]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const plannerStore = useEventPlannerStore()

const params = computed(() => parseRankBorderDetailQuery(route.query))
const trackerEndpoint = ref(resolvePersistedTrackerEndpoint())

const regionRef = computed(() => params.value?.region ?? "cn")
const eventIdRef = computed(() => (params.value ? String(params.value.eventId) : null))
const masterData = useRankBorderMasterData(regionRef, eventIdRef)

// A shared or stale link can name a chapter the event does not have, or ask
// for chapter mode on an event without chapters: once the event's master data
// is known, rewrite it to the default chapter or the total leaderboard.
watch(
  [params, masterData.selectedEvent, masterData.worldBloomCharacterOptions],
  ([value, event, chapters]) => {
    if (!value || value.mode !== "world_bloom") {
      return
    }
    const currentCharacterId = value.worldBloomCharacterId != null ? String(value.worldBloomCharacterId) : null
    const nextSelection = resolveWorldBloomModeSelection(
      { mode: value.mode, worldBloomCharacterId: currentCharacterId },
      event,
      chapters,
    )
    const nextCharacterId = nextSelection.worldBloomCharacterId
    if (nextSelection.mode === value.mode && nextCharacterId === currentCharacterId) {
      return
    }
    const query = { ...route.query }
    if (nextSelection.mode === "world_bloom" && nextCharacterId) {
      query.mode = "world_bloom"
      query.wl = nextCharacterId
    } else {
      delete query.mode
      delete query.wl
    }
    void router.replace({ query })
  },
  { immediate: true },
)

const cardById = computed(() => buildMasterRecordMap(masterData.cards.value))
const honorById = computed(() => buildMasterRecordMap(masterData.honors.value))
const honorGroupById = computed(() => buildMasterRecordMap(masterData.honorGroups.value))
const bondsHonorById = computed(() => buildMasterRecordMap(masterData.bondsHonors.value))
const bondsHonorWordById = computed(() => buildMasterRecordMap(masterData.bondsHonorWords.value))
const gameCharacterUnitById = computed(() => buildMasterRecordMap(masterData.gameCharacterUnits.value))

const honors = useRankBorderHonors({
  cardById,
  honorById,
  honorGroupById,
  bondsHonorById,
  bondsHonorWordById,
  gameCharacterUnitById,
  selectedRegion: regionRef,
  trackerEndpoint,
  masterData,
})

const page = useRankBorderDetailPage(params, trackerEndpoint)
const {
  loading,
  error,
  errorDetail,
  current,
  notRanked,
  profile,
  previous,
  next,
  activeTrace,
  traceSource,
  canSwitchTraceSource,
  borderTraceLoading,
  setTraceSource,
  overview,
  comparisons,
  issues,
  hasIssues,
  retryIssues,
  isSelfComparison,
  addComparisonTarget,
  addComparisonPlayer,
  removeComparison,
  refresh,
} = page

const selectedWindow = ref<RankBorderHeatmapWindow | null>(null)

watch(() => params.value?.target, () => {
  selectedWindow.value = null
})

// Profile assets (card art / honors master tables) load lazily once the target
// actually carries profile data.
watch(current, (value) => {
  if (value && isLatestResult(value) && (value.cardId != null || value.profileHonors.length > 0)) {
    honors.preloadProfileAssets()
  }
}, { immediate: true })

const isLineTarget = computed(() => params.value?.target.kind === "line")
const intervalSeconds = computed(() => params.value?.intervalSeconds ?? 3600)

const intervalOptions = computed(() => [
  { value: "900", label: t("rankBorder.intervals.minutes", { value: 15 }, 15) },
  { value: "3600", label: t("rankBorder.intervals.hours", { value: 1 }, 1) },
  { value: "21600", label: t("rankBorder.intervals.hours", { value: 6 }, 6) },
  { value: "86400", label: t("rankBorder.intervals.hours", { value: 24 }, 24) },
])

// While master data resolves the header says so instead of showing a raw "#184".
const eventLabel = computed(() =>
  masterData.selectedEvent.value?.label
  ?? (masterData.loading.value ? t("rankBorder.fields.loadingEvents") : `#${params.value?.eventId ?? "?"}`),
)

// First load vs refresh: "showing the last successful data" is only true once there is some.
const detailIssuesTitle = computed(() =>
  current.value != null || primaryStats.value.latest != null
    ? t("rankBorder.detailIssues.title")
    : t("rankBorder.detailIssues.titleNoData"),
)
const regionLabel = computed(() => params.value ? resolveSekaiRegionLabel(params.value.region, t) : "")

const eventStartAt = computed(() => {
  const value = params.value
  if (!value) {
    return null
  }
  if (value.mode === "world_bloom" && value.worldBloomCharacterId) {
    const chapter = masterData.worldBloomCharacterOptions.value
      .find((option) => option.id === value.worldBloomCharacterId)
    if (chapter?.chapterStartAt != null) {
      return chapter.chapterStartAt
    }
  }
  return masterData.selectedEvent.value?.startAt ?? null
})

/** When the ranking settles: the chapter's or the event's aggregate time. */
const eventEndAt = computed(() => {
  const value = params.value
  if (!value) {
    return null
  }
  if (value.mode === "world_bloom" && value.worldBloomCharacterId) {
    const chapter = masterData.worldBloomCharacterOptions.value
      .find((option) => option.id === value.worldBloomCharacterId)
    if (chapter?.aggregateAt != null) {
      return chapter.aggregateAt
    }
  }
  const event = masterData.selectedEvent.value
  return event?.aggregateAt ?? event?.closedAt ?? null
})

const leaderVisual = computed(() =>
  current.value && isLatestResult(current.value)
    ? resolveLeaderVisual(current.value, honors.honorContext.value)
    : null,
)

const honorViews = computed(() =>
  current.value && isLatestResult(current.value)
    ? buildProfileHonorViews(
        current.value,
        honors.honorContext.value,
        3,
        `detail-page-${sanitizeDomId(current.value.userId ?? String(current.value.rank))}`,
      )
    : [],
)

const titleSegments = computed(() => {
  if (isLineTarget.value) {
    return parseRichNameSegments(t("rankBorder.result.borderLineTitle", { rank: formatTargetRank(params.value?.target.kind === "line" ? params.value.target.rank : current.value?.rank ?? null) }))
  }

  const name = current.value && isLatestResult(current.value) ? current.value.name : null
  return parseRichNameSegments(name ?? profile.value?.name ?? t("rankBorder.result.unknownPlayer"))
})

const statusBadge = computed(() => {
  if (isLineTarget.value) {
    return { label: t("rankBorder.result.lineTracked"), tone: "line" as const }
  }
  if (notRanked.value) {
    return { label: t("rankBorder.result.notRanked"), tone: "out" as const }
  }
  const rank = current.value?.rank ?? null
  if (rank == null) {
    return null
  }
  return rank <= PERSONAL_COLLECTION_LIMIT
    ? { label: t("rankBorder.result.inTop100"), tone: "in" as const }
    : { label: t("rankBorder.result.outsideTop100"), tone: "out" as const }
})

// --- Trace scoping (heatmap window) ------------------------------------------

const scopedTrace = computed(() =>
  selectedWindow.value
    ? traceRecordsForWindow(activeTrace.value, selectedWindow.value.start, selectedWindow.value.end, true)
    : activeTrace.value,
)

const traceScopeLabel = computed(() =>
  selectedWindow.value?.label
  ?? intervalOptions.value.find((option) => option.value === String(intervalSeconds.value))?.label
  ?? "-",
)

// --- Stats -------------------------------------------------------------------

const primaryStats = computed(() =>
  resolveTraceMetricStats(
    scopedTrace.value,
    activeTrace.value,
    intervalSeconds.value,
    selectedWindow.value,
  ),
)

const subjectScore = computed(() => current.value?.score ?? primaryStats.value.latest?.score ?? null)

/**
 * The moment the page's data describes: the newest sample it holds, never
 * past the event's end. Idle times and holds are measured against this, so a
 * stalled tracker does not read as a player gone quiet.
 */
const dataNow = computed(() => {
  const trace = activeTrace.value
  const latest = Math.max(
    overview.value?.asOf ?? Math.floor(Date.now() / 1000),
    current.value?.timestamp ?? 0,
    trace[trace.length - 1]?.timestamp ?? 0,
  )
  return eventEndAt.value != null ? Math.min(latest, eventEndAt.value) : latest
})

/** The subject's own pace right now; a selected heatmap hour is history, not a pace to project from. */
const liveSpeed = computed(() => (selectedWindow.value ? null : primaryStats.value.hourlySpeed))

/** A seat's or border line's pace over the page's interval, from the overview's growth part. */
function seatSpeed(rank: number) {
  const data = overview.value
  if (!data) {
    return null
  }
  return resolveHourlySpeed(
    data.topRankGrowths.find((entry) => entry.rank === rank)
    ?? data.borderGrowths.find((entry) => entry.rank === rank),
  )
}

/** A player's own pace when the overview tracks them, else their seat's. */
function playerSpeed(userId: string | null, rank: number) {
  const growth = userId ? overview.value?.topPlayerGrowths.find((entry) => entry.userId === userId) : null
  return growth ? resolveHourlySpeed(growth) : seatSpeed(rank)
}

function detailRoute(target: RankBorderDetailTargetInput): RouteLocationRaw | null {
  const value = params.value
  return value ? { path: "/rank-border/detail", query: buildRankBorderDetailQuery(value, target) } : null
}

function catchUpNote(side: "above" | "below", gap: number, otherSpeed: number | null) {
  const seconds = side === "above"
    ? resolveCatchUpSeconds(gap, liveSpeed.value, otherSpeed)
    : resolveCatchUpSeconds(gap, otherSpeed, liveSpeed.value)
  if (seconds == null) {
    return null
  }
  return t(side === "above" ? "rankBorder.overview.facts.catchUp" : "rankBorder.overview.facts.caughtBy", {
    duration: formatDurationLabel(t, seconds),
  })
}

// --- Hero: neighbours and key lines ------------------------------------------

const neighbourRows = computed<DetailHeroNeighbour[]>(() => {
  const subject = current.value
  const score = subjectScore.value
  if (!subject || score == null) {
    return []
  }

  const build = (entry: RankBorderLatest | RankBorderLine, side: "above" | "below"): DetailHeroNeighbour => {
    const player = isLatestResult(entry) ? entry : null
    const gap = side === "above" ? entry.score - score : score - entry.score
    return {
      key: side,
      rankLabel: player ? formatRank(entry.rank) : formatTargetRank(entry.rank),
      name: player ? plainNameText(player.name) ?? t("rankBorder.result.unknownPlayer") : null,
      scoreLabel: formatNumberCN(entry.score),
      gapLabel: `${side === "above" ? "+" : "−"}${formatNumberCN(Math.abs(gap))}`,
      note: catchUpNote(side, gap, player ? playerSpeed(player.userId, entry.rank) : seatSpeed(entry.rank)),
      current: false,
      to: detailRoute(player
        ? resolveQuickFactsDetailTarget({ kind: "rank", rank: entry.rank, userId: player.userId })
        : { kind: "line", rank: entry.rank }),
    }
  }

  const rows: DetailHeroNeighbour[] = []
  if (previous.value) {
    rows.push(build(previous.value, "above"))
  }
  rows.push({
    key: "current",
    rankLabel: isLineTarget.value ? formatTargetRank(subject.rank) : formatRank(subject.rank),
    name: isLineTarget.value ? null : plainNameText(subject.name) ?? t("rankBorder.result.unknownPlayer"),
    scoreLabel: formatNumberCN(score),
    gapLabel: null,
    note: null,
    current: true,
    to: null,
  })
  if (next.value) {
    rows.push(build(next.value, "below"))
  }
  return rows
})

/** The next lines up (how far to T10, T50, T100…) and the nearest one down. */
const keyLineRows = computed<DetailHeroLine[]>(() => {
  const data = overview.value
  const score = subjectScore.value
  if (!data || score == null) {
    return []
  }

  // The seats beside the subject are already in the neighbour list.
  const shown = new Set([current.value?.rank, previous.value?.rank, next.value?.rank])
  const keySeats: readonly number[] = OVERVIEW_KEY_SEATS
  const candidates = [
    ...data.topRankings.filter((entry) => keySeats.includes(entry.rank)),
    ...data.borderLines.filter((line) => line.rank > PERSONAL_COLLECTION_LIMIT),
  ].filter((line) => !shown.has(line.rank))

  const build = (line: { rank: number; gap: number }, side: "above" | "below"): DetailHeroLine => ({
    key: `${side}:${line.rank}`,
    label: formatTargetRank(line.rank),
    gapLabel: t(side === "above" ? "rankBorder.detail.behind" : "rankBorder.detail.ahead", { gap: formatNumberCN(line.gap) }),
    note: catchUpNote(side, line.gap, seatSpeed(line.rank)),
    to: detailRoute(line.rank <= PERSONAL_COLLECTION_LIMIT ? { kind: "rank", rank: line.rank } : { kind: "line", rank: line.rank }),
  })

  const rows = resolveMilestones(score, candidates, 3).reverse().map((line) => build(line, "above"))
  const cushion = resolveCushion(score, candidates)
  if (cushion) {
    rows.push(build(cushion, "below"))
  }
  return rows
})

/** A border line has no identity of its own; name the player sitting on it instead. */
const lineHolderName = computed(() =>
  isLineTarget.value && current.value && isLatestResult(current.value) ? plainNameText(current.value.name) : null,
)

const profileWord = computed(() => {
  if (isLineTarget.value) {
    return null
  }
  const word = (current.value && isLatestResult(current.value) ? current.value.profileWord : null) ?? profile.value?.profileWord
  return word?.trim() || null
})

// --- Dashboard ---------------------------------------------------------------

/** A seat or a border line: its trace is the line's history, not one player's games. */
const seatView = computed(() => isLineTarget.value || traceSource.value === "border")

const subjectRankLabel = computed(() => {
  const rank = current.value?.rank ?? (params.value?.target.kind === "line" ? params.value.target.rank : null)
  return isLineTarget.value ? formatTargetRank(rank) : formatRank(rank)
})

/** Who the subject is projected against: the seats beside it and the nearest key line each way. */
const projectionRivals = computed<DashboardRival[]>(() => {
  const data = overview.value
  const score = subjectScore.value
  if (!data || score == null) {
    return []
  }

  const rivals: DashboardRival[] = []
  const seen = new Set<number>([current.value?.rank ?? -1])
  const add = (entry: RankBorderLatest | RankBorderLine | null) => {
    if (!entry || seen.has(entry.rank)) {
      return
    }
    seen.add(entry.rank)
    const player = isLatestResult(entry) ? entry : null
    rivals.push({
      key: `rank:${entry.rank}`,
      label: player ? formatRank(entry.rank) : formatTargetRank(entry.rank),
      name: player ? plainNameText(player.name) : null,
      score: entry.score,
      speed: player ? playerSpeed(player.userId, entry.rank) : seatSpeed(entry.rank),
    })
  }

  add(previous.value)
  add(next.value)
  const keySeats: readonly number[] = OVERVIEW_KEY_SEATS
  const lines: RankBorderLine[] = [
    ...data.topRankings.filter((entry) => keySeats.includes(entry.rank)).map(({ rank, score: lineScore, timestamp }) => ({ rank, score: lineScore, timestamp })),
    ...data.borderLines.filter((line) => line.rank > PERSONAL_COLLECTION_LIMIT),
  ].filter((line) => !seen.has(line.rank))
  const above = resolveMilestones(score, lines, 1)[0]
  const below = resolveCushion(score, lines)
  for (const milestone of [above, below]) {
    add(lines.find((line) => line.rank === milestone?.rank) ?? null)
  }
  return rivals
})

/** The top 100's own speeds over the interval, and the subject's among them. */
const paceField = computed(() =>
  (overview.value?.topPlayerGrowths ?? [])
    .map((entry) => resolveHourlySpeed(entry))
    .filter((speed): speed is number => speed != null && speed >= 0),
)
const paceFieldOwn = computed(() => {
  const userId = current.value && isLatestResult(current.value) ? current.value.userId : null
  const growth = userId ? overview.value?.topPlayerGrowths.find((entry) => entry.userId === userId) : null
  return growth ? resolveHourlySpeed(growth) : null
})

// --- Daily totals and seat holders -------------------------------------------

const dailyColumns = computed<DetailTableColumn[]>(() => {
  const column = (key: string, extra: Partial<DetailTableColumn> = {}): DetailTableColumn => ({
    key,
    label: t(`rankBorder.detail.daily.${key}`),
    align: "right",
    ...extra,
  })
  return seatView.value
    ? [column("date", { align: "left" }), column("growth"), column("updates", { wideOnly: true }), column("endScore")]
    : [
        column("date", { align: "left" }),
        column("gained"),
        column("games"),
        column("active", { wideOnly: true }),
        column("best", { wideOnly: true }),
        column("endRank"),
        column("endScore", { wideOnly: true }),
      ]
})

const dailyRows = computed<DetailTableRow[]>(() => {
  const days = summarizeDays(activeTrace.value, startOfLocalDay)
  const top = Math.max(0, ...days.map((day) => day.gained))
  return days.reverse().map((day) => {
    const date = { text: formatDay(day.dayStart) }
    const gained = { text: formatGrowth(day.gained), meter: top > 0 ? day.gained / top : 0 }
    const games = { text: formatNumberCN(day.games) }
    const endScore = { text: formatNumberCN(day.endScore) }
    return {
      key: day.dayStart,
      cells: seatView.value
        ? [date, gained, games, endScore]
        : [
            date,
            gained,
            games,
            { text: day.activeSeconds > 0 ? formatDurationLabel(t, day.activeSeconds) : "-" },
            { text: day.bestPt > 0 ? formatNumberCN(day.bestPt) : "-" },
            { text: formatRank(day.endRank) },
            endScore,
          ],
    }
  })
})

const HOLDER_LOG_LIMIT = 30

const holderColumns = computed<DetailTableColumn[]>(() => [
  { key: "player", label: t("rankBorder.detail.holderLog.player"), align: "left" },
  { key: "from", label: t("rankBorder.detail.holderLog.from"), align: "right" },
  { key: "held", label: t("rankBorder.detail.holderLog.held"), align: "right" },
  { key: "score", label: t("rankBorder.detail.holderLog.score"), align: "right", wideOnly: true },
])

const holderRows = computed<DetailTableRow[]>(() => {
  if (!seatView.value) {
    return []
  }
  // The trace only carries ids; players still on the board lend their names.
  const names = new Map<string, string>()
  for (const entry of overview.value?.topRankings ?? []) {
    const name = plainNameText(entry.name)
    if (entry.userId && name) {
      names.set(entry.userId, name)
    }
  }
  return listHolderRuns(activeTrace.value, HOLDER_LOG_LIMIT).map((run) => ({
    key: `${run.userId}:${run.from}`,
    cells: [
      {
        // Ids are long opaque tokens: a short prefix is enough to tell two holders apart.
        text: names.get(run.userId) ?? t("rankBorder.detail.holderLog.unnamed", { id: run.userId.slice(0, 6) }),
        to: detailRoute({ kind: "user", userId: run.userId }),
      },
      { text: formatMoment(run.from) },
      {
        text: run.to != null
          ? formatDurationLabel(t, run.to - run.from)
          : t("rankBorder.detail.holderLog.ongoing", { duration: formatDurationLabel(t, Math.max(0, dataNow.value - run.from)) }),
      },
      { text: formatNumberCN(run.score) },
    ],
  }))
})

// --- Comparisons -------------------------------------------------------------

const comparisonMeta = computed(() =>
  comparisons.value.map((entry, index) => ({
    key: entry.id,
    label: entry.label,
    color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
  })),
)

const comparisonChartSeries = computed(() =>
  comparisons.value.map((entry) => ({
    key: entry.id,
    records: selectedWindow.value
      ? traceRecordsForWindow(entry.trace, selectedWindow.value.start, selectedWindow.value.end, true)
      : entry.trace,
  })),
)

/** The page's own target as it appears in the comparison table and chart legends. */
const primaryLabel = computed(() => {
  if (isLineTarget.value) {
    return formatTargetRank(params.value?.target.kind === "line" ? params.value.target.rank : null)
  }
  const name = current.value && isLatestResult(current.value) ? plainNameText(current.value.name) : null
  return name ?? formatRank(current.value?.rank ?? null)
})

const comparisonRows = computed<ComparisonTableRow[]>(() => {
  const primaryScore = primaryStats.value.latest?.score ?? current.value?.score ?? null

  const primaryRow: ComparisonTableRow = {
    id: "primary",
    label: primaryLabel.value,
    color: null,
    removable: false,
    loading: false,
    error: false,
    currentLabel: formatPt(primaryScore),
    gapLabel: null,
    gapTone: null,
    hourlySpeedLabel: formatPerHour(primaryStats.value.hourlySpeed),
    recentAverageLabel: formatPt(primaryStats.value.recentAveragePt),
    latestPointLabel: formatGrowth(primaryStats.value.latestPointGrowth),
    threeWindowSpeedLabel: formatPerHour(primaryStats.value.threeWindowSpeed),
    loopCountLabel: formatLoopCount(primaryStats.value.loopCount),
  }

  const rows = comparisons.value.map((entry, index) => {
    const scoped = comparisonChartSeries.value.find((series) => series.key === entry.id)?.records ?? entry.trace
    const stats = resolveTraceMetricStats(scoped, entry.trace, intervalSeconds.value, selectedWindow.value)
    const score = stats.latest?.score ?? entry.current?.score ?? null
    const gap = primaryScore != null && score != null ? primaryScore - score : null
    return {
      id: entry.id,
      label: entry.label,
      color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
      removable: true,
      loading: entry.loading,
      error: !entry.loading && entry.error,
      currentLabel: formatPt(score),
      gapLabel: gap != null && gap !== 0 ? formatNumberCN(Math.abs(gap)) : null,
      gapTone: gap == null || gap === 0 ? null : gap > 0 ? "up" as const : "down" as const,
      hourlySpeedLabel: formatPerHour(stats.hourlySpeed),
      recentAverageLabel: formatPt(stats.recentAveragePt),
      latestPointLabel: formatGrowth(stats.latestPointGrowth),
      threeWindowSpeedLabel: formatPerHour(stats.threeWindowSpeed),
      loopCountLabel: formatLoopCount(stats.loopCount),
    }
  })

  return [primaryRow, ...rows]
})

/** Strip in-game color tags so picker labels and search stay plain text. */
function plainNameText(name: string | null | undefined) {
  return name ? stripNameTags(name) : null
}

const comparisonTargetOptions = computed<ComboboxOption[]>(() => {
  const data = overview.value
  if (!data) {
    return []
  }

  // The page's own seat / line / player is not a comparison target.
  const seatOptions = data.topRankings
    .filter((entry) => !isSelfComparison("rank", String(entry.rank))
      && !(entry.userId != null && isSelfComparison("user", entry.userId)))
    .map((entry) => {
      const name = plainNameText(entry.name)
      return {
        value: `rank:${entry.rank}`,
        label: name ? `#${entry.rank} ${name}` : `#${entry.rank}`,
        keywords: [`t${entry.rank}`, `#${entry.rank}`, String(entry.rank), name ?? ""],
      }
    })
  const lineOptions = data.borderLines.filter((line) => !isSelfComparison("line", String(line.rank))).map((line) => ({
    value: `line:${line.rank}`,
    label: `T${line.rank}`,
    tags: [{
      label: t("rankBorder.result.borderLine"),
      class: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100",
    }],
    keywords: [`t${line.rank}`, String(line.rank)],
  }))
  return [...seatOptions, ...lineOptions]
})

function handleAddTarget(value: string) {
  const separator = value.indexOf(":")
  const kind = value.slice(0, separator)
  const rank = value.slice(separator + 1)
  if (kind !== "rank" && kind !== "line") {
    return
  }

  // The comparison follows the seat (whoever holds it), so it is labelled as
  // the seat rather than after its current occupant.
  reportAddResult(addComparisonTarget(kind, rank, kind === "rank" ? `#${rank}` : `T${rank}`))
}

function handleAddPlayer(input: string) {
  reportAddResult(addComparisonPlayer(input))
}

function reportAddResult(result: ReturnType<typeof addComparisonTarget>) {
  if (result === "limit") {
    toast.warning(t("rankBorder.comparison.limitReached", { max: DETAIL_COMPARISON_LIMIT }))
  } else if (result === "duplicate") {
    toast.info(t("rankBorder.comparison.duplicateTarget"))
  } else if (result === "self") {
    toast.info(t("rankBorder.comparison.selfTarget"))
  } else if (result === "invalid") {
    toast.warning(t("rankBorder.result.invalidLocator"))
  }
}

// --- Planner overlay (own realtime detail only) ------------------------------

const plannerValues = computed<Array<{ key: "target" | "planned"; value: number }>>(() => {
  const value = params.value
  if (!value || value.target.kind !== "user" || !value.target.own || selectedWindow.value != null) {
    return []
  }

  const targetUserId = value.target.userId
  const account = (userStore.gameAccountBindings ?? [])
    .find((binding) => String(binding.userId) === targetUserId && binding.server === value.region)
  if (!account) {
    return []
  }

  const plan = plannerStore.getPlan(buildPlannerPlanKey(
    `${account.server}:${targetUserId}`,
    value.region,
    String(value.eventId),
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

// --- Charts ------------------------------------------------------------------

const chartTimeDomain = computed<RankBorderChartTimeDomain | null>(() => {
  if (selectedWindow.value) {
    return { start: selectedWindow.value.start, end: selectedWindow.value.end }
  }

  const records = scopedTrace.value
  if (records.length < 2) {
    return null
  }

  const start = eventStartAt.value ?? records[0].timestamp
  const end = Math.max(records[records.length - 1].timestamp, start + 1)
  return { start, end }
})

const detailCharts = computed(() =>
  buildDetailCharts({
    records: scopedTrace.value,
    comparisons: comparisonChartSeries.value,
    timeDomain: chartTimeDomain.value,
    scoreZeroBaseline: selectedWindow.value == null,
    plannerValues: plannerValues.value,
    formatTick,
    formatPoint,
    formatTimeTick,
    plannerLabel: (key) => t(key === "target" ? "rankBorder.comparison.targetLine" : "rankBorder.comparison.plannedLine"),
  }),
)

// --- Expanded chart dialog ---------------------------------------------------

type ChartMetricKey = "rank" | "score" | "speed"

const expandedMetric = ref<ChartMetricKey | null>(null)

const chartMeta = computed<Record<ChartMetricKey, { title: string; unit: string; svgClass: string }>>(() => ({
  rank: { title: t("rankBorder.result.rtrChart"), unit: "RT", svgClass: "text-sky-600 dark:text-sky-300" },
  score: { title: t("rankBorder.result.ptrChart"), unit: "pt", svgClass: "text-cyan-600 dark:text-cyan-300" },
  speed: { title: t("rankBorder.result.speedChart"), unit: "pt/h", svgClass: "text-emerald-600 dark:text-emerald-300" },
}))

// The dense build runs only while the dialog is open.
const expandedCharts = computed(() =>
  expandedMetric.value == null
    ? null
    : buildDetailCharts({
        records: scopedTrace.value,
        comparisons: comparisonChartSeries.value,
        timeDomain: chartTimeDomain.value,
        scoreZeroBaseline: selectedWindow.value == null,
        density: "detailed",
        plannerValues: plannerValues.value,
        formatTick,
        formatPoint,
        formatTimeTick,
        plannerLabel: (key) => t(key === "target" ? "rankBorder.comparison.targetLine" : "rankBorder.comparison.plannedLine"),
      }),
)

// --- Tooltip -----------------------------------------------------------------

const tooltip = ref<RankBorderTooltipState>({ visible: false, x: 0, y: 0, label: "" })

function showTooltip(event: MouseEvent, label: string) {
  const maxX = Math.max(12, window.innerWidth - 240)
  tooltip.value = {
    visible: true,
    label,
    x: Math.min(event.clientX + 12, maxX),
    y: Math.max(event.clientY - 10, 24),
  }
}

function moveTooltip(event: MouseEvent) {
  if (!tooltip.value.visible) {
    return
  }
  const maxX = Math.max(12, window.innerWidth - 240)
  tooltip.value = {
    ...tooltip.value,
    x: Math.min(event.clientX + 12, maxX),
    y: Math.max(event.clientY - 10, 24),
  }
}

function hideTooltip() {
  tooltip.value = { ...tooltip.value, visible: false }
}

// --- Page actions ------------------------------------------------------------

function goBack() {
  if (window.history.state?.back) {
    router.back()
    return
  }
  void router.push("/rank-border")
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    toast.success(t("rankBorder.actions.linkCopied"))
  } catch {
  }
}

function updateInterval(value: unknown) {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return
  }
  void router.replace({ query: { ...route.query, interval: value } })
}

// --- Formatters --------------------------------------------------------------

function resolvePersistedTrackerEndpoint() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) as PersistedState : {}
    const normalized = normalizeTrackerEndpoint(parsed.endpoint)
    if (!normalized || LEGACY_DIRECT_TRACKER_ENDPOINTS.has(normalized)) {
      return DEFAULT_TRACKER_ENDPOINT
    }
    return normalized
  } catch {
    return DEFAULT_TRACKER_ENDPOINT
  }
}

function formatPt(value: number | null | undefined) {
  return typeof value === "number" ? `${formatNumberCN(value)} pt` : "-"
}

function formatRank(value: number | null | undefined) {
  return typeof value === "number" ? `#${formatNumberCN(value)}` : "-"
}

function formatTargetRank(value: number | null | undefined) {
  return typeof value === "number" ? `T${value}` : "-"
}

function formatGrowth(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  const sign = value > 0 ? "+" : ""
  return `${sign}${formatNumberCN(value)}`
}

function formatPerHour(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  const sign = value > 0 ? "+" : ""
  return `${sign}${formatNumberCN(value)} pt/h`
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

function formatDay(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString(getI18nLocale(), {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  })
}

function formatLoopCount(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  return `${new Intl.NumberFormat(getI18nLocale(), { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)))}/h`
}

// Tracker samples are 10 s apart, so the second matters here.
function formatTimestamp(timestamp: number | null | undefined) {
  if (!timestamp) {
    return "-"
  }

  return formatLocalizedDateTime(timestamp * 1000, "dateTimeSeconds", "-")
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(getI18nLocale(), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)
}

function formatTick(value: number, metric: RankBorderChartMetric) {
  if (metric === "rank") {
    return formatRank(value)
  }

  return metric === "speed" ? `${formatCompactNumber(value)} pt/h` : `${formatCompactNumber(value)} pt`
}

function formatPoint(record: RankBorderTracePoint, metric: RankBorderChartMetric) {
  const time = new Date(record.timestamp * 1000).toLocaleString(getI18nLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
  if (metric === "rank") {
    return t("rankBorder.result.chartPointRank", { time, value: formatRank(record.rank) })
  }
  if (metric === "speed") {
    return t("rankBorder.result.chartPointSpeed", { time, value: formatPerHour(record.score) })
  }
  return t("rankBorder.result.chartPointScore", { time, value: formatPt(record.score) })
}

function formatTimeTick(timestamp: number, timeDomain: RankBorderChartTimeDomain) {
  const options: Intl.DateTimeFormatOptions = isSameLocalDay(timeDomain.start, timeDomain.end)
    ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
    : { month: "numeric", day: "numeric", hour: "2-digit", hourCycle: "h23" }
  return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), options)
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-7xl gap-2 sm:gap-3">
      <!-- Page header -->
      <div class="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" class="h-8 px-2" @click="goBack">
          <ArrowLeft class="size-4" />
          {{ t("rankBorder.actions.backToList") }}
        </Button>
        <!-- Phones: the event name takes its own full-width line under the actions instead of
             being squeezed to one character between the back button and the controls. -->
        <div v-if="params" class="order-last w-full min-w-0 text-sm text-muted-foreground sm:order-none sm:w-auto sm:flex-1 sm:truncate">
          <span class="font-medium text-foreground">{{ eventLabel }}</span>
          <span v-if="regionLabel"> · {{ regionLabel }}</span>
        </div>
        <div v-else class="min-w-0 flex-1" />

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <Select :model-value="String(intervalSeconds)" :aria-label="t('rankBorder.fields.interval')" @update:model-value="updateInterval">
            <SelectTrigger class="h-8 w-28 text-xs" :aria-label="t('rankBorder.fields.interval')">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in intervalOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" class="h-8" @click="copyLink">
            <Link2 class="size-4" />
            <span class="hidden sm:inline">{{ t("rankBorder.actions.copyLink") }}</span>
          </Button>
          <Button type="button" size="sm" class="h-8" :disabled="loading" @click="refresh(false)">
            <RefreshCcw :class="['size-4', loading ? 'animate-spin' : '']" />
            <span class="hidden sm:inline">{{ t("rankBorder.actions.refresh") }}</span>
          </Button>
        </div>
      </div>

      <!-- Invalid / legacy link: nothing was requested, so say so instead of "not collected yet" -->
      <div v-if="!params" class="grid justify-items-start gap-3 rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p>{{ t("rankBorder.result.invalidLink") }}</p>
        <Button as-child variant="outline" size="sm">
          <RouterLink to="/rank-border">
            <ArrowLeft class="size-4" />
            {{ t("rankBorder.result.goToRankBorder") }}
          </RouterLink>
        </Button>
      </div>

      <template v-else>
        <div
          v-if="hasIssues"
          role="status"
          class="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
        >
          <span class="font-medium">{{ detailIssuesTitle }}</span>
          <span v-if="issues.overview">{{ t("rankBorder.detailIssues.overview") }}</span>
          <span v-if="issues.comparisons.length > 0">{{ t("rankBorder.detailIssues.comparisons", { names: issues.comparisons.join(", ") }) }}</span>
          <span v-if="issues.realtime">{{ t("rankBorder.detailIssues.realtime") }}</span>
          <Button type="button" variant="outline" size="sm" class="ml-auto h-7" @click="retryIssues">
            <RefreshCcw class="size-3.5" />
            {{ t("rankBorder.detailIssues.retry") }}
          </Button>
        </div>

        <!-- Who the page is about and where they stand -->
        <div
          v-if="error && !current && !notRanked"
          class="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <p>{{ error === "not_found" ? t(params.target.kind === "user" ? "rankBorder.result.userNotFound" : "rankBorder.result.rankNotFound") : error }}</p>
          <p v-if="error !== 'not_found' && errorDetail" class="mt-1 text-xs text-destructive/70">
            {{ t("core.errors.detail", { detail: errorDetail }) }}
          </p>
        </div>
        <DetailHero
          v-else
          :is-line="isLineTarget"
          :leader="leaderVisual"
          :honors="honorViews"
          :title-segments="titleSegments"
          :status="statusBadge"
          :rank-label="subjectRankLabel"
          :score-label="formatPt(subjectScore)"
          :latest-label="t('rankBorder.result.latest', { value: formatTimestamp(current?.timestamp ?? primaryStats.latest?.timestamp ?? null) })"
          :not-ranked-hint="notRanked ? t('rankBorder.result.notRankedHint') : null"
          :profile-word="profileWord"
          :holder-name="lineHolderName"
          :neighbours="neighbourRows"
          :neighbours-title="t(isLineTarget ? 'rankBorder.detail.nearbyLines' : 'rankBorder.detail.nearby')"
          :lines="keyLineRows"
        >
          <Tabs
            v-if="canSwitchTraceSource"
            :model-value="traceSource"
            @update:model-value="(value) => (value === 'player' || value === 'border') && setTraceSource(value)"
          >
            <!-- Triggers fill the list: 32 px with a mouse, 40 px on touch (the primitive's coarse-pointer minimum). -->
            <TabsList class="h-8">
              <TabsTrigger value="player" class="px-2.5 text-xs">{{ t("rankBorder.sections.playerTracking") }}</TabsTrigger>
              <TabsTrigger value="border" class="px-2.5 text-xs">{{ t("rankBorder.sections.borderTracking") }}</TabsTrigger>
            </TabsList>
          </Tabs>
          <RefreshCcw v-if="borderTraceLoading" class="size-3.5 animate-spin text-muted-foreground" />
          <span class="text-xs text-muted-foreground">
            {{ t(seatView ? "rankBorder.detail.sourceSeat" : "rankBorder.detail.sourcePlayer") }}
          </span>
        </DetailHero>

        <DetailDashboard
          v-if="primaryStats.hasChart"
          :trace="scopedTrace"
          :full-trace="activeTrace"
          :stats="primaryStats"
          :seat-view="seatView"
          :scope-label="traceScopeLabel"
          :window="selectedWindow"
          :data-now="dataNow"
          :event-start-at="eventStartAt"
          :event-end-at="eventEndAt"
          :score="subjectScore"
          :live-speed="liveSpeed"
          :self-label="subjectRankLabel"
          :rivals="projectionRivals"
          :field="paceField"
          :field-own="paceFieldOwn"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
        />

        <!-- Comparison center -->
        <ComparisonCenter
          :rows="comparisonRows"
          :limit="DETAIL_COMPARISON_LIMIT"
          :can-add="comparisons.length < DETAIL_COMPARISON_LIMIT"
          :target-options="comparisonTargetOptions"
          @add-target="handleAddTarget"
          @add-player="handleAddPlayer"
          @remove="removeComparison"
        />

        <!-- Trend charts -->
        <div v-if="primaryStats.hasChart" class="rank-border-detail-charts">
          <TrendChartCard
            :title="t('rankBorder.result.rtrChart')"
            unit-label="RT"
            svg-class="text-sky-600 dark:text-sky-300"
            :chart="detailCharts.rank"
            :time-ticks="detailCharts.timeTicks"
            :primary-label="primaryLabel"
            :comparison-meta="comparisonMeta"
            expandable
            :show-tooltip="showTooltip"
            :move-tooltip="moveTooltip"
            :hide-tooltip="hideTooltip"
            @expand="expandedMetric = 'rank'"
          />
          <TrendChartCard
            :title="t('rankBorder.result.ptrChart')"
            unit-label="pt"
            svg-class="text-cyan-600 dark:text-cyan-300"
            :chart="detailCharts.score"
            :time-ticks="detailCharts.timeTicks"
            :primary-label="primaryLabel"
            :comparison-meta="comparisonMeta"
            :planner-lines="detailCharts.plannerLines"
            expandable
            :show-tooltip="showTooltip"
            :move-tooltip="moveTooltip"
            :hide-tooltip="hideTooltip"
            @expand="expandedMetric = 'score'"
          >
            <template #legend-extra>
              <span
                v-for="line in detailCharts.plannerLines"
                :key="`plan-legend-${line.key}`"
                class="inline-flex items-center gap-1"
              >
                <span
                  class="inline-block h-0.5 w-4 rounded-full"
                  :class="line.tone === 'target' ? 'bg-amber-500/90' : 'bg-emerald-500/90'"
                />
                {{ line.label }} {{ formatPt(line.value) }}
              </span>
            </template>
          </TrendChartCard>
          <TrendChartCard
            :title="t('rankBorder.result.speedChart')"
            unit-label="pt/h"
            svg-class="text-emerald-600 dark:text-emerald-300"
            :chart="detailCharts.speed"
            :time-ticks="detailCharts.timeTicks"
            :primary-label="primaryLabel"
            :comparison-meta="comparisonMeta"
            expandable
            :show-tooltip="showTooltip"
            :move-tooltip="moveTooltip"
            :hide-tooltip="hideTooltip"
            @expand="expandedMetric = 'speed'"
          />
        </div>
        <div v-else-if="loading" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {{ t("rankBorder.result.waitingTrace") }}
        </div>
        <div v-else class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          {{ t("rankBorder.result.emptyTrace") }}
        </div>

        <!-- Expanded chart dialog -->
        <Dialog :open="expandedMetric != null" @update:open="(open) => !open && (expandedMetric = null)">
          <DialogContent size="2xl">
            <DialogHeader>
              <DialogTitle>{{ expandedMetric ? chartMeta[expandedMetric].title : "" }}</DialogTitle>
              <DialogDescription>{{ traceScopeLabel }}</DialogDescription>
            </DialogHeader>
            <DialogBody>
            <TrendChartCard
              v-if="expandedMetric && expandedCharts"
              large
              :title="chartMeta[expandedMetric].title"
              :unit-label="chartMeta[expandedMetric].unit"
              :svg-class="chartMeta[expandedMetric].svgClass"
              :chart="expandedCharts[expandedMetric]"
              :time-ticks="expandedCharts.timeTicks"
              :primary-label="primaryLabel"
            :comparison-meta="comparisonMeta"
              :planner-lines="expandedMetric === 'score' ? expandedCharts.plannerLines : []"
              :show-tooltip="showTooltip"
              :move-tooltip="moveTooltip"
              :hide-tooltip="hideTooltip"
            >
              <template v-if="expandedMetric === 'score'" #legend-extra>
                <span
                  v-for="line in expandedCharts.plannerLines"
                  :key="`dialog-plan-legend-${line.key}`"
                  class="inline-flex items-center gap-1"
                >
                  <span
                    class="inline-block h-0.5 w-4 rounded-full"
                    :class="line.tone === 'target' ? 'bg-amber-500/90' : 'bg-emerald-500/90'"
                  />
                  {{ line.label }} {{ formatPt(line.value) }}
                </span>
              </template>
            </TrendChartCard>
            </DialogBody>
          </DialogContent>
        </Dialog>

        <!-- Heatmap + update log -->
        <DetailHistoryPanel
          :trace="activeTrace"
          :event-start-at="eventStartAt"
          :scope-label="traceScopeLabel"
          :window="selectedWindow"
          :show-tooltip="showTooltip"
          :move-tooltip="moveTooltip"
          :hide-tooltip="hideTooltip"
          @update:window="selectedWindow = $event"
        />

        <!-- Day by day, and who held the seat -->
        <div
          v-if="primaryStats.hasChart && dailyRows.length > 0"
          :class="['grid min-w-0 items-start gap-2 sm:gap-3', holderRows.length > 0 ? 'xl:grid-cols-2' : '']"
        >
          <DetailTable
            :title="t('rankBorder.detail.daily.title')"
            :caption="t('rankBorder.detail.daily.caption')"
            :columns="dailyColumns"
            :rows="dailyRows"
            data-testid="rank-detail-daily"
          />
          <DetailTable
            v-if="holderRows.length > 0"
            :title="t('rankBorder.detail.holderLog.title')"
            :caption="t('rankBorder.detail.holderLog.caption', { count: HOLDER_LOG_LIMIT })"
            :columns="holderColumns"
            :rows="holderRows"
            data-testid="rank-detail-holders"
          />
        </div>
      </template>
    </div>

    <div
      v-if="tooltip.visible"
      class="rank-border-tooltip"
      :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    >
      {{ tooltip.label }}
    </div>
  </div>
</template>

<style scoped>
.rank-border-detail-charts {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

@media (min-width: 900px) {
  .rank-border-detail-charts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rank-border-detail-charts > :last-child {
    grid-column: 1 / -1;
  }
}

@media (min-width: 1400px) {
  .rank-border-detail-charts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rank-border-detail-charts > :last-child {
    grid-column: auto;
  }
}

.rank-border-tooltip {
  position: fixed;
  z-index: 80;
  max-width: 14rem;
  transform: translateY(-100%);
  border: 1px solid color-mix(in oklab, var(--border) 70%, var(--foreground) 30%);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--popover) 92%, transparent);
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.22);
  color: var(--popover-foreground);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.35;
  padding: 0.375rem 0.5rem;
  pointer-events: none;
  white-space: normal;
}
</style>

