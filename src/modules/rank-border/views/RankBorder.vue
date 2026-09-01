<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { useRouter } from "vue-router"
import { formatNumberCN } from "@/lib/number-format"
import { getI18nLocale } from "@/shared/i18n"
import RankJumpRail from "../components/RankJumpRail.vue"
import RankLeaderboard from "../components/RankLeaderboard.vue"
import RankReplayRail from "../components/RankReplayRail.vue"
import RankToolbar from "../components/RankToolbar.vue"
import { RANK_BORDER_CONTEXT_KEY } from "../composables/rank-border-context"
import { useNowSecond } from "../composables/useNowSecond"
import { isLocalMockTrackerEndpoint, useRankBorderHonors } from "../composables/useRankBorderHonors"
import { useRankBorderLive } from "../composables/useRankBorderLive"
import { useRankBorderQuery } from "../composables/useRankBorderQuery"
import { isLatestResult } from "../lib/honor-visuals"
import {
  buildRankBorderDetailQuery,
  type RankBorderDetailTargetInput,
} from "../lib/detail-link"
import {
  DEFAULT_REPLAY_WINDOW_SECONDS,
  TRACKER_UPDATE_INTERVAL_SECONDS,
} from "../lib/rank-border-constants"
import type {
  RankBorderTooltipState,
  RichNameSegment,
} from "../lib/rank-border-types"
import { parseRichNameSegments, richNameSegmentStyle } from "../lib/rich-name"

const { t } = useI18n()
const router = useRouter()

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
  trackerEndpointReady,
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
  masterData: masterOptions,
})
const { profileAssetsLoading, preloadProfileAssets } = honors

// Shared low-frequency clock: relative times and replay bounds read this
// instead of a per-second interval.
const nowSecond = useNowSecond(15_000)

const playbackAt = ref<number | null>(null)
const playbackDraftAt = ref<number | null>(null)
const isMobileViewport = ref(matchViewport("(max-width: 767px)"))
const rankBorderTooltip = ref<RankBorderTooltipState>({
  visible: false,
  x: 0,
  y: 0,
  label: "",
})
const expandedRank = ref<number | null>(null)
const visibleRank = ref<number | null>(null)

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
  isLocalMockTrackerEndpoint,
})
const {
  top100Details,
  canRefresh,
  latestTrackerTimestamp,
} = live

const shouldRenderProfileAssets = computed(() => !hideProfileAssets.value)

const replayBounds = computed(() => {
  const now = nowSecond.value
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

const hasProfileAssetPayload = computed(() => {
  if (!shouldRenderProfileAssets.value) {
    return false
  }

  const values = Array.from(top100Details.value.values()).filter(isLatestResult)
  return values.some((item) => item.cardId != null || item.profileHonors.length > 0)
})

function toggleRowExpansion(rank: number) {
  expandedRank.value = expandedRank.value === rank ? null : rank
}

function openDetailPage(target: RankBorderDetailTargetInput) {
  void router.push({
    path: "/rank-border/detail",
    query: buildRankBorderDetailQuery({
      region: selectedRegion.value,
      eventId: selectedEventIdNumber.value,
      mode: mode.value,
      worldBloomCharacterId: selectedWorldBloomCharacterIdNumber.value || null,
      intervalSeconds: selectedIntervalSeconds.value,
    }, target),
  })
}

function reportVisibleRank(rank: number | null) {
  visibleRank.value = rank
}

function jumpToRank(rank: number) {
  if (!rank) {
    return
  }

  visibleRank.value = rank
  expandedRank.value = rank
  void nextTick(() => {
    document.querySelector<HTMLElement>(`[data-rank-border-row="${rank}"]`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    })
  })
}

provide(RANK_BORDER_CONTEXT_KEY, {
  query,
  live,
  honors,
  ui: {
    isMobileViewport,
    nowSecond,
    shouldRenderProfileAssets,
    expandedRank,
    toggleRowExpansion,
    openDetailPage,
    reportVisibleRank,
    visibleRank,
    jumpToRank,
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

watch([selectedRegion, selectedEventId, mode, selectedWorldBloomCharacterId], () => {
  playbackAt.value = null
  playbackDraftAt.value = null
  expandedRank.value = null
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

onMounted(() => {
  updateViewportFlags()
  window.addEventListener("resize", updateViewportFlags, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateViewportFlags)
})

function matchViewport(queryText: string) {
  return typeof window !== "undefined" ? window.matchMedia(queryText).matches : false
}

function updateViewportFlags() {
  isMobileViewport.value = matchViewport("(max-width: 767px)")
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
  return timestamp ? Math.max(0, nowSecond.value - timestamp) : null
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
</script>

<template>
  <div class="flex w-full flex-1 flex-col items-center px-1 py-2 sm:px-0 sm:py-4">
    <div class="mx-auto grid w-full max-w-6xl gap-2 sm:gap-3">
      <RankToolbar />

      <RankReplayRail />

      <RankJumpRail />

      <RankLeaderboard />
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
