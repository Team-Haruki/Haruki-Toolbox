<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ChartLine,
  Gauge,
  RefreshCcw,
  Server,
  Trophy,
  UserRound,
} from "lucide-vue-next"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatGameAccountLabel } from "@/lib/game-account-display"
import { formatNumberCN } from "@/lib/number-format"
import { resolveSekaiRegionLabel, SEKAI_REGION_OPTIONS } from "@/lib/sekai-region"
import { getI18nLocale } from "@/shared/i18n"
import {
  resolveCardAttrIconUrl,
  resolveCardFrameImageUrl,
  resolveRareBirthdayImageUrl,
  resolveRareStarImageUrl,
  resolveSekaiCardThumbnailUrl,
  resolveSekaiGameAssetUrl,
  resolveTrainRankImageUrl,
} from "@/shared/sekai/data-sources"
import { useSettingsStore } from "@/shared/stores/settings"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion } from "@/types"
import {
  fetchRankBorderBatchTraceByRanks,
  fetchRankBorderLatestByRank,
  fetchRankBorderLatestByUser,
  fetchRankBorderPrivateLatestByUser,
  fetchRankBorderPrivateTraceByUser,
  fetchRankBorderTraceByRank,
  fetchRankBorderTraceByUser,
  fetchRankBorderWebTraceByRank,
  fetchRankBorderWebTraceByUser,
  fetchRankBorderWebRankings,
  fetchRankBorderPublicUserProfile,
  subscribeRankBorderRealtime,
  type RankBorderRealtimeEvent,
  type RankBorderRealtimeOnline,
  type RankBorderRealtimeState,
  type RankBorderRealtimeSubscription,
  type RankBorderTrackerScope,
} from "../api/rank-border"
import {
  useRankBorderMasterOptions,
  type RankBorderMasterBondsHonor,
  type RankBorderMasterBondsHonorWord,
  type RankBorderMasterCard,
  type RankBorderMasterGameCharacterUnit,
  type RankBorderMasterHonor,
  type RankBorderMasterHonorGroup,
} from "../composables/useRankBorderMasterOptions"
import { useRankBorderTracker } from "../composables/useRankBorderTracker"
import {
  normalizeRankBorderWebRankings,
  normalizeTrackerEndpoint,
  parseRankBorderRankQuery,
  resolveRankBorderTraceGrowth,
  type RankBorderGrowth,
  type RankBorderLatest,
  type RankBorderLine,
  type RankBorderMode,
  type RankBorderTracePoint,
  type RankBorderUserProfile,
} from "../lib/rank-border"

type PersistedState = {
  endpoint?: string
  region?: SekaiRegion
  eventId?: string | null
  mode?: RankBorderMode
  worldBloomCharacterId?: string | null
  intervalSeconds?: string
  accountKey?: string
  hideProfileAssets?: boolean
}

type AccountOption = {
  key: string
  label: string
  server: SekaiRegion
  userId: string
}

type RankBorderLineRow = {
  key: string
  rank: number
  score: number | null
  timestamp: number | null
  growth: RankBorderGrowth | null
  displayGrowth: number | null
  displayGrowthChanged: boolean
  detail: RankBorderLatest | null
  selected: boolean
  scoreChanged: boolean
  growthChanged: boolean
  detailChanged: boolean
  top100: boolean
}

type RankBorderSegmentRow = {
  rank: number
  score: number
  timestamp: number | null
  growth: RankBorderGrowth | null
  selected: boolean
  scoreChanged: boolean
  growthChanged: boolean
}

type RankBorderChartMetric = "score" | "rank"

type RankBorderChartReferenceLine = {
  value: number
  y: number
  label: string
}

type RankBorderHeatmapCell = {
  key: string
  label: string
  start: number
  end: number
  hourLabel: string
  value: number
  roundCount: number
  sampleCount: number
  displayLabel: string
  intensity: number
  color: string
  textColor: string
  status: "active" | "before" | "future"
  selectable: boolean
  selected: boolean
}

type RankBorderHeatmapDay = {
  key: string
  label: string
  cells: RankBorderHeatmapCell[]
}

type RankBorderHeatmapWindow = {
  start: number
  end: number
  label: string
}

type RankBorderJumpTarget = {
  rank: number
  label: string
  value: string
}

type RankBorderChartPoint = {
  key: string
  x: number
  y: number
  label: string
}

type RankBorderChartTimeTick = {
  key: string
  left: string
  label: string
}

type RankBorderChartTimeDomain = {
  start: number
  end: number
}

type RankBorderDetailCharts = {
  rankReferenceLines: RankBorderChartReferenceLine[]
  scoreReferenceLines: RankBorderChartReferenceLine[]
  rankPoints: RankBorderChartPoint[]
  scorePoints: RankBorderChartPoint[]
  timeTicks: RankBorderChartTimeTick[]
  rankPath: string
  scorePath: string
}

type RankBorderUpdateRecord = {
  key: string
  time: string
  rank: string
  score: string
  growth: string
}

type RankBorderHonorView = {
  key: string
  label: string
  type: "normal" | "bonds"
  groupType: string | null
  honorId: number | null
  baseUrl: string | null
  rankUrl: string | null
  rankPlacement: "event" | "full" | "rank_match"
  frameUrl: string | null
  framePlacement: "full" | "low"
  scrollUrl: string | null
  levelIconUrl: string | null
  level6IconUrl: string | null
  fcApLevel: string | null
  bondsLeftBgUrl: string | null
  bondsRightBgUrl: string | null
  bondsLeftIconUrl: string | null
  bondsRightIconUrl: string | null
  level: number | null
}

type RankBorderHonorLevelStar = {
  key: string
  url: string
  slot: number
  layer: number
}

type PlayerDetailSource = "rank" | "user"

type PlayerDetailState = {
  source: PlayerDetailSource
  query: string
  result: RankBorderLatest
  previous: RankBorderLatest | null
  next: RankBorderLatest | null
}

type LineDetailState = {
  source: "line"
  query: string
  result: RankBorderLine
  growth: RankBorderGrowth | null
  previous: RankBorderLine | null
  next: RankBorderLine | null
}

type DetailState = PlayerDetailState | LineDetailState

type RankBorderTooltipState = {
  visible: boolean
  x: number
  y: number
  label: string
}

const STORAGE_KEY = "haruki:rank-border:state"
const DEFAULT_TRACKER_ENDPOINT = normalizeTrackerEndpoint(import.meta.env.VITE_HARUKI_EVENT_TRACKER_URL) || "/event-tracker"
const LEGACY_DIRECT_TRACKER_ENDPOINTS = new Set([
  "http://100.111.213.59:8777",
  "http://127.0.0.1:8777",
  "http://127.0.0.1:18777",
  "http://localhost:8777",
  "http://localhost:18777",
])
const DEFAULT_INTERVAL_SECONDS = "3600"
const PERSONAL_COLLECTION_LIMIT = 100
const NUMBER_FLASH_MS = 1200
const FC_AP_HONOR_IDS = new Set([3009, 3010, 3011, 3012, 3013, 3014, 4700, 4701])
const TOP_100_DETAIL_CONCURRENCY = 8
const TRACKER_UPDATE_INTERVAL_SECONDS = 10
const MIN_LIVE_REFRESH_MS = 2_000
const MAX_LIVE_REFRESH_MS = 30_000
const DETAIL_CHART_WIDTH = 260
const DETAIL_CHART_HEIGHT = 84
const DETAIL_CHART_X_PADDING = 10
const DETAIL_CHART_Y_PADDING = 14
const DETAIL_CHART_Y_BOTTOM_PADDING = 32
const ROW_SPARKLINE_MAX_POINTS = 48
const DETAIL_CHART_MAX_POINTS = 96
const DETAIL_HEATMAP_HOURS_PER_DAY = 24
const DETAIL_RECENT_POINT_COUNT = 10
const DETAIL_UPDATE_RECORD_LIMIT = 8
const DETAIL_CSB_WINDOW_SECONDS = 20 * 60 * 3
const TOP_100_TRACE_WARMUP_MIN_LIMIT = 400
const TOP_100_TRACE_WARMUP_MAX_LIMIT = 12_000
const TOP_100_DETAIL_CACHE_TTL_MS = 2 * 60 * 1000
const TOP_100_DETAIL_CACHE_PREFIX = "haruki:rank-border:top100:"
const PROFILE_ENRICH_PRIORITY_LIMIT = 24
const DEFERRED_PROFILE_ENRICH_DELAY_MS = 600
const DEFERRED_TRACE_WARMUP_DELAY_MS = 500
const HEATMAP_MYSEKAI_ROUND_THRESHOLD = 37
const HEATMAP_ACTIVE_ROUND_BASELINE = 15
const HEATMAP_ACTIVE_ROUND_SPAN = 15
const DEFAULT_REPLAY_WINDOW_SECONDS = 7 * 24 * 60 * 60
const TOP_100_RANKS = Array.from({ length: PERSONAL_COLLECTION_LIMIT }, (_, index) => index + 1)

const { t } = useI18n()
const userStore = useUserStore()
const settingsStore = useSettingsStore()
const persistedState = readPersistedState()

const trackerEndpoint = ref(resolveInitialTrackerEndpoint(persistedState.endpoint))
const selectedRegion = ref<SekaiRegion>(persistedState.region ?? "cn")
const selectedEventId = ref<string | null>(persistedState.eventId ?? null)
const mode = ref<RankBorderMode>(persistedState.mode ?? "normal")
const selectedWorldBloomCharacterId = ref<string | null>(persistedState.worldBloomCharacterId ?? null)
const intervalSeconds = ref(persistedState.intervalSeconds ?? DEFAULT_INTERVAL_SECONDS)
const selectedAccountKey = ref(persistedState.accountKey ?? "")
const hideProfileAssets = ref(persistedState.hideProfileAssets ?? false)
const playbackAt = ref<number | null>(null)
const playbackDraftAt = ref<number | null>(null)
const detail = ref<DetailState | null>(null)
const detailTrace = ref<RankBorderTracePoint[]>([])
const detailTraceLoading = ref(false)
const detailDialogOpen = ref(false)
const selectedHeatmapWindow = ref<RankBorderHeatmapWindow | null>(null)
const isMobileViewport = ref(resolveIsMobileViewport())
const mobileExpandedDetail = ref<{ source: "rank" | "line", rank: number } | null>(null)
const mobileLocateOpen = ref(false)
const liveRefreshing = ref(false)
const detailLoading = ref(false)
const detailError = ref<string | null>(null)
const realtimeState = ref<RankBorderRealtimeState>("closed")
const realtimeOnline = ref<RankBorderRealtimeOnline | null>(null)
const currentUnixSecond = ref(Math.floor(Date.now() / 1000))
const rankBorderTooltip = ref<RankBorderTooltipState>({
  visible: false,
  x: 0,
  y: 0,
  label: "",
})
const top100Details = ref<Map<number, RankBorderLatest>>(new Map())
const top100GrowthByRank = ref<Map<number, RankBorderGrowth>>(new Map())
const top100GrowthIntervalSeconds = ref<number | null>(null)
const top100TraceByRank = ref<Map<number, RankBorderTracePoint[]>>(new Map())
const segmentTraceByRank = ref<Map<number, RankBorderTracePoint[]>>(new Map())
const publicProfileByUserId = ref<Map<string, RankBorderUserProfile>>(new Map())
const scoreChangedRanks = ref<Set<number>>(new Set())
const growthChangedRanks = ref<Set<number>>(new Set())
const detailChangedRanks = ref<Set<number>>(new Set())
const detailScoreChanged = ref(false)
const visibleRank = ref<number | null>(null)
const top100DetailRefreshing = ref(false)
const top100TraceWarming = ref(false)
const profileAssetsLoading = ref(false)

const masterOptions = useRankBorderMasterOptions(selectedRegion, selectedEventId)
const tracker = useRankBorderTracker()

const eventComboboxOptions = computed<ComboboxOption[]>(() =>
  masterOptions.eventOptions.value.map((event) => ({
    value: event.value,
    label: event.label,
    description: event.startAt ? formatTimestamp(event.startAt) : null,
    tags: [
      {
        label: `#${event.id}`,
        class: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-200",
      },
      ...(event.isWorldBloom
        ? [{
            label: t("rankBorder.badges.worldBloom"),
            class: "border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100",
          }]
        : []),
    ],
    keywords: [
      String(event.id),
      `#${event.id}`,
      event.eventType ?? "",
      event.assetbundleName ?? "",
    ],
  })),
)

const accountOptions = computed<AccountOption[]>(() =>
  (userStore.gameAccountBindings ?? []).map((account, index) => {
    const regionLabel = resolveSekaiRegionLabel(account.server, t)
    const userId = String(account.userId)
    return {
      key: `${account.server}:${userId}:${index}`,
      label: formatGameAccountLabel({
        regionLabel,
        uid: userId,
        hideUid: settingsStore.hideGameUserId,
      }),
      server: account.server,
      userId,
    }
  }),
)

const selectedAccount = computed(() =>
  accountOptions.value.find((account) => account.key === selectedAccountKey.value) ?? null,
)

const selectedEvent = computed(() => masterOptions.selectedEvent.value)
const selectedWorldBloomCharacter = computed(() =>
  masterOptions.worldBloomCharacterOptions.value.find((option) => option.value === selectedWorldBloomCharacterId.value) ?? null,
)
const selectedActivityStartAt = computed(() =>
  (mode.value === "world_bloom" ? selectedWorldBloomCharacter.value?.chapterStartAt : null)
  ?? selectedEvent.value?.startAt
  ?? null,
)
const selectedActivityEndAt = computed(() =>
  (mode.value === "world_bloom" ? selectedWorldBloomCharacter.value?.aggregateAt : null)
  ?? selectedEvent.value?.aggregateAt
  ?? selectedEvent.value?.closedAt
  ?? null,
)
const cardById = computed<Map<number, RankBorderMasterCard>>(() => buildMasterRecordMap(masterOptions.cards.value))
const honorById = computed<Map<number, RankBorderMasterHonor>>(() => buildMasterRecordMap(masterOptions.honors.value))
const honorGroupById = computed<Map<number, RankBorderMasterHonorGroup>>(() =>
  buildMasterRecordMap(masterOptions.honorGroups.value),
)
const bondsHonorById = computed<Map<number, RankBorderMasterBondsHonor>>(() =>
  buildMasterRecordMap(masterOptions.bondsHonors.value),
)
const bondsHonorWordById = computed<Map<number, RankBorderMasterBondsHonorWord>>(() =>
  buildMasterRecordMap(masterOptions.bondsHonorWords.value),
)
const gameCharacterUnitById = computed<Map<number, RankBorderMasterGameCharacterUnit>>(() =>
  buildMasterRecordMap(masterOptions.gameCharacterUnits.value),
)
const selectedIntervalSeconds = computed(() => normalizePositiveInteger(intervalSeconds.value, Number(DEFAULT_INTERVAL_SECONDS)))
const selectedEventIdNumber = computed(() => normalizePositiveInteger(selectedEventId.value, 0))
const selectedWorldBloomCharacterIdNumber = computed(() =>
  normalizePositiveInteger(selectedWorldBloomCharacterId.value, 0),
)
const trackerEndpointReady = computed(() => normalizeTrackerEndpoint(trackerEndpoint.value) !== "")
const canRefresh = computed(() =>
  trackerEndpointReady.value
  && selectedEventIdNumber.value > 0
  && (mode.value === "normal" || selectedWorldBloomCharacterIdNumber.value > 0),
)
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
const shouldRenderProfileAssets = computed(() => !hideProfileAssets.value)

const top100Rows = computed<RankBorderLineRow[]>(() =>
  TOP_100_RANKS.map((rank) => createTop100Row(rank, top100Details.value.get(rank) ?? null)),
)

const hasTop100Data = computed(() => top100Details.value.size > 0)
const selectedTrackerGrowthByRank = computed(() =>
  tracker.growthIntervalSeconds.value === selectedIntervalSeconds.value
    ? tracker.growthByRank.value
    : new Map<number, RankBorderGrowth>(),
)
const segmentRows = computed<RankBorderSegmentRow[]>(() =>
  tracker.lines.value
    .filter((line) => line.rank > PERSONAL_COLLECTION_LIMIT)
    .map((line) => {
      const growth = selectedTrackerGrowthByRank.value.get(line.rank) ?? null
      return {
        rank: line.rank,
        score: line.score,
        timestamp: line.timestamp,
        growth,
        selected: detail.value?.source === "line" && detail.value.result.rank === line.rank,
        scoreChanged: scoreChangedRanks.value.has(line.rank),
        growthChanged: growthChangedRanks.value.has(line.rank),
      }
    }),
)
const hasSegmentData = computed(() => segmentRows.value.length > 0)
const quickJumpTargets = computed<RankBorderJumpTarget[]>(() => {
  const targetRanks = new Set<number>(TOP_100_RANKS)
  for (const line of segmentRows.value) {
    if (line.rank > PERSONAL_COLLECTION_LIMIT) {
      targetRanks.add(line.rank)
    }
  }

  return Array.from(targetRanks)
    .sort((a, b) => a - b)
    .map((rank, index) => ({
      rank,
      label: rank <= PERSONAL_COLLECTION_LIMIT ? formatRank(rank) : formatTargetRank(rank),
      value: String(index),
    }))
})

const activeQuickJumpRank = computed(() =>
  visibleRank.value ?? detail.value?.result.rank ?? null,
)
const selectedAccountDetail = computed(() =>
  selectedAccount.value && detail.value?.source === "user" && detail.value.query === selectedAccount.value.userId
    ? detail.value
    : null,
)

const latestTrackerTimestamp = computed(() => {
  const candidates = [
    tracker.status.value?.timestamp,
    ...tracker.lines.value.map((line) => line.timestamp),
    ...Array.from(top100Details.value.values()).map((line) => line.timestamp),
  ].filter((timestamp): timestamp is number => typeof timestamp === "number")
  return candidates.length > 0 ? Math.max(...candidates) : null
})

const replayBounds = computed(() => {
  const now = currentUnixSecond.value
  const latest = latestTrackerTimestamp.value ?? now
  const start = selectedActivityStartAt.value ?? Math.max(0, latest - DEFAULT_REPLAY_WINDOW_SECONDS)
  const expectedEnd = selectedActivityEndAt.value ?? now
  const end = Math.max(start + 1, Math.min(now, Math.max(expectedEnd, latest)))
  return { start, end }
})

const activityReplayReady = computed(() =>
  canRefresh.value && replayBounds.value.end - replayBounds.value.start >= 60,
)
const isPlaybackLive = computed(() => playbackAt.value == null)
const playbackDisplayAt = computed(() =>
  clampNumber(playbackDraftAt.value ?? playbackAt.value ?? replayBounds.value.end, replayBounds.value.start, replayBounds.value.end),
)
const playbackStatusLabel = computed(() =>
  isPlaybackLive.value && playbackDraftAt.value == null
    ? t("rankBorder.result.activityReplayLive")
    : t("rankBorder.result.activityReplayAt", { time: formatTimestamp(playbackDisplayAt.value) }),
)
const canUseRealtimeAutoRefresh = computed(() =>
  canRefresh.value && isPlaybackLive.value && userStore.hasActiveSession,
)
const trackerStatusTone = computed(() => {
  if (!isPlaybackLive.value) {
    return "muted"
  }
  if (!userStore.hasActiveSession) {
    return "amber"
  }
  if (realtimeState.value === "ready") {
    return "live"
  }
  if (realtimeState.value === "connecting") {
    return "muted"
  }
  return "amber"
})
const trackerStatusLabel = computed(() => {
  if (!isPlaybackLive.value) {
    return t("rankBorder.status.replaying")
  }
  if (!userStore.hasActiveSession) {
    return t("rankBorder.status.loginRequired")
  }
  if (realtimeState.value === "ready") {
    return t("rankBorder.status.liveWs")
  }
  if (realtimeState.value === "connecting") {
    return t("rankBorder.status.connecting")
  }
  return t("rankBorder.status.waitingWs")
})

const isSelectedWorldBloomEvent = computed(() => selectedEvent.value?.isWorldBloom === true)

const modeOptions = computed(() => {
  const options = [{ value: "normal" as const, label: t("rankBorder.modes.normal") }]
  if (isSelectedWorldBloomEvent.value) {
    options.push({ value: "world_bloom" as const, label: t("rankBorder.modes.worldBloom") })
  }
  return options
})

const intervalOptions = computed(() => [
  { value: "900", label: t("rankBorder.intervals.minutes", { value: 15 }) },
  { value: "3600", label: t("rankBorder.intervals.hours", { value: 1 }) },
  { value: "21600", label: t("rankBorder.intervals.hours", { value: 6 }) },
  { value: "86400", label: t("rankBorder.intervals.hours", { value: 24 }) },
])

const scopedDetailTrace = computed(() =>
  selectedHeatmapWindow.value
    ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
    : detailTrace.value,
)

const chartDetailTrace = computed(() =>
  selectedHeatmapWindow.value
    ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, false)
    : detailTrace.value,
)

const detailTraceScopeLabel = computed(() =>
  selectedHeatmapWindow.value?.label
  ?? intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label
  ?? "-",
)

const activeDetailResult = computed(() => {
  if (!detail.value) {
    return null
  }

  const latestScopedTrace = scopedDetailTrace.value[scopedDetailTrace.value.length - 1] ?? null
  if (!latestScopedTrace) {
    return detail.value.result
  }

  return latestResultFromTrace(detail.value.result, latestScopedTrace)
})

const activeDetailPreviousGap = computed(() =>
  detail.value?.previous && activeDetailResult.value
    ? detailDelta(detail.value.previous, activeDetailResult.value)
    : null,
)

const activeDetailNextGap = computed(() =>
  detail.value?.next && activeDetailResult.value
    ? detailDelta(activeDetailResult.value, detail.value.next)
    : null,
)

const detailTraceStats = computed(() => {
  const records = scopedDetailTrace.value
  const latestTrace = records[records.length - 1] ?? null
  const startTime = (latestTrace?.timestamp ?? currentUnixSecond.value) - selectedIntervalSeconds.value
  const growth = resolveRankBorderTraceGrowth(records, startTime)
  const earlier = growth?.timestampEarlier != null
    ? records.find((record) => record.timestamp === growth.timestampEarlier) ?? null
    : null
  const latest = growth?.timestampLatest != null
    ? findLatestTraceAtTimestamp(records, growth.timestampLatest)
    : null
  const latestInterval = resolveLatestTraceDelta(records)
  const recentAverage = resolveRecentAverageDelta(records, DETAIL_RECENT_POINT_COUNT)
  const threeWindowGrowth = resolveTraceGrowthForWindow(records, DETAIL_CSB_WINDOW_SECONDS)
  const roundWindowStart = selectedHeatmapWindow.value?.start ?? startTime
  const roundWindowEnd = selectedHeatmapWindow.value?.end ?? latestTrace?.timestamp ?? currentUnixSecond.value
  const roundRate = selectedHeatmapWindow.value
    ? resolveHeatmapRoundCount(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end)
    : resolveTraceRoundRate(detailTrace.value, roundWindowStart, roundWindowEnd)
  const hourlySpeed = growth?.growth != null && growth.timeDiff
    ? Math.round((growth.growth / growth.timeDiff) * 3600)
    : null
  const rankShift = earlier && latest ? earlier.rank - latest.rank : null
  return {
    records,
    growth,
    hourlySpeed,
    rankShift,
    latestPointGrowth: latestInterval?.growth ?? null,
    latestPointSeconds: latestInterval?.timeDiff ?? null,
    recentAveragePt: recentAverage,
    threeWindowGrowth: threeWindowGrowth?.growth ?? null,
    threeWindowSpeed: threeWindowGrowth?.growth != null && threeWindowGrowth.timeDiff
      ? Math.round((threeWindowGrowth.growth / threeWindowGrowth.timeDiff) * 3600)
      : null,
    loopCount: roundRate,
    previousGap: activeDetailPreviousGap.value,
    nextGap: activeDetailNextGap.value,
    hasChart: records.length >= 2,
  }
})

const detailHeatmapDays = computed<RankBorderHeatmapDay[]>(() => {
  const records = detailTrace.value
  if (records.length < 2) {
    return []
  }

  const hourSeconds = 60 * 60
  const eventStart = selectedEvent.value?.startAt ?? records[0]?.timestamp
  const latest = records[records.length - 1]
  if (!eventStart || latest.timestamp < eventStart) {
    return []
  }

  const startDay = startOfLocalDay(eventStart)
  const latestHour = Math.floor(latest.timestamp / hourSeconds) * hourSeconds
  const latestDay = startOfLocalDay(latest.timestamp)
  const dayStarts = heatmapDayStarts(startDay, latestDay)
  const buckets = new Map<number, { value: number; sampleCount: number; roundCount: number }>()

  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1]
    const record = records[index]
    if (record.timestamp < eventStart || previous.timestamp > latest.timestamp) {
      continue
    }

    const bucketTimestamp = Math.max(previous.timestamp, eventStart)
    const bucketStart = Math.floor(bucketTimestamp / hourSeconds) * hourSeconds
    const bucket = buckets.get(bucketStart) ?? { value: 0, sampleCount: 0, roundCount: 0 }
    const delta = Math.max(0, record.score - previous.score)
    bucket.value += delta
    bucket.sampleCount += 1
    if (delta > 0) {
      bucket.roundCount += 1
    }
    buckets.set(bucketStart, bucket)
  }

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
          hourLabel: String(hourIndex + 1),
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
          displayLabel: status === "active" ? formatHeatmapRoundCount(roundCount) : "",
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
      ? detailTrace.value
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
  return {
    rankReferenceLines: chartReferenceLines(chartRecords, "rank", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, false, DETAIL_CHART_Y_BOTTOM_PADDING),
    scoreReferenceLines: chartReferenceLines(chartRecords, "score", DETAIL_CHART_HEIGHT, DETAIL_CHART_Y_PADDING, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING),
    rankPoints: chartPoints(chartRecords, "rank", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING),
    scorePoints: chartPoints(chartRecords, "score", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING),
    timeTicks: chartTimeTicks(timeDomain, DETAIL_CHART_WIDTH, DETAIL_CHART_X_PADDING),
    rankPath: sparklinePath(chartRecords, "rank", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, false, DETAIL_CHART_Y_BOTTOM_PADDING),
    scorePath: sparklinePath(chartRecords, "score", DETAIL_CHART_WIDTH, DETAIL_CHART_HEIGHT, DETAIL_CHART_MAX_POINTS, DETAIL_CHART_X_PADDING, DETAIL_CHART_Y_PADDING, timeDomain, scoreZeroBaseline, DETAIL_CHART_Y_BOTTOM_PADDING),
  }
})

const hasProfileAssetPayload = computed(() => {
  if (!shouldRenderProfileAssets.value) {
    return false
  }

  const values = [
    ...Array.from(top100Details.value.values()),
    detail.value?.result ?? null,
  ].filter(isLatestResult)
  return values.some((item) => item.cardId != null || item.profileHonors.length > 0)
})

let liveRefreshTimer: ReturnType<typeof setTimeout> | null = null
let realtimeSubscription: RankBorderRealtimeSubscription | null = null
let realtimeSubscriptionKey = ""
let realtimeSubscriptionToken = 0
let numberFlashTimer: ReturnType<typeof setTimeout> | null = null
let pendingRefresh = false
let top100DetailRefreshToken = 0
let top100TraceWarmupToken = 0
let top100TraceWarmupTimer: ReturnType<typeof setTimeout> | null = null
let detailRequestToken = 0
let activeDetailTraceKey = ""
let visibleRankFrame: number | null = null
const clockTimer = setInterval(() => {
  currentUnixSecond.value = Math.floor(Date.now() / 1000)
}, 1000)

watch(
  () => masterOptions.eventOptions.value,
  (options) => {
    if (options.length === 0) {
      selectedEventId.value = null
      return
    }

    if (!selectedEventId.value || !options.some((option) => option.value === selectedEventId.value)) {
      selectedEventId.value = resolveDefaultEventId(options)
    }
  },
  { immediate: true },
)

watch(
  () => masterOptions.worldBloomCharacterOptions.value,
  (options) => {
    if (mode.value !== "world_bloom") {
      return
    }

    if (options.length === 0) {
      selectedWorldBloomCharacterId.value = null
      return
    }

    if (!selectedWorldBloomCharacterId.value || !options.some((option) => option.value === selectedWorldBloomCharacterId.value)) {
      selectedWorldBloomCharacterId.value = resolveDefaultWorldBloomCharacterId(options)
    }
  },
  { immediate: true },
)

watch(mode, () => {
  if (mode.value === "world_bloom" && !selectedWorldBloomCharacterId.value) {
    selectedWorldBloomCharacterId.value = resolveDefaultWorldBloomCharacterId(masterOptions.worldBloomCharacterOptions.value)
  }
})

watch(isSelectedWorldBloomEvent, (isWorldBloom) => {
  if (!isWorldBloom && mode.value === "world_bloom") {
    mode.value = "normal"
    selectedWorldBloomCharacterId.value = null
  }
})

watch(
  [
    trackerEndpoint,
    selectedRegion,
    selectedEventId,
    mode,
    selectedWorldBloomCharacterId,
    intervalSeconds,
    selectedAccountKey,
    hideProfileAssets,
  ],
  persistState,
)

watch(
  accountOptions,
  (options) => {
    if (options.length === 0) {
      selectedAccountKey.value = ""
      return
    }

    if (!selectedAccount.value) {
      const sameRegionAccount = options.find((account) => account.server === selectedRegion.value)
      selectedAccountKey.value = (sameRegionAccount ?? options[0]).key
    }
  },
  { immediate: true },
)

watch(
  [
    trackerEndpoint,
    selectedRegion,
    selectedEventId,
    mode,
    selectedWorldBloomCharacterId,
    playbackAt,
    () => userStore.isLoggedIn,
  ],
  () => {
    resetRankBorderData()
    resetLiveRefreshTimer()
    void refreshData(true)
  },
  { immediate: true },
)

watch(intervalSeconds, () => {
  refreshTop100GrowthsFromCachedTraces(top100GrowthByRank.value)
  scheduleTop100TraceWarmup(top100GrowthByRank.value, true)
  void refreshData(true)
})

watch([selectedRegion, selectedEventId, mode, selectedWorldBloomCharacterId], () => {
  playbackAt.value = null
  playbackDraftAt.value = null
})

watch(replayBounds, (bounds) => {
  if (playbackAt.value != null) {
    playbackAt.value = clampNumber(playbackAt.value, bounds.start, bounds.end)
  }
  if (playbackDraftAt.value != null) {
    playbackDraftAt.value = clampNumber(playbackDraftAt.value, bounds.start, bounds.end)
  }
})

watch(hasProfileAssetPayload, (shouldLoad) => {
  if (!shouldLoad || profileAssetsLoading.value) {
    return
  }

  preloadProfileAssets()
})

function preloadProfileAssets() {
  if (profileAssetsLoading.value) {
    return
  }

  if (cardById.value.size > 0 && honorById.value.size > 0 && honorGroupById.value.size > 0) {
    return
  }

  profileAssetsLoading.value = true
  void masterOptions.loadProfileAssets(false).finally(() => {
    profileAssetsLoading.value = false
  })
}

onBeforeUnmount(() => {
  stopLiveRefreshTimer()
  stopRealtimeSubscription()
  clearTop100TraceWarmupTimer()
  stopVisibleRankListener()
  stopMobileViewportListener()
  clearInterval(clockTimer)
  clearNumberFlashTimer()
})

onMounted(() => {
  startVisibleRankListener()
  startMobileViewportListener()
})

function updateRegion(value: AcceptableValue) {
  if (typeof value === "string" && isSekaiRegionValue(value)) {
    switchRegion(value)
  }
}

function updateMode(value: AcceptableValue) {
  if (value === "normal" || value === "world_bloom") {
    mode.value = value
  }
}

function updateInterval(value: AcceptableValue) {
  if (typeof value === "string" && normalizePositiveInteger(value, 0) > 0) {
    intervalSeconds.value = value
  }
}

function updateEvent(value: string | null) {
  if (selectedEventId.value !== value) {
    selectedWorldBloomCharacterId.value = null
  }
  selectedEventId.value = value
}

function updateWorldBloomCharacter(value: AcceptableValue) {
  selectedWorldBloomCharacterId.value = typeof value === "string" ? value : null
}

function updateAccount(value: AcceptableValue) {
  selectedAccountKey.value = typeof value === "string" ? value : ""
  const account = selectedAccount.value
  if (!account) {
    return
  }

  switchRegion(account.server)
}

function updatePlaybackDraft(value: Event) {
  if (!(value.target instanceof HTMLInputElement)) {
    return
  }

  playbackDraftAt.value = clampNumber(Number(value.target.value), replayBounds.value.start, replayBounds.value.end)
}

function commitPlaybackDraft(value?: Event) {
  if (value?.target instanceof HTMLInputElement) {
    playbackDraftAt.value = clampNumber(Number(value.target.value), replayBounds.value.start, replayBounds.value.end)
  }

  playbackAt.value = clampNumber(playbackDraftAt.value ?? replayBounds.value.end, replayBounds.value.start, replayBounds.value.end)
  playbackDraftAt.value = null
}

function resetPlaybackLive() {
  playbackAt.value = null
  playbackDraftAt.value = null
}

function switchRegion(region: SekaiRegion) {
  if (region === selectedRegion.value) {
    return
  }

  selectedRegion.value = region
  selectedEventId.value = null
  selectedWorldBloomCharacterId.value = null
  mode.value = "normal"
}

function createTop100Row(rank: number, rowDetail: RankBorderLatest | null): RankBorderLineRow {
  const localGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
    ? top100GrowthByRank.value.get(rank)
    : null
  const growth = localGrowth ?? selectedTrackerGrowthByRank.value.get(rank) ?? null
  const rowKey = top100RowKey(rank, rowDetail)
  return {
    key: rowKey,
    rank,
    score: rowDetail?.score ?? null,
    timestamp: rowDetail?.timestamp ?? null,
    growth,
    displayGrowth: growth?.growth ?? null,
    detail: rowDetail,
    selected: detail.value?.result.rank === rank,
    scoreChanged: scoreChangedRanks.value.has(rank),
    growthChanged: growthChangedRanks.value.has(rank),
    displayGrowthChanged: growthChangedRanks.value.has(rank),
    detailChanged: detailChangedRanks.value.has(rank),
    top100: rank <= PERSONAL_COLLECTION_LIMIT,
  }
}

function top100RowKey(rank: number, rowDetail: RankBorderLatest | null) {
  const userId = normalizeTextValue(rowDetail?.userId)
  if (userId) {
    return `user:${userId}`
  }

  const name = normalizeTextValue(rowDetail?.name)
  if (name) {
    return `name:${name}`
  }

  return `rank:${rank}`
}

function resetRankBorderData() {
  detailRequestToken += 1
  activeDetailTraceKey = ""
  detail.value = null
  detailTrace.value = []
  selectedHeatmapWindow.value = null
  detailLoading.value = false
  detailError.value = null
  mobileExpandedDetail.value = null
  mobileLocateOpen.value = false
  top100Details.value = new Map()
  top100GrowthByRank.value = new Map()
  top100GrowthIntervalSeconds.value = null
  top100TraceByRank.value = new Map()
  segmentTraceByRank.value = new Map()
  publicProfileByUserId.value = new Map()
  tracker.lines.value = []
  tracker.growths.value = []
  tracker.growthIntervalSeconds.value = null
  profileAssetsLoading.value = false
}

function realtimeKey() {
  return [
    normalizeTrackerEndpoint(trackerEndpoint.value),
    selectedRegion.value,
    selectedEventIdNumber.value,
    mode.value,
    selectedWorldBloomCharacterIdNumber.value || "",
  ].join(":")
}

async function refreshData(cacheBust = true) {
  if (!canRefresh.value) {
    return
  }

  if (liveRefreshing.value) {
    pendingRefresh = true
    return
  }

  stopLiveRefreshTimer()
  liveRefreshing.value = true
  try {
    const previousDetails = top100Details.value
    const previousTop100Growths = top100GrowthByRank.value
    const previousLines = new Map(tracker.lines.value.map((line) => [line.rank, line]))
    const previousGrowths = new Map(tracker.growths.value.map((growth) => [growth.rank, growth.growth]))
    const previousTrackerTimestamp = latestTrackerTimestamp.value
    const requestedIntervalSeconds = selectedIntervalSeconds.value
    hydrateTop100DetailsFromCache()
    const initialDetailsRefresh = top100Details.value.size === 0
      ? refreshTop100Details(previousDetails).catch(() => undefined)
      : null
    const trackerRefresh = tracker.refresh({
      endpoint: trackerEndpoint.value,
      region: selectedRegion.value,
      eventId: selectedEventIdNumber.value,
      mode: mode.value,
      worldBloomCharacterId: selectedWorldBloomCharacterIdNumber.value || null,
      intervalSeconds: requestedIntervalSeconds,
      userId: null,
      rank: null,
      cacheBust,
      playbackAt: playbackAt.value,
      useWebSocket: canUseRealtimeAutoRefresh.value,
    })
    await trackerRefresh
    if (tracker.error.value) {
      await initialDetailsRefresh
      return
    }

    markChangedLines(previousLines)
    markChangedGrowths(previousGrowths)
    if (initialDetailsRefresh) {
      await initialDetailsRefresh
    } else if (latestTrackerTimestamp.value !== previousTrackerTimestamp) {
      const detailsRefresh = refreshTop100Details(previousDetails)
      void detailsRefresh
    }
    refreshTop100GrowthsFromCachedTraces(previousTop100Growths)
    scheduleTop100TraceWarmup(previousTop100Growths)
    await refreshSegmentTraces()
    await refreshActiveDetail()
  } finally {
    liveRefreshing.value = false
    if (pendingRefresh) {
      pendingRefresh = false
      void refreshData(true)
      return
    }
    resetLiveRefreshTimer()
  }
}

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

async function jumpToRank(rank: number) {
  if (!rank) {
    return
  }

  visibleRank.value = rank
  if (isMobileViewport.value && rank <= PERSONAL_COLLECTION_LIMIT) {
    await openMobileRankDetail(rank)
  } else if (isMobileViewport.value) {
    openMobileLineDetail(rank)
  } else if (rank <= PERSONAL_COLLECTION_LIMIT) {
    await openRankDetail(rank)
  } else {
    openLineDetail(rank)
  }

  await nextTick()
  const selector = `[data-rank-border-row="${rank}"]`
  document.querySelector<HTMLElement>(selector)?.scrollIntoView({
    behavior: "smooth",
    block: "center",
  })
}

function startVisibleRankListener() {
  updateVisibleRankFromViewport()
  window.addEventListener("scroll", scheduleVisibleRankUpdate, { passive: true })
  window.addEventListener("resize", scheduleVisibleRankUpdate, { passive: true })
}

function stopVisibleRankListener() {
  window.removeEventListener("scroll", scheduleVisibleRankUpdate)
  window.removeEventListener("resize", scheduleVisibleRankUpdate)
  if (visibleRankFrame != null) {
    cancelAnimationFrame(visibleRankFrame)
    visibleRankFrame = null
  }
}

function resolveIsMobileViewport() {
  return typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
}

function updateMobileViewport() {
  isMobileViewport.value = resolveIsMobileViewport()
}

function startMobileViewportListener() {
  updateMobileViewport()
  window.addEventListener("resize", updateMobileViewport, { passive: true })
}

function stopMobileViewportListener() {
  window.removeEventListener("resize", updateMobileViewport)
}

function scheduleVisibleRankUpdate() {
  if (visibleRankFrame != null) {
    return
  }

  visibleRankFrame = requestAnimationFrame(() => {
    visibleRankFrame = null
    updateVisibleRankFromViewport()
  })
}

function updateVisibleRankFromViewport() {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-rank-border-row]"))
  if (rows.length === 0) {
    visibleRank.value = null
    return
  }

  const scrollElement = document.scrollingElement ?? document.documentElement
  const scrollTop = scrollElement.scrollTop
  const scrollBottom = scrollTop + window.innerHeight
  if (scrollTop <= 4) {
    const firstRank = Number(rows[0]?.dataset.rankBorderRow)
    if (Number.isFinite(firstRank)) {
      visibleRank.value = firstRank
    }
    return
  }
  if (scrollBottom >= scrollElement.scrollHeight - 8) {
    const lastRank = Number(rows[rows.length - 1]?.dataset.rankBorderRow)
    if (Number.isFinite(lastRank)) {
      visibleRank.value = lastRank
    }
    return
  }

  const jumpRail = document.querySelector<HTMLElement>(".rank-border-jump-rail")
  const contentTop = Math.max(0, jumpRail?.getBoundingClientRect().bottom ?? 0)
  const viewportCenter = contentTop + (window.innerHeight - contentTop) / 2
  let nearestRank: number | null = null
  let nearestDistance = Number.POSITIVE_INFINITY
  let lastVisibleRank: number | null = null
  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    if (rect.bottom < contentTop || rect.top > window.innerHeight) {
      continue
    }

    const rank = Number(row.dataset.rankBorderRow)
    if (!Number.isFinite(rank)) {
      continue
    }

    lastVisibleRank = rank
    const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestRank = rank
    }
  }

  const nextRank = nearestRank ?? lastVisibleRank
  if (nextRank != null) {
    visibleRank.value = nextRank
  }
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
      result: cachedDetail,
      previous: rank > 1 ? top100Details.value.get(rank - 1) ?? null : null,
      next: top100Details.value.get(rank + 1) ?? null,
    }
    detail.value = nextDetail
    detailError.value = null
    detailLoading.value = false
    refreshDetailTrace(nextDetail)
    markDetailScoreChange(previousScore, cachedDetail.score)
    void loadRankDetail(rank, true, requestToken)
    return
  }

  await loadRankDetail(rank, false, requestToken)
}

async function loadRankDetail(rank: number, silent: boolean, requestToken = detailRequestToken) {
  if (!rank || !canRefresh.value) {
    return
  }

  const previousScore = detail.value?.result.score ?? null
  if (!silent) {
    detailLoading.value = true
  }
  detailError.value = null
  try {
    const [result, previous, next] = await Promise.all([
      fetchLatestPublicRank(rank),
      rank > 1 ? fetchLatestPublicRank(rank - 1).catch(() => null) : Promise.resolve(null),
      fetchLatestPublicRank(rank + 1).catch(() => null),
    ])
    if (requestToken !== detailRequestToken) {
      return
    }
    if (!result) {
      throw new Error(t("rankBorder.result.rankNotFound"))
    }

    detail.value = {
      source: "rank",
      query: String(rank),
      result,
      previous,
      next,
    }
    refreshDetailTrace(detail.value)
    markDetailScoreChange(previousScore, result.score)
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
    const result = options.privateLookup
      ? await fetchPrivateLatestByUser(userId)
      : await fetchRankBorderLatestByUser({
          ...detailScope.value,
          userId,
        })
    if (!result) {
      throw new Error(t("rankBorder.result.accountOutOfRange"))
    }
    if (!options.privateLookup && shouldRejectMismatchedAccountLookup(userId, result)) {
      throw new Error(t("rankBorder.result.accountOutOfRange"))
    }

    const [previous, next] = await Promise.all([
      result.rank > 1 ? fetchLatestPublicRank(result.rank - 1).catch(() => null) : Promise.resolve(null),
      fetchLatestPublicRank(result.rank + 1).catch(() => null),
    ])
    if (requestToken !== detailRequestToken) {
      return
    }
    detail.value = {
      source: "user",
      query: userId,
      result,
      previous,
      next,
    }
    refreshDetailTrace(detail.value)
    markDetailScoreChange(previousScore, result.score)
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

async function fetchPrivateLatestByUser(userId: string) {
  if (!userStore.isLoggedIn) {
    throw new Error(t("rankBorder.result.privateLookupLoginRequired"))
  }

  return await fetchRankBorderPrivateLatestByUser({
    ...detailScope.value,
    userId,
    ownerId: userStore.kratosIdentityId,
  })
}

async function fetchLatestPublicRank(rank: number): Promise<RankBorderLatest | null> {
  const cached = top100Details.value.get(rank)
  if (cached && (!cached.userId || publicProfileByUserId.value.has(cached.userId) || hasProfileFields(cached))) {
    return cached
  }

  const latest = cached ?? latestByTimestamp((await fetchRankBorderWebRankings({
    ...detailScope.value,
    rankMin: rank,
    rankMax: rank,
    limit: 1,
  })).items)
  if (!latest) {
    return null
  }

  const profile = latest.userId ? await fetchPublicProfile(latest.userId).catch(() => null) : null
  return mergeLatestWithProfile(latest, profile)
}

async function fetchFallbackLineDetail(rank: number): Promise<LineDetailState | null> {
  const latest = await fetchRankBorderLatestByRank({
    ...detailScope.value,
    rank,
  }).catch(() => null)
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

function mergeLatestWithProfile(latest: RankBorderLatest, profile: RankBorderUserProfile | null): RankBorderLatest {
  if (!profile) {
    return latest
  }

  return {
    ...latest,
    userId: latest.userId ?? profile.userId,
    name: profile.name ?? latest.name,
    cheerfulTeamId: profile.cheerfulTeamId ?? latest.cheerfulTeamId,
    cardId: profile.cardId ?? latest.cardId,
    cardLevel: profile.cardLevel ?? latest.cardLevel,
    cardMasterRank: profile.cardMasterRank ?? latest.cardMasterRank,
    cardSpecialTrainingStatus: profile.cardSpecialTrainingStatus ?? latest.cardSpecialTrainingStatus,
    cardDefaultImage: profile.cardDefaultImage ?? latest.cardDefaultImage,
    profileWord: profile.profileWord ?? latest.profileWord,
    profileHonors: profile.profileHonors.length > 0 ? profile.profileHonors : latest.profileHonors,
    userPlayerFrames: profile.userPlayerFrames.length > 0 ? profile.userPlayerFrames : latest.userPlayerFrames,
  }
}

function mergeProfileFromLatest(
  previous: RankBorderUserProfile | null,
  latest: RankBorderLatest,
): RankBorderUserProfile {
  return {
    userId: latest.userId ?? previous?.userId ?? "",
    name: latest.name ?? previous?.name ?? null,
    cheerfulTeamId: latest.cheerfulTeamId ?? previous?.cheerfulTeamId ?? null,
    cardId: latest.cardId ?? previous?.cardId ?? null,
    cardLevel: latest.cardLevel ?? previous?.cardLevel ?? null,
    cardMasterRank: latest.cardMasterRank ?? previous?.cardMasterRank ?? null,
    cardSpecialTrainingStatus: latest.cardSpecialTrainingStatus ?? previous?.cardSpecialTrainingStatus ?? null,
    cardDefaultImage: latest.cardDefaultImage ?? previous?.cardDefaultImage ?? null,
    profileWord: latest.profileWord ?? previous?.profileWord ?? null,
    profileHonors: latest.profileHonors.length > 0 ? latest.profileHonors : previous?.profileHonors ?? [],
    userPlayerFrames: latest.userPlayerFrames.length > 0 ? latest.userPlayerFrames : previous?.userPlayerFrames ?? [],
  }
}

function hasProfileFields(latest: RankBorderLatest) {
  return latest.name != null
    || latest.cardId != null
    || latest.profileWord != null
    || latest.profileHonors.length > 0
    || latest.userPlayerFrames.length > 0
}

function isProfileChanged(previous: RankBorderUserProfile, next: RankBorderUserProfile) {
  return previous.name !== next.name
    || previous.cheerfulTeamId !== next.cheerfulTeamId
    || previous.cardId !== next.cardId
    || previous.cardLevel !== next.cardLevel
    || previous.cardMasterRank !== next.cardMasterRank
    || previous.cardSpecialTrainingStatus !== next.cardSpecialTrainingStatus
    || previous.cardDefaultImage !== next.cardDefaultImage
    || previous.profileWord !== next.profileWord
    || profileHonorSignature(previous) !== profileHonorSignature(next)
    || playerFrameSignature(previous) !== playerFrameSignature(next)
}

function latestByTimestamp(items: RankBorderLatest[]) {
  return items.reduce<RankBorderLatest | null>((latest, item) => {
    if (!latest) {
      return item
    }

    return (item.timestamp ?? 0) > (latest.timestamp ?? 0) ? item : latest
  }, null)
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

  await loadRankDetail(parseRankBorderRankQuery(activeDetail.query) ?? 0, true)
}

function refreshDetailTrace(value: DetailState) {
  const nextDetailTraceKey = detailTraceKey(value)
  if (nextDetailTraceKey !== activeDetailTraceKey) {
    activeDetailTraceKey = nextDetailTraceKey
    selectedHeatmapWindow.value = null
  }

  const cachedTrace = readCachedTrace(value)
  if (cachedTrace.length > 0) {
    detailTrace.value = cachedTrace
  } else if (detailTrace.value.length === 0) {
    detailTrace.value = []
  }

  void loadDetailTrace(value)
}

function readCachedTrace(value: DetailState) {
  if (value.source === "line") {
    return segmentTraceByRank.value.get(value.result.rank) ?? []
  }
  if (value.source === "user") {
    return []
  }

  return top100TraceByRank.value.get(value.result.rank) ?? []
}

function detailTraceKey(value: DetailState) {
  return `${value.source}:${value.query}:${value.result.rank}`
}

async function loadDetailTrace(value: DetailState) {
  if (!canRefresh.value) {
    return
  }

  const shouldShowLoading = detailTrace.value.length === 0
  if (shouldShowLoading) {
    detailTraceLoading.value = true
  }
  try {
    const records = await fetchDetailTrace(value)
    if (detail.value?.query === value.query && detail.value.source === value.source) {
      detailTrace.value = records
      if (value.source !== "user") {
        cacheTrace(value.result.rank, records)
      }
    }
  } finally {
    if (shouldShowLoading) {
      detailTraceLoading.value = false
    }
  }
}

async function fetchDetailTrace(value: DetailState): Promise<RankBorderTracePoint[]> {
  if (value.source === "user") {
    return await fetchRankBorderPrivateTraceByUser({
      ...detailScope.value,
      userId: value.query,
      ownerId: userStore.kratosIdentityId,
      full: true,
    }).catch(() => [])
  }

  if (value.source === "rank" && value.result.userId) {
    const webRecords = await fetchRankBorderWebTraceByUser({
      ...detailScope.value,
      userId: value.result.userId,
      full: true,
    }).catch(() => [])
    const directRecords = await fetchRankBorderTraceByUser({
      ...detailScope.value,
      userId: value.result.userId,
      full: true,
    }).catch(() => [])
    const rankRecords = await fetchFullRankTrace(value.result.rank).catch(() => [])
    return longestTrace([webRecords, directRecords, rankRecords])
  }

  return await fetchFullRankTrace(value.result.rank).catch(() => [])
}

function cacheTrace(rank: number, records: RankBorderTracePoint[]) {
  if (rank <= PERSONAL_COLLECTION_LIMIT) {
    const next = new Map(top100TraceByRank.value)
    next.set(rank, records)
    top100TraceByRank.value = next
    return
  }

  const next = new Map(segmentTraceByRank.value)
  next.set(rank, records)
  segmentTraceByRank.value = next
}

function longestTrace(items: RankBorderTracePoint[][]) {
  return items.reduce<RankBorderTracePoint[]>((best, current) =>
    current.length > best.length ? current : best,
  [])
}

function latestResultFromTrace(base: RankBorderLatest | RankBorderLine, trace: RankBorderTracePoint) {
  return {
    ...base,
    rank: trace.rank,
    score: trace.score,
    timestamp: trace.timestamp,
    userId: "userId" in base ? trace.userId ?? base.userId : trace.userId,
    characterId: "characterId" in base ? trace.characterId ?? base.characterId : trace.characterId,
  } satisfies RankBorderLatest | RankBorderLine
}

async function refreshTop100Details(previousDetails: Map<number, RankBorderLatest>) {
  if (top100DetailRefreshing.value) {
    return
  }

  top100DetailRefreshing.value = true
  const token = ++top100DetailRefreshToken
  const ranks = TOP_100_RANKS
  if (ranks.length === 0) {
    top100Details.value = new Map()
    detailChangedRanks.value = new Set()
    top100DetailRefreshing.value = false
    return
  }

  try {
    const rankings = await fetchRankBorderWebRankings({
      ...detailScope.value,
      rankMin: 1,
      rankMax: PERSONAL_COLLECTION_LIMIT,
      limit: PERSONAL_COLLECTION_LIMIT,
    })
    const latestEntries = latestRankingEntriesByRank(rankings.items)
    if (latestEntries.length === 0 && previousDetails.size > 0) {
      return
    }
    const nextProfiles = seedProfilesFromLatestEntries(latestEntries)
    const missingProfileIds = Array.from(new Set(
      latestEntries
        .filter((item) => item.userId && !nextProfiles.has(item.userId) && !hasProfileFields(item))
        .map((item) => item.userId)
        .filter((userId): userId is string => !!userId),
    ))
    const profileScope = { ...detailScope.value }
    if (token !== top100DetailRefreshToken) {
      return
    }

    const nextDetails = new Map<number, RankBorderLatest>()
    const previousDetailsByKey = latestDetailsByRowKey(previousDetails)
    const nextDetailChanges = new Set<number>()
    const nextScoreChanges = new Set<number>()

    for (const latest of latestEntries) {
      const profile = latest.userId ? nextProfiles.get(latest.userId) ?? null : null
      const nextDetail = mergeLatestWithProfile(latest, profile)
      const rowKey = top100RowKey(nextDetail.rank, nextDetail)
      const previousDetail = previousDetailsByKey.get(rowKey)
      nextDetails.set(nextDetail.rank, nextDetail)

      if (!previousDetail || isLineDetailChanged(previousDetail, nextDetail)) {
        nextDetailChanges.add(nextDetail.rank)
        if (!previousDetail || previousDetail.score !== nextDetail.score) {
          nextScoreChanges.add(nextDetail.rank)
        }
      }
    }

    top100Details.value = nextDetails
    writeTop100DetailsCache(nextDetails)
    if (nextScoreChanges.size > 0) {
      restartRankFlash(scoreChangedRanks, nextScoreChanges)
    }
    if (nextDetailChanges.size > 0) {
      restartRankFlash(detailChangedRanks, nextDetailChanges)
    }
    if (missingProfileIds.length > 0) {
      const priorityIds = missingProfileIds.slice(0, PROFILE_ENRICH_PRIORITY_LIMIT)
      const deferredIds = missingProfileIds.slice(PROFILE_ENRICH_PRIORITY_LIMIT)
      if (priorityIds.length > 0) {
        void enrichTop100Profiles(priorityIds, profileScope)
      }
      if (deferredIds.length > 0) {
        window.setTimeout(() => {
          void enrichTop100Profiles(deferredIds, profileScope)
        }, DEFERRED_PROFILE_ENRICH_DELAY_MS)
      }
    }
  } finally {
    if (token === top100DetailRefreshToken) {
      top100DetailRefreshing.value = false
    }
  }
}

async function enrichTop100Profiles(userIds: string[], scope: RankBorderTrackerScope) {
  const profiles = await mapWithConcurrency(userIds, TOP_100_DETAIL_CONCURRENCY, async (userId) =>
    [
      userId,
      await fetchRankBorderPublicUserProfile({
        ...scope,
        uniqueId: userId,
        limit: 1,
      }).catch(() => null),
    ] as const,
  )
  if (!isSameTrackerScope(scope, detailScope.value)) {
    return
  }

  const nextProfiles = new Map(publicProfileByUserId.value)
  for (const [userId, profile] of profiles) {
    if (profile) {
      nextProfiles.set(userId, profile)
    }
  }
  publicProfileByUserId.value = nextProfiles

  const nextDetails = new Map(top100Details.value)
  const nextDetailChanges = new Set<number>()
  for (const [rank, latest] of top100Details.value) {
    const profile = latest.userId ? nextProfiles.get(latest.userId) ?? null : null
    if (!profile) {
      continue
    }

    const merged = mergeLatestWithProfile(latest, profile)
    if (isLineDetailChanged(latest, merged)) {
      nextDetails.set(rank, merged)
      nextDetailChanges.add(rank)
    }
  }
  top100Details.value = nextDetails
  writeTop100DetailsCache(nextDetails)
  if (nextDetailChanges.size > 0) {
    restartRankFlash(detailChangedRanks, nextDetailChanges)
  }
}

function seedProfilesFromLatestEntries(items: RankBorderLatest[]) {
  const nextProfiles = new Map(publicProfileByUserId.value)
  let changed = false
  for (const item of items) {
    if (!item.userId || !hasProfileFields(item)) {
      continue
    }

    const previous = nextProfiles.get(item.userId) ?? null
    const profile = mergeProfileFromLatest(previous, item)
    if (!previous || isProfileChanged(previous, profile)) {
      nextProfiles.set(item.userId, profile)
      changed = true
    }
  }

  if (changed) {
    publicProfileByUserId.value = nextProfiles
  }
  return nextProfiles
}

function latestRankingEntriesByRank(items: RankBorderLatest[]) {
  const byRank = new Map<number, RankBorderLatest>()
  for (const item of items) {
    const previous = byRank.get(item.rank)
    if (!previous || (item.timestamp ?? 0) > (previous.timestamp ?? 0)) {
      byRank.set(item.rank, item)
    }
  }

  return Array.from(byRank.values()).sort((a, b) => a.rank - b.rank)
}

function latestDetailsByRowKey(details: Map<number, RankBorderLatest>) {
  const byKey = new Map<string, RankBorderLatest>()
  for (const [rank, latest] of details) {
    byKey.set(top100RowKey(rank, latest), latest)
  }
  return byKey
}

function top100DetailsCacheKey() {
  return [
    TOP_100_DETAIL_CACHE_PREFIX,
    normalizeTrackerEndpoint(trackerEndpoint.value),
    selectedRegion.value,
    selectedEventIdNumber.value,
    mode.value,
    selectedWorldBloomCharacterIdNumber.value || "",
    playbackAt.value ?? "live",
  ].join(":")
}

function hydrateTop100DetailsFromCache() {
  if (top100Details.value.size > 0 || !canRefresh.value) {
    return
  }

  try {
    const raw = sessionStorage.getItem(top100DetailsCacheKey())
    if (!raw) {
      return
    }

    const parsed = JSON.parse(raw) as { cachedAt?: unknown; items?: unknown }
    if (typeof parsed.cachedAt !== "number" || Date.now() - parsed.cachedAt > TOP_100_DETAIL_CACHE_TTL_MS) {
      return
    }

    const cachedItems = Array.isArray(parsed.items)
      ? parsed.items.map((item) => ({ rankData: item, userData: item }))
      : []
    const items = normalizeRankBorderWebRankings({ items: cachedItems }).items
    if (items.length === 0) {
      return
    }

    const nextDetails = new Map<number, RankBorderLatest>()
    for (const item of latestRankingEntriesByRank(items)) {
      nextDetails.set(item.rank, item)
    }
    top100Details.value = nextDetails
    seedProfilesFromLatestEntries(items)
  } catch {
  }
}

function writeTop100DetailsCache(details: Map<number, RankBorderLatest>) {
  if (!canRefresh.value || details.size === 0) {
    return
  }

  try {
    sessionStorage.setItem(top100DetailsCacheKey(), JSON.stringify({
      cachedAt: Date.now(),
      items: Array.from(details.values()),
    }))
  } catch {
  }
}

function refreshTop100GrowthsFromCachedTraces(previousGrowths: Map<number, RankBorderGrowth>) {
  const nextGrowths = new Map<number, RankBorderGrowth>()
  const nextGrowthChanges = new Set<number>()

  for (const rank of TOP_100_RANKS) {
    const trackerGrowth = selectedTrackerGrowthByRank.value.get(rank)
    if (trackerGrowth) {
      nextGrowths.set(rank, trackerGrowth)
    }
  }

  for (const rank of TOP_100_RANKS) {
    const records = top100TraceByRank.value.get(rank) ?? []
    const latestRecord = records[records.length - 1] ?? null
    if (!latestRecord) {
      continue
    }

    const startTime = latestRecord.timestamp - selectedIntervalSeconds.value
    const growth = resolveRankBorderTraceGrowth(records, startTime)
    if (!growth) {
      continue
    }

    const previousGrowth = previousGrowths.get(rank)
    nextGrowths.set(rank, growth)
    if (!previousGrowth || isGrowthChanged(previousGrowth, growth)) {
      nextGrowthChanges.add(rank)
    }
  }

  top100GrowthByRank.value = nextGrowths
  top100GrowthIntervalSeconds.value = selectedIntervalSeconds.value
  if (nextGrowthChanges.size > 0) {
    restartRankFlash(growthChangedRanks, nextGrowthChanges)
  }
}

function findLatestTraceAtTimestamp(records: RankBorderTracePoint[], timestamp: number) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index]
    if (record.timestamp === timestamp) {
      return record
    }
  }
  return null
}

function scheduleTop100TraceWarmup(previousGrowths: Map<number, RankBorderGrowth>, force = false) {
  clearTop100TraceWarmupTimer()
  top100TraceWarmupTimer = setTimeout(() => {
    top100TraceWarmupTimer = null
    warmTop100Traces(previousGrowths, force)
  }, DEFERRED_TRACE_WARMUP_DELAY_MS)
}

function clearTop100TraceWarmupTimer() {
  if (top100TraceWarmupTimer) {
    clearTimeout(top100TraceWarmupTimer)
    top100TraceWarmupTimer = null
  }
}

function warmTop100Traces(previousGrowths: Map<number, RankBorderGrowth>, force = false) {
  if (!canRefresh.value) {
    return
  }

  if (!force && !shouldWarmTop100Traces()) {
    return
  }

  if (top100TraceWarming.value) {
    if (!force) {
      return
    }

    top100TraceWarming.value = false
    top100TraceWarmupToken += 1
  }

  top100TraceWarming.value = true
  const token = ++top100TraceWarmupToken
  void (async () => {
    try {
      const traces = await fetchRankTraceMapFromWebRankings(
        1,
        PERSONAL_COLLECTION_LIMIT,
        resolveTop100TraceWarmupLimit(),
      ).catch(() => new Map<number, RankBorderTracePoint[]>())
      if (token !== top100TraceWarmupToken || traces.size === 0) {
        return
      }

      const nextTraces = new Map(top100TraceByRank.value)
      for (const [rank, records] of traces) {
        nextTraces.set(rank, records)
      }
      top100TraceByRank.value = nextTraces
      refreshTop100GrowthsFromCachedTraces(previousGrowths)
    } finally {
      if (token === top100TraceWarmupToken) {
        top100TraceWarming.value = false
      }
    }
  })()
}

function shouldWarmTop100Traces() {
  const growthCount = TOP_100_RANKS.reduce(
    (count, rank) => count + (selectedTrackerGrowthByRank.value.has(rank) ? 1 : 0),
    0,
  )
  if (selectedIntervalSeconds.value <= Number(DEFAULT_INTERVAL_SECONDS) && growthCount >= 80) {
    return false
  }

  return growthCount < TOP_100_RANKS.length
    || top100TraceByRank.value.size < Math.min(24, TOP_100_RANKS.length)
}

function resolveTop100TraceWarmupLimit() {
  const intervalSamples = Math.ceil(selectedIntervalSeconds.value / TRACKER_UPDATE_INTERVAL_SECONDS) + 12
  return clampNumber(
    Math.max(TOP_100_TRACE_WARMUP_MIN_LIMIT, intervalSamples),
    TOP_100_TRACE_WARMUP_MIN_LIMIT,
    TOP_100_TRACE_WARMUP_MAX_LIMIT,
  )
}

async function refreshSegmentTraces() {
  const ranks = tracker.lines.value
    .filter((line) => line.rank > PERSONAL_COLLECTION_LIMIT)
    .map((line) => line.rank)
  if (ranks.length === 0) {
    segmentTraceByRank.value = new Map()
    return
  }

  const entries = await mapWithConcurrency(ranks, TOP_100_DETAIL_CONCURRENCY, async (rank) => {
    const records = await fetchRankTraceFromWebRankings(rank, ROW_SPARKLINE_MAX_POINTS).catch(() => [])
    return records.length > 0 ? [rank, records] as const : null
  })
  const nextTraces = new Map<number, RankBorderTracePoint[]>()
  for (const entry of entries) {
    if (entry) {
      nextTraces.set(entry[0], entry[1])
    }
  }
  segmentTraceByRank.value = nextTraces
}

async function fetchRankTraceFromWebRankings(rank: number, limit?: number): Promise<RankBorderTracePoint[]> {
  const records = await fetchRankBorderTraceByRank({
    ...detailScope.value,
    rank,
    limit,
  })
  return typeof limit === "number" ? records.slice(-limit) : records
}

async function fetchFullRankTrace(rank: number): Promise<RankBorderTracePoint[]> {
  const webRecords = await fetchRankBorderWebTraceByRank({
    ...detailScope.value,
    rank,
    full: true,
  }).catch(() => [])
  const directRecords = await fetchRankBorderTraceByRank({
    ...detailScope.value,
    rank,
    full: true,
  }).catch(() => [])

  return longestTrace([webRecords, directRecords])
}

async function fetchRankTraceMapFromWebRankings(rankMin: number, rankMax: number, limit: number) {
  const ranks = Array.from({ length: rankMax - rankMin + 1 }, (_, index) => rankMin + index)
  const batchTraces = await fetchRankBorderBatchTraceByRanks({
    ...detailScope.value,
    ranks,
    limit,
  }).catch(() => new Map<number, RankBorderTracePoint[]>())
  if (batchTraces.size > 0) {
    const limitedTraces = new Map<number, RankBorderTracePoint[]>()
    for (const [rank, records] of batchTraces) {
      limitedTraces.set(rank, records.slice(-limit))
    }
    return limitedTraces
  }

  const rankings = await fetchRankBorderWebRankings({
    ...detailScope.value,
    rankMin,
    rankMax,
    limit,
  })
  const traces = new Map<number, RankBorderTracePoint[]>()
  for (const item of rankings.items) {
    const records = traces.get(item.rank) ?? []
    records.push({
      rank: item.rank,
      score: item.score,
      timestamp: item.timestamp ?? 0,
      userId: item.userId,
      characterId: item.characterId,
    })
    traces.set(item.rank, records)
  }

  for (const [rank, records] of traces) {
    traces.set(
      rank,
      records
        .filter((record) => record.timestamp > 0)
        .sort((a, b) => a.timestamp - b.timestamp),
    )
  }

  return traces
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  })

  await Promise.all(workers)
  return results
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

function resetLiveRefreshTimer() {
  stopLiveRefreshTimer()
  resetRealtimeSubscription()
}

function resetRealtimeSubscription() {
  if (!canRefresh.value || playbackAt.value != null || !canUseRealtimeAutoRefresh.value) {
    stopRealtimeSubscription()
    return
  }

  const key = realtimeKey()
  if (realtimeSubscription && realtimeSubscriptionKey === key) {
    return
  }

  stopRealtimeSubscription()
  realtimeSubscriptionKey = key
  realtimeState.value = "connecting"
  const token = ++realtimeSubscriptionToken
  void subscribeRankBorderRealtime({
    endpoint: trackerEndpoint.value,
    region: selectedRegion.value,
    eventId: selectedEventIdNumber.value,
  }, (event) => handleRealtimeEvent(event, token))
    .then((subscription) => {
      if (token !== realtimeSubscriptionToken || realtimeSubscriptionKey !== key) {
        subscription.unsubscribe()
        return
      }
      realtimeSubscription = subscription
    })
    .catch(() => {
      if (token !== realtimeSubscriptionToken) {
        return
      }
      realtimeState.value = "error"
      realtimeOnline.value = null
      scheduleLocalLiveRefreshFallback()
    })
}

function stopRealtimeSubscription() {
  realtimeSubscriptionToken += 1
  realtimeSubscription?.unsubscribe()
  realtimeSubscription = null
  realtimeSubscriptionKey = ""
  realtimeOnline.value = null
  realtimeState.value = "closed"
}

function handleRealtimeEvent(event: RankBorderRealtimeEvent, token: number) {
  if (token !== realtimeSubscriptionToken) {
    return
  }

  if (event.type === "state") {
    realtimeState.value = event.state
    realtimeOnline.value = event.online ?? realtimeOnline.value
    return
  }

  if (event.server !== selectedRegion.value || event.eventId !== selectedEventIdNumber.value) {
    return
  }

  if (event.type === "online") {
    realtimeOnline.value = event.online
    realtimeState.value = "ready"
    return
  }

  if (event.type === "updated" && playbackAt.value == null && canRefresh.value) {
    void refreshData(true)
  }
}

function scheduleLocalLiveRefreshFallback() {
  stopLiveRefreshTimer()
  if (!canRefresh.value || playbackAt.value != null || !shouldAllowLocalLiveRefreshFallback()) {
    return
  }

  scheduleNextLiveRefresh()
}

function scheduleNextLiveRefresh() {
  stopLiveRefreshTimer()
  if (!canRefresh.value || playbackAt.value != null) {
    return
  }

  liveRefreshTimer = setTimeout(() => {
    if (canRefresh.value && !liveRefreshing.value) {
      void refreshData(true)
    }
  }, resolveNextLiveRefreshDelay())
}

function shouldAllowLocalLiveRefreshFallback() {
  return import.meta.env.DEV
    || import.meta.env.VITE_HARUKI_EVENT_TRACKER_ALLOW_REST_FALLBACK === "true"
    || isLocalMockTrackerEndpoint(trackerEndpoint.value)
}

function stopLiveRefreshTimer() {
  if (liveRefreshTimer) {
    clearTimeout(liveRefreshTimer)
    liveRefreshTimer = null
  }
}

function resolveNextLiveRefreshDelay() {
  const latestTimestamp = latestTrackerTimestamp.value
  if (!latestTimestamp) {
    return MAX_LIVE_REFRESH_MS
  }

  const ageSeconds = Math.max(0, currentUnixSecond.value - latestTimestamp)
  const secondsUntilNextTrackerTick = TRACKER_UPDATE_INTERVAL_SECONDS - (ageSeconds % TRACKER_UPDATE_INTERVAL_SECONDS)
  return Math.min(
    MAX_LIVE_REFRESH_MS,
    Math.max(MIN_LIVE_REFRESH_MS, secondsUntilNextTrackerTick * 1000),
  )
}

function markChangedLines(previousLines: Map<number, RankBorderLine>) {
  const changedRanks = new Set<number>()

  for (const line of tracker.lines.value) {
    const previousLine = previousLines.get(line.rank)
    if (previousLine && previousLine.score !== line.score) {
      changedRanks.add(line.rank)
    }
  }

  if (changedRanks.size > 0) {
    restartRankFlash(scoreChangedRanks, changedRanks)
  }
}

function markChangedGrowths(previousGrowths: Map<number, number | null>) {
  const nextGrowthChanges = new Set<number>()

  for (const growth of tracker.growths.value) {
    const previousGrowth = previousGrowths.get(growth.rank)
    if (!previousGrowths.has(growth.rank) || previousGrowth !== growth.growth) {
      nextGrowthChanges.add(growth.rank)
    }
  }

  if (nextGrowthChanges.size > 0) {
    restartRankFlash(growthChangedRanks, nextGrowthChanges)
  }
}

function markDetailScoreChange(previousScore: number | null, nextScore: number) {
  if (previousScore == null || previousScore !== nextScore) {
    restartDetailScoreFlash()
  }
}

function restartRankFlash(target: typeof scoreChangedRanks, changedRanks: Set<number>) {
  const current = new Set(target.value)
  for (const rank of changedRanks) {
    current.delete(rank)
  }
  target.value = current
  requestAnimationFrame(() => {
    target.value = new Set([...target.value, ...changedRanks])
    scheduleNumberFlashReset()
  })
}

function restartDetailScoreFlash() {
  detailScoreChanged.value = false
  requestAnimationFrame(() => {
    detailScoreChanged.value = true
    scheduleNumberFlashReset()
  })
}

function scheduleNumberFlashReset() {
  clearNumberFlashTimer()
  numberFlashTimer = setTimeout(() => {
    scoreChangedRanks.value = new Set()
    growthChangedRanks.value = new Set()
    detailChangedRanks.value = new Set()
    detailScoreChanged.value = false
    numberFlashTimer = null
  }, NUMBER_FLASH_MS)
}

function clearNumberFlashTimer() {
  if (numberFlashTimer) {
    clearTimeout(numberFlashTimer)
    numberFlashTimer = null
  }
}

function isSameTrackerScope(left: RankBorderTrackerScope, right: RankBorderTrackerScope) {
  return normalizeTrackerEndpoint(left.endpoint) === normalizeTrackerEndpoint(right.endpoint)
    && left.region === right.region
    && left.eventId === right.eventId
    && left.mode === right.mode
    && (left.worldBloomCharacterId ?? null) === (right.worldBloomCharacterId ?? null)
    && (left.playbackAt ?? null) === (right.playbackAt ?? null)
}

function persistState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      endpoint: trackerEndpoint.value,
      region: selectedRegion.value,
      eventId: selectedEventId.value,
      mode: mode.value,
      worldBloomCharacterId: selectedWorldBloomCharacterId.value,
      intervalSeconds: intervalSeconds.value,
      accountKey: selectedAccountKey.value,
      hideProfileAssets: hideProfileAssets.value,
    } satisfies PersistedState))
  } catch {
  }
}

function readPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw) as PersistedState
    return typeof parsed === "object" && parsed ? parsed : {}
  } catch {
    return {}
  }
}

function resolveInitialTrackerEndpoint(endpoint: string | undefined) {
  const normalized = normalizeTrackerEndpoint(endpoint)
  if (!normalized || LEGACY_DIRECT_TRACKER_ENDPOINTS.has(normalized)) {
    return DEFAULT_TRACKER_ENDPOINT
  }

  return normalized
}

function resolveDefaultEventId(options: Array<{ value: string; startAt: number | null; aggregateAt: number | null }>): string | null {
  const now = Math.floor(Date.now() / 1000)
  const active = options.find((option) =>
    option.startAt != null
    && option.aggregateAt != null
    && option.startAt <= now
    && option.aggregateAt >= now,
  )

  return active?.value ?? options[0]?.value ?? null
}

function resolveDefaultWorldBloomCharacterId(
  options: Array<{ value: string; active?: boolean; chapterStartAt: number | null; aggregateAt: number | null }>,
): string | null {
  const active = options.find((option) => option.active)
  if (active) {
    return active.value
  }

  const now = currentUnixSecond.value
  const started = options
    .filter((option) => option.chapterStartAt != null && option.chapterStartAt <= now)
    .sort((a, b) => (b.chapterStartAt ?? 0) - (a.chapterStartAt ?? 0))

  return started[0]?.value ?? options[0]?.value ?? null
}

function isSekaiRegionValue(value: string): value is SekaiRegion {
  return SEKAI_REGION_OPTIONS.some((option) => option.value === value)
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function clampNumber(value: number | null | undefined, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.round(parsed)))
}

function isPublicUniqueId(value: string) {
  return /^[a-f0-9]{64}$/i.test(value.trim())
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

function formatTimestamp(timestamp: number | null | undefined) {
  if (!timestamp) {
    return "-"
  }

  return new Date(timestamp * 1000).toLocaleString()
}

function formatReplayTick(timestamp: number | null | undefined) {
  if (!timestamp) {
    return "-"
  }

  return new Date(timestamp * 1000).toLocaleString(getI18nLocale(), {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
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

function formatRankShift(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  const sign = value > 0 ? "+" : ""
  return `${sign}${formatNumberCN(value)}`
}

function formatLoopCount(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "-"
  }

  return `${formatHeatmapRoundCount(value)}/h`
}

function formatHeatmapRoundCount(value: number) {
  return new Intl.NumberFormat(getI18nLocale(), {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.round(value)))
}

function formatElapsed(seconds: number | null | undefined) {
  if (typeof seconds !== "number") {
    return "-"
  }

  if (seconds < 60) {
    return t("rankBorder.time.secondsAgo", { value: seconds })
  }

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return t("rankBorder.time.minutesAgo", { value: minutes })
  }

  const hours = Math.round(minutes / 60)
  return t("rankBorder.time.hoursAgo", { value: hours })
}

function elapsedSince(timestamp: number | null | undefined) {
  return timestamp ? Math.max(0, currentUnixSecond.value - timestamp) : null
}

function formatUserLabel(result: { name: string | null } | null) {
  if (!result) {
    return "-"
  }

  return result.name ?? t("rankBorder.result.unknownPlayer")
}

function buildMasterRecordMap<T extends { id?: number }>(items: T[]) {
  const map = new Map<number, T>()
  for (const item of items) {
    if (typeof item.id === "number" && item.id > 0) {
      map.set(item.id, item)
    }
  }
  return map
}

function isLocalMockTrackerEndpoint(endpoint: string) {
  const normalized = normalizeTrackerEndpoint(endpoint)
  return normalized === "http://127.0.0.1:18777" || normalized === "http://localhost:18777"
}

type ProfileResult = RankBorderLatest | RankBorderLine | null

function isLatestResult(result: ProfileResult): result is RankBorderLatest {
  return Array.isArray((result as RankBorderLatest | null)?.profileHonors)
}

function leaderThumbnailUrl(result: ProfileResult) {
  if (!isLatestResult(result) || !result.cardId) {
    return null
  }

  const card = cardById.value.get(result.cardId)
  const assetBundleName = normalizeTextValue(card?.assetbundleName)
  if (!assetBundleName) {
    return null
  }

  const trainedArt = resolveCardTrainedArt(result)
  if (isLocalMockTrackerEndpoint(trackerEndpoint.value)) {
    return `/rank-border/card/${assetBundleName}${trainedArt ? "_after_training" : "_normal"}.png`
  }

  return resolveSekaiCardThumbnailUrl(
    selectedRegion.value,
    assetBundleName,
    trainedArt,
    settingsStore.currentAssetEndpoint,
  )
}

function leaderCardFrameUrl(result: ProfileResult) {
  const rarity = leaderCardRarity(result)
  return rarity ? resolveCardFrameImageUrl(rarity) : null
}

function leaderAttrIconUrl(result: ProfileResult) {
  if (!isLatestResult(result) || !result.cardId) {
    return null
  }

  const card = cardById.value.get(result.cardId)
  const attr = normalizeTextValue(card?.attr)?.toLowerCase()
  return attr ? resolveCardAttrIconUrl(attr) : null
}

function leaderRareIconUrl(result: ProfileResult) {
  const rarity = leaderCardRarity(result)
  if (!rarity) {
    return null
  }

  return rarity === "rarity_birthday"
    ? resolveRareBirthdayImageUrl()
    : resolveRareStarImageUrl(resolveCardDisplayAfterTraining(result))
}

function leaderRareCount(result: ProfileResult) {
  const rarity = leaderCardRarity(result)
  if (!rarity) {
    return 0
  }

  if (rarity === "rarity_birthday") {
    return 1
  }

  const match = rarity.match(/\d+/)
  return match ? Number(match[0]) : 0
}

function leaderMasterRankUrl(result: ProfileResult) {
  if (!isLatestResult(result) || result.cardMasterRank == null || result.cardMasterRank <= 0) {
    return null
  }

  return resolveTrainRankImageUrl(result.cardMasterRank)
}

function leaderCardRarity(result: ProfileResult) {
  if (!isLatestResult(result) || !result.cardId) {
    return null
  }

  const card = cardById.value.get(result.cardId)
  return normalizeTextValue(card?.cardRarityType)
}

function leaderCardLabel(result: ProfileResult) {
  if (!isLatestResult(result) || !result.cardId) {
    return null
  }

  const card = cardById.value.get(result.cardId)
  return normalizeTextValue(card?.prefix) ?? `#${result.cardId}`
}

function leaderLevelLabel(result: ProfileResult) {
  return isLatestResult(result) && result.cardLevel != null ? `Lv.${result.cardLevel}` : null
}

function leaderMasterRankLabel(result: ProfileResult) {
  return isLatestResult(result) && result.cardMasterRank != null ? `MR${result.cardMasterRank}` : null
}

function profileHonorViews(result: ProfileResult, limit = 3, keyScope = "profile"): RankBorderHonorView[] {
  if (!isLatestResult(result)) {
    return []
  }

  return result.profileHonors
    .slice(0, limit)
    .map((honor, index) => {
      const honorId = honor.honorId ?? honor.honorId2
      const masterHonor = honorId ? honorById.value.get(honorId) ?? null : null
      const bondsHonor = honorId ? bondsHonorById.value.get(honorId) ?? null : null
      if (!masterHonor && bondsHonor) {
        return resolveBondsHonorView(honor, bondsHonor, honorId, index, keyScope)
      }

      const groupId = normalizePositiveNumber(masterHonor?.groupId ?? masterHonor?.groupID)
      const masterGroup = groupId ? honorGroupById.value.get(groupId) ?? null : null
      return {
        key: `${keyScope}:${honor.seq ?? index}:${honorId ?? "unknown"}`,
        label: normalizeTextValue(masterHonor?.name) ?? (honorId ? `#${honorId}` : "-"),
        ...resolveHonorVisual(masterHonor, masterGroup, honorId ?? null, honor.honorLevel, "sub"),
        level: honor.honorLevel,
      }
    })
}

function rowHonorKeyScope(row: RankBorderLineRow) {
  return `row-${row.rank}-${sanitizeDomId(row.detail?.userId ?? "line")}`
}

function detailHonorKeyScope(value: DetailState) {
  return `detail-${value.source}-${value.result.rank}-${sanitizeDomId(isLatestResult(value.result) ? value.result.userId ?? value.query : value.query)}`
}

function resolveHonorVisual(
  honor: RankBorderMasterHonor | null,
  group: RankBorderMasterHonorGroup | null,
  honorId: number | null,
  level: number | null,
  mode: "main" | "sub",
): Omit<RankBorderHonorView, "key" | "label" | "level"> {
  const levelVisual = resolveHonorLevelVisual(honor, level)
  const assetBundleName = normalizeTextValue(honor?.assetbundleName) ?? normalizeTextValue(levelVisual?.assetbundleName)
  const rarity = normalizeTextValue(honor?.honorRarity) ?? normalizeTextValue(levelVisual?.honorRarity)
  const backgroundAssetBundleName = resolveHonorBackgroundAssetName(group, assetBundleName)
  const groupType = honorId != null && FC_AP_HONOR_IDS.has(honorId)
    ? "fc_ap"
    : resolveHonorGroupType(group, backgroundAssetBundleName, assetBundleName)
  const resolvedRarity = rarity ?? resolveHonorRarityFromAssetName(assetBundleName)
  const baseUrl = resolveHonorBaseUrl(groupType, backgroundAssetBundleName, assetBundleName, mode)
  const rankUrl = assetBundleName && honorUsesRankLayer(groupType, assetBundleName)
    ? resolveHonorRankUrl(groupType, assetBundleName, mode)
    : null

  return {
    type: "normal",
    groupType,
    honorId,
    baseUrl,
    rankUrl: rankUrl && rankUrl !== baseUrl ? rankUrl : null,
    rankPlacement: resolveHonorRankPlacement(groupType, assetBundleName),
    frameUrl: resolveHonorFrameUrl(group, backgroundAssetBundleName, assetBundleName, resolvedRarity, mode),
    framePlacement: resolvedRarity === "low" ? "low" : "full",
    scrollUrl: assetBundleName && honorUsesScrollLayer(groupType)
      ? resolveHonorScrollUrl(assetBundleName)
      : null,
    levelIconUrl: honorUsesLevelIconLayer(groupType)
      ? "/rank-border/honor/icon_degreeLv.png"
      : null,
    level6IconUrl: honorUsesLevelIconLayer(groupType)
      ? "/rank-border/honor/icon_degreeLv6.png"
      : null,
    fcApLevel: assetBundleName && honorUsesScrollLevel(groupType, assetBundleName)
      ? String(level ?? "")
      : null,
    bondsLeftBgUrl: null,
    bondsRightBgUrl: null,
    bondsLeftIconUrl: null,
    bondsRightIconUrl: null,
  }
}

function resolveBondsHonorView(
  honor: RankBorderLatest["profileHonors"][number],
  bondsHonor: RankBorderMasterBondsHonor,
  honorId: number | null,
  index: number,
  keyScope: string,
): RankBorderHonorView {
  const slots = resolveBondsHonorDisplaySlots(bondsHonor, honor.bondsHonorViewType)
  const rarity = normalizeTextValue(bondsHonor.honorRarity)
  const word = honor.bondsHonorWordId ? bondsHonorWordById.value.get(honor.bondsHonorWordId) ?? null : null
  return {
    key: `${keyScope}:${honor.seq ?? index}:bonds:${honorId ?? "unknown"}:${honor.bondsHonorViewType ?? ""}`,
    label: normalizeTextValue(word?.name) ?? normalizeTextValue(bondsHonor.name) ?? (honorId ? `#${honorId}` : "-"),
    type: "bonds",
    groupType: "bonds",
    honorId,
    baseUrl: null,
    rankUrl: null,
    rankPlacement: "event",
    frameUrl: resolveBondsHonorFrameUrl(rarity, "sub"),
    framePlacement: rarity === "low" ? "low" : "full",
    scrollUrl: null,
    levelIconUrl: "/rank-border/honor/icon_degreeLv.png",
    level6IconUrl: "/rank-border/honor/icon_degreeLv6.png",
    fcApLevel: null,
    bondsLeftBgUrl: slots.leftCharacterId ? `/rank-border/honor/bonds/${slots.leftCharacterId}_sub.png` : null,
    bondsRightBgUrl: slots.rightCharacterId ? `/rank-border/honor/bonds/${slots.rightCharacterId}_sub.png` : null,
    bondsLeftIconUrl: slots.leftUnitId ? resolveBondsHonorCharacterUrl(slots.leftUnitId) : null,
    bondsRightIconUrl: slots.rightUnitId ? resolveBondsHonorCharacterUrl(slots.rightUnitId) : null,
    level: honor.honorLevel,
  }
}

function resolveBondsHonorDisplaySlots(bondsHonor: RankBorderMasterBondsHonor, viewType: string | null) {
  let leftUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId1 ?? bondsHonor.gameCharacterUnitID1)
  let rightUnitId = normalizePositiveNumber(bondsHonor.gameCharacterUnitId2 ?? bondsHonor.gameCharacterUnitID2)
  if (bondsHonor.configurableUnitVirtualSinger && bondsHonorUsesUnitVirtualSinger(viewType)) {
    const originalLeftUnitId = leftUnitId
    const originalRightUnitId = rightUnitId
    leftUnitId = resolveUnitVirtualSingerUnitId(originalLeftUnitId, originalRightUnitId)
    rightUnitId = resolveUnitVirtualSingerUnitId(originalRightUnitId, originalLeftUnitId)
  }

  if (bondsHonorViewTypeIsReverse(viewType)) {
    const originalLeftUnitId = leftUnitId
    leftUnitId = rightUnitId
    rightUnitId = originalLeftUnitId
  }

  return {
    leftUnitId,
    rightUnitId,
    leftCharacterId: resolveGameCharacterIdByUnitId(leftUnitId),
    rightCharacterId: resolveGameCharacterIdByUnitId(rightUnitId),
  }
}

function normalizePositiveNumber(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function resolveUnitVirtualSingerUnitId(candidateUnitId: number | null, pairedUnitId: number | null) {
  if (!candidateUnitId) {
    return candidateUnitId
  }

  const candidate = gameCharacterUnitById.value.get(candidateUnitId)
  const candidateCharacterId = normalizePositiveNumber(candidate?.gameCharacterId ?? candidate?.gameCharacterID)
  if (!candidate || !candidateCharacterId || candidateCharacterId < 21 || !pairedUnitId) {
    return candidateUnitId
  }

  const paired = gameCharacterUnitById.value.get(pairedUnitId)
  const pairedUnit = normalizeTextValue(paired?.unit)
  if (!paired || !pairedUnit || pairedUnit === "piapro") {
    return candidateUnitId
  }

  for (let unitId = 27; unitId <= 56; unitId += 1) {
    const unit = gameCharacterUnitById.value.get(unitId)
    if (
      normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID) === candidateCharacterId
      && normalizeTextValue(unit?.unit) === pairedUnit
    ) {
      return unitId
    }
  }

  return candidateUnitId
}

function resolveGameCharacterIdByUnitId(unitId: number | null) {
  if (!unitId) {
    return null
  }

  const unit = gameCharacterUnitById.value.get(unitId)
  return normalizePositiveNumber(unit?.gameCharacterId ?? unit?.gameCharacterID)
}

function bondsHonorViewTypeIsReverse(viewType: string | null) {
  return (normalizeTextValue(viewType)?.toLowerCase() ?? "").startsWith("reverse")
}

function bondsHonorUsesUnitVirtualSinger(viewType: string | null) {
  return (normalizeTextValue(viewType)?.toLowerCase() ?? "").includes("unit_virtual_singer")
}

function resolveHonorLevelVisual(honor: RankBorderMasterHonor | null, level: number | null) {
  if (!honor?.levels?.length) {
    return null
  }

  const requestedLevel = level ?? 0
  let first: NonNullable<RankBorderMasterHonor["levels"]>[number] | null = null
  let best: NonNullable<RankBorderMasterHonor["levels"]>[number] | null = null
  for (const item of honor.levels) {
    if (!normalizeTextValue(item.assetbundleName) && !normalizeTextValue(item.honorRarity)) {
      continue
    }

    first ??= item
    if (item.level === requestedLevel) {
      return item
    }

    if (requestedLevel > 0 && item.level != null && item.level <= requestedLevel) {
      if (!best || (item.level ?? 0) > (best.level ?? 0)) {
        best = item
      }
    }
  }

  return best ?? first
}

function resolveHonorBackgroundAssetName(group: RankBorderMasterHonorGroup | null, assetBundleName: string | null) {
  return normalizeTextValue(group?.backgroundAssetbundleName)
    ?? normalizeTextValue(group?.backgroundAssetBundleName)
    ?? deriveHonorBackgroundAssetName(assetBundleName)
    ?? null
}

function deriveHonorBackgroundAssetName(assetBundleName: string | null) {
  if (!assetBundleName || !assetBundleName.includes("event") || !assetBundleName.includes("top")) {
    return null
  }

  return assetBundleName.replace(/^honor_top_\d+_?/, "honor_bg_")
}

function resolveHonorGroupType(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
) {
  const groupType = normalizeTextValue(group?.honorType) ?? ""
  if (isWorldLinkHonorGroup(groupType, backgroundAssetBundleName, assetBundleName)) {
    return "wl_event"
  }

  return groupType
}

function isWorldLinkHonorGroup(groupType: string, backgroundAssetBundleName: string | null, assetBundleName: string | null) {
  return groupType === "wl_event"
    || groupType === "world_link"
    || Boolean(backgroundAssetBundleName?.includes("event_wl") || assetBundleName?.includes("event_wl"))
}

function honorUsesRankLayer(groupType: string, assetBundleName: string) {
  return groupType === "event"
    || groupType === "wl_event"
    || groupType === "rank_match"
    || groupType === "sekai_echo"
    || isWorldLinkRankAssetName(assetBundleName)
}

function honorUsesScrollLayer(groupType: string) {
  return groupType === "event" || groupType === "wl_event" || groupType === "fc_ap"
}

function honorUsesScrollLevel(groupType: string, assetBundleName: string | null) {
  return groupType === "fc_ap" && assetBundleName != null
}

function honorUsesLevelIconLayer(groupType: string) {
  return groupType === "character" || groupType === "achievement" || groupType === "bonds"
}

function resolveHonorBaseUrl(
  groupType: string,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
  mode: "main" | "sub",
) {
  if (groupType === "rank_match" && backgroundAssetBundleName) {
    return resolveSekaiGameAssetUrl(
      selectedRegion.value,
      `startapp/rank_live/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
      settingsStore.currentAssetEndpoint,
    )
  }

  if (backgroundAssetBundleName) {
    return resolveSekaiGameAssetUrl(
      selectedRegion.value,
      `startapp/honor/${backgroundAssetBundleName}/degree_${mode}.png`,
      settingsStore.currentAssetEndpoint,
    )
  }

  if (isCompactTopRankHonorAssetName(assetBundleName)) {
    return resolveHonorRankUrl(groupType, assetBundleName, mode)
  }

  const path = assetBundleName ? `startapp/honor/${assetBundleName}/degree_${mode}.png` : null
  if (!path) {
    return null
  }
  return resolveSekaiGameAssetUrl(selectedRegion.value, path, settingsStore.currentAssetEndpoint)
}

function resolveHonorRankUrl(groupType: string, assetBundleName: string, mode: "main" | "sub") {
  const path = groupType === "rank_match"
    ? `startapp/rank_live/honor/${assetBundleName}/${mode}.png`
    : `startapp/honor/${assetBundleName}/rank_${mode}.png`
  return resolveSekaiGameAssetUrl(selectedRegion.value, path, settingsStore.currentAssetEndpoint)
}

function resolveHonorScrollUrl(assetBundleName: string) {
  return resolveSekaiGameAssetUrl(
    selectedRegion.value,
    `startapp/honor/${assetBundleName}/scroll.png`,
    settingsStore.currentAssetEndpoint,
  )
}

function resolveBondsHonorCharacterUrl(unitId: number) {
  return resolveSekaiGameAssetUrl(
    selectedRegion.value,
    `startapp/bonds_honor/character/chr_sd_${String(unitId).padStart(2, "0")}_01.png`,
    settingsStore.currentAssetEndpoint,
  )
}

function resolveBondsHonorFrameUrl(rarity: string | null, mode: "main" | "sub") {
  if (!rarity) {
    return null
  }

  return `/rank-border/honor/frame_degree_${mode[0]}_${honorRarityRank(rarity)}.png`
}

function resolveHonorFrameUrl(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
  rarity: string | null,
  mode: "main" | "sub",
) {
  if (!rarity) {
    return null
  }

  const rarityRank = honorRarityRank(rarity)
  const frameName = normalizeTextValue(group?.frameName)
    ?? deriveHonorFrameName(assetBundleName)
  if (isBirthdayHonor(group, backgroundAssetBundleName, assetBundleName) && rarityRank <= 1) {
    return null
  }

  if (frameName && usesGroupHonorFrame(frameName, rarityRank)) {
    return resolveSekaiGameAssetUrl(
      selectedRegion.value,
      `startapp/honor_frame/${frameName}/frame_degree_${mode[0]}_${rarityRank}.png`,
      settingsStore.currentAssetEndpoint,
    )
  }

  return `/rank-border/honor/frame_degree_${mode[0]}_${rarityRank}.png`
}

function isBirthdayHonor(
  group: RankBorderMasterHonorGroup | null,
  backgroundAssetBundleName: string | null,
  assetBundleName: string | null,
) {
  const frameName = normalizeTextValue(group?.frameName) ?? ""
  return normalizeTextValue(group?.honorType) === "birthday"
    || frameName.startsWith("honor_frame_birthday")
    || Boolean(backgroundAssetBundleName?.startsWith("honor_bg_birthday"))
    || Boolean(assetBundleName?.startsWith("honor_bg_birthday"))
}

function deriveHonorFrameName(assetBundleName: string | null) {
  if (!assetBundleName) {
    return null
  }

  const normalized = assetBundleName.trim()
  if (normalized.startsWith("honor_bg_event_")) {
    return normalized.replace(/^honor_bg_/, "")
  }

  if (normalized.startsWith("honor_top_")) {
    const background = deriveHonorBackgroundAssetName(normalized)
    if (background?.startsWith("honor_bg_event_")) {
      return background.replace(/^honor_bg_/, "")
    }
  }

  return null
}

function resolveHonorRarityFromAssetName(assetBundleName: string | null) {
  if (!assetBundleName) {
    return null
  }

  if (assetBundleName.includes("000001")) {
    return "highest"
  }

  if (assetBundleName.includes("0001000")) {
    return "middle"
  }

  if (assetBundleName.includes("000100")) {
    return "high"
  }

  return null
}

function usesGroupHonorFrame(frameName: string, rarityRank: number) {
  const startRare = frameName.startsWith("event") ? 3 : 2
  return rarityRank >= startRare
}

function resolveHonorRankPlacement(groupType: string, assetBundleName: string | null): RankBorderHonorView["rankPlacement"] {
  if (groupType === "rank_match") {
    return "rank_match"
  }

  if (isWorldLinkRankAssetName(assetBundleName)) {
    return "full"
  }

  return "event"
}

function isWorldLinkRankAssetName(assetBundleName: string | null) {
  const normalized = normalizeTextValue(assetBundleName)?.toLowerCase() ?? ""
  return normalized.startsWith("honor_top_") && normalized.includes("event")
}

function isCompactTopRankHonorAssetName(assetBundleName: string | null) {
  const normalized = normalizeTextValue(assetBundleName)?.toLowerCase() ?? ""
  return /^honor_top_\d+$/.test(normalized)
}

function honorRarityRank(rarity: string) {
  if (rarity === "middle") {
    return 2
  }

  if (rarity === "high") {
    return 3
  }

  if (rarity === "highest") {
    return 4
  }

  return 1
}

function resolveCardTrainedArt(result: RankBorderLatest) {
  const defaultImage = normalizeTextValue(result.cardDefaultImage)?.toLowerCase() ?? ""
  if (["special_training", "after_training", "card_after_training", "trained"].includes(defaultImage)) {
    return true
  }

  if (["normal", "original", "before_training", "card_normal"].includes(defaultImage)) {
    return false
  }

  return normalizeTextValue(result.cardSpecialTrainingStatus)?.toLowerCase() === "done"
}

function resolveCardDisplayAfterTraining(result: ProfileResult) {
  if (!isLatestResult(result)) {
    return false
  }

  const rarity = leaderCardRarity(result)
  if (rarity === "rarity_3" || rarity === "rarity_4") {
    return true
  }

  return resolveCardTrainedArt(result)
}

function honorLevelLabel(honor: RankBorderHonorView) {
  return honor.level != null && honor.level > 0 ? `Lv.${honor.level}` : ""
}

function honorSvgId(honor: RankBorderHonorView, suffix: string) {
  return `rank-border-honor-${sanitizeDomId(honor.key)}-${suffix}`
}

function sanitizeDomId(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-")
}

function honorFrameSvgAttrs(honor: RankBorderHonorView) {
  return honor.framePlacement === "low"
    ? { x: 8, y: 0, width: 164, height: 80 }
    : { x: 0, y: 0, width: 180, height: 80 }
}

function honorRankSvgAttrs(honor: RankBorderHonorView) {
  if (honor.rankPlacement === "full") {
    return { x: 0, y: 0, width: 180, height: 80 }
  }

  return honor.rankPlacement === "rank_match"
    ? { x: 17, y: 42, width: 120, height: 38 }
    : { x: 34, y: 42, width: 120, height: 38 }
}

function honorLevelStars(honor: RankBorderHonorView) {
  if (honor.groupType === "fc_ap") {
    return []
  }

  const level = Math.max(0, honor.level ?? 0)
  const normalizedLevel = level > 10 ? level - 10 : level
  const stars: RankBorderHonorLevelStar[] = []
  if (honor.levelIconUrl) {
    for (let index = 0; index < Math.min(normalizedLevel, 5); index += 1) {
      stars.push({
        key: `${honor.key}:lv:${index}`,
        url: honor.levelIconUrl,
        slot: index,
        layer: 1,
      })
    }
  }
  if (honor.level6IconUrl) {
    for (let index = 5; index < normalizedLevel; index += 1) {
      stars.push({
        key: `${honor.key}:lv6:${index}`,
        url: honor.level6IconUrl,
        slot: index - 5,
        layer: 2,
      })
    }
  }
  return stars
}

function hideBrokenImage(event: Event) {
  if (event.target instanceof HTMLImageElement) {
    event.target.hidden = true
    return
  }

  if (event.target instanceof SVGImageElement) {
    event.target.style.display = "none"
    event.target.setAttribute("visibility", "hidden")
    event.target.removeAttribute("href")
  }
}

function showRankBorderTooltip(event: MouseEvent, label: string) {
  const nextPosition = resolveTooltipPosition(event)
  rankBorderTooltip.value = {
    visible: true,
    label,
    ...nextPosition,
  }
}

function moveRankBorderTooltip(event: MouseEvent) {
  if (!rankBorderTooltip.value.visible) {
    return
  }

  rankBorderTooltip.value = {
    ...rankBorderTooltip.value,
    ...resolveTooltipPosition(event),
  }
}

function hideRankBorderTooltip() {
  rankBorderTooltip.value = {
    ...rankBorderTooltip.value,
    visible: false,
  }
}

function resolveTooltipPosition(event: MouseEvent) {
  const maxX = Math.max(12, window.innerWidth - 240)
  return {
    x: Math.min(event.clientX + 12, maxX),
    y: Math.max(event.clientY - 10, 24),
  }
}

function normalizeTextValue(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
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
    ?? selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth
    ?? detailTraceStats.value.growth?.growth
    ?? null
}

function previousDetailLabel(value: DetailState) {
  return value.source === "line" ? t("rankBorder.result.previousLine") : t("rankBorder.result.previousRank")
}

function nextDetailLabel(value: DetailState) {
  return value.source === "line" ? t("rankBorder.result.nextLine") : t("rankBorder.result.nextRank")
}

function isLineDetailChanged(previous: RankBorderLatest, next: RankBorderLatest) {
  return previous.score !== next.score
    || previous.userId !== next.userId
    || previous.name !== next.name
    || previous.timestamp !== next.timestamp
    || previous.cardId !== next.cardId
    || previous.cardDefaultImage !== next.cardDefaultImage
    || previous.cardSpecialTrainingStatus !== next.cardSpecialTrainingStatus
    || previous.profileWord !== next.profileWord
    || profileHonorSignature(previous) !== profileHonorSignature(next)
}

function isGrowthChanged(previous: RankBorderGrowth, next: RankBorderGrowth) {
  return previous.growth !== next.growth
    || previous.scoreLatest !== next.scoreLatest
    || previous.scoreEarlier !== next.scoreEarlier
    || previous.timestampLatest !== next.timestampLatest
    || previous.timestampEarlier !== next.timestampEarlier
}

function profileHonorSignature(value: Pick<RankBorderLatest, "profileHonors">) {
  return value.profileHonors
    .map((honor) => [
      honor.seq,
      honor.honorId,
      honor.honorId2,
      honor.honorLevel,
      honor.profileHonorType,
      honor.bondsHonorViewType,
      honor.bondsHonorWordId,
    ].join(":"))
    .join("|")
}

function playerFrameSignature(value: Pick<RankBorderLatest, "userPlayerFrames">) {
  return value.userPlayerFrames
    .map((frame) => [
      frame.playerFrameId,
      frame.playerFrameAttachStatus,
    ].join(":"))
    .join("|")
}

function sparklinePath(
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
) {
  const sampledRecords = sampleTraceRecords(records, maxPoints)
  const values = sampledRecords.map((record) => chartMetricValue(record, metric))
  if (values.length < 2) {
    return ""
  }

  const minValue = zeroBaseline && metric === "score" ? 0 : Math.min(...values)
  const maxValue = Math.max(...values)
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

function chartRecordsForTimeDomain(records: RankBorderTracePoint[], timeDomain: RankBorderChartTimeDomain | null) {
  const visibleRecords = timeDomain
    ? records.filter((record) => record.timestamp >= timeDomain.start && record.timestamp <= timeDomain.end)
    : records
  return dedupeChartRecordsByTimestamp(visibleRecords)
}

function dedupeChartRecordsByTimestamp(records: RankBorderTracePoint[]) {
  if (records.length < 2) {
    return records
  }

  const byTimestamp = new Map<number, RankBorderTracePoint>()
  for (const record of records) {
    byTimestamp.set(record.timestamp, record)
  }

  return Array.from(byTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp)
}

function collapseChartCoordinates(points: Array<{ x: number; y: number }>) {
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

function sampleTraceRecords(records: RankBorderTracePoint[], maxPoints: number) {
  if (records.length <= maxPoints || maxPoints < 3) {
    return records
  }

  const step = (records.length - 1) / (maxPoints - 1)
  return Array.from({ length: maxPoints }, (_, index) => records[Math.round(index * step)])
}

function chartReferenceLines(
  records: RankBorderTracePoint[],
  metric: RankBorderChartMetric,
  height = 96,
  yPadding = 0,
  zeroBaseline = false,
  yBottomPadding = yPadding,
): RankBorderChartReferenceLine[] {
  const values = records.map((record) => chartMetricValue(record, metric))
  if (values.length === 0) {
    return []
  }

  const minValue = zeroBaseline && metric === "score" ? 0 : Math.min(...values)
  const maxValue = Math.max(...values)
  const tickValues = resolveChartTickValues(minValue, maxValue)
  return tickValues
    .map((value) => ({
      value,
      y: Number(chartMetricY(value, minValue, maxValue, metric, height, yPadding, yBottomPadding).toFixed(2)),
      label: formatChartTick(value, metric),
    }))
    .sort((a, b) => a.y - b.y)
}

function chartLabelTop(line: RankBorderChartReferenceLine) {
  return `${(line.y / DETAIL_CHART_HEIGHT) * 100}%`
}

function chartPointStyle(point: RankBorderChartPoint) {
  return {
    left: `${(point.x / DETAIL_CHART_WIDTH) * 100}%`,
    top: `${(point.y / DETAIL_CHART_HEIGHT) * 100}%`,
  }
}

function chartMetricValue(record: RankBorderTracePoint, metric: RankBorderChartMetric) {
  return metric === "score" ? record.score : record.rank
}

function chartMetricY(
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

function resolveDetailChartTimeDomain(records: RankBorderTracePoint[]): RankBorderChartTimeDomain | null {
  if (records.length < 2) {
    return null
  }

  const firstRecord = records[0]
  const latestRecord = records[records.length - 1]
  const event = selectedEvent.value
  const chapter = mode.value === "world_bloom" ? selectedWorldBloomCharacter.value : null
  const eventStart = chapter?.chapterStartAt ?? event?.startAt ?? firstRecord.timestamp
  const eventEnd = chapter?.aggregateAt ?? event?.aggregateAt ?? null
  const now = Math.floor(Date.now() / 1000)
  const latestDataTimestamp = Math.max(latestRecord.timestamp, latestTrackerTimestamp.value ?? latestRecord.timestamp)
  const resolvedEnd = eventEnd != null && eventEnd <= now
    ? eventEnd
    : Math.min(eventEnd ?? latestDataTimestamp, latestDataTimestamp)
  const start = eventStart
  const end = Math.max(resolvedEnd, latestRecord.timestamp, start + 1)
  return { start, end }
}

function chartTimestampX(timestamp: number, timeDomain: RankBorderChartTimeDomain, width: number, xPadding = 0) {
  const usableWidth = Math.max(1, width - xPadding * 2)
  const duration = Math.max(1, timeDomain.end - timeDomain.start)
  const ratio = Math.max(0, Math.min(1, (timestamp - timeDomain.start) / duration))
  return xPadding + ratio * usableWidth
}

function resolveChartTickValues(minValue: number, maxValue: number) {
  if (maxValue === minValue) {
    return [minValue]
  }

  const middleValue = Math.round((minValue + maxValue) / 2)
  return Array.from(new Set([minValue, middleValue, maxValue]))
}

function formatChartTick(value: number, metric: RankBorderChartMetric) {
  return metric === "rank" ? formatRank(value) : `${formatCompactNumber(value)} pt`
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
): RankBorderChartPoint[] {
  const sampledRecords = sampleTraceRecords(records, maxPoints)
  const values = sampledRecords.map((record) => chartMetricValue(record, metric))
  if (values.length < 2) {
    return []
  }

  const minValue = zeroBaseline && metric === "score" ? 0 : Math.min(...values)
  const maxValue = Math.max(...values)
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

function resolveLatestTraceDelta(records: RankBorderTracePoint[]) {
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

function resolveRecentAverageDelta(records: RankBorderTracePoint[], count: number) {
  const recentRecords = records.slice(-Math.max(2, count + 1))
  if (recentRecords.length < 2) {
    return null
  }

  const deltas = recentRecords.slice(1).map((record, index) =>
    record.score - recentRecords[index].score,
  )
  return Math.round(deltas.reduce((sum, value) => sum + value, 0) / deltas.length)
}

function resolveTraceGrowthForWindow(records: RankBorderTracePoint[], seconds: number) {
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

function resolveTraceRoundRate(records: RankBorderTracePoint[], startTimestamp: number, endTimestamp: number) {
  if (records.length < 2 || endTimestamp <= startTimestamp) {
    return null
  }

  const roundCount = resolveHeatmapRoundCount(records, startTimestamp, endTimestamp)
  const hours = (endTimestamp - startTimestamp) / 3600
  return hours > 0 ? roundCount / hours : null
}

function resolveHeatmapRoundCount(records: RankBorderTracePoint[], startTimestamp: number, endTimestamp: number) {
  let roundCount = 0
  for (let index = 1; index < records.length; index += 1) {
    const previous = records[index - 1]
    const record = records[index]
    const bucketTimestamp = previous.timestamp
    if (bucketTimestamp < startTimestamp || bucketTimestamp >= endTimestamp) {
      continue
    }
    if (record.score > previous.score) {
      roundCount += 1
    }
  }
  return roundCount
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

function isSameLocalDay(leftTimestamp: number, rightTimestamp: number) {
  const left = new Date(leftTimestamp * 1000)
  const right = new Date(rightTimestamp * 1000)
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate()
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

function traceRecordsForWindow(
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

function findPreviousTracePoint(records: RankBorderTracePoint[], timestamp: number) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    if (records[index].timestamp < timestamp) {
      return records[index]
    }
  }
  return null
}

function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp * 1000)
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 1000)
}

function heatmapDayStarts(startDay: number, endDay: number) {
  const starts: number[] = []
  const cursor = new Date(startDay * 1000)
  while (Math.floor(cursor.getTime() / 1000) <= endDay) {
    starts.push(Math.floor(cursor.getTime() / 1000))
    cursor.setDate(cursor.getDate() + 1)
  }
  return starts.length > 0 ? starts : [startDay]
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

function heatmapTextColor() {
  return "rgb(15 23 42)"
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
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-7xl gap-2 sm:gap-4">
      <Alert class="hidden border-cyan-200 bg-cyan-50/70 text-cyan-950 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-100 sm:grid">
        <Server class="h-4 w-4" />
        <AlertTitle>{{ t("rankBorder.notice.title") }}</AlertTitle>
        <AlertDescription class="leading-6">
          {{ t("rankBorder.notice.description") }}
        </AlertDescription>
      </Alert>

      <Card class="gap-2 rounded-lg py-2 sm:gap-3 sm:py-3 xl:rounded-xl xl:py-5">
        <CardHeader class="gap-2 px-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3 sm:px-4 xl:px-5">
          <div class="min-w-0 space-y-1.5">
            <CardTitle class="flex items-center gap-2 text-lg">
              <Trophy class="size-5" />
              {{ t("rankBorder.title") }}
            </CardTitle>
            <CardDescription class="hidden sm:block">{{ t("rankBorder.description") }}</CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              :class="[
                'inline-flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm font-medium',
                trackerStatusTone === 'live'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
                  : trackerStatusTone === 'amber'
                    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200',
              ]"
            >
              <span class="rank-border-live-dot" />
              {{ trackerStatusLabel }}
            </span>
            <Button type="button" :disabled="!canRefresh || liveRefreshing" @click="refreshData(true)">
              <RefreshCcw :class="['size-4', liveRefreshing ? 'animate-spin' : '']" />
              {{ liveRefreshing ? t("rankBorder.actions.refreshing") : t("rankBorder.actions.refresh") }}
            </Button>
          </div>
        </CardHeader>

        <CardContent class="grid gap-2 px-1.5 pb-1.5 sm:gap-3 sm:px-4 sm:pb-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_24rem] xl:px-5 xl:pb-5">
          <section class="order-1 grid gap-3 lg:col-span-2">
            <div
              :class="[
                'rank-border-query-grid rounded-md border bg-muted/10 p-2.5',
                mode === 'world_bloom' ? 'rank-border-query-grid--world-bloom' : 'rank-border-query-grid--normal',
              ]"
            >
              <div class="rank-border-query-field rank-border-query-field--region">
                <Label>{{ t("rankBorder.fields.region") }}</Label>
                <Select :model-value="selectedRegion" :disabled="masterOptions.loading.value" @update:model-value="updateRegion">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in SEKAI_REGION_OPTIONS" :key="option.value" :value="option.value">
                      {{ resolveSekaiRegionLabel(option.value, t) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="rank-border-query-field rank-border-query-field--mode">
                <Label>{{ t("rankBorder.fields.mode") }}</Label>
                <Select :model-value="mode" @update:model-value="updateMode">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in modeOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="rank-border-query-field rank-border-query-field--event">
                <Label>{{ t("rankBorder.fields.event") }}</Label>
                <Combobox
                  :model-value="selectedEventId"
                  :options="eventComboboxOptions"
                  :disabled="masterOptions.loading.value || eventComboboxOptions.length === 0"
                  :clearable="false"
                  trigger-class="rank-border-event-combobox-trigger"
                  content-class="rank-border-event-combobox-content"
                  :placeholder="masterOptions.loading.value ? t('rankBorder.fields.loadingEvents') : t('rankBorder.fields.eventPlaceholder')"
                  :search-placeholder="t('rankBorder.fields.eventSearchPlaceholder')"
                  :empty-text="t('rankBorder.fields.eventEmpty')"
                  :icon-component="Activity"
                  @update:model-value="updateEvent"
                />
              </div>

              <div v-if="mode === 'world_bloom'" class="rank-border-query-field rank-border-query-field--world-bloom">
                <Label>{{ t("rankBorder.fields.worldBloomCharacter") }}</Label>
                <Select :model-value="selectedWorldBloomCharacterId ?? undefined" @update:model-value="updateWorldBloomCharacter">
                  <SelectTrigger class="rank-border-world-bloom-select-trigger w-full">
                    <SelectValue :placeholder="t('rankBorder.fields.worldBloomCharacterPlaceholder')">
                      {{ selectedWorldBloomCharacter?.label ?? t('rankBorder.fields.worldBloomCharacterPlaceholder') }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent class="rank-border-world-bloom-select-content">
                    <SelectItem
                      v-for="option in masterOptions.worldBloomCharacterOptions.value"
                      :key="option.value"
                      :value="option.value"
                    >
                      <span class="rank-border-world-bloom-select-item">
                        <span>{{ option.label }}</span>
                        <span v-if="option.active" class="rank-border-world-bloom-select-item__badge">{{ t("rankBorder.badges.current") }}</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="rank-border-query-field rank-border-query-field--interval">
                <Label>{{ t("rankBorder.fields.interval") }}</Label>
                <Select :model-value="intervalSeconds" @update:model-value="updateInterval">
                  <SelectTrigger class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in intervalOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="grid gap-2 rounded-md border bg-background/70 p-2.5 lg:grid-cols-[minmax(16rem,1fr)_8rem]">
              <div class="grid gap-1.5">
                <Label>{{ t("rankBorder.fields.account") }}</Label>
                <Select
                  :model-value="selectedAccountKey"
                  :disabled="accountOptions.length === 0"
                  @update:model-value="updateAccount"
                >
                  <SelectTrigger class="w-full">
                    <SelectValue :placeholder="t('rankBorder.fields.accountPlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="account in accountOptions" :key="account.key" :value="account.key">
                      {{ account.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid content-end">
                <Button type="button" :disabled="!canRefresh || accountOptions.length === 0 || detailLoading" @click="locateSelectedAccount">
                  <Gauge :class="['size-4', detailLoading ? 'animate-pulse' : '']" />
                  {{ t("rankBorder.actions.locate") }}
                </Button>
              </div>

              <p
                :class="[
                  'text-xs leading-5',
                  accountOptions.length === 0 ? 'text-destructive' : 'text-muted-foreground',
                ]"
                class="lg:col-span-2"
              >
                {{ accountOptions.length === 0 ? t("rankBorder.result.noBoundAccount") : t("rankBorder.sections.locateDescription") }}
              </p>
            </div>

            <section
              v-if="isMobileViewport && (mobileLocateOpen || selectedAccountDetail || detailLoading || detailError)"
              class="rank-border-mobile-locator md:hidden"
            >
              <div class="rank-border-mobile-locator__head">
                <div class="min-w-0">
                  <p class="truncate text-xs text-muted-foreground">{{ t("rankBorder.sections.locateIndicator") }}</p>
                  <p class="truncate text-sm font-semibold">{{ selectedAccount?.label ?? t("rankBorder.result.noBoundAccount") }}</p>
                </div>
                <Button
                  v-if="selectedAccountDetail"
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-8 shrink-0"
                  @click="detailDialogOpen = true"
                >
                  <ChartLine class="size-4" />
                  {{ t("rankBorder.actions.showDetails") }}
                </Button>
              </div>
              <div v-if="detailLoading && !selectedAccountDetail" class="rank-border-mobile-locator__state">
                {{ t("rankBorder.result.waitingLiveData") }}
              </div>
              <div v-else-if="detailError && !selectedAccountDetail" class="rank-border-mobile-locator__state rank-border-mobile-locator__state--error">
                {{ detailError }}
              </div>
              <div v-else-if="selectedAccountDetail" class="rank-border-mobile-locator__metrics">
                <div>
                  <span>{{ t("rankBorder.result.rank") }}</span>
                  <strong>{{ formatDetailRank(selectedAccountDetail) }}</strong>
                </div>
                <div>
                  <span>{{ t("rankBorder.result.score") }}</span>
                  <strong>{{ formatPt(selectedAccountDetail.result.score) }}</strong>
                </div>
                <div>
                  <span>{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                  <strong :class="(detailGrowth(selectedAccountDetail) ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">
                    {{ formatGrowth(detailGrowth(selectedAccountDetail)) }}
                  </strong>
                </div>
                <div>
                  <span>{{ t("rankBorder.result.latestPlain") }}</span>
                  <strong>{{ formatElapsed(elapsedSince(selectedAccountDetail.result.timestamp)) }}</strong>
                </div>
              </div>
            </section>

            <div class="flex flex-col gap-2 rounded-md border bg-background/70 p-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0">
                <p class="text-sm font-medium">{{ t("rankBorder.fields.hideProfileAssets") }}</p>
                <p class="text-xs leading-5 text-muted-foreground">{{ t("rankBorder.fields.hideProfileAssetsHint") }}</p>
              </div>
              <Switch
                v-model="hideProfileAssets"
                class="shrink-0"
                :aria-label="t('rankBorder.fields.hideProfileAssets')"
              />
            </div>

            <p v-if="masterOptions.error.value" class="text-xs text-destructive">{{ masterOptions.error.value }}</p>
          </section>

          <section v-if="activityReplayReady" class="rank-border-replay-rail order-2 lg:col-span-2">
            <div class="rank-border-replay-rail__meta">
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ t("rankBorder.sections.activityReplay") }}</p>
                <p class="truncate text-xs text-muted-foreground">{{ playbackStatusLabel }}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                class="h-8 shrink-0"
                :disabled="isPlaybackLive && playbackDraftAt == null"
                @click="resetPlaybackLive"
              >
                {{ t("rankBorder.actions.backToLive") }}
              </Button>
            </div>
            <div class="rank-border-replay-rail__track">
              <span>{{ formatReplayTick(replayBounds.start) }}</span>
              <input
                class="rank-border-replay-range"
                type="range"
                :min="replayBounds.start"
                :max="replayBounds.end"
                :step="TRACKER_UPDATE_INTERVAL_SECONDS"
                :value="playbackDisplayAt"
                :aria-label="t('rankBorder.sections.activityReplay')"
                @input="updatePlaybackDraft"
                @change="commitPlaybackDraft"
                @pointerup="commitPlaybackDraft"
                @keyup.enter="commitPlaybackDraft"
              >
              <span>{{ formatReplayTick(replayBounds.end) }}</span>
            </div>
          </section>

          <div class="order-3 grid min-w-0 content-start gap-3 lg:order-2">
            <div
              v-if="quickJumpTargets.length > 0"
              class="rank-border-jump-rail"
            >
              <span class="shrink-0 text-xs font-medium text-muted-foreground">{{ t("rankBorder.sections.quickJump") }}</span>
              <div class="rank-border-jump-rail__bars">
                <button
                  v-for="target in quickJumpTargets"
                  :key="target.rank"
                  type="button"
                  :class="[
                    'rank-border-jump-bar',
                    activeQuickJumpRank === target.rank ? 'rank-border-jump-bar--active' : '',
                  ]"
                  :aria-label="target.label"
                  :aria-current="activeQuickJumpRank === target.rank ? 'true' : undefined"
                  @mouseenter="showRankBorderTooltip($event, target.label)"
                  @mousemove="moveRankBorderTooltip($event)"
                  @mouseleave="hideRankBorderTooltip"
                  @click="jumpToRank(target.rank)"
                />
              </div>
            </div>

          <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-base font-semibold">{{ selectedEvent?.label ?? t("rankBorder.sections.lines") }}</h2>
                <p class="text-sm text-muted-foreground">
                  {{ t("rankBorder.sections.linesDescription") }}
                </p>
              </div>
            </div>

            <div v-if="tracker.error.value" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ tracker.error.value }}
            </div>

            <div v-if="!hasTop100Data" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("rankBorder.result.emptyLines") }}
            </div>
            <div v-else class="rank-border-table-shell rounded-md border bg-background/80">
              <div class="rank-border-table-header rank-border-top-header">
                <span>{{ t("rankBorder.table.rank") }}</span>
                <span>{{ t("rankBorder.table.player") }}</span>
                <span class="text-right">{{ t("rankBorder.table.score") }}</span>
              </div>
              <TransitionGroup name="rank-border-row" tag="div" class="rank-border-top-list">
                <div
                  v-for="row in top100Rows"
                  :key="row.key"
                  :data-rank-border-row="row.rank"
                  class="rank-border-top-item border-b last:border-b-0"
                >
                  <button
                    type="button"
                    :class="[
                      'rank-border-table-row rank-border-top-row text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
                      row.rank <= 3 ? 'bg-cyan-50/55 dark:bg-cyan-500/10' : 'bg-background/80',
                      row.selected ? 'ring-1 ring-cyan-500/50' : '',
                    ]"
                    @click="isMobileViewport ? openMobileRankDetail(row.rank) : openRankDetail(row.rank)"
                  >
                    <div class="rank-border-rank-cell">
                      <span
                        :class="[
                          'inline-flex min-w-10 justify-center rounded-md border px-1.5 py-1 text-xs font-semibold tabular-nums sm:min-w-12 sm:px-2 sm:text-sm',
                          row.rank === 1 ? 'border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-100' : '',
                          row.rank === 2 ? 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/15 dark:text-slate-100' : '',
                          row.rank === 3 ? 'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-100' : '',
                          row.rank > 3 ? 'bg-background text-foreground' : '',
                        ]"
                      >
                        {{ formatRank(row.rank) }}
                      </span>
                    </div>

                  <div class="rank-border-player-scroll">
                    <div
                      :class="[
                        'rank-border-player-track',
                        shouldRenderProfileAssets ? 'rank-border-player-track--assets' : 'rank-border-player-track--plain',
                      ]"
                    >
                      <div
                        v-if="shouldRenderProfileAssets"
                        class="rank-border-leader rank-border-leader--row"
                      >
                        <img
                          v-if="leaderThumbnailUrl(row.detail)"
                          class="rank-border-leader__base"
                          :src="leaderThumbnailUrl(row.detail) ?? ''"
                          :alt="leaderCardLabel(row.detail) ?? ''"
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <UserRound v-else class="rank-border-leader__fallback size-4" />
                        <span v-if="leaderThumbnailUrl(row.detail)" class="rank-border-leader__level-band" aria-hidden="true" />
                        <span v-if="leaderLevelLabel(row.detail)" class="rank-border-leader__level">{{ leaderLevelLabel(row.detail) }}</span>
                        <img
                          v-if="leaderCardFrameUrl(row.detail)"
                          class="rank-border-leader__frame"
                          :src="leaderCardFrameUrl(row.detail) ?? ''"
                          alt=""
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <img
                          v-if="leaderAttrIconUrl(row.detail)"
                          class="rank-border-leader__attr"
                          :src="leaderAttrIconUrl(row.detail) ?? ''"
                          alt=""
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <span v-if="leaderRareIconUrl(row.detail) && leaderRareCount(row.detail) > 0" class="rank-border-leader__stars" aria-hidden="true">
                          <img
                            v-for="starIndex in leaderRareCount(row.detail)"
                            :key="starIndex"
                            class="rank-border-leader__star"
                            :src="leaderRareIconUrl(row.detail) ?? ''"
                            alt=""
                            loading="lazy"
                            @error="hideBrokenImage"
                          >
                        </span>
                        <img
                          v-if="leaderMasterRankUrl(row.detail)"
                          class="rank-border-leader__train-rank"
                          :src="leaderMasterRankUrl(row.detail) ?? ''"
                          :alt="leaderMasterRankLabel(row.detail) ?? ''"
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                      </div>
                      <div class="rank-border-player-copy">
                        <p class="rank-border-player-name">
                          {{ row.detail ? formatUserLabel(row.detail) : t("rankBorder.result.noPlayer") }}
                        </p>
                        <div v-if="shouldRenderProfileAssets && profileHonorViews(row.detail, 3, rowHonorKeyScope(row)).length > 0" class="rank-border-honor-strip rank-border-honor-strip--row">
                          <span
                            v-for="honor in profileHonorViews(row.detail, 3, rowHonorKeyScope(row))"
                            :key="honor.key"
                            class="rank-border-honor rank-border-honor--row"
                            :title="`${honor.label} ${honorLevelLabel(honor)}`.trim()"
                          >
                            <span v-if="honor.type === 'normal' && honor.baseUrl" class="rank-border-honor-visual">
                              <svg class="rank-border-honor-svg" viewBox="0 0 180 80" aria-hidden="true" focusable="false">
                                <image :href="honor.baseUrl" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                                <image
                                  v-if="honor.frameUrl"
                                  :href="honor.frameUrl"
                                  v-bind="honorFrameSvgAttrs(honor)"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                                <image
                                  v-if="honor.rankUrl"
                                  :href="honor.rankUrl"
                                  v-bind="honorRankSvgAttrs(honor)"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                                <image
                                  v-if="honor.scrollUrl"
                                  :href="honor.scrollUrl"
                                  x="37"
                                  y="3"
                                  width="101"
                                  height="75"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                                <image
                                  v-for="star in honorLevelStars(honor)"
                                  :key="star.key"
                                  :href="star.url"
                                  :x="50 + star.slot * 16"
                                  y="61"
                                  width="16"
                                  height="16"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                                <text
                                  v-if="honor.fcApLevel"
                                  class="rank-border-honor-fcap-text"
                                  x="87"
                                  y="57"
                                  text-anchor="middle"
                                  dominant-baseline="middle"
                                >
                                  {{ honor.fcApLevel }}
                                </text>
                              </svg>
                            </span>
                            <span v-else-if="honor.type === 'bonds' && honor.bondsLeftBgUrl && honor.bondsRightBgUrl" class="rank-border-honor-visual rank-border-honor-visual--bonds">
                              <svg class="rank-border-honor-svg" viewBox="0 0 180 80" aria-hidden="true" focusable="false">
                                <defs>
                                  <mask :id="honorSvgId(honor, 'mask')" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="80" style="mask-type: alpha">
                                    <image href="/rank-border/honor/mask_degree_sub.png" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                                  </mask>
                                  <clipPath :id="honorSvgId(honor, 'left-bg')">
                                    <rect x="0" y="0" width="93" height="80" />
                                  </clipPath>
                                  <clipPath :id="honorSvgId(honor, 'left-icon')">
                                    <rect x="0" y="0" width="90" height="80" />
                                  </clipPath>
                                  <clipPath :id="honorSvgId(honor, 'right-icon')">
                                    <rect x="90" y="0" width="90" height="80" />
                                  </clipPath>
                                </defs>
                                <g :mask="`url(#${honorSvgId(honor, 'mask')})`">
                                  <image :href="honor.bondsRightBgUrl" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                                  <image
                                    :href="honor.bondsLeftBgUrl"
                                    x="0"
                                    y="0"
                                    width="180"
                                    height="80"
                                    preserveAspectRatio="none"
                                    :clip-path="`url(#${honorSvgId(honor, 'left-bg')})`"
                                    @error="hideBrokenImage"
                                  />
                                  <image
                                    v-if="honor.bondsLeftIconUrl"
                                    :href="honor.bondsLeftIconUrl"
                                    x="-4"
                                    y="-29"
                                    width="128"
                                    height="109"
                                    preserveAspectRatio="none"
                                    :clip-path="`url(#${honorSvgId(honor, 'left-icon')})`"
                                    @error="hideBrokenImage"
                                  />
                                  <image
                                    v-if="honor.bondsRightIconUrl"
                                    :href="honor.bondsRightIconUrl"
                                    x="56"
                                    y="-29"
                                    width="128"
                                    height="109"
                                    preserveAspectRatio="none"
                                    :clip-path="`url(#${honorSvgId(honor, 'right-icon')})`"
                                    @error="hideBrokenImage"
                                  />
                                </g>
                                <image
                                  v-if="honor.frameUrl"
                                  :href="honor.frameUrl"
                                  v-bind="honorFrameSvgAttrs(honor)"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                                <image
                                  v-for="star in honorLevelStars(honor)"
                                  :key="star.key"
                                  :href="star.url"
                                  :x="50 + star.slot * 16"
                                  y="61"
                                  width="16"
                                  height="16"
                                  preserveAspectRatio="none"
                                  @error="hideBrokenImage"
                                />
                              </svg>
                            </span>
                            <span v-else class="rank-border-honor-fallback">{{ honor.label }}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rank-border-score-cell">
                    <span
                      :class="[
                        'rank-border-live-number rank-border-row-score',
                        row.scoreChanged ? 'rank-border-live-number--changed' : '',
                      ]"
                    >
                      {{ formatPt(row.score) }}
                    </span>
                    <div class="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-0.5 text-[0.6875rem] leading-4 text-muted-foreground sm:gap-2 sm:text-xs">
                      <span
                        v-if="row.displayGrowth != null"
                        :class="[
                          'rank-border-live-number',
                          row.displayGrowthChanged ? 'rank-border-live-number--changed' : '',
                          row.displayGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                        ]"
                      >
                        {{ formatGrowth(row.displayGrowth) }}
                      </span>
                      <span>{{ formatElapsed(elapsedSince(row.timestamp)) }}</span>
                    </div>
                  </div>
                  </button>

                  <div v-if="isMobileExpandedTarget('rank', row.rank)" class="rank-border-mobile-fact md:hidden">
                    <div v-if="detailLoading && !isMobileDetailExpanded('rank', row.rank)" class="rank-border-mobile-fact__state">
                      {{ t("rankBorder.result.waitingLiveData") }}
                    </div>
                    <div v-else-if="detailError && !isMobileDetailExpanded('rank', row.rank)" class="rank-border-mobile-fact__state rank-border-mobile-fact__state--error">
                      {{ detailError }}
                    </div>
                    <template v-else-if="detail && isMobileDetailExpanded('rank', row.rank)">
                      <div class="rank-border-mobile-fact__head">
                        <div class="min-w-0">
                          <p class="truncate text-xs text-muted-foreground">{{ formatDetailTitle(detail) }}</p>
                          <p class="truncate text-xl font-semibold tabular-nums">{{ formatDetailRank(detail) }}</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" class="h-8 shrink-0" @click.stop="openDetailFromMobileFact">
                          <ChartLine class="size-4" />
                          {{ t("rankBorder.actions.showDetails") }}
                        </Button>
                      </div>
                      <div class="rank-border-mobile-fact__metrics">
                        <div>
                          <span>{{ t("rankBorder.result.score") }}</span>
                          <strong>{{ formatPt(detail.result.score) }}</strong>
                        </div>
                        <div>
                          <span>{{ t("rankBorder.result.latestPlain") }}</span>
                          <strong>{{ formatElapsed(elapsedSince(detail.result.timestamp)) }}</strong>
                        </div>
                        <div v-if="row.displayGrowth != null">
                          <span>{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                          <strong :class="row.displayGrowth > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ formatGrowth(row.displayGrowth) }}</strong>
                        </div>
                        <div>
                          <span>{{ previousDetailLabel(detail) }}</span>
                          <strong>{{ detail.previous ? formatGrowth(detailDelta(detail.previous, detail.result)) : "-" }}</strong>
                        </div>
                        <div>
                          <span>{{ nextDetailLabel(detail) }}</span>
                          <strong>{{ detail.next ? formatGrowth(detailDelta(detail.result, detail.next)) : "-" }}</strong>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>
              </TransitionGroup>
            </div>
          </section>

          <section class="grid min-w-0 gap-3 rounded-md border bg-muted/10 p-2.5 sm:p-3">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-base font-semibold">{{ t("rankBorder.sections.segmentLines") }}</h2>
                <p class="text-sm text-muted-foreground">
                  {{ t("rankBorder.sections.segmentLinesDescription", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}
                </p>
              </div>
            </div>

            <div v-if="!hasSegmentData" class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              {{ t("rankBorder.result.emptySegments") }}
            </div>
            <div v-else class="rank-border-table-shell rounded-md border bg-background/80">
              <div class="rank-border-table-header rank-border-segment-header">
                <span>{{ t("rankBorder.table.target") }}</span>
                <span>{{ t("rankBorder.table.border") }}</span>
                <span class="text-right">{{ t("rankBorder.table.score") }}</span>
              </div>
              <div
                v-for="row in segmentRows"
                :key="row.rank"
                :data-rank-border-row="row.rank"
                class="border-b last:border-b-0"
              >
                <button
                  type="button"
                  :class="[
                    'rank-border-table-row rank-border-segment-row bg-background/80 text-left transition-colors hover:bg-cyan-50/60 dark:hover:bg-cyan-500/10',
                    row.selected ? 'ring-1 ring-cyan-500/50' : '',
                  ]"
                  @click="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
                  @keydown.enter.prevent="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
                  @keydown.space.prevent="isMobileViewport ? openMobileLineDetail(row.rank) : openLineDetail(row.rank)"
                >
                  <div class="rank-border-rank-cell">
                    <span class="inline-flex min-w-12 justify-center rounded-md border bg-background px-2 py-1 text-sm font-semibold tabular-nums text-foreground">
                      {{ formatTargetRank(row.rank) }}
                    </span>
                  </div>

                  <div class="rank-border-player-scroll">
                    <div class="rank-border-player-track rank-border-player-track--plain">
                      <p class="rank-border-player-name">
                      {{ t("rankBorder.result.borderLine") }}
                      </p>
                    </div>
                  </div>

                  <div class="rank-border-score-cell">
                    <span
                      :class="[
                        'rank-border-live-number rank-border-row-score',
                        row.scoreChanged ? 'rank-border-live-number--changed' : '',
                      ]"
                    >
                      {{ formatPt(row.score) }}
                    </span>
                    <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                      <span
                        v-if="row.growth?.growth != null"
                        :class="[
                          'rank-border-live-number',
                          row.growthChanged ? 'rank-border-live-number--changed' : '',
                          row.growth.growth > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                        ]"
                      >
                        {{ formatGrowth(row.growth.growth) }}
                      </span>
                      <span>{{ formatElapsed(elapsedSince(row.timestamp)) }}</span>
                    </div>
                  </div>
                </button>

                <div v-if="isMobileExpandedTarget('line', row.rank)" class="rank-border-mobile-fact md:hidden">
                  <div v-if="detailLoading && !isMobileDetailExpanded('line', row.rank)" class="rank-border-mobile-fact__state">
                    {{ t("rankBorder.result.waitingLiveData") }}
                  </div>
                  <div v-else-if="detailError && !isMobileDetailExpanded('line', row.rank)" class="rank-border-mobile-fact__state rank-border-mobile-fact__state--error">
                    {{ detailError }}
                  </div>
                  <template v-else-if="detail && isMobileDetailExpanded('line', row.rank)">
                    <div class="rank-border-mobile-fact__head">
                      <div class="min-w-0">
                        <p class="truncate text-xs text-muted-foreground">{{ formatDetailTitle(detail) }}</p>
                        <p class="truncate text-xl font-semibold tabular-nums">{{ formatDetailRank(detail) }}</p>
                      </div>
                      <Button type="button" variant="outline" size="sm" class="h-8 shrink-0" @click.stop="openDetailFromMobileFact">
                        <ChartLine class="size-4" />
                        {{ t("rankBorder.actions.showDetails") }}
                      </Button>
                    </div>
                    <div class="rank-border-mobile-fact__metrics">
                      <div>
                        <span>{{ t("rankBorder.result.score") }}</span>
                        <strong>{{ formatPt(detail.result.score) }}</strong>
                      </div>
                      <div>
                        <span>{{ t("rankBorder.result.latestPlain") }}</span>
                        <strong>{{ formatElapsed(elapsedSince(detail.result.timestamp)) }}</strong>
                      </div>
                      <div v-if="row.growth?.growth != null">
                        <span>{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</span>
                        <strong :class="row.growth.growth > 0 ? 'text-emerald-600 dark:text-emerald-300' : ''">{{ formatGrowth(row.growth.growth) }}</strong>
                      </div>
                      <div>
                        <span>{{ previousDetailLabel(detail) }}</span>
                        <strong>{{ detail.previous ? formatGrowth(detailDelta(detail.previous, detail.result)) : "-" }}</strong>
                      </div>
                      <div>
                        <span>{{ nextDetailLabel(detail) }}</span>
                        <strong>{{ detail.next ? formatGrowth(detailDelta(detail.result, detail.next)) : "-" }}</strong>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </section>
          </div>

          <aside v-if="!isMobileViewport" class="rank-border-live-aside order-2 hidden min-w-0 max-w-full content-start gap-3 md:grid lg:sticky lg:top-[4.25rem] lg:order-3 lg:max-h-[calc(100svh-5.25rem)] lg:overflow-y-auto lg:overscroll-contain">
            <section class="rank-border-live-card grid min-w-0 max-w-full gap-3 overflow-hidden rounded-md border bg-background p-2.5 shadow-sm sm:p-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <UserRound class="size-4 text-muted-foreground" />
                  <h2 class="truncate text-base font-semibold">{{ t("rankBorder.sections.liveCard") }}</h2>
                </div>
                <Button
                  v-if="detail"
                  type="button"
                  variant="outline"
                  size="sm"
                  class="h-8"
                  @click="detailDialogOpen = true"
                >
                  <ChartLine class="size-4" />
                  {{ t("rankBorder.actions.showDetails") }}
                </Button>
              </div>

              <div v-if="detailError" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {{ detailError }}
              </div>

              <div v-if="detail" class="rank-border-live-card__body grid min-w-0 gap-3 rounded-md border bg-background p-3">
                <div class="grid min-w-0 gap-3">
                  <div class="flex min-w-0 items-start justify-between gap-3">
                    <div class="flex min-w-0 items-start gap-3">
                      <div
                        v-if="shouldRenderProfileAssets"
                        class="rank-border-leader rank-border-leader--detail"
                      >
                        <img
                          v-if="leaderThumbnailUrl(detail.result)"
                          class="rank-border-leader__base"
                          :src="leaderThumbnailUrl(detail.result) ?? ''"
                          :alt="leaderCardLabel(detail.result) ?? ''"
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <UserRound v-else class="rank-border-leader__fallback size-6" />
                        <span v-if="leaderThumbnailUrl(detail.result)" class="rank-border-leader__level-band" aria-hidden="true" />
                        <span v-if="leaderLevelLabel(detail.result)" class="rank-border-leader__level">{{ leaderLevelLabel(detail.result) }}</span>
                        <img
                          v-if="leaderCardFrameUrl(detail.result)"
                          class="rank-border-leader__frame"
                          :src="leaderCardFrameUrl(detail.result) ?? ''"
                          alt=""
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <img
                          v-if="leaderAttrIconUrl(detail.result)"
                          class="rank-border-leader__attr"
                          :src="leaderAttrIconUrl(detail.result) ?? ''"
                          alt=""
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                        <span v-if="leaderRareIconUrl(detail.result) && leaderRareCount(detail.result) > 0" class="rank-border-leader__stars" aria-hidden="true">
                          <img
                            v-for="starIndex in leaderRareCount(detail.result)"
                            :key="starIndex"
                            class="rank-border-leader__star"
                            :src="leaderRareIconUrl(detail.result) ?? ''"
                            alt=""
                            loading="lazy"
                            @error="hideBrokenImage"
                          >
                        </span>
                        <img
                          v-if="leaderMasterRankUrl(detail.result)"
                          class="rank-border-leader__train-rank"
                          :src="leaderMasterRankUrl(detail.result) ?? ''"
                          :alt="leaderMasterRankLabel(detail.result) ?? ''"
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-sm text-muted-foreground">{{ formatDetailTitle(detail) }}</p>
                        <p class="mt-1 truncate text-3xl font-semibold tabular-nums">{{ formatDetailRank(detail) }}</p>
                      </div>
                    </div>
                    <span
                      :class="[
                        'inline-flex shrink-0 rounded-md border px-2 py-1 text-xs font-medium',
                        detailBadgeClass(detail),
                      ]"
                    >
                      {{ formatDetailBadge(detail) }}
                    </span>
                  </div>
                </div>

                <div class="rank-border-live-card__metrics">
                  <div class="min-w-0 rounded-md border bg-muted/20 p-2.5">
                    <p class="text-xs text-muted-foreground">{{ t("rankBorder.result.score") }}</p>
                    <p
                      :class="[
                        'rank-border-live-number break-words text-lg font-semibold leading-tight tabular-nums sm:text-xl',
                        detailScoreChanged ? 'rank-border-live-number--changed' : '',
                      ]"
                    >
                      {{ formatPt(detail.result.score) }}
                    </p>
                  </div>
                  <div class="min-w-0 rounded-md border bg-muted/20 p-2.5">
                    <p class="text-xs text-muted-foreground">{{ t("rankBorder.result.latest") }}</p>
                    <p class="truncate text-sm font-medium tabular-nums">{{ formatElapsed(elapsedSince(detail.result.timestamp)) }}</p>
                  </div>
                  <div v-if="detailGrowth(detail) != null" class="col-span-2 min-w-0 rounded-md border bg-muted/20 p-2.5">
                    <p class="text-xs text-muted-foreground">{{ t("rankBorder.result.intervalGrowth", { interval: intervalOptions.find((option) => option.value === intervalSeconds)?.label ?? "-" }) }}</p>
                    <p
                      :class="[
                        'rank-border-live-number truncate text-xl font-semibold tabular-nums',
                        detailScoreChanged ? 'rank-border-live-number--changed' : '',
                        (detailGrowth(detail) ?? 0) > 0 ? 'text-emerald-600 dark:text-emerald-300' : '',
                      ]"
                    >
                      {{ formatGrowth(detailGrowth(detail)) }}
                    </p>
                  </div>
                </div>

                <div class="rank-border-live-card__gaps">
                  <div class="flex items-center justify-between rounded-md border bg-muted/20 p-2.5 text-sm">
                    <span class="inline-flex items-center gap-1 text-muted-foreground">
                      <ArrowUp class="size-3.5" />
                      {{ previousDetailLabel(detail) }}
                    </span>
                    <span class="font-medium tabular-nums">
                      {{ detail.previous ? formatGrowth(detailDelta(detail.previous, detail.result)) : "-" }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between rounded-md border bg-muted/20 p-2.5 text-sm">
                    <span class="inline-flex items-center gap-1 text-muted-foreground">
                      <ArrowDown class="size-3.5" />
                      {{ nextDetailLabel(detail) }}
                    </span>
                    <span class="font-medium tabular-nums">
                      {{ detail.next ? formatGrowth(detailDelta(detail.result, detail.next)) : "-" }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                {{ t("rankBorder.result.emptyLiveCard") }}
              </div>
            </section>

          </aside>
        </CardContent>

        <Dialog v-model:open="detailDialogOpen">
          <DialogContent class="rank-border-detail-dialog">
            <template v-if="detail">
              <DialogHeader class="rank-border-detail-dialog__header">
                <DialogTitle class="flex min-w-0 flex-wrap items-center gap-2">
                  <span class="truncate">{{ t("rankBorder.sections.detailDialog") }}</span>
                  <span
                    :class="[
                      'inline-flex shrink-0 rounded-md border px-2 py-1 text-xs font-medium',
                      detailBadgeClass(detail, activeDetailResult ?? detail.result),
                    ]"
                  >
                    {{ formatDetailBadge(detail, activeDetailResult ?? detail.result) }}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {{ formatDetailTitle(detail, activeDetailResult ?? detail.result) }} / {{ formatDetailRank(detail, activeDetailResult ?? detail.result) }}
                </DialogDescription>
              </DialogHeader>

              <div class="rank-border-detail-grid">
                <section class="rank-border-detail-profile rounded-md border bg-muted/15 p-3">
                  <div
                    :class="[
                      'rank-border-detail-profile__body',
                      shouldRenderProfileAssets ? 'rank-border-detail-profile__body--assets' : 'rank-border-detail-profile__body--plain',
                    ]"
                  >
                    <div
                      v-if="shouldRenderProfileAssets"
                      class="rank-border-leader rank-border-leader--dialog"
                    >
                      <img
                        v-if="leaderThumbnailUrl(detail.result)"
                        class="rank-border-leader__base"
                        :src="leaderThumbnailUrl(detail.result) ?? ''"
                        :alt="leaderCardLabel(detail.result) ?? ''"
                        loading="lazy"
                        @error="hideBrokenImage"
                      >
                      <UserRound v-else class="rank-border-leader__fallback size-7" />
                      <span v-if="leaderThumbnailUrl(detail.result)" class="rank-border-leader__level-band" aria-hidden="true" />
                      <span v-if="leaderLevelLabel(detail.result)" class="rank-border-leader__level">{{ leaderLevelLabel(detail.result) }}</span>
                      <img
                        v-if="leaderCardFrameUrl(detail.result)"
                        class="rank-border-leader__frame"
                        :src="leaderCardFrameUrl(detail.result) ?? ''"
                        alt=""
                        loading="lazy"
                        @error="hideBrokenImage"
                      >
                      <img
                        v-if="leaderAttrIconUrl(detail.result)"
                        class="rank-border-leader__attr"
                        :src="leaderAttrIconUrl(detail.result) ?? ''"
                        alt=""
                        loading="lazy"
                        @error="hideBrokenImage"
                      >
                      <span v-if="leaderRareIconUrl(detail.result) && leaderRareCount(detail.result) > 0" class="rank-border-leader__stars" aria-hidden="true">
                        <img
                          v-for="starIndex in leaderRareCount(detail.result)"
                          :key="starIndex"
                          class="rank-border-leader__star"
                          :src="leaderRareIconUrl(detail.result) ?? ''"
                          alt=""
                          loading="lazy"
                          @error="hideBrokenImage"
                        >
                      </span>
                      <img
                        v-if="leaderMasterRankUrl(detail.result)"
                        class="rank-border-leader__train-rank"
                        :src="leaderMasterRankUrl(detail.result) ?? ''"
                        :alt="leaderMasterRankLabel(detail.result) ?? ''"
                        loading="lazy"
                        @error="hideBrokenImage"
                      >
                    </div>
                    <div class="rank-border-detail-profile__copy">
                      <p class="truncate text-sm text-muted-foreground">{{ formatUserLabel(isLatestResult(detail.result) ? detail.result : null) }}</p>
                      <div class="rank-border-detail-profile__score">
                        <p class="rank-border-detail-rank">{{ formatDetailRank(detail, activeDetailResult ?? detail.result) }}</p>
                        <p
                          :class="[
                            'rank-border-live-number rank-border-detail-score',
                            detailScoreChanged ? 'rank-border-live-number--changed' : '',
                          ]"
                        >
                          {{ formatPt((activeDetailResult ?? detail.result).score) }}
                        </p>
                      </div>
                      <p class="mt-1 truncate text-xs text-muted-foreground">{{ t("rankBorder.result.latestPlain") }} {{ formatTimestamp((activeDetailResult ?? detail.result).timestamp) }}</p>
                    </div>
                    <div
                      v-if="shouldRenderProfileAssets && profileHonorViews(detail.result, 3, detailHonorKeyScope(detail)).length > 0"
                      class="rank-border-honor-strip rank-border-honor-strip--detail"
                    >
                    <span
                      v-for="honor in profileHonorViews(detail.result, 3, detailHonorKeyScope(detail))"
                      :key="honor.key"
                      class="rank-border-honor rank-border-honor--detail"
                      :title="`${honor.label} ${honorLevelLabel(honor)}`.trim()"
                    >
                      <span v-if="honor.type === 'normal' && honor.baseUrl" class="rank-border-honor-visual">
                        <svg class="rank-border-honor-svg" viewBox="0 0 180 80" aria-hidden="true" focusable="false">
                          <image :href="honor.baseUrl" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                          <image
                            v-if="honor.frameUrl"
                            :href="honor.frameUrl"
                            v-bind="honorFrameSvgAttrs(honor)"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-if="honor.rankUrl"
                            :href="honor.rankUrl"
                            v-bind="honorRankSvgAttrs(honor)"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-if="honor.scrollUrl"
                            :href="honor.scrollUrl"
                            x="37"
                            y="3"
                            width="101"
                            height="75"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-for="star in honorLevelStars(honor)"
                            :key="star.key"
                            :href="star.url"
                            :x="50 + star.slot * 16"
                            y="61"
                            width="16"
                            height="16"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                          <text
                            v-if="honor.fcApLevel"
                            class="rank-border-honor-fcap-text"
                            x="87"
                            y="57"
                            text-anchor="middle"
                            dominant-baseline="middle"
                          >
                            {{ honor.fcApLevel }}
                          </text>
                        </svg>
                      </span>
                      <span v-else-if="honor.type === 'bonds' && honor.bondsLeftBgUrl && honor.bondsRightBgUrl" class="rank-border-honor-visual rank-border-honor-visual--bonds">
                        <svg class="rank-border-honor-svg" viewBox="0 0 180 80" aria-hidden="true" focusable="false">
                          <defs>
                            <mask :id="honorSvgId(honor, 'mask')" maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="80" style="mask-type: alpha">
                              <image href="/rank-border/honor/mask_degree_sub.png" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                            </mask>
                            <clipPath :id="honorSvgId(honor, 'left-bg')">
                              <rect x="0" y="0" width="93" height="80" />
                            </clipPath>
                            <clipPath :id="honorSvgId(honor, 'left-icon')">
                              <rect x="0" y="0" width="90" height="80" />
                            </clipPath>
                            <clipPath :id="honorSvgId(honor, 'right-icon')">
                              <rect x="90" y="0" width="90" height="80" />
                            </clipPath>
                          </defs>
                          <g :mask="`url(#${honorSvgId(honor, 'mask')})`">
                            <image :href="honor.bondsRightBgUrl" x="0" y="0" width="180" height="80" preserveAspectRatio="none" @error="hideBrokenImage" />
                            <image
                              :href="honor.bondsLeftBgUrl"
                              x="0"
                              y="0"
                              width="180"
                              height="80"
                              preserveAspectRatio="none"
                              :clip-path="`url(#${honorSvgId(honor, 'left-bg')})`"
                              @error="hideBrokenImage"
                            />
                            <image
                              v-if="honor.bondsLeftIconUrl"
                              :href="honor.bondsLeftIconUrl"
                              x="-4"
                              y="-29"
                              width="128"
                              height="109"
                              preserveAspectRatio="none"
                              :clip-path="`url(#${honorSvgId(honor, 'left-icon')})`"
                              @error="hideBrokenImage"
                            />
                            <image
                              v-if="honor.bondsRightIconUrl"
                              :href="honor.bondsRightIconUrl"
                              x="56"
                              y="-29"
                              width="128"
                              height="109"
                              preserveAspectRatio="none"
                              :clip-path="`url(#${honorSvgId(honor, 'right-icon')})`"
                              @error="hideBrokenImage"
                            />
                          </g>
                          <image
                            v-if="honor.frameUrl"
                            :href="honor.frameUrl"
                            v-bind="honorFrameSvgAttrs(honor)"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                          <image
                            v-for="star in honorLevelStars(honor)"
                            :key="star.key"
                            :href="star.url"
                            :x="50 + star.slot * 16"
                            y="61"
                            width="16"
                            height="16"
                            preserveAspectRatio="none"
                            @error="hideBrokenImage"
                          />
                        </svg>
                      </span>
                      <span v-else class="rank-border-honor-fallback">{{ honor.label }}</span>
                    </span>
                    </div>
                  </div>
                </section>

                <section class="rank-border-detail-stats rounded-md border bg-muted/15 p-2 sm:p-3">
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.hourlySpeed") }}</p>
                    <strong>{{ formatPerHour(detailTraceStats.hourlySpeed) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.recentAveragePt") }}</p>
                    <strong>{{ formatPt(detailTraceStats.recentAveragePt) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.latestPointGrowth") }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.latestPointGrowth) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.twentyMinTripleSpeed") }}</p>
                    <strong>{{ formatPerHour(detailTraceStats.threeWindowSpeed) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.loopCount") }}</p>
                    <strong>{{ formatLoopCount(detailTraceStats.loopCount) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ t("rankBorder.result.rankShift") }}</p>
                    <strong>{{ formatRankShift(detailTraceStats.rankShift) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ previousDetailLabel(detail) }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.previousGap) }}</strong>
                  </div>
                  <div class="rank-border-stat">
                    <p>{{ nextDetailLabel(detail) }}</p>
                    <strong>{{ formatGrowth(detailTraceStats.nextGap) }}</strong>
                  </div>
                </section>

	                <section class="rank-border-trend-panel grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
	                  <div class="flex items-center justify-between gap-2">
	                    <h3 class="text-sm font-semibold">{{ t("rankBorder.result.trendSection") }}</h3>
	                    <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
	                  </div>

                  <div v-if="detailTraceLoading && !detailTraceStats.hasChart" class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    {{ t("rankBorder.result.waitingTrace") }}
                  </div>
                  <div v-else-if="detailTraceStats.hasChart" class="rank-border-trend-grid">
                    <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ t("rankBorder.result.rtrChart") }}</p>
                        <span class="text-xs text-muted-foreground">RT</span>
                      </div>
                      <div class="rank-border-chart-frame rank-border-chart-frame--detail">
                        <div class="rank-border-chart-plot">
                          <svg
                            class="rank-border-chart-svg text-sky-600 dark:text-sky-300"
                            :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
                            preserveAspectRatio="none"
                            aria-label="rank trend"
                          >
                            <line
                              v-for="line in detailCharts.rankReferenceLines"
                              :key="`dialog-rtr-grid-${line.value}`"
                              class="rank-border-chart-grid"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <path class="rank-border-detail-line" :d="detailCharts.rankPath" />
                          </svg>
                          <button
                            v-for="point in detailCharts.rankPoints"
                            :key="point.key"
                            type="button"
                            class="rank-border-chart-point"
                            :style="chartPointStyle(point)"
                            :aria-label="point.label"
                            @mouseenter="showRankBorderTooltip($event, point.label)"
                            @mousemove="moveRankBorderTooltip($event)"
                            @mouseleave="hideRankBorderTooltip"
                          />
                        </div>
                        <div class="rank-border-chart-labels" aria-hidden="true">
                          <span
                            v-for="line in detailCharts.rankReferenceLines"
                            :key="`dialog-rtr-label-${line.value}`"
                            class="rank-border-chart-label"
                            :style="{ top: chartLabelTop(line) }"
                          >
                            {{ line.label }}
                          </span>
                        </div>
                      </div>
                      <div class="rank-border-chart-time-axis" aria-hidden="true">
                        <span
                          v-for="tick in detailCharts.timeTicks"
                          :key="tick.key"
                          :style="{ left: tick.left }"
                        >
                          {{ tick.label }}
                        </span>
                      </div>
                    </div>

                    <div class="min-h-0 rounded-md border bg-background/70 p-2.5">
                      <div class="mb-1.5 flex items-center justify-between gap-2">
                        <p class="text-sm font-medium">{{ t("rankBorder.result.ptrChart") }}</p>
                        <span class="text-xs text-muted-foreground">pt</span>
                      </div>
                      <div class="rank-border-chart-frame rank-border-chart-frame--detail">
                        <div class="rank-border-chart-plot">
                          <svg
                            class="rank-border-chart-svg text-cyan-600 dark:text-cyan-300"
                            :viewBox="`0 0 ${DETAIL_CHART_WIDTH} ${DETAIL_CHART_HEIGHT}`"
                            preserveAspectRatio="none"
                            aria-label="score trend"
                          >
                            <line
                              v-for="line in detailCharts.scoreReferenceLines"
                              :key="`dialog-ptr-grid-${line.value}`"
                              class="rank-border-chart-grid"
                              x1="0"
                              :x2="DETAIL_CHART_WIDTH"
                              :y1="line.y"
                              :y2="line.y"
                            />
                            <path class="rank-border-detail-line" :d="detailCharts.scorePath" />
                          </svg>
                          <button
                            v-for="point in detailCharts.scorePoints"
                            :key="point.key"
                            type="button"
                            class="rank-border-chart-point"
                            :style="chartPointStyle(point)"
                            :aria-label="point.label"
                            @mouseenter="showRankBorderTooltip($event, point.label)"
                            @mousemove="moveRankBorderTooltip($event)"
                            @mouseleave="hideRankBorderTooltip"
                          />
                        </div>
                        <div class="rank-border-chart-labels" aria-hidden="true">
                          <span
                            v-for="line in detailCharts.scoreReferenceLines"
                            :key="`dialog-ptr-label-${line.value}`"
                            class="rank-border-chart-label"
                            :style="{ top: chartLabelTop(line) }"
                          >
                            {{ line.label }}
                          </span>
                        </div>
                      </div>
                      <div class="rank-border-chart-time-axis" aria-hidden="true">
                        <span
                          v-for="tick in detailCharts.timeTicks"
                          :key="tick.key"
                          :style="{ left: tick.left }"
                        >
                          {{ tick.label }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div v-else class="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    {{ t("rankBorder.result.emptyTrace") }}
                  </div>
                </section>

                <div class="rank-border-detail-history">
                  <section class="rank-border-heatmap-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
                    <div class="flex items-center justify-between gap-2">
                      <h3 class="text-sm font-semibold">{{ t("rankBorder.result.heatmapTitle") }}</h3>
                      <span class="text-right text-xs text-muted-foreground">
                        {{ t("rankBorder.result.dailyHours") }} · {{ t("rankBorder.result.heatmapHint") }}
                      </span>
                    </div>
                    <div v-if="hasDetailHeatmap" class="rank-border-heatmap-panel">
                      <div class="rank-border-heatmap-row rank-border-heatmap-row--header" aria-hidden="true">
                        <span class="rank-border-heatmap-corner" />
                        <div class="rank-border-heatmap-hours">
                          <span v-for="hour in DETAIL_HEATMAP_HOURS_PER_DAY" :key="`heatmap-hour-${hour}`">{{ hour }}</span>
                        </div>
                      </div>
                      <div
                        v-for="day in detailHeatmapDays"
                        :key="day.key"
                        class="rank-border-heatmap-row"
                      >
                        <span class="rank-border-heatmap-day-label">
                          <span>{{ day.label }}</span>
                        </span>
                        <div class="rank-border-heatmap rank-border-heatmap--detail">
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
	                            @mouseenter="showRankBorderTooltip($event, cell.label)"
	                            @mousemove="moveRankBorderTooltip($event)"
	                            @mouseleave="hideRankBorderTooltip"
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

	                  <section v-if="detailUpdateRecords.length > 0" class="rank-border-update-section grid min-w-0 gap-2 rounded-md border bg-muted/15 p-3">
	                    <div class="flex items-center justify-between gap-2">
	                      <h3 class="text-sm font-semibold">{{ t("rankBorder.result.updateLog") }}</h3>
	                      <span class="text-xs text-muted-foreground">{{ detailTraceScopeLabel }}</span>
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
                          v-for="record in detailUpdateRecords"
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
          </DialogContent>
        </Dialog>
      </Card>
    </div>

    <div
      v-if="rankBorderTooltip.visible"
      class="rank-border-tooltip"
      :style="{ left: `${rankBorderTooltip.x}px`, top: `${rankBorderTooltip.y}px` }"
    >
      {{ rankBorderTooltip.label }}
    </div>
  </div>
</template>

<style scoped>
@font-face {
  font-family: "RankBorderSourceHanSansSC";
  font-display: swap;
  font-style: normal;
  font-weight: 700;
  src: url("/rank-border/fonts/SourceHanSansSC-Bold.ttf") format("truetype");
}

.rank-border-live-dot {
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: rgb(16 185 129);
  box-shadow: 0 0 0 0 rgb(16 185 129 / 0.34);
  animation: rank-border-live-pulse 1.6s ease-out infinite;
}

.rank-border-live-number {
  display: inline-block;
  align-items: baseline;
  backface-visibility: hidden;
  transform-origin: center;
  transition: color 180ms ease, opacity 180ms ease;
  will-change: transform, color;
}

.rank-border-live-number--changed {
  color: rgb(5 150 105);
  animation: rank-border-number-lift 520ms cubic-bezier(0.22, 1, 0.36, 1);
}

.rank-border-query-grid {
  display: grid;
  min-width: 0;
  gap: 0.625rem;
  grid-template-columns: minmax(0, 1fr);
}

.rank-border-query-grid > * {
  min-width: 0;
}

.rank-border-query-field {
  display: grid;
  min-width: 0;
  gap: 0.375rem;
}

.rank-border-query-field .text-sm,
.rank-border-query-field label {
  min-width: 0;
}

.rank-border-event-combobox-trigger {
  min-width: 0;
}

.rank-border-event-combobox-content {
  width: min(92vw, 42rem);
}

.rank-border-world-bloom-select-trigger {
  min-width: 0;
  height: auto;
  min-height: 2.25rem;
}

.rank-border-world-bloom-select-trigger :deep([data-slot="select-value"]) {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.25;
  text-align: left;
}

.rank-border-world-bloom-select-content {
  width: min(92vw, 42rem);
}

.rank-border-world-bloom-select-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.35;
  white-space: normal;
}

.rank-border-world-bloom-select-item__badge {
  flex: 0 0 auto;
  border: 1px solid color-mix(in oklab, rgb(8 145 178) 34%, transparent);
  border-radius: 9999px;
  background: color-mix(in oklab, rgb(8 145 178) 10%, transparent);
  padding: 0.0625rem 0.375rem;
  color: rgb(14 116 144);
  font-size: 0.6875rem;
  font-weight: 700;
}

@media (min-width: 1024px) {
  .rank-border-query-grid--normal {
    grid-template-columns: minmax(5.8rem, 7.5rem) minmax(8rem, 11rem) minmax(22rem, 1fr) minmax(7rem, 8.5rem);
  }

  .rank-border-query-grid--world-bloom {
    grid-template-areas: "region mode event world interval";
    grid-template-columns:
      minmax(5.6rem, 7.5rem)
      minmax(8rem, 10.5rem)
      minmax(18rem, 1.25fr)
      minmax(18rem, 1fr)
      minmax(7.4rem, 8.8rem);
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--region {
    grid-area: region;
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--mode {
    grid-area: mode;
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--event {
    grid-area: event;
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--world-bloom {
    grid-area: world;
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--interval {
    grid-area: interval;
  }
}

@media (min-width: 1024px) and (max-width: 1180px) {
  .rank-border-query-grid--world-bloom {
    grid-template-areas:
      "region mode interval"
      "event event event"
      "world world world";
    grid-template-columns: minmax(5.6rem, 1fr) minmax(8rem, 1.25fr) minmax(7.4rem, 1fr);
  }
}

@media (min-width: 1181px) and (max-width: 1450px) {
  .rank-border-query-grid--world-bloom {
    grid-template-areas:
      "region mode event event"
      "interval world world world";
    grid-template-columns: minmax(5.6rem, 7.5rem) minmax(8rem, 10.5rem) minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (min-width: 640px) and (max-width: 1023px) {
  .rank-border-query-grid--normal {
    grid-template-columns: minmax(7rem, 0.7fr) minmax(8rem, 0.8fr) minmax(18rem, 2fr) minmax(7rem, 0.7fr);
  }

  .rank-border-query-grid--world-bloom {
    grid-template-columns: minmax(7rem, 0.8fr) minmax(8rem, 1fr) minmax(7rem, 0.8fr);
  }

  .rank-border-query-grid--world-bloom .rank-border-query-field--event,
  .rank-border-query-grid--world-bloom .rank-border-query-field--world-bloom {
    grid-column: 1 / -1;
  }
}

.rank-border-table-shell {
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
}

.rank-border-table-header,
.rank-border-table-row {
  display: grid;
  min-width: 0;
  align-items: center;
}

.rank-border-table-header {
  position: sticky;
  top: 0;
  z-index: 3;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--muted) 45%, var(--background));
  color: var(--muted-foreground);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.5rem 0.75rem;
}

.rank-border-table-row {
  width: 100%;
  min-height: 4.375rem;
  border: 0;
  padding: 0.5rem 0.75rem;
}

.rank-border-top-list {
  position: relative;
  overflow: visible;
}

.rank-border-top-item {
  position: relative;
  transform: translateZ(0);
  will-change: transform;
}

.rank-border-row-move,
.rank-border-row-enter-active,
.rank-border-row-leave-active {
  transition:
    transform 420ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.rank-border-row-enter-from,
.rank-border-row-leave-to {
  opacity: 0.88;
  transform: translateY(0.125rem);
}

.rank-border-row-leave-active {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 1;
}

.rank-border-top-header,
.rank-border-top-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.85rem, 13vw, 10.25rem);
  column-gap: 0.75rem;
}

.rank-border-segment-header,
.rank-border-segment-row {
  grid-template-columns: 4.75rem minmax(0, 1fr) clamp(6.75rem, 12vw, 9.25rem);
  column-gap: 0.75rem;
}

.rank-border-rank-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.rank-border-player-scroll {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.rank-border-player-scroll::-webkit-scrollbar {
  display: none;
}

.rank-border-player-track {
  display: grid;
  width: 100%;
  min-width: 0;
  align-items: center;
  gap: 0.75rem;
  padding-block: 0.125rem;
  padding-inline-end: 0.75rem;
}

.rank-border-player-track--assets {
  grid-template-columns: auto minmax(0, 1fr);
}

.rank-border-player-track--plain {
  min-width: 0;
}

.rank-border-player-copy {
  display: grid;
  min-width: 0;
  gap: 0.375rem;
}

.rank-border-player-name {
  min-width: 0;
  max-width: 22rem;
  overflow: hidden;
  color: var(--foreground);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-score-cell {
  position: relative;
  z-index: 2;
  display: grid;
  min-width: 0;
  justify-items: end;
  gap: 0.25rem;
  align-self: stretch;
  align-content: center;
  padding-inline-start: 0.25rem;
  text-align: right;
}

.rank-border-score-cell::before {
  position: absolute;
  inset-block: -0.5rem;
  inset-inline-start: -0.5rem;
  z-index: -1;
  width: calc(100% + 0.5rem);
  content: "";
  background: linear-gradient(
    90deg,
    color-mix(in oklab, var(--background) 0%, transparent),
    color-mix(in oklab, var(--background) 86%, transparent) 1rem,
    color-mix(in oklab, var(--background) 96%, transparent)
  );
}

.rank-border-row-score {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  font-size: clamp(0.9375rem, 1.65vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-leader {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  overflow: hidden;
  border-radius: 7.8125%;
  background: var(--muted);
  color: var(--muted-foreground);
  container-type: inline-size;
  isolation: isolate;
  box-shadow:
    0 0 0 1px color-mix(in oklab, var(--border) 82%, transparent),
    0 0.1875rem 0.5rem rgb(15 23 42 / 0.12);
}

.rank-border-leader :where(img) {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.rank-border-leader__base {
  z-index: 0;
  object-fit: cover;
}

.rank-border-leader__fallback {
  position: relative;
  z-index: 1;
}

.rank-border-leader__level-band {
  position: absolute;
  z-index: 1;
  inset-inline: 0;
  bottom: 0;
  height: 18.75%;
  background: rgb(70 70 100);
  content: "";
  pointer-events: none;
}

.rank-border-leader__frame {
  z-index: 2;
  object-fit: fill;
}

.rank-border-leader__attr {
  position: absolute;
  inset: 0 auto auto 0;
  z-index: 4;
  width: 24%;
  height: 25%;
  object-fit: contain;
  pointer-events: none;
}

.rank-border-leader__stars {
  position: absolute;
  z-index: 5;
  inset-inline-start: 5%;
  bottom: 20%;
  display: flex;
  width: 72%;
  height: 15%;
  gap: 1px;
  pointer-events: none;
}

.rank-border-leader__stars .rank-border-leader__star {
  position: static;
  flex: 0 0 18%;
  min-width: 0;
  width: 18%;
  height: 100%;
  object-fit: contain;
}

.rank-border-leader__level {
  position: absolute;
  z-index: 5;
  inset-block-start: auto;
  inset-inline-start: 4.6875%;
  bottom: 2.5%;
  max-width: 58%;
  overflow: hidden;
  color: white;
  font-family: "RankBorderSourceHanSansSC", "Source Han Sans SC", "Source Han Sans CN", "Noto Sans CJK SC", sans-serif;
  font-size: 0.55rem;
  font-size: 15.625cqw;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-leader__train-rank {
  inset: auto 0 0 auto;
  z-index: 5;
  width: 35%;
  height: 35%;
  object-fit: contain;
}

.rank-border-leader--row {
  width: 3.5rem;
  height: 3.5rem;
}

.rank-border-leader--detail {
  width: 3.25rem;
  height: 3.25rem;
}

.rank-border-leader--dialog {
  width: 4rem;
  height: 4rem;
}

.rank-border-honor-strip {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.25rem;
  overflow: visible;
}

.rank-border-honor-strip--row {
  flex-wrap: nowrap;
  gap: 0.25rem 0.375rem;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
}

.rank-border-honor-strip--row::-webkit-scrollbar {
  display: none;
}

.rank-border-honor-strip--detail {
  flex-wrap: nowrap;
  gap: 0.375rem;
  grid-column: 1 / -1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
}

.rank-border-honor {
  display: inline-flex;
  min-width: 0;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1;
}

.rank-border-honor-visual {
  position: relative;
  container-type: inline-size;
  display: block;
  width: 100%;
  height: 100%;
  aspect-ratio: 9 / 4;
  overflow: hidden;
  border-radius: 0;
  contain: paint;
}

.rank-border-honor-visual--bonds {
  background: color-mix(in oklab, var(--muted) 64%, transparent);
}

.rank-border-honor-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.rank-border-honor-fcap-text {
  fill: #fff;
  stroke: rgb(33 35 64 / 0.45);
  stroke-linejoin: round;
  stroke-width: 2;
  font-family: "RankBorderSourceHanSansSC", ui-sans-serif, system-ui, sans-serif;
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  paint-order: stroke fill;
  pointer-events: none;
}

.rank-border-honor-fallback {
  display: block;
  max-width: 100%;
  overflow: hidden;
  padding: 0 0.25rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-honor--row {
  width: 5rem;
  aspect-ratio: 9 / 4;
}

.rank-border-honor--detail {
  width: 6rem;
  aspect-ratio: 9 / 4;
}

.rank-border-live-card__metrics {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.rank-border-live-card__gaps {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

:global(.rank-border-detail-dialog.rank-border-detail-dialog) {
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  left: 50% !important;
  inset-inline-start: 50% !important;
  inset-inline-end: auto !important;
  display: grid;
  width: min(82rem, calc(100vw - 2rem));
  max-width: none;
  height: min(50rem, calc(100svh - 2rem));
  max-height: calc(100svh - 2rem);
  margin: 0;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 0.75rem;
  overflow: hidden;
  padding: 1rem;
  translate: -50% -50% !important;
  transform: none !important;
}

.rank-border-detail-dialog__header {
  min-width: 0;
  padding-right: 2rem;
}

.rank-border-detail-grid {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-columns: minmax(21rem, 0.96fr) minmax(24rem, 1.04fr);
  grid-template-rows: auto minmax(0, 1fr);
  grid-template-areas:
    "profile stats"
    "trend heatmap";
  align-items: start;
  gap: 0.75rem;
  overflow: hidden;
}

.rank-border-detail-profile,
.rank-border-trend-panel,
.rank-border-detail-history,
.rank-border-heatmap-section,
.rank-border-update-section {
  min-height: 0;
  overflow: hidden;
}

.rank-border-detail-profile {
  display: grid;
  grid-area: profile;
  align-self: start;
}

.rank-border-detail-profile__body {
  display: grid;
  min-width: 0;
  min-height: 0;
  align-content: start;
  align-items: start;
  gap: 0.75rem;
}

.rank-border-detail-profile__body--assets {
  grid-template-columns: auto minmax(0, 1fr);
}

.rank-border-detail-profile__body--plain {
  grid-template-columns: minmax(0, 1fr);
}

.rank-border-detail-profile__copy {
  display: grid;
  min-width: 0;
  align-content: start;
}

.rank-border-detail-profile__score {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.25rem 0.75rem;
  margin-top: 0.25rem;
}

.rank-border-detail-rank {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: clamp(1.5rem, 2.4vw, 2.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1.05;
}

.rank-border-detail-score {
  max-width: 100%;
  overflow-wrap: anywhere;
  padding-bottom: 0.125rem;
  font-size: clamp(0.9375rem, 1.45vw, 1.25rem);
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.1;
}

.rank-border-detail-stats {
  display: grid;
  grid-area: stats;
  min-width: 0;
  min-height: 0;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-self: start;
  align-content: start;
  gap: 0.5rem;
  overflow: hidden;
}

.rank-border-trend-grid {
  display: grid;
  min-height: 0;
  min-width: 0;
  grid-template-rows: repeat(2, minmax(9.75rem, 1fr));
  gap: 0.5rem;
}

.rank-border-trend-panel {
  grid-area: trend;
}

.rank-border-detail-history {
  display: grid;
  grid-area: heatmap;
  min-width: 0;
  min-height: 0;
  grid-template-rows: minmax(0, auto) minmax(8rem, 1fr);
  align-content: stretch;
  gap: 0.75rem;
  overflow: hidden;
}

.rank-border-heatmap-section {
  display: grid;
  grid-template-rows: auto minmax(0, auto);
  align-content: start;
  min-height: 0;
}

.rank-border-update-section {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  align-content: stretch;
  min-height: 0;
}

.rank-border-mobile-fact {
  display: grid;
  gap: 0.625rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 72%, transparent);
  background: color-mix(in oklab, var(--muted) 30%, transparent);
  padding: 0.625rem 0.75rem 0.75rem;
}

.rank-border-mobile-fact__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.rank-border-mobile-fact__metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
}

.rank-border-mobile-fact__metrics div,
.rank-border-mobile-fact__state {
  min-width: 0;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 82%, transparent);
  padding: 0.45rem 0.5rem;
}

.rank-border-mobile-fact__metrics span {
  display: block;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-fact__metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-fact__state {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
}

.rank-border-mobile-fact__state--error {
  border-color: color-mix(in oklab, var(--destructive) 52%, var(--border));
  background: color-mix(in oklab, var(--destructive) 8%, var(--background));
  color: var(--destructive);
}

.rank-border-mobile-locator {
  display: grid;
  min-width: 0;
  gap: 0.625rem;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  padding: 0.625rem;
  box-shadow: 0 8px 22px rgb(15 23 42 / 0.08);
}

.rank-border-mobile-locator__head {
  display: grid;
  min-width: 0;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
}

.rank-border-mobile-locator__metrics {
  display: grid;
  min-width: 0;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.375rem;
}

.rank-border-mobile-locator__metrics div,
.rank-border-mobile-locator__state {
  min-width: 0;
  border: 1px solid color-mix(in oklab, var(--border) 76%, transparent);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 84%, transparent);
  padding: 0.45rem 0.5rem;
}

.rank-border-mobile-locator__metrics span {
  display: block;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  line-height: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-locator__metrics strong {
  display: block;
  overflow: hidden;
  margin-top: 0.125rem;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 650;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-mobile-locator__state {
  color: var(--muted-foreground);
  font-size: 0.8125rem;
}

.rank-border-mobile-locator__state--error {
  border-color: color-mix(in oklab, var(--destructive) 52%, var(--border));
  background: color-mix(in oklab, var(--destructive) 8%, var(--background));
  color: var(--destructive);
}

.rank-border-replay-rail {
  display: grid;
  gap: 0.5rem;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 82%, transparent);
  padding: 0.625rem;
}

.rank-border-replay-rail__meta {
  display: flex;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.rank-border-replay-rail__track {
  display: grid;
  min-width: 0;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.625rem;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-replay-range {
  min-width: 0;
  accent-color: rgb(8 145 178);
}

.rank-border-jump-rail {
  position: sticky;
  top: 4rem;
  z-index: 24;
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.625rem;
  overflow: hidden;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, transparent);
  padding: 0.45rem 0.625rem;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.1);
  backdrop-filter: blur(14px);
}

.rank-border-jump-rail__bars {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: end;
  justify-content: space-between;
  gap: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  padding: 0.25rem 0.0625rem;
}

.rank-border-jump-bar {
  appearance: none;
  flex: 0 0 0.12rem;
  width: 0.12rem;
  min-width: 0.12rem;
  max-width: 0.12rem;
  height: 1.35rem;
  border: 0;
  border-radius: 0.0625rem;
  background: color-mix(in oklab, var(--muted-foreground) 28%, transparent);
  cursor: pointer;
  padding: 0;
  transform-origin: bottom center;
  transition: background-color 140ms ease, height 140ms ease, opacity 140ms ease;
}

.rank-border-jump-bar:hover,
.rank-border-jump-bar:focus-visible {
  background: rgb(8 145 178);
  height: 2.05rem;
  outline: none;
}

.rank-border-jump-bar--active {
  background: rgb(6 182 212);
  height: 1.75rem;
}

.rank-border-sparkline,
.rank-border-detail-line {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.rank-border-sparkline {
  stroke-width: 2.25;
}

.rank-border-detail-line {
  stroke-width: 1.85;
  vector-effect: non-scaling-stroke;
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

.rank-border-chart-frame {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.75rem;
  gap: 0.5rem;
  height: 6rem;
  min-width: 0;
}

.rank-border-chart-frame--dialog {
  height: 8.75rem;
}

.rank-border-chart-frame--detail {
  height: 7.15rem;
}

.rank-border-chart-plot {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-svg {
  width: 100%;
  height: 100%;
  min-width: 0;
  overflow: hidden;
}

.rank-border-chart-labels {
  position: relative;
  min-width: 0;
  height: 100%;
}

.rank-border-chart-label {
  position: absolute;
  right: 0;
  max-width: 100%;
  transform: translateY(-50%);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  overflow: hidden;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-border-sparkline-baseline,
.rank-border-chart-grid {
  fill: none;
  stroke: var(--border);
  stroke-width: 1;
  opacity: 0.7;
}

.rank-border-chart-grid {
  stroke-dasharray: 3 3;
  opacity: 0.74;
}

.rank-border-chart-point {
  position: absolute;
  z-index: 2;
  width: 1.05rem;
  height: 1.05rem;
  transform: translate(-50%, -50%);
  border: 0.125rem solid transparent;
  border-radius: 9999px;
  background: transparent;
  cursor: crosshair;
  opacity: 0;
  padding: 0;
  transition: background-color 140ms ease, border-color 140ms ease, opacity 140ms ease, transform 140ms ease, box-shadow 140ms ease;
}

.rank-border-chart-point:hover {
  transform: translate(-50%, -50%) scale(1);
  border-color: currentColor;
  background: var(--background);
  box-shadow: 0 0 0 0.2rem color-mix(in oklab, currentColor 14%, transparent);
  opacity: 1;
}

.rank-border-chart-time-axis {
  position: relative;
  height: 1.15rem;
  margin-top: 0.45rem;
  margin-right: 5.25rem;
  border-top: 1px solid color-mix(in oklab, var(--border) 68%, transparent);
  color: var(--muted-foreground);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-chart-time-axis span {
  position: absolute;
  top: 0.35rem;
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 92%, transparent);
  padding-inline: 0.18rem;
  transform: translateX(-50%);
  white-space: nowrap;
}

.rank-border-heatmap {
  display: grid;
  min-width: 0;
}

.rank-border-heatmap-panel {
  display: grid;
  --rank-border-heatmap-label-width: 2.75rem;
  --rank-border-heatmap-gap: 0.125rem;
  --rank-border-heatmap-min-cell-size: 1.08rem;
  --rank-border-heatmap-cell-size: clamp(1.08rem, 1.56vw, 1.34rem);
  --rank-border-heatmap-grid-width: max(
    calc(100% - var(--rank-border-heatmap-label-width) - 0.375rem),
    calc(var(--rank-border-heatmap-min-cell-size) * 24 + var(--rank-border-heatmap-gap) * 23)
  );
  min-width: 0;
  min-height: 0;
  max-height: 15.75rem;
  gap: 0.25rem;
  overflow-x: auto;
  overflow-y: auto;
  overscroll-behavior-x: contain;
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

.rank-border-heatmap--detail {
  width: var(--rank-border-heatmap-grid-width);
  grid-template-columns: repeat(24, minmax(var(--rank-border-heatmap-min-cell-size), 1fr));
  gap: var(--rank-border-heatmap-gap);
  min-height: 0;
  justify-content: stretch;
  overflow: visible;
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
  height: 100%;
  min-height: 0;
  max-height: none;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  background: color-mix(in oklab, var(--background) 74%, transparent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

.rank-border-update-log__title {
  border-bottom: 1px solid var(--border);
  padding: 0.32rem 0.5rem;
  color: var(--foreground);
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.15;
}

.rank-border-update-log__header,
.rank-border-update-log__row {
  display: grid;
  grid-template-columns: 3.8rem 3rem 5rem minmax(7.25rem, 1fr);
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

@keyframes rank-border-live-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0.34);
  }

  70% {
    box-shadow: 0 0 0 0.45rem rgb(16 185 129 / 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(16 185 129 / 0);
  }
}

@keyframes rank-border-number-lift {
  0% {
    transform: translateY(0);
    filter: brightness(1);
  }

  38% {
    transform: translateY(-0.12rem);
    filter: brightness(1.12);
  }

  100% {
    transform: translateY(0);
    filter: brightness(1);
  }
}

@media (min-width: 768px) and (max-width: 1180px) {
  :global(.rank-border-detail-dialog.rank-border-detail-dialog) {
    width: min(68rem, calc(100vw - 1.5rem));
    height: min(49rem, calc(100svh - 1.5rem));
    grid-template-rows: auto auto;
    align-content: start;
    gap: 0.625rem;
    overflow-y: auto;
    padding: 0.75rem;
  }

  .rank-border-detail-grid {
    grid-template-columns: minmax(17.5rem, 0.9fr) minmax(21rem, 1.1fr);
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.625rem;
    overflow: visible;
  }

  .rank-border-leader--dialog {
    width: 3.25rem;
    height: 3.25rem;
  }

  .rank-border-honor--detail {
    width: 4.75rem;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.75rem;
  }

  .rank-border-detail-profile__body {
    gap: 0.625rem;
  }

  .rank-border-detail-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.375rem;
    padding: 0.75rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    margin-top: 0.125rem;
    font-size: 0.8125rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 4.1rem;
    gap: 0.375rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.5rem;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.35rem;
    gap: 0.25rem;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3.4rem 2.8rem 4.8rem minmax(6.8rem, 1fr);
    gap: 0.25rem;
    padding: 0.2rem 0.375rem;
  }
}

@media (min-width: 768px) and (max-width: 1100px) {
  .rank-border-live-aside {
    position: static;
    max-height: none;
    overflow: visible;
  }

  .rank-border-live-card__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .rank-border-live-card__metrics,
  .rank-border-live-card__gaps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rank-border-top-header,
  .rank-border-top-row {
    grid-template-columns: 4.25rem minmax(0, 1fr) 8.4rem;
  }

  .rank-border-segment-header,
  .rank-border-segment-row {
    grid-template-columns: 4.25rem minmax(0, 1fr) 8rem;
  }

  .rank-border-player-name {
    max-width: 18rem;
  }

  .rank-border-row-score {
    font-size: clamp(0.875rem, 1.55vw, 1.0625rem);
  }
}

@media (min-width: 768px) and (max-width: 900px) {
  :global(.rank-border-detail-dialog.rank-border-detail-dialog) {
    top: 50% !important;
    right: auto !important;
    bottom: auto !important;
    left: 50% !important;
    inset-inline-start: 50% !important;
    inset-inline-end: auto !important;
    width: calc(100vw - 1rem);
    max-width: calc(100vw - 1rem);
    height: calc(100svh - 1rem);
    max-height: calc(100svh - 1rem);
    margin: 0;
    translate: -50% -50% !important;
    transform: none !important;
  }

  .rank-border-detail-grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-template-areas:
      "profile"
      "stats"
      "trend"
      "heatmap";
    padding-bottom: 0.625rem;
    overflow: visible;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto minmax(10rem, auto);
    overflow: visible;
  }

  .rank-border-detail-profile__body--assets {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
  }

  .rank-border-update-log {
    height: auto;
    max-height: 14rem;
  }
}

@media (min-width: 768px) and (max-height: 840px) {
  :global(.rank-border-detail-dialog.rank-border-detail-dialog) {
    height: calc(100svh - 1rem);
    grid-template-rows: auto auto;
    align-content: start;
    overflow-y: auto;
    padding: 0.625rem;
  }

  .rank-border-detail-dialog__header {
    padding-right: 2rem;
  }

  .rank-border-detail-dialog__header :deep([data-slot="dialog-title"]) {
    font-size: 1rem;
    line-height: 1.25;
  }

  .rank-border-detail-dialog__header :deep([data-slot="dialog-description"]) {
    font-size: 0.75rem;
    line-height: 1.25;
  }

  .rank-border-detail-grid {
    grid-template-rows: auto auto;
    overflow: visible;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
    padding: 0.625rem;
  }

  .rank-border-detail-rank {
    font-size: clamp(1.25rem, 2vw, 1.75rem);
  }

  .rank-border-detail-score {
    font-size: clamp(0.875rem, 1.35vw, 1.0625rem);
  }

  .rank-border-leader--dialog {
    width: 3rem;
    height: 3rem;
  }

  .rank-border-honor--detail {
    width: 4.25rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.35rem;
  }

  .rank-border-trend-grid {
    gap: 0.375rem;
  }

  .rank-border-update-log__title,
  .rank-border-update-log__header,
  .rank-border-update-log__row {
    padding-block: 0.1875rem;
  }
}

@media (max-width: 767px) {
  .rank-border-table-header {
    display: none;
  }

  .rank-border-table-row {
    min-height: 3.75rem;
    padding: 0.5rem 0.625rem;
  }

  .rank-border-top-row {
    grid-template-columns: 3.1rem minmax(0, 1fr) minmax(5.3rem, 5.95rem);
    column-gap: 0.375rem;
  }

  .rank-border-segment-row {
    grid-template-columns: 3.8rem minmax(0, 1fr) minmax(5.3rem, 5.95rem);
    column-gap: 0.375rem;
  }

  .rank-border-player-track {
    gap: 0.5rem;
    padding-inline-end: 0.5rem;
  }

  .rank-border-player-track--assets {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .rank-border-player-name {
    max-width: 9.75rem;
    font-size: 0.8125rem;
  }

  .rank-border-leader--row {
    width: 2.65rem;
    height: 2.65rem;
  }

  .rank-border-honor-strip--row {
    gap: 0.1875rem;
  }

  .rank-border-honor--row {
    width: 3.9rem;
  }

  .rank-border-score-cell {
    gap: 0.15rem;
    padding-inline-start: 0.125rem;
  }

  .rank-border-score-cell::before {
    inset-inline-start: -0.375rem;
    width: calc(100% + 0.375rem);
  }

  .rank-border-row-score {
    font-size: 0.8125rem;
  }

  :global(.rank-border-detail-dialog.rank-border-detail-dialog) {
    position: fixed !important;
    top: 50% !important;
    right: auto !important;
    bottom: auto !important;
    left: 50% !important;
    inset: auto !important;
    inset-block-start: 50% !important;
    inset-block-end: auto !important;
    inset-inline-start: 50% !important;
    inset-inline-end: auto !important;
    width: min(30rem, calc(100vw - 1rem)) !important;
    max-width: calc(100vw - 1rem) !important;
    height: min(44rem, calc(100svh - 1rem));
    max-height: calc(100svh - 1rem);
    margin: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.5rem;
    overflow: hidden;
    overscroll-behavior: contain;
    border-radius: 0.875rem;
    padding: 0.625rem;
    --tw-translate-x: -50% !important;
    --tw-translate-y: -50% !important;
    translate: -50% -50% !important;
    transform: none !important;
  }

  .rank-border-detail-dialog__header {
    min-height: 0;
    padding-right: 2.25rem;
  }

  .rank-border-detail-dialog__header :deep([data-slot="dialog-title"]) {
    line-height: 1.25;
  }

  .rank-border-detail-dialog__header :deep([data-slot="dialog-description"]) {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.3;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .rank-border-detail-grid {
    display: grid;
    height: 100%;
    min-height: 0;
    max-height: none;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: none;
    grid-auto-rows: auto;
    grid-template-areas:
      "profile"
      "stats"
      "trend"
      "heatmap";
    align-content: start;
    gap: 0.625rem;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0.125rem 0.125rem 0.75rem;
    scrollbar-width: thin;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-detail-history,
  .rank-border-heatmap-section,
  .rank-border-update-section,
  .rank-border-detail-stats {
    min-height: auto;
    overflow: visible;
  }

  .rank-border-detail-history {
    grid-template-rows: auto auto;
    overflow: visible;
  }

  .rank-border-detail-profile,
  .rank-border-trend-panel,
  .rank-border-heatmap-section,
  .rank-border-update-section {
    padding: 0.625rem;
  }

  .rank-border-detail-profile__body {
    align-items: start;
    gap: 0.5rem 0.625rem;
  }

  .rank-border-detail-profile__body--assets {
    grid-template-columns: 2.85rem minmax(0, 1fr);
  }

  .rank-border-leader--detail {
    width: 2.85rem;
    height: 2.85rem;
  }

  .rank-border-leader--dialog {
    width: 2.85rem;
    height: 2.85rem;
  }

  .rank-border-honor--detail {
    width: 4.6rem;
  }

  .rank-border-detail-profile__copy {
    align-content: start;
  }

  .rank-border-detail-profile__score {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: start;
    gap: 0.125rem;
  }

  .rank-border-detail-rank {
    font-size: 1.625rem;
  }

  .rank-border-detail-score {
    min-width: 0;
    overflow: visible;
    font-size: 0.9375rem;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .rank-border-detail-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-content: start;
    padding: 0.5rem;
  }

  .rank-border-trend-grid {
    grid-template-rows: none;
    gap: 0.5rem;
  }

  .rank-border-heatmap-section,
  .rank-border-update-section {
    align-content: start;
  }

  .rank-border-heatmap-section {
    grid-template-rows: auto max-content;
  }

  .rank-border-update-section {
    grid-template-rows: auto auto;
  }

  .rank-border-trend-panel > div:first-child,
  .rank-border-heatmap-section > div:first-child,
  .rank-border-update-section > div:first-child {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .rank-border-live-card__metrics,
  .rank-border-live-card__gaps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rank-border-chart-frame {
    grid-template-columns: minmax(0, 1fr) 3.75rem;
  }

  .rank-border-chart-frame--detail {
    height: 6.5rem;
  }

  .rank-border-chart-time-axis {
    margin-right: 4.25rem;
  }

  .rank-border-stat {
    padding: 0.4375rem;
  }

  .rank-border-stat p {
    font-size: 0.6875rem;
  }

  .rank-border-stat strong {
    font-size: 0.8125rem;
  }

  .rank-border-heatmap-row {
    --rank-border-heatmap-label-width: 2.2rem;
    gap: 0.25rem;
  }

  .rank-border-heatmap-panel {
    --rank-border-heatmap-min-cell-size: 1rem;
    --rank-border-heatmap-cell-size: clamp(1rem, 3.6vw, 1.18rem);
    --rank-border-heatmap-gap: 0.125rem;
    max-height: 13.75rem;
  }

  .rank-border-update-log {
    height: 13rem;
    max-height: 13rem;
    overflow: hidden;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3.25rem 2.75rem 4.25rem minmax(5.5rem, 1fr);
    gap: 0.25rem;
    padding-inline: 0.375rem;
  }
}

@media (max-width: 380px) {
  .rank-border-top-row {
    grid-template-columns: 2.8rem minmax(0, 1fr) 5.35rem;
    padding-inline: 0.45rem;
  }

  .rank-border-segment-row {
    grid-template-columns: 3.45rem minmax(0, 1fr) 5.35rem;
    padding-inline: 0.45rem;
  }

  .rank-border-player-track--assets {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .rank-border-player-name {
    max-width: 8.5rem;
    font-size: 0.75rem;
  }

  .rank-border-leader--row {
    width: 2.35rem;
    height: 2.35rem;
  }

  .rank-border-honor--row {
    width: 3.35rem;
  }

  .rank-border-row-score {
    font-size: 0.75rem;
  }

  .rank-border-replay-rail__track {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.375rem;
  }

  .rank-border-replay-rail__track span:last-child {
    text-align: right;
  }

  .rank-border-update-log__header,
  .rank-border-update-log__row {
    grid-template-columns: 3rem 2.35rem 3.75rem minmax(4.8rem, 1fr);
    font-size: 0.6875rem;
  }
}

</style>
