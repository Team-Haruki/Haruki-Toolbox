import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from "vue"
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
  normalizeRankBorderWebRankings,
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
  TOP_100_DETAIL_CACHE_PREFIX,
  TOP_100_DETAIL_CACHE_TTL_MS,
  TOP_100_RANKS,
  TRACKER_UPDATE_INTERVAL_SECONDS,
} from "../lib/rank-border-constants"
import type {
  DetailState,
  RankBorderLineRow,
  RankBorderSegmentRow,
} from "../lib/rank-border-types"

/**
 * LIVE DATA ENGINE for the rank-border view.
 *
 * Owns the tracker subscription, the realtime WebSocket + local live-refresh
 * fallback timers, the top-100 leaderboard data + growth caches, the number
 * flash state, and the refresh orchestration that keeps them coherent. The
 * detail subsystem stays in the view; this composable reaches it only through
 * the `refreshActiveDetail` / `resetDetailData` callbacks. Everything returned
 * keeps the original declaration names so the view's <template> and remaining
 * script reference them unchanged.
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
  detail: Ref<DetailState | null>
  publicProfileByUserId: Ref<Map<string, RankBorderUserProfile>>
  detailScoreChanged: Ref<boolean>
  refreshActiveDetail: () => void | Promise<void>
  resetDetailData: () => void
  normalizeTextValue: (value: unknown) => string | null
  mergeLatestWithProfile: (
    latest: RankBorderLatest,
    profile: RankBorderUserProfile | null,
  ) => RankBorderLatest
  hasProfileFields: (latest: RankBorderLatest) => boolean
  isLocalMockTrackerEndpoint: (endpoint: string) => boolean
}

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
    detail,
    publicProfileByUserId,
    detailScoreChanged,
    refreshActiveDetail,
    resetDetailData,
    normalizeTextValue,
    mergeLatestWithProfile,
    hasProfileFields,
    isLocalMockTrackerEndpoint,
  } = deps

  const { t } = useI18n()
  const userStore = useUserStore()

  const tracker = useRankBorderTracker()

  const liveRefreshing = ref(false)
  const realtimeState = ref<RankBorderRealtimeState>("closed")
  const realtimeOnline = ref<RankBorderRealtimeOnline | null>(null)
  const currentUnixSecond = ref(Math.floor(Date.now() / 1000))
  const top100Details = ref<Map<number, RankBorderLatest>>(new Map())
  const top100GrowthByRank = ref<Map<number, RankBorderGrowth>>(new Map())
  const top100RankGrowthByRank = ref<Map<number, RankBorderGrowth>>(new Map())
  const top100GrowthIntervalSeconds = ref<number | null>(null)
  const top100TraceByRank = ref<Map<number, RankBorderTracePoint[]>>(new Map())
  const segmentTraceByRank = ref<Map<number, RankBorderTracePoint[]>>(new Map())
  const scoreChangedRanks = ref<Set<number>>(new Set())
  const growthChangedRanks = ref<Set<number>>(new Set())
  const detailChangedRanks = ref<Set<number>>(new Set())

  let liveRefreshTimer: ReturnType<typeof setTimeout> | null = null
  let realtimeSubscription: RankBorderRealtimeSubscription | null = null
  let realtimeSubscriptionKey = ""
  let realtimeSubscriptionToken = 0
  let numberFlashTimer: ReturnType<typeof setTimeout> | null = null
  let pendingRefresh = false
  const clockTimer = setInterval(() => {
    currentUnixSecond.value = Math.floor(Date.now() / 1000)
  }, 1000)

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
          selected: detail.value?.source === "line" && detail.value.result.rank === line.rank,
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
    clearInterval(clockTimer)
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
    const rowKey = top100RowKey(rank, rowDetail)
    return {
      key: rowKey,
      rank,
      score: rowDetail?.score ?? null,
      timestamp: rowDetail?.timestamp ?? null,
      growth,
      rankGrowth,
      displayGrowth: growth?.growth ?? null,
      displayRankGrowth: rankGrowth?.growth ?? null,
      detail: rowDetail,
      selected: detail.value?.result.rank === rank,
      scoreChanged: scoreChangedRanks.value.has(rank),
      growthChanged: growthChangedRanks.value.has(rank),
      displayGrowthChanged: growthChangedRanks.value.has(rank),
      displayRankGrowthChanged: growthChangedRanks.value.has(rank),
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
    resetDetailData()
    top100Details.value = new Map()
    top100GrowthByRank.value = new Map()
    top100RankGrowthByRank.value = new Map()
    top100GrowthIntervalSeconds.value = null
    top100TraceByRank.value = new Map()
    segmentTraceByRank.value = new Map()
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
        return
      }

      applyTop100Overview(
        tracker.topRankings.value,
        tracker.topPlayerGrowths.value,
        tracker.topRankGrowths.value,
        previousDetails,
        previousTop100Growths,
        previousTop100RankGrowths,
      )
      markChangedLines(previousLines)
      markChangedGrowths(previousGrowths)
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

  function applyTop100Overview(
    rankings: RankBorderLatest[],
    playerGrowths: RankBorderTopPlayerGrowth[],
    rankGrowths: RankBorderGrowth[],
    previousDetails: Map<number, RankBorderLatest>,
    previousPlayerGrowths: Map<number, RankBorderGrowth>,
    previousRankGrowths: Map<number, RankBorderGrowth>,
  ) {
    const latestEntries = latestRankingEntriesByRank(rankings)
    if (latestEntries.length === 0 && previousDetails.size > 0) {
      return
    }

    const nextProfiles = seedProfilesFromLatestEntries(latestEntries)
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

    const nextGrowths = new Map<number, RankBorderGrowth>()
    const nextGrowthChanges = new Set<number>()
    for (const growth of playerGrowths) {
      const detail = nextDetails.get(growth.rank)
      if (detail?.userId && detail.userId !== growth.userId) {
        continue
      }
      nextGrowths.set(growth.rank, growth)
      const previousGrowth = previousPlayerGrowths.get(growth.rank)
      if (!previousGrowth || isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(growth.rank)
      }
    }

    const nextRankGrowths = new Map<number, RankBorderGrowth>()
    for (const growth of rankGrowths) {
      nextRankGrowths.set(growth.rank, growth)
      const previousGrowth = previousRankGrowths.get(growth.rank)
      if (!previousGrowth || isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(growth.rank)
      }
    }

    top100Details.value = nextDetails
    top100GrowthByRank.value = nextGrowths
    top100RankGrowthByRank.value = nextRankGrowths
    top100GrowthIntervalSeconds.value = selectedIntervalSeconds.value
    writeTop100DetailsCache(nextDetails)
    if (nextScoreChanges.size > 0) {
      restartRankFlash(scoreChangedRanks, nextScoreChanges)
    }
    if (nextDetailChanges.size > 0) {
      restartRankFlash(detailChangedRanks, nextDetailChanges)
    }
    if (nextGrowthChanges.size > 0) {
      restartRankFlash(growthChangedRanks, nextGrowthChanges)
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
      if (!previousGrowth || isGrowthChanged(previousGrowth, growth)) {
        nextGrowthChanges.add(rank)
      }
    }

    top100GrowthByRank.value = nextGrowths
    top100RankGrowthByRank.value = nextRankGrowths
    top100GrowthIntervalSeconds.value = selectedIntervalSeconds.value
    if (nextGrowthChanges.size > 0) {
      restartRankFlash(growthChangedRanks, nextGrowthChanges)
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
    currentUnixSecond,
    top100Details,
    top100GrowthByRank,
    top100RankGrowthByRank,
    top100GrowthIntervalSeconds,
    top100TraceByRank,
    segmentTraceByRank,
    scoreChangedRanks,
    growthChangedRanks,
    detailChangedRanks,
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
    createTop100Row,
    top100RowKey,
    resetRankBorderData,
    realtimeKey,
    refreshData,
    applyTop100Overview,
    seedProfilesFromLatestEntries,
    latestRankingEntriesByRank,
    latestDetailsByRowKey,
    top100DetailsCacheKey,
    hydrateTop100DetailsFromCache,
    writeTop100DetailsCache,
    refreshTop100GrowthsFromCachedTraces,
    resetLiveRefreshTimer,
    resetRealtimeSubscription,
    stopRealtimeSubscription,
    handleRealtimeEvent,
    scheduleLocalLiveRefreshFallback,
    scheduleNextLiveRefresh,
    shouldAllowLocalLiveRefreshFallback,
    stopLiveRefreshTimer,
    resolveNextLiveRefreshDelay,
    markChangedLines,
    markChangedGrowths,
    restartRankFlash,
    scheduleNumberFlashReset,
    clearNumberFlashTimer,
  }
}
