<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  ChartLine,
} from "lucide-vue-next"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet"
import { formatNumberCN } from "@/lib/number-format"
import { getI18nLocale } from "@/shared/i18n"
import RankDetailPanel from "../components/RankDetailPanel.vue"
import RankLeaderboard from "../components/RankLeaderboard.vue"
import RankLocateBar from "../components/RankLocateBar.vue"
import RankQueryBar from "../components/RankQueryBar.vue"
import RankReplayRail from "../components/RankReplayRail.vue"
import { RANK_BORDER_CONTEXT_KEY } from "../composables/rank-border-context"
import { useRankBorderDetail } from "../composables/useRankBorderDetail"
import { useRankBorderHonors } from "../composables/useRankBorderHonors"
import { useRankBorderLive } from "../composables/useRankBorderLive"
import { useRankBorderQuery } from "../composables/useRankBorderQuery"
import {
  normalizeTrackerEndpoint,
  type RankBorderLatest,
  type RankBorderUserProfile,
} from "../lib/rank-border"
import {
  DEFAULT_REPLAY_WINDOW_SECONDS,
  PERSONAL_COLLECTION_LIMIT,
  TOP_100_RANKS,
  TRACKER_UPDATE_INTERVAL_SECONDS,
} from "../lib/rank-border-constants"
import type {
  DetailState,
  RankBorderJumpTarget,
  RankBorderTooltipState,
  RichNameSegment,
} from "../lib/rank-border-types"

// Shared types live in ./lib/rank-border-types (imported at the top of this
// file) so the composables and components split out of this view can reuse them.

// Shared constants live in ./lib/rank-border-constants so the composables and
// components extracted from this view can reuse them without re-declaring.

const { t } = useI18n()

const query = useRankBorderQuery()
const {
  trackerEndpoint,
  selectedRegion,
  selectedEventId,
  mode,
  selectedWorldBloomCharacterId,
  intervalSeconds,
  hideProfileAssets,
  masterOptions,
  selectedAccount,
  selectedActivityStartAt,
  selectedActivityEndAt,
  cardById,
  honorById,
  honorGroupById,
  bondsHonorById,
  bondsHonorWordById,
  gameCharacterUnitById,
  selectedIntervalSeconds,
  selectedEventIdNumber,
  selectedWorldBloomCharacterIdNumber,
  intervalOptions,
  trackerEndpointReady,
  switchRegion,
} = query

const honors = useRankBorderHonors({
  cardById,
  honorById,
  honorGroupById,
  bondsHonorById,
  bondsHonorWordById,
  gameCharacterUnitById,
  selectedRegion,
  trackerEndpoint,
  masterOptions,
})
const {
  isLatestResult,
  profileAssetsLoading,
  preloadProfileAssets,
} = honors

const playbackAt = ref<number | null>(null)
const playbackDraftAt = ref<number | null>(null)
// The central detail spine ref stays declared in the view because both the live
// engine (top100 rows / segments) and the detail subsystem read it.
const detail = ref<DetailState | null>(null)
const isMobileViewport = ref(resolveIsMobileViewport())
const hoveredQuickJumpRank = ref<number | null>(null)
const rankBorderTooltip = ref<RankBorderTooltipState>({
  visible: false,
  x: 0,
  y: 0,
  label: "",
})
const publicProfileByUserId = ref<Map<string, RankBorderUserProfile>>(new Map())
const detailScoreChanged = ref(false)
const visibleRank = ref<number | null>(null)

// Late-bound bridge so the live engine (created before the detail subsystem) can
// reach the detail loaders/reset without a temporal dead zone. The concrete
// implementations are assigned right after useRankBorderDetail() is created.
const detailBridge: { refreshActiveDetail: () => void | Promise<void>; resetDetailData: () => void } = {
  refreshActiveDetail: () => {},
  resetDetailData: () => {},
}

const live = useRankBorderLive({
  trackerEndpoint,
  selectedRegion,
  selectedEventId,
  mode,
  selectedWorldBloomCharacterId,
  selectedEventIdNumber,
  selectedWorldBloomCharacterIdNumber,
  intervalSeconds,
  selectedIntervalSeconds,
  trackerEndpointReady,
  playbackAt,
  detail,
  publicProfileByUserId,
  detailScoreChanged,
  refreshActiveDetail: () => detailBridge.refreshActiveDetail(),
  resetDetailData: () => detailBridge.resetDetailData(),
  normalizeTextValue,
  mergeLatestWithProfile,
  hasProfileFields,
  isLocalMockTrackerEndpoint,
})
const {
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
  segmentRows,
  latestTrackerTimestamp,
  refreshTop100GrowthsFromCachedTraces,
  scheduleNumberFlashReset,
} = live

const detailApi = useRankBorderDetail({
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
})
const {
  detailDialogOpen,
  detailError,
  openRankDetail,
  openLineDetail,
  openMobileRankDetail,
  openMobileLineDetail,
} = detailApi
detailBridge.refreshActiveDetail = detailApi.refreshActiveDetail
detailBridge.resetDetailData = detailApi.resetDetailData

const shouldRenderProfileAssets = computed(() => !hideProfileAssets.value)

const quickJumpTargets = computed<RankBorderJumpTarget[]>(() => {
  const targetRanks = new Set<number>(TOP_100_RANKS)
  for (const line of segmentRows.value) {
    if (line.rank > PERSONAL_COLLECTION_LIMIT) {
      targetRanks.add(line.rank)
    }
  }

  return Array.from(targetRanks)
    .sort((a, b) => a - b)
    .map((rank, index) => {
      const progressRatio = targetRanks.size > 1 ? index / (targetRanks.size - 1) : 0
      return {
        rank,
        label: rank <= PERSONAL_COLLECTION_LIMIT ? formatRank(rank) : formatTargetRank(rank),
        value: String(index),
        progress: `${progressRatio * 100}%`,
        position: `calc(0.875rem + ${progressRatio} * (100% - 1.75rem))`,
        progressRatio,
      }
    })
})

const activeQuickJumpRank = computed(() =>
  visibleRank.value ?? detail.value?.result.rank ?? null,
)
const activeQuickJumpTarget = computed(() => quickJumpTargetByRank(activeQuickJumpRank.value))
const hoveredQuickJumpTarget = computed(() => quickJumpTargetByRank(hoveredQuickJumpRank.value))
const mobileQuickJumpFillStyle = computed(() => {
  const target = hoveredQuickJumpTarget.value ?? activeQuickJumpTarget.value ?? quickJumpTargets.value[0] ?? null
  const progress = target ? `${target.progressRatio * 100}%` : "0%"
  const progressRatio = target ? String(target.progressRatio) : "0"
  return {
    "--rank-border-jump-progress": progress,
    "--rank-border-jump-progress-ratio": progressRatio,
  }
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

// Share the SINGLE composable instances (they own the WebSocket/timers) plus
// genuinely view-local helpers with the child components split out of this view.
// Children must inject this context instead of re-instantiating the composables.
// Declared after the replay computeds so the provided refs are already initialized.
provide(RANK_BORDER_CONTEXT_KEY, {
  query,
  live,
  detail: detailApi,
  honors,
  ui: {
    isMobileViewport,
    shouldRenderProfileAssets,
    formatRank,
    formatTargetRank,
    formatPt,
    formatGrowth,
    formatPerHour,
    formatTimestamp,
    formatElapsed,
    elapsedSince,
    formatUserLabel,
    richUserLabelSegments,
    richNameSegmentStyle,
    detailScoreChanged,
    formatLoopCount,
    formatRankShift,
    showRankBorderTooltip,
    moveRankBorderTooltip,
    hideRankBorderTooltip,
    activityReplayReady,
    playbackStatusLabel,
    isPlaybackLive,
    playbackDraftAt,
    resetPlaybackLive,
    replayBounds,
    playbackDisplayAt,
    formatReplayTick,
    updatePlaybackDraft,
    commitPlaybackDraft,
  },
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

let visibleRankFrame: number | null = null
let quickJumpPreviewFrame: number | null = null
let quickJumpPreviewRank: number | null = null
let quickJumpPointerActive = false
let quickJumpCommitRank: number | null = null

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

onBeforeUnmount(() => {
  stopVisibleRankListener()
  stopMobileViewportListener()
  clearQuickJumpPreviewFrame()
})

onMounted(() => {
  startVisibleRankListener()
  startMobileViewportListener()
})

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

  const bounds = replayBounds.value
  const nextPlaybackAt = clampNumber(playbackDraftAt.value ?? bounds.end, bounds.start, bounds.end)
  playbackAt.value = nextPlaybackAt >= bounds.end - TRACKER_UPDATE_INTERVAL_SECONDS
    ? null
    : nextPlaybackAt
  playbackDraftAt.value = null
}

function resetPlaybackLive() {
  playbackAt.value = null
  playbackDraftAt.value = null
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

function previewJumpToRank(rank: number) {
  if (!rank) {
    return
  }

  visibleRank.value = rank
  quickJumpPreviewRank = rank
  if (quickJumpPreviewFrame != null) {
    return
  }

  quickJumpPreviewFrame = requestAnimationFrame(() => {
    quickJumpPreviewFrame = null
    const targetRank = quickJumpPreviewRank
    quickJumpPreviewRank = null
    if (!targetRank) {
      return
    }

    document.querySelector<HTMLElement>(`[data-rank-border-row="${targetRank}"]`)?.scrollIntoView({
      behavior: "auto",
      block: "center",
    })
  })
}

function clearQuickJumpPreviewFrame() {
  if (quickJumpPreviewFrame == null) {
    return
  }

  cancelAnimationFrame(quickJumpPreviewFrame)
  quickJumpPreviewFrame = null
  quickJumpPreviewRank = null
}

function resolveQuickJumpRankFromPointer(event: MouseEvent) {
  const target = event.currentTarget
  if (!(target instanceof HTMLElement)) {
    return null
  }

  const targets = quickJumpTargets.value
  if (targets.length === 0) {
    return null
  }

  const rect = target.getBoundingClientRect()
  const style = window.getComputedStyle(target)
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0
  const paddingRight = Number.parseFloat(style.paddingRight) || 0
  const trackLeft = rect.left + paddingLeft
  const trackWidth = Math.max(1, rect.width - paddingLeft - paddingRight)
  const ratio = trackWidth > 0
    ? Math.min(1, Math.max(0, (event.clientX - trackLeft) / trackWidth))
    : 0
  const index = Math.round(ratio * (targets.length - 1))
  return targets[index]?.rank ?? null
}

function quickJumpTargetByRank(rank: number | null) {
  return quickJumpTargets.value.find((target) => target.rank === rank) ?? null
}

function quickJumpLabelStyle(target: RankBorderJumpTarget) {
  const transform = target.progressRatio < 0.08
    ? "translateX(0)"
    : target.progressRatio > 0.92
      ? "translateX(-100%)"
      : "translateX(-50%)"
  return {
    left: target.position,
    transform,
  }
}

function handleQuickJumpPointerDown(event: PointerEvent) {
  const rank = resolveQuickJumpRankFromPointer(event)
  if (!rank) {
    return
  }

  const target = quickJumpTargetByRank(rank)
  hoveredQuickJumpRank.value = rank
  if (!isMobileViewport.value) {
    return
  }

  event.preventDefault()
  if (target) {
    showRankBorderTooltip(event, target.label)
  }
  quickJumpPointerActive = true
  quickJumpCommitRank = rank
  if (event.currentTarget instanceof HTMLElement) {
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  previewJumpToRank(rank)
}

function handleQuickJumpPointerMove(event: PointerEvent) {
  const rank = resolveQuickJumpRankFromPointer(event)
  const target = quickJumpTargetByRank(rank)
  hoveredQuickJumpRank.value = rank

  if (!isMobileViewport.value) {
    return
  }

  if (target) {
    showRankBorderTooltip(event, target.label)
  }
  if (!quickJumpPointerActive) {
    return
  }
  event.preventDefault()
  if (!rank || rank === quickJumpCommitRank) {
    return
  }

  quickJumpCommitRank = rank
  previewJumpToRank(rank)
}

function handleQuickJumpClick(event: MouseEvent) {
  if (isMobileViewport.value) {
    return
  }

  const rank = resolveQuickJumpRankFromPointer(event)
  if (rank) {
    void jumpToRank(rank)
  }
}

function handleQuickJumpPointerEnd(event: PointerEvent) {
  const rank = quickJumpCommitRank ?? resolveQuickJumpRankFromPointer(event)
  if (!isMobileViewport.value) {
    return
  }

  event.preventDefault()
  quickJumpPointerActive = false
  quickJumpCommitRank = null
  hideRankBorderTooltip()
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
  if (rank) {
    void jumpToRank(rank)
  }
}

function handleQuickJumpPointerCancel(event: PointerEvent) {
  hoveredQuickJumpRank.value = null
  quickJumpPointerActive = false
  quickJumpCommitRank = null
  hideRankBorderTooltip()
  if (event.currentTarget instanceof HTMLElement && event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
}

function handleQuickJumpPointerLeave() {
  hoveredQuickJumpRank.value = null
  if (!quickJumpPointerActive) {
    hideRankBorderTooltip()
  }
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

function hasProfileFields(latest: RankBorderLatest) {
  return latest.name != null
    || latest.cardId != null
    || latest.profileWord != null
    || latest.profileHonors.length > 0
    || latest.userPlayerFrames.length > 0
}

function clampNumber(value: number | null | undefined, min: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    return min
  }

  return Math.min(max, Math.max(min, Math.round(parsed)))
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

function richUserLabelSegments(result: { name: string | null } | null, fallback = "-"): RichNameSegment[] {
  return parseRichNameSegments(result ? formatUserLabel(result) : fallback)
}

function richNameSegmentStyle(segment: RichNameSegment) {
  return segment.color ? { color: segment.color } : undefined
}

function parseRichNameSegments(value: string): RichNameSegment[] {
  const rawText = value
  const segments: Omit<RichNameSegment, "key">[] = [{ text: "", color: null }]
  let rest = value

  try {
    while (true) {
      const openIndex = rest.indexOf("<#")
      if (openIndex === -1) {
        segments[segments.length - 1].text += rest.replaceAll("</color>", "")
        break
      }

      const closeIndex = rest.indexOf(">", openIndex)
      if (closeIndex === -1) {
        throw new Error("Unclosed color tag")
      }

      segments[segments.length - 1].text += rest.slice(0, openIndex).replaceAll("</color>", "")
      const code = rest.slice(openIndex + 2, closeIndex)
      const color = normalizeRichNameColor(code)
      if (!color) {
        throw new Error("Invalid color tag")
      }

      segments.push({ text: "", color })
      rest = rest.slice(closeIndex + 1)
    }
  } catch {
    return [{ key: "plain", text: rawText, color: null }]
  }

  const visibleSegments = segments.filter((segment) => segment.text.length > 0)
  return visibleSegments.length > 0
    ? visibleSegments.map((segment, index) => ({ ...segment, key: `${index}:${segment.text}:${segment.color ?? ""}` }))
    : [{ key: "plain", text: rawText, color: null }]
}

function normalizeRichNameColor(code: string) {
  if (/^[\dA-Fa-f]{3}$/.test(code)) {
    return `#${code.split("").map((value) => `${value}${value}`).join("").toLowerCase()}`
  }

  if (/^[\dA-Fa-f]{6}$/.test(code)) {
    return `#${code.toLowerCase()}`
  }

  return null
}

function isLocalMockTrackerEndpoint(endpoint: string) {
  const normalized = normalizeTrackerEndpoint(endpoint)
  return normalized === "http://127.0.0.1:18777" || normalized === "http://localhost:18777"
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

</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-7xl gap-2 sm:gap-4">
      <RankQueryBar />

      <Card class="gap-2 rounded-lg py-2 sm:gap-3 sm:py-3 xl:rounded-xl xl:py-5">
        <CardContent class="grid gap-3 px-1.5 pb-1.5 sm:gap-4 sm:px-4 sm:pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,400px)] lg:gap-4 xl:px-5 xl:pb-5">
          <div class="rank-border-left-column min-w-0 space-y-3">
            <RankLocateBar />

            <RankReplayRail />

            <div class="grid min-w-0 content-start gap-3">
            <div
              v-if="quickJumpTargets.length > 0"
              class="rank-border-jump-rail"
            >
              <span class="shrink-0 text-xs font-medium text-muted-foreground">{{ t("rankBorder.sections.quickJump") }}</span>
              <div
                class="rank-border-jump-rail__bars"
                role="group"
                tabindex="0"
                :aria-label="t('rankBorder.sections.quickJump')"
                :style="mobileQuickJumpFillStyle"
                @click="handleQuickJumpClick"
                @pointerdown="handleQuickJumpPointerDown"
                @pointermove="handleQuickJumpPointerMove"
                @pointerup="handleQuickJumpPointerEnd"
                @pointercancel="handleQuickJumpPointerCancel"
                @lostpointercapture="handleQuickJumpPointerCancel"
                @pointerleave="handleQuickJumpPointerLeave"
              >
                <span
                  v-if="hoveredQuickJumpTarget && !isMobileViewport"
                  class="rank-border-jump-hover-label"
                  :style="quickJumpLabelStyle(hoveredQuickJumpTarget)"
                >
                  {{ hoveredQuickJumpTarget.label }}
                </span>
                <button
                  v-for="target in quickJumpTargets"
                  :key="target.rank"
                  type="button"
                  :class="[
                    'rank-border-jump-bar',
                    activeQuickJumpRank === target.rank ? 'rank-border-jump-bar--active' : '',
                    hoveredQuickJumpRank === target.rank ? 'rank-border-jump-bar--hovered' : '',
                  ]"
                  :style="{ left: target.position }"
                  :aria-label="target.label"
                  :aria-current="activeQuickJumpRank === target.rank ? 'true' : undefined"
                  tabindex="-1"
                />
              </div>
            </div>

          <RankLeaderboard />
            </div>
          </div>

          <aside v-if="!isMobileViewport" class="rank-border-detail-aside min-w-0 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100svh-2rem)] lg:overflow-y-auto lg:overscroll-contain">
            <div v-if="detailError" class="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {{ detailError }}
            </div>
            <RankDetailPanel v-if="detail" :show-close="false" />
            <div v-else-if="!detailError" class="rank-border-detail-empty">
              <ChartLine class="size-9 text-muted-foreground/55" />
              <p class="text-sm font-medium">{{ t("rankBorder.detailPanel.emptyTitle") }}</p>
              <p class="max-w-[18rem] text-xs leading-5 text-muted-foreground">{{ t("rankBorder.detailPanel.emptyHint") }}</p>
            </div>
          </aside>
        </CardContent>
      </Card>

      <Sheet :open="detailDialogOpen" @update:open="detailDialogOpen = $event">
        <SheetContent side="bottom" class="max-h-[calc(100dvh-1.5rem)] overflow-y-auto">
          <div class="mx-auto mb-1 h-1.5 w-10 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden="true" />
          <RankDetailPanel :show-close="false" @close="detailDialogOpen = false" />
        </SheetContent>
      </Sheet>
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

.rank-border-detail-aside {
  display: grid;
  min-width: 0;
  align-content: start;
  gap: 0.75rem;
}

.rank-border-detail-empty {
  display: grid;
  min-height: 12rem;
  align-content: center;
  justify-items: center;
  gap: 0.5rem;
  border: 1px dashed color-mix(in oklab, var(--border) 80%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in oklab, var(--background) 88%, var(--muted));
  padding: 2rem 1.25rem;
  text-align: center;
}

.rank-border-jump-rail {
  position: sticky;
  top: 4rem;
  z-index: 24;
  display: grid;
  min-width: 0;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 0.875rem;
  overflow: visible;
  border: 1px solid color-mix(in oklab, var(--border) 78%, transparent);
  border-radius: 0.5rem;
  background: color-mix(in oklab, var(--background) 88%, transparent);
  padding: 0.875rem 0.875rem;
  box-shadow: 0 12px 30px rgb(15 23 42 / 0.1);
  backdrop-filter: blur(14px);
}

.rank-border-jump-rail__bars {
  --rank-border-jump-progress: 0%;
  --rank-border-jump-progress-ratio: 0;
  position: relative;
  display: block;
  min-width: 0;
  height: 1.5rem;
  flex: 1 1 auto;
  touch-action: pan-y;
  cursor: pointer;
  overflow: visible;
  border-radius: 9999px;
  background: transparent;
  box-shadow: none;
  padding: 0 0.875rem;
}

.rank-border-jump-rail__bars:focus-visible {
  outline: 2px solid color-mix(in oklab, var(--primary) 72%, transparent);
  outline-offset: 2px;
}

.rank-border-jump-rail__bars::before,
.rank-border-jump-rail__bars::after {
  position: absolute;
  right: 0.875rem;
  top: 50%;
  left: 0.875rem;
  height: 0.5rem;
  border-radius: 9999px;
  content: "";
  transform: translateY(-50%);
}

.rank-border-jump-rail__bars::before {
  background: color-mix(in oklab, var(--muted) 68%, transparent);
}

.rank-border-jump-rail__bars::after {
  right: calc(0.875rem + (1 - var(--rank-border-jump-progress-ratio)) * (100% - 1.75rem));
  background: rgb(8 145 178);
  box-shadow: inset 0 0 0 1px rgb(6 182 212 / 0.24);
}

.rank-border-jump-bar {
  appearance: none;
  position: absolute;
  top: 50%;
  width: 0;
  min-width: 0;
  max-width: 0;
  height: 0;
  border: 0;
  border-radius: 0.0625rem;
  background: transparent;
  cursor: inherit;
  opacity: 0;
  padding: 0;
  pointer-events: none;
  transform: translateX(-50%) translateY(-50%);
  transform-origin: center center;
  transition: background-color 140ms ease, height 140ms ease, opacity 140ms ease, transform 140ms ease, width 140ms ease;
}

.rank-border-jump-bar--active {
  background: rgb(6 182 212);
  width: 0.5rem;
  min-width: 0.5rem;
  max-width: 0.5rem;
  height: 0.9rem;
  border-radius: 9999px;
  opacity: 0.85;
  z-index: 1;
}

.rank-border-jump-bar--hovered {
  width: 0.625rem;
  min-width: 0.625rem;
  max-width: 0.625rem;
  height: 1.35rem;
  border-radius: 9999px;
  background: rgb(8 145 178);
  opacity: 1;
  transform: translateX(-50%) translateY(-50%);
  z-index: 2;
}

.rank-border-jump-hover-label {
  position: absolute;
  bottom: 100%;
  z-index: 2;
  max-width: min(10rem, 42vw);
  overflow: hidden;
  border: 1px solid color-mix(in oklab, rgb(8 145 178) 36%, var(--border));
  border-radius: 9999px;
  background: color-mix(in oklab, var(--background) 94%, rgb(236 254 255));
  box-shadow: 0 10px 24px rgb(15 23 42 / 0.14);
  color: color-mix(in oklab, rgb(8 145 178) 86%, var(--foreground));
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
  padding: 0.35rem 0.5rem;
  pointer-events: none;
  text-overflow: ellipsis;
  translate: 0 -0.375rem;
  white-space: nowrap;
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

@media (max-width: 767px) {
  .rank-border-jump-rail {
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    gap: 0.5rem;
    overflow: hidden;
    padding: 0.5rem 0.625rem;
  }

  .rank-border-jump-rail__bars {
    height: 2.25rem;
    touch-action: none;
    cursor: ew-resize;
    overflow: hidden;
    border-radius: 9999px;
    background: linear-gradient(90deg, rgb(8 145 178) 0 var(--rank-border-jump-progress), color-mix(in oklab, var(--muted) 62%, transparent) var(--rank-border-jump-progress) 100%);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--border) 54%, transparent);
    padding: 0 0.875rem;
  }

  .rank-border-jump-rail__bars::before,
  .rank-border-jump-rail__bars::after {
    display: none;
  }

  .rank-border-jump-bar {
    display: none;
  }

  .rank-border-jump-bar--active,
  .rank-border-jump-bar--hovered {
    display: none;
  }
}

</style>
