<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRoute, useRouter } from "vue-router"
import { toast } from "vue-sonner"
import { ArrowLeft, Link2, RefreshCcw } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
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
import { formatNumberCN } from "@/lib/number-format"
import { resolveSekaiRegionLabel } from "@/lib/sekai-region"
import { getI18nLocale } from "@/shared/i18n"
import { useUserStore } from "@/shared/stores/user"
import type { ComboboxOption } from "@/components/ui/combobox"
import ComparisonCenter, { type ComparisonTableRow } from "../components/ComparisonCenter.vue"
import DetailHistoryPanel from "../components/DetailHistoryPanel.vue"
import HonorBadge from "../components/HonorBadge.vue"
import LeaderCard from "../components/LeaderCard.vue"
import TrendChartCard from "../components/TrendChartCard.vue"
import { useRankBorderHonors } from "../composables/useRankBorderHonors"
import { useRankBorderMasterData } from "../composables/useRankBorderMasterData"
import {
  DETAIL_COMPARISON_LIMIT,
  useRankBorderDetailPage,
} from "../composables/useRankBorderDetailPage"
import { buildDetailCharts } from "../lib/detail-charts"
import { parseRankBorderDetailQuery } from "../lib/detail-link"
import {
  buildProfileHonorViews,
  isLatestResult,
  resolveLeaderVisual,
  sanitizeDomId,
} from "../lib/honor-visuals"
import { buildMasterRecordMap } from "../lib/master-data-types"
import {
  normalizeTrackerEndpoint,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import { isSameLocalDay, traceRecordsForWindow } from "../lib/rank-border-chart"
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
import { resolveTraceMetricStats } from "../lib/trace-stats"
import { parseRichNameSegments, richNameSegmentStyle } from "../lib/rich-name"

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
  current,
  previous,
  next,
  activeTrace,
  hasPlayerTrace,
  hasBorderTrace,
  traceSource,
  setTraceSource,
  overview,
  comparisons,
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
  { value: "900", label: t("rankBorder.intervals.minutes", { value: 15 }) },
  { value: "3600", label: t("rankBorder.intervals.hours", { value: 1 }) },
  { value: "21600", label: t("rankBorder.intervals.hours", { value: 6 }) },
  { value: "86400", label: t("rankBorder.intervals.hours", { value: 24 }) },
])

const eventLabel = computed(() => masterData.selectedEvent.value?.label ?? `#${params.value?.eventId ?? "?"}`)
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
  return parseRichNameSegments(name ?? t("rankBorder.result.unknownPlayer"))
})

const statusBadge = computed(() => {
  if (isLineTarget.value) {
    return { label: t("rankBorder.result.lineTracked"), tone: "line" as const }
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

const previousGap = computed(() =>
  previous.value && current.value ? previous.value.score - current.value.score : null,
)
const nextGap = computed(() =>
  next.value && current.value ? current.value.score - next.value.score : null,
)

type StatTile = { key: string; label: string; value: string }

const statTiles = computed<StatTile[]>(() => {
  const stats = primaryStats.value
  return [
    { key: "hourlySpeed", label: t("rankBorder.result.hourlySpeed"), value: formatPerHour(stats.hourlySpeed) },
    { key: "recentAveragePt", label: t("rankBorder.result.recentAveragePt"), value: formatPt(stats.recentAveragePt) },
    { key: "latestPointGrowth", label: t("rankBorder.result.latestPointGrowth"), value: formatGrowth(stats.latestPointGrowth) },
    { key: "threeWindowSpeed", label: t("rankBorder.result.twentyMinTripleSpeed"), value: formatPerHour(stats.threeWindowSpeed) },
    { key: "loopCount", label: t("rankBorder.result.loopCount"), value: formatLoopCount(stats.loopCount) },
    { key: "rankShift", label: t("rankBorder.result.rankShift"), value: formatGrowth(stats.rankShift) },
    {
      key: "previousGap",
      label: isLineTarget.value ? t("rankBorder.result.previousLine") : t("rankBorder.result.previousRank"),
      value: formatGrowth(previousGap.value),
    },
    {
      key: "nextGap",
      label: isLineTarget.value ? t("rankBorder.result.nextLine") : t("rankBorder.result.nextRank"),
      value: formatGrowth(nextGap.value),
    },
  ]
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
  if (!name) {
    return null
  }
  return parseRichNameSegments(name).map((segment) => segment.text).join("")
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

  const seat = kind === "rank"
    ? overview.value?.topRankings.find((entry) => String(entry.rank) === rank)
    : null
  const seatName = plainNameText(seat?.name)
  const label = kind === "rank"
    ? (seatName ? `#${rank} ${seatName}` : `#${rank}`)
    : `T${rank}`
  reportAddResult(addComparisonTarget(kind, rank, label))
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

function formatLoopCount(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  return `${new Intl.NumberFormat(getI18nLocale(), { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value)))}/h`
}

function formatTimestamp(timestamp: number | null | undefined) {
  if (!timestamp) {
    return "-"
  }

  return new Date(timestamp * 1000).toLocaleString()
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
    ? { hour: "2-digit", minute: "2-digit" }
    : { month: "numeric", day: "numeric", hour: "2-digit" }
  return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), options)
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-6xl gap-2 sm:gap-3">
      <!-- Page header -->
      <div class="flex flex-wrap items-center gap-2">
        <Button type="button" variant="ghost" size="sm" class="h-8 px-2" @click="goBack">
          <ArrowLeft class="size-4" />
          {{ t("rankBorder.actions.backToList") }}
        </Button>
        <div class="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          <span class="font-medium text-foreground">{{ eventLabel }}</span>
          <span v-if="regionLabel"> · {{ regionLabel }}</span>
        </div>
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

      <!-- Invalid link -->
      <Card v-if="!params">
        <CardContent class="grid justify-items-start gap-3 p-6 text-sm text-muted-foreground">
          <p>{{ t("rankBorder.result.rankNotFound") }}</p>
          <Button type="button" variant="outline" size="sm" @click="goBack">
            <ArrowLeft class="size-4" />
            {{ t("rankBorder.actions.backToList") }}
          </Button>
        </CardContent>
      </Card>

      <template v-else>
        <div class="rank-border-detail-top">
        <!-- Hero -->
        <Card class="gap-0 py-0">
          <CardContent class="grid gap-3 p-3 sm:p-4">
            <div v-if="error && !current" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ error === "not_found" ? t("rankBorder.result.rankNotFound") : error }}
            </div>
            <div v-else class="rank-border-detail-hero">
              <LeaderCard v-if="!isLineTarget" :leader="leaderVisual" variant="detail" />
              <div class="min-w-0 grid content-start gap-0.5">
                <div class="flex min-w-0 flex-wrap items-center gap-2">
                  <h1 class="min-w-0 truncate text-base font-semibold sm:text-lg">
                    <span
                      v-for="segment in titleSegments"
                      :key="segment.key"
                      :style="richNameSegmentStyle(segment)"
                    >
                      {{ segment.text }}
                    </span>
                  </h1>
                  <span
                    v-if="statusBadge"
                    :class="[
                      'inline-flex shrink-0 rounded-md border px-2 py-0.5 text-xs font-medium',
                      statusBadge.tone === 'line'
                        ? 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100'
                        : statusBadge.tone === 'in'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                          : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100',
                    ]"
                  >
                    {{ statusBadge.label }}
                  </span>
                </div>
                <div class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p class="rank-border-detail-hero__rank">
                    {{ isLineTarget ? formatTargetRank(current?.rank ?? (params.target.kind === "line" ? params.target.rank : null)) : formatRank(current?.rank ?? null) }}
                  </p>
                  <p class="rank-border-detail-hero__score">{{ formatPt(current?.score ?? primaryStats.latest?.score ?? null) }}</p>
                </div>
                <p class="truncate text-xs text-muted-foreground">
                  {{ t("rankBorder.result.latest", { value: formatTimestamp(current?.timestamp ?? primaryStats.latest?.timestamp ?? null) }) }}
                </p>
              </div>
              <div v-if="honorViews.length > 0" class="rank-border-detail-hero__honors">
                <HonorBadge
                  v-for="honor in honorViews"
                  :key="honor.key"
                  :honor="honor"
                  variant="detail"
                />
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <Tabs
                v-if="hasPlayerTrace && hasBorderTrace"
                :model-value="traceSource"
                @update:model-value="(value) => (value === 'player' || value === 'border') && setTraceSource(value)"
              >
                <TabsList class="h-8">
                  <TabsTrigger value="player" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.playerTracking") }}</TabsTrigger>
                  <TabsTrigger value="border" class="h-7 px-2.5 text-xs">{{ t("rankBorder.sections.borderTracking") }}</TabsTrigger>
                </TabsList>
              </Tabs>
              <span class="text-xs text-muted-foreground">{{ traceScopeLabel }}</span>
            </div>

            <div class="rank-border-detail-stats">
              <div v-for="tile in statTiles" :key="tile.key" class="rank-border-stat">
                <p>{{ tile.label }}</p>
                <strong>{{ tile.value }}</strong>
              </div>
            </div>
          </CardContent>
        </Card>

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
        </div>

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
          <DialogContent class="rank-border-chart-dialog">
            <DialogHeader>
              <DialogTitle>{{ expandedMetric ? chartMeta[expandedMetric].title : "" }}</DialogTitle>
              <DialogDescription>{{ traceScopeLabel }}</DialogDescription>
            </DialogHeader>
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
/* Hero + comparison center share one row on wide screens. */
.rank-border-detail-top {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
}

@media (min-width: 1280px) {
  .rank-border-detail-top {
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    align-items: stretch;
  }
}

.rank-border-detail-hero {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: 0.875rem;
}

.rank-border-detail-hero__rank {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1.5rem, 4vw, 2.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.05;
}

.rank-border-detail-hero__score {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: clamp(1rem, 2.2vw, 1.375rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.1;
}

.rank-border-detail-hero__honors {
  display: flex;
  min-width: 0;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.375rem;
  grid-column: 1 / -1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

@media (min-width: 900px) {
  .rank-border-detail-hero {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .rank-border-detail-hero__honors {
    grid-column: auto;
    align-self: center;
  }
}

.rank-border-detail-stats {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.5rem;
}

.rank-border-stat {
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  padding: 0.5rem;
}

.rank-border-stat p {
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.75rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-stat strong {
  display: block;
  overflow: hidden;
  margin-top: 0.25rem;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

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

<style>
/* DialogContent teleports to <body>, out of reach of scoped :deep selectors. */
.rank-border-chart-dialog {
  width: min(96vw, 68rem);
  max-width: none;
}
</style>
