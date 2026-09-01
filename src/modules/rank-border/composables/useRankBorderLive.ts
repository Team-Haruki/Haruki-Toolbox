import { computed, onBeforeUnmount, shallowRef, watch, type ComputedRef, type Ref } from "vue"
import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import type { SekaiRegion } from "@/types"
import {
  subscribeRankBorderRealtime,
  type RankBorderRealtimeEvent,
  type RankBorderRealtimeOnline,
  type RankBorderRealtimeState,
  type RankBorderRealtimeSubscription,
} from "../api/rank-border"
import { useRankBorderTracker } from "./useRankBorderTracker"
import {
  normalizeTrackerEndpoint,
  resolveRankBorderTraceGrowth,
  type RankBorderGrowth,
  type RankBorderLatest,
  type RankBorderLine,
  type RankBorderMode,
  type RankBorderTopPlayerGrowth,
  type RankBorderTracePoint,
  type RankBorderUserProfile,
} from "../lib/rank-border"
import {
  MAX_LIVE_REFRESH_MS,
  MIN_LIVE_REFRESH_MS,
  NUMBER_FLASH_MS,
  PERSONAL_COLLECTION_LIMIT,
  TOP_100_DETAIL_CACHE_TTL_MS,
  TOP_100_RANKS,
  TRACKER_UPDATE_INTERVAL_SECONDS,
} from "../lib/rank-border-constants"
import type {
  RankBorderLineRow,
  RankBorderSegmentRow,
} from "../lib/rank-border-types"

/**
 * LIVE DATA ENGINE for the rank-border view.
 *
 * Owns the tracker subscription, the realtime WebSocket + local live-refresh
 * fallback timers, the top-100 leaderboard data + growth caches, the number
 * flash marks, and the refresh orchestration that keeps them coherent.
 *
 * Perf contract (deliberate differences from the first implementation):
 * - No per-second clock: nothing here re-renders on wall-time alone. Relative
 *   times are rendered by leaf components subscribing to `useNowSecond`.
 * - Change flashes are one-shot: each refresh replaces the changed-rank sets
 *   once and a single timer clears them after the CSS animation finished, so
 *   one data refresh causes at most two list re-renders.
 * - The top-100 snapshot is cached in module memory (not sessionStorage), so
 *   returning to the page repaints instantly without JSON round-trips.
 */
export interface UseRankBorderLiveDeps {
  trackerEndpoint: Ref<string>
  selectedRegion: Ref<SekaiRegion>
  selectedEventId: Ref<string | null>
  mode: Ref<RankBorderMode>
  selectedWorldBloomCharacterId: Ref<string | null>
  selectedEventIdNumber: ComputedRef<number>
  selectedWorldBloomCharacterIdNumber: ComputedRef<number>
  intervalSeconds: Ref<string>
  selectedIntervalSeconds: ComputedRef<number>
  trackerEndpointReady: ComputedRef<boolean>
  playbackAt: Ref<number | null>
  isLocalMockTrackerEndpoint: (endpoint: string) => boolean
}

type Top100MemoryCacheEntry = {
  cachedAt: number
  details: Map<number, RankBorderLatest>
}

const TOP_100_MEMORY_CACHE_LIMIT = 4
const top100MemoryCache = new Map<string, Top100MemoryCacheEntry>()

export function useRankBorderLive(deps: UseRankBorderLiveDeps) {
  const {
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
  } = deps

  const { t } = useI18n()
  const userStore = useUserStore()

  const tracker = useRankBorderTracker()

  const liveRefreshing = shallowRef(false)
  const publicProfileByUserId = shallowRef<Map<string, RankBorderUserProfile>>(new Map())
  const realtimeState = shallowRef<RankBorderRealtimeState>("closed")
  const realtimeOnline = shallowRef<RankBorderRealtimeOnline | null>(null)
  const top100Details = shallowRef<Map<number, RankBorderLatest>>(new Map())
  const top100GrowthByRank = shallowRef<Map<number, RankBorderGrowth>>(new Map())
  const top100RankGrowthByRank = shallowRef<Map<number, RankBorderGrowth>>(new Map())
  const top100GrowthIntervalSeconds = shallowRef<number | null>(null)
  const top100TraceByRank = shallowRef<Map<number, RankBorderTracePoint[]>>(new Map())
  const segmentTraceByRank = shallowRef<Map<number, RankBorderTracePoint[]>>(new Map())
  const scoreChangedRanks = shallowRef<Set<number>>(new Set())
  const growthChangedRanks = shallowRef<Set<number>>(new Set())

  let liveRefreshTimer: ReturnType<typeof setTimeout> | null = null
  let realtimeSubscription: RankBorderRealtimeSubscription | null = null
  let realtimeSubscriptionKey = ""
  let realtimeSubscriptionToken = 0
  let numberFlashTimer: ReturnType<typeof setTimeout> | null = null
  let pendingRefresh = false

  const isPlaybackLive = computed(() => playbackAt.value == null)

  const canRefresh = computed(() =>
    trackerEndpointReady.value
    && selectedEventIdNumber.value > 0
    && (mode.value === "normal" || selectedWorldBloomCharacterIdNumber.value > 0),
  )

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
          scoreChanged: scoreChangedRanks.value.has(line.rank),
          growthChanged: growthChangedRanks.value.has(line.rank),
        }
      }),
  )
  const hasSegmentData = computed(() => segmentRows.value.length > 0)

  const latestTrackerTimestamp = computed(() => {
    const candidates = [
      tracker.status.value?.timestamp,
      ...tracker.lines.value.map((line) => line.timestamp),
      ...Array.from(top100Details.value.values()).map((line) => line.timestamp),
    ].filter((timestamp): timestamp is number => typeof timestamp === "number")
    return candidates.length > 0 ? Math.max(...candidates) : null
  })

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
    void refreshData(true)
  })

  onBeforeUnmount(() => {
    stopLiveRefreshTimer()
    stopRealtimeSubscription()
    clearNumberFlashTimer()
  })

  function createTop100Row(rank: number, rowDetail: RankBorderLatest | null): RankBorderLineRow {
    const localGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
      ? top100GrowthByRank.value.get(rank)
      : null
    const localRankGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
      ? top100RankGrowthByRank.value.get(rank)
      : null
    const growth = localGrowth ?? null
    const rankGrowth = localRankGrowth ?? selectedTrackerGrowthByRank.value.get(rank) ?? null
    return {
      key: top100RowKey(rank, rowDetail),
      rank,
      score: rowDetail?.score ?? null,
      timestamp: rowDetail?.timestamp ?? null,
      growth,
      rankGrowth,
      displayGrowth: growth?.growth ?? null,
      displayRankGrowth: rankGrowth?.growth ?? null,
      detail: rowDetail,
      scoreChanged: scoreChangedRanks.value.has(rank),
      growthChanged: growthChangedRanks.value.has(rank),
      displayGrowthChanged: growthChangedRanks.value.has(rank),
      displayRankGrowthChanged: growthChangedRanks.value.has(rank),
      top100: rank <= PERSONAL_COLLECTION_LIMIT,
    }
  }

  function normalizeTextValue(value: unknown) {
    if (typeof value !== "string") {
      return null
    }

    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }

  function hasProfileFields(latest: RankBorderLatest) {
    return latest.name != null
      || latest.cardId != null
      || latest.profileWord != null
      || latest.profileHonors.length > 0
      || latest.userPlayerFrames.length > 0
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
    publicProfileByUserId.value = new Map()
    top100Details.value = new Map()
    top100GrowthByRank.value = new Map()
    top100RankGrowthByRank.value = new Map()
    top100GrowthIntervalSeconds.value = null
    top100TraceByRank.value = new Map()
    segmentTraceByRank.value = new Map()
    scoreChangedRanks.value = new Set()
    growthChangedRanks.value = new Set()
    tracker.lines.value = []
    tracker.growths.value = []
    tracker.growthIntervalSeconds.value = null
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
      const previousTop100RankGrowths = top100RankGrowthByRank.value
      const previousLines = new Map(tracker.lines.value.map((line) => [line.rank, line]))
      const previousGrowths = new Map(tracker.growths.value.map((growth) => [growth.rank, growth.growth]))
      const requestedIntervalSeconds = selectedIntervalSeconds.value
      hydrateTop100DetailsFromCache()
      await tracker.refresh({
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
      if (tracker.error.value) {
        return
      }

      applyTop100Overview(
        tracker.topRankings.value,
        tracker.topPlayerGrowths.value,
        tracker.topRankGrowths.value,
        previousDetails,
        previousTop100Growths,
        previousTop100RankGrowths,
        previousLines,
        previousGrowths,
      )
    } finally {
      liveRefreshing.value = false
      if (pendingRefresh) {
        pendingRefresh = false
        void refreshData(true)
      } else {
        resetLiveRefreshTimer()
      }
    }
  }

  function buildLatestDetailOverview(
    latestEntries: RankBorderLatest[],
    profiles: ReadonlyMap<string, RankBorderUserProfile>,
    previousDetails: Map<number, RankBorderLatest>,
  ) {
    const nextDetails = new Map<number, RankBorderLatest>()
    const previousDetailsByKey = latestDetailsByRowKey(previousDetails)
    const nextScoreChanges = new Set<number>()
    for (const latest of latestEntries) {
      const profile = latest.userId ? profiles.get(latest.userId) ?? null : null
      const nextDetail = mergeLatestWithProfile(latest, profile)
      const previousDetail = previousDetailsByKey.get(top100RowKey(nextDetail.rank, nextDetail))
      nextDetails.set(nextDetail.rank, nextDetail)
      if (previousDetail && previousDetail.score !== nextDetail.score) {
        nextScoreChanges.add(nextDetail.rank)
      }
    }
    return { nextDetails, nextScoreChanges }
  }

  function buildPlayerGrowthOverview(
    playerGrowths: RankBorderTopPlayerGrowth[],
    nextDetails: ReadonlyMap<number, RankBorderLatest>,
    previousGrowths: ReadonlyMap<number, RankBorderGrowth>,
  ) {
    const nextGrowths = new Map<number, RankBorderGrowth>()
    const nextGrowthChanges = new Set<number>()
    for (const growth of playerGrowths) {
      const detailEntry = nextDetails.get(growth.rank)
      if (detailEntry?.userId && detailEntry.userId !== growth.userId) {
        continue
      }
      nextGrowths.set(growth.rank, growth)
      const previousGrowth = previousGrowths.get(growth.rank)
      if (previousGrowth && isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(growth.rank)
      }
    }
    return { nextGrowths, nextGrowthChanges }
  }

  function buildRankGrowthOverview(
    rankGrowths: RankBorderGrowth[],
    previousGrowths: ReadonlyMap<number, RankBorderGrowth>,
    nextGrowthChanges: Set<number>,
  ) {
    const nextRankGrowths = new Map<number, RankBorderGrowth>()
    for (const growth of rankGrowths) {
      nextRankGrowths.set(growth.rank, growth)
      const previousGrowth = previousGrowths.get(growth.rank)
      if (previousGrowth && isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(growth.rank)
      }
    }
    return nextRankGrowths
  }

  function applyTop100Overview(
    rankings: RankBorderLatest[],
    playerGrowths: RankBorderTopPlayerGrowth[],
    rankGrowths: RankBorderGrowth[],
    previousDetails: Map<number, RankBorderLatest>,
    previousPlayerGrowths: Map<number, RankBorderGrowth>,
    previousRankGrowths: Map<number, RankBorderGrowth>,
    previousLines: Map<number, RankBorderLine>,
    previousLineGrowths: Map<number, number | null>,
  ) {
    const latestEntries = latestRankingEntriesByRank(rankings)
    if (latestEntries.length === 0 && previousDetails.size > 0) {
      return
    }

    const nextProfiles = seedProfilesFromLatestEntries(latestEntries)
    const { nextDetails, nextScoreChanges } = buildLatestDetailOverview(
      latestEntries,
      nextProfiles,
      previousDetails,
    )
    const { nextGrowths, nextGrowthChanges } = buildPlayerGrowthOverview(
      playerGrowths,
      nextDetails,
      previousPlayerGrowths,
    )
    const nextRankGrowths = buildRankGrowthOverview(rankGrowths, previousRankGrowths, nextGrowthChanges)

    for (const line of tracker.lines.value) {
      const previousLine = previousLines.get(line.rank)
      if (previousLine && previousLine.score !== line.score) {
        nextScoreChanges.add(line.rank)
      }
    }
    for (const growth of tracker.growths.value) {
      if (previousLineGrowths.has(growth.rank) && previousLineGrowths.get(growth.rank) !== growth.growth) {
        nextGrowthChanges.add(growth.rank)
      }
    }

    top100Details.value = nextDetails
    top100GrowthByRank.value = nextGrowths
    top100RankGrowthByRank.value = nextRankGrowths
    top100GrowthIntervalSeconds.value = selectedIntervalSeconds.value
    writeTop100DetailsCache(nextDetails)
    applyFlashMarks(nextScoreChanges, nextGrowthChanges)
  }

  /**
   * Publish the change marks exactly once per refresh; the value spans in the
   * rows are keyed by their value, so a changed value remounts its span and
   * restarts the one-shot CSS animation without any rAF class juggling. One
   * timer clears the marks after the animation so the highlight color drops.
   */
  function applyFlashMarks(nextScoreChanges: Set<number>, nextGrowthChanges: Set<number>) {
    if (nextScoreChanges.size === 0 && nextGrowthChanges.size === 0) {
      return
    }

    scoreChangedRanks.value = nextScoreChanges
    growthChangedRanks.value = nextGrowthChanges
    scheduleNumberFlashReset()
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

    const cached = top100MemoryCache.get(top100DetailsCacheKey())
    if (!cached || Date.now() - cached.cachedAt > TOP_100_DETAIL_CACHE_TTL_MS) {
      return
    }

    top100Details.value = new Map(cached.details)
    seedProfilesFromLatestEntries(Array.from(cached.details.values()))
  }

  function writeTop100DetailsCache(details: Map<number, RankBorderLatest>) {
    if (!canRefresh.value || details.size === 0) {
      return
    }

    const key = top100DetailsCacheKey()
    top100MemoryCache.delete(key)
    top100MemoryCache.set(key, {
      cachedAt: Date.now(),
      details,
    })
    while (top100MemoryCache.size > TOP_100_MEMORY_CACHE_LIMIT) {
      const oldestKey = top100MemoryCache.keys().next().value
      if (oldestKey == null) {
        break
      }
      top100MemoryCache.delete(oldestKey)
    }
  }

  function refreshTop100GrowthsFromCachedTraces(previousGrowths: Map<number, RankBorderGrowth>) {
    const nextGrowths = new Map<number, RankBorderGrowth>()
    const nextRankGrowths = new Map<number, RankBorderGrowth>()
    const nextGrowthChanges = new Set<number>()

    for (const rank of TOP_100_RANKS) {
      const trackerGrowth = selectedTrackerGrowthByRank.value.get(rank)
      if (trackerGrowth) {
        nextRankGrowths.set(rank, trackerGrowth)
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
      if (previousGrowth && isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(rank)
      }
    }

    top100GrowthByRank.value = nextGrowths
    top100RankGrowthByRank.value = nextRankGrowths
    top100GrowthIntervalSeconds.value = selectedIntervalSeconds.value
    if (nextGrowthChanges.size > 0) {
      growthChangedRanks.value = nextGrowthChanges
      scheduleNumberFlashReset()
    }
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

    const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - latestTimestamp)
    const secondsUntilNextTrackerTick = TRACKER_UPDATE_INTERVAL_SECONDS - (ageSeconds % TRACKER_UPDATE_INTERVAL_SECONDS)
    return Math.min(
      MAX_LIVE_REFRESH_MS,
      Math.max(MIN_LIVE_REFRESH_MS, secondsUntilNextTrackerTick * 1000),
    )
  }

  function scheduleNumberFlashReset() {
    clearNumberFlashTimer()
    numberFlashTimer = setTimeout(() => {
      if (scoreChangedRanks.value.size > 0) {
        scoreChangedRanks.value = new Set()
      }
      if (growthChangedRanks.value.size > 0) {
        growthChangedRanks.value = new Set()
      }
      numberFlashTimer = null
    }, NUMBER_FLASH_MS)
  }

  function clearNumberFlashTimer() {
    if (numberFlashTimer) {
      clearTimeout(numberFlashTimer)
      numberFlashTimer = null
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
        honor.honorCount,
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

  return {
    tracker,
    liveRefreshing,
    realtimeState,
    realtimeOnline,
    top100Details,
    top100GrowthByRank,
    top100RankGrowthByRank,
    top100GrowthIntervalSeconds,
    top100TraceByRank,
    segmentTraceByRank,
    scoreChangedRanks,
    growthChangedRanks,
    canRefresh,
    top100Rows,
    hasTop100Data,
    selectedTrackerGrowthByRank,
    segmentRows,
    hasSegmentData,
    latestTrackerTimestamp,
    canUseRealtimeAutoRefresh,
    trackerStatusTone,
    trackerStatusLabel,
    resetRankBorderData,
    refreshData,
    refreshTop100GrowthsFromCachedTraces,
    resetLiveRefreshTimer,
    stopRealtimeSubscription,
    scheduleNumberFlashReset,
  }
}
