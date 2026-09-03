import { computed, onBeforeUnmount, shallowRef, watch, type ComputedRef, type Ref } from "vue"
import { useUserStore } from "@/shared/stores/user"
import {
  fetchRankBorderOverview,
  fetchRankBorderPrivateWebUserDetailV2,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
  subscribeRankBorderRealtime,
  type RankBorderRealtimeSubscription,
  type RankBorderTrackerScope,
} from "../api/rank-border"
import {
  normalizeRankBorderTraceTimeline,
  type RankBorderLatest,
  type RankBorderOverview,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import type { RankBorderDetailParams, RankBorderDetailTargetInput } from "../lib/detail-link"
import {
  isSelfComparisonTarget,
  resolveComparisonSelfIdentity,
  type ComparisonTargetKind,
} from "../lib/comparison-target"
import { TRACE_PAGE_LIMIT } from "../lib/rank-border-constants"

export type DetailComparisonKind = "rank" | "line" | "user"

export type DetailPageComparison = {
  id: string
  kind: DetailComparisonKind
  query: string
  /** Resolved display label (#5 名前 / T500 / player name). */
  label: string
  trace: RankBorderTracePoint[]
  current: RankBorderLatest | null
  loading: boolean
  error: boolean
}

export type AddComparisonResult = "added" | "duplicate" | "limit" | "invalid" | "self"

export const DETAIL_COMPARISON_LIMIT = 3

type DetailTargetCacheEntry = {
  current: RankBorderLatest | null
  previous: RankBorderLatest | null
  next: RankBorderLatest | null
  playerTrace: RankBorderTracePoint[]
  borderTrace: RankBorderTracePoint[]
  cachedAt: number
}

const DETAIL_CACHE_LIMIT = 8
const OVERVIEW_CACHE_TTL_MS = 60_000

// Module-level caches survive navigation, so list -> detail -> back -> detail
// repaints instantly from memory and only the missing tail is fetched.
const detailTargetCache = new Map<string, DetailTargetCacheEntry>()
const overviewCache = new Map<string, { cachedAt: number; overview: RankBorderOverview }>()

/**
 * Data orchestration for the standalone detail page: loads the target's
 * current state and full trace(s) with module-memory caching + cursor-based
 * incremental refresh, manages up to DETAIL_COMPARISON_LIMIT comparison
 * targets, and reacts to realtime pushes only when the pushed capture
 * timestamp is actually newer than the locally known data.
 */
export function useRankBorderDetailPage(
  params: ComputedRef<RankBorderDetailParams | null>,
  trackerEndpoint: Ref<string>,
) {
  const userStore = useUserStore()

  const loading = shallowRef(false)
  const error = shallowRef<string | null>(null)
  const current = shallowRef<RankBorderLatest | null>(null)
  const previous = shallowRef<RankBorderLatest | null>(null)
  const next = shallowRef<RankBorderLatest | null>(null)
  const playerTrace = shallowRef<RankBorderTracePoint[]>([])
  const borderTrace = shallowRef<RankBorderTracePoint[]>([])
  const traceSource = shallowRef<"player" | "border">("player")
  const comparisons = shallowRef<DetailPageComparison[]>([])
  const overview = shallowRef<RankBorderOverview | null>(null)

  let requestToken = 0
  let realtimeSubscription: RankBorderRealtimeSubscription | null = null
  let realtimeKey = ""

  const scope = computed<RankBorderTrackerScope | null>(() => {
    const value = params.value
    if (!value) {
      return null
    }
    return {
      endpoint: trackerEndpoint.value,
      region: value.region,
      eventId: value.eventId,
      mode: value.mode,
      worldBloomCharacterId: value.worldBloomCharacterId,
      cacheBust: true,
      playbackAt: null,
      useWebSocket: false,
    }
  })

  const hasPlayerTrace = computed(() => playerTrace.value.length >= 2)
  const hasBorderTrace = computed(() => borderTrace.value.length >= 2)
  const activeTrace = computed(() =>
    traceSource.value === "border" && hasBorderTrace.value ? borderTrace.value : playerTrace.value,
  )

  const latestKnownTimestamp = computed(() => {
    const candidates = [
      current.value?.timestamp,
      playerTrace.value[playerTrace.value.length - 1]?.timestamp,
      borderTrace.value[borderTrace.value.length - 1]?.timestamp,
    ].filter((timestamp): timestamp is number => typeof timestamp === "number")
    return candidates.length > 0 ? Math.max(...candidates) : null
  })

  watch(
    () => [scope.value, params.value?.target] as const,
    () => {
      void loadTarget({ hydrateFromCache: true })
      void loadOverview()
      resetRealtime()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    stopRealtime()
  })

  function targetCacheKey(): string | null {
    const activeScope = scope.value
    const target = params.value?.target
    if (!activeScope || !target) {
      return null
    }
    const targetId = target.kind === "user" ? `user:${target.userId}:${target.own ? 1 : 0}` : `${target.kind}:${target.rank}`
    return [
      activeScope.endpoint,
      activeScope.region,
      activeScope.eventId,
      activeScope.mode,
      activeScope.worldBloomCharacterId ?? "",
      targetId,
    ].join("|")
  }

  function writeTargetCache() {
    const key = targetCacheKey()
    if (!key || (!current.value && playerTrace.value.length === 0 && borderTrace.value.length === 0)) {
      return
    }
    detailTargetCache.delete(key)
    detailTargetCache.set(key, {
      current: current.value,
      previous: previous.value,
      next: next.value,
      playerTrace: playerTrace.value,
      borderTrace: borderTrace.value,
      cachedAt: Date.now(),
    })
    while (detailTargetCache.size > DETAIL_CACHE_LIMIT) {
      const oldestKey = detailTargetCache.keys().next().value
      if (oldestKey == null) {
        break
      }
      detailTargetCache.delete(oldestKey)
    }
  }

  /** Merge freshly fetched points after the known tail, keeping the timeline sorted. */
  function appendTrace(existing: RankBorderTracePoint[], incoming: RankBorderTracePoint[]): RankBorderTracePoint[] {
    if (incoming.length === 0) {
      return existing
    }
    const lastTimestamp = existing[existing.length - 1]?.timestamp ?? 0
    const fresh = incoming.filter((point) => point.timestamp > lastTimestamp)
    if (fresh.length === 0) {
      return existing
    }
    return normalizeRankBorderTraceTimeline([...existing, ...fresh])
  }

  async function loadTarget(options: { hydrateFromCache?: boolean; silent?: boolean } = {}) {
    const activeScope = scope.value
    const target = params.value?.target
    const token = ++requestToken
    if (!activeScope || !target) {
      current.value = null
      playerTrace.value = []
      borderTrace.value = []
      return
    }

    const cacheKey = targetCacheKey()
    let hydrated = false
    if (options.hydrateFromCache && cacheKey) {
      const cached = detailTargetCache.get(cacheKey)
      if (cached) {
        current.value = cached.current
        previous.value = cached.previous
        next.value = cached.next
        playerTrace.value = cached.playerTrace
        borderTrace.value = cached.borderTrace
        traceSource.value = target.kind === "line" || cached.playerTrace.length < 2 ? "border" : traceSource.value === "border" && cached.borderTrace.length >= 2 ? "border" : "player"
        hydrated = true
      } else {
        current.value = null
        previous.value = null
        next.value = null
        playerTrace.value = []
        borderTrace.value = []
      }
    }

    const silent = options.silent ?? hydrated
    const incremental = hydrated || (options.silent === true && playerTrace.value.length + borderTrace.value.length > 0)
    if (!silent) {
      loading.value = true
      error.value = null
    }
    try {
      if (target.kind === "user") {
        await loadUserTarget(activeScope, target, token, incremental)
      } else {
        await loadRankTarget(activeScope, target, token, incremental)
      }
      if (token !== requestToken) {
        return
      }
      if (!current.value && playerTrace.value.length === 0 && borderTrace.value.length === 0) {
        error.value = "not_found"
      } else {
        error.value = null
        writeTargetCache()
      }
    } catch (loadError) {
      if (token !== requestToken) {
        return
      }
      if (!silent) {
        current.value = null
        playerTrace.value = []
        borderTrace.value = []
      }
      error.value = loadError instanceof Error ? loadError.message : String(loadError)
    } finally {
      if (token === requestToken && !silent) {
        loading.value = false
      }
    }
  }

  async function loadUserTarget(
    activeScope: RankBorderTrackerScope,
    target: Extract<RankBorderDetailTargetInput, { kind: "user" }>,
    token: number,
    incremental: boolean,
  ) {
    const usePrivate = target.own === true && userStore.isLoggedIn
    if (usePrivate) {
      // The private endpoint has no trace cursor; its own-account trace is
      // small enough that a full refetch stays cheap.
      const detail = await fetchRankBorderPrivateWebUserDetailV2({
        ...activeScope,
        userId: target.userId,
        ownerId: userStore.kratosIdentityId,
        includeTrace: true,
        includeProfile: true,
      })
      if (token !== requestToken) {
        return
      }
      current.value = detail.current ?? current.value
      previous.value = detail.previous ?? previous.value
      next.value = detail.next ?? next.value
      playerTrace.value = normalizeRankBorderTraceTimeline(detail.playerTrace)
      borderTrace.value = []
      traceSource.value = "player"
      return
    }

    const cursor = incremental
      ? playerTrace.value[playerTrace.value.length - 1]?.timestamp ?? null
      : null
    const detail = await fetchRankBorderWebUserDetailV2({
      ...activeScope,
      userId: target.userId,
      includeTrace: true,
      includeProfile: !incremental,
      cursor,
      fetchAllTrace: cursor == null,
      limit: TRACE_PAGE_LIMIT,
    })
    if (token !== requestToken) {
      return
    }
    current.value = detail.current ?? current.value
    previous.value = detail.previous ?? previous.value
    next.value = detail.next ?? next.value
    playerTrace.value = cursor == null
      ? normalizeRankBorderTraceTimeline(detail.playerTrace)
      : appendTrace(playerTrace.value, detail.playerTrace)
    borderTrace.value = []
    traceSource.value = "player"
  }

  async function loadRankTarget(
    activeScope: RankBorderTrackerScope,
    target: Extract<RankBorderDetailTargetInput, { kind: "rank" | "line" }>,
    token: number,
    incremental: boolean,
  ) {
    const wantPlayerTrace = target.kind === "rank"
    const playerCursor = playerTrace.value[playerTrace.value.length - 1]?.timestamp ?? null
    const borderCursor = borderTrace.value[borderTrace.value.length - 1]?.timestamp ?? null
    // Both traces share one request; incremental mode resumes from the older
    // tail so neither series misses points.
    const cursor = incremental
      ? Math.min(playerCursor ?? Number.POSITIVE_INFINITY, borderCursor ?? Number.POSITIVE_INFINITY)
      : null
    const normalizedCursor = cursor != null && Number.isFinite(cursor) ? cursor : null
    const detail = await fetchRankBorderWebRankDetailV2({
      ...activeScope,
      rank: target.rank,
      includeTrace: true,
      includePlayerTrace: wantPlayerTrace,
      cursor: incremental ? normalizedCursor : null,
      fetchAllTrace: !incremental,
      limit: TRACE_PAGE_LIMIT,
    })
    if (token !== requestToken) {
      return
    }
    current.value = detail.current ?? current.value
    previous.value = detail.previous ?? previous.value
    next.value = detail.next ?? next.value
    playerTrace.value = incremental
      ? appendTrace(playerTrace.value, detail.playerTrace)
      : normalizeRankBorderTraceTimeline(detail.playerTrace)
    borderTrace.value = incremental
      ? appendTrace(borderTrace.value, detail.rankTrace)
      : normalizeRankBorderTraceTimeline(detail.rankTrace)
    if (!incremental) {
      traceSource.value = target.kind === "line" || playerTrace.value.length < 2 ? "border" : "player"
    }
  }

  // --- Overview (comparison picker + shared context) ---------------------------

  function overviewCacheKey(): string | null {
    const activeScope = scope.value
    if (!activeScope) {
      return null
    }
    return [
      activeScope.endpoint,
      activeScope.region,
      activeScope.eventId,
      activeScope.mode,
      activeScope.worldBloomCharacterId ?? "",
    ].join("|")
  }

  async function loadOverview(force = false) {
    const activeScope = scope.value
    const value = params.value
    const key = overviewCacheKey()
    if (!activeScope || !value || !key) {
      overview.value = null
      return
    }

    const cached = overviewCache.get(key)
    if (cached) {
      overview.value = cached.overview
      if (!force && Date.now() - cached.cachedAt < OVERVIEW_CACHE_TTL_MS) {
        return
      }
    }

    try {
      const data = await fetchRankBorderOverview({
        ...activeScope,
        intervalSeconds: value.intervalSeconds,
      })
      if (overviewCacheKey() !== key) {
        return
      }
      overview.value = data
      overviewCache.set(key, { cachedAt: Date.now(), overview: data })
      while (overviewCache.size > 4) {
        const oldestKey = overviewCache.keys().next().value
        if (oldestKey == null) {
          break
        }
        overviewCache.delete(oldestKey)
      }
    } catch {
    }
  }

  function setTraceSource(source: "player" | "border") {
    traceSource.value = source
  }

  // --- Comparisons -------------------------------------------------------------

  const selfIdentity = computed(() => resolveComparisonSelfIdentity(params.value?.target, current.value))

  /** True when the target is the page's own seat / line / player. */
  function isSelfComparison(kind: ComparisonTargetKind, query: string): boolean {
    return isSelfComparisonTarget(selfIdentity.value, kind, query)
  }

  function addComparisonTarget(kind: DetailComparisonKind, query: string, label: string): AddComparisonResult {
    const normalized = query.trim()
    if (!normalized) {
      return "invalid"
    }
    if (isSelfComparison(kind, normalized)) {
      return "self"
    }

    const id = `${kind}:${normalized}`
    if (comparisons.value.some((item) => item.id === id)) {
      return "duplicate"
    }
    if (comparisons.value.length >= DETAIL_COMPARISON_LIMIT) {
      return "limit"
    }

    const comparison: DetailPageComparison = {
      id,
      kind,
      query: normalized,
      label,
      trace: [],
      current: null,
      loading: true,
      error: false,
    }
    comparisons.value = [...comparisons.value, comparison]
    void loadComparison(comparison.id, false)
    return "added"
  }

  function addComparisonPlayer(input: string): AddComparisonResult {
    const userId = input.trim()
    return addComparisonTarget("user", userId, userId)
  }

  function removeComparison(id: string) {
    comparisons.value = comparisons.value.filter((item) => item.id !== id)
  }

  async function loadComparison(id: string, incremental: boolean) {
    const activeScope = scope.value
    const entry = comparisons.value.find((item) => item.id === id)
    if (!activeScope || !entry) {
      return
    }

    const cursor = incremental
      ? entry.trace[entry.trace.length - 1]?.timestamp ?? null
      : null
    if (!incremental) {
      patchComparison(id, { loading: true, error: false })
    }
    try {
      if (entry.kind === "user") {
        const detail = await fetchRankBorderWebUserDetailV2({
          ...activeScope,
          userId: entry.query,
          includeTrace: true,
          includeProfile: cursor == null,
          cursor,
          fetchAllTrace: cursor == null,
          limit: TRACE_PAGE_LIMIT,
        })
        const nextTrace = cursor == null
          ? normalizeRankBorderTraceTimeline(detail.playerTrace)
          : appendTrace(entry.trace, detail.playerTrace)
        patchComparison(id, {
          trace: nextTrace,
          current: detail.current ?? entry.current,
          label: detail.current?.name ?? detail.profile?.name ?? entry.label,
          loading: false,
          error: nextTrace.length === 0,
        })
      } else {
        const rank = Number(entry.query)
        const detail = await fetchRankBorderWebRankDetailV2({
          ...activeScope,
          rank,
          includeTrace: true,
          includePlayerTrace: entry.kind === "rank",
          cursor,
          fetchAllTrace: cursor == null,
          limit: TRACE_PAGE_LIMIT,
        })
        const incoming = detail.rankTrace.length > 0 ? detail.rankTrace : detail.playerTrace
        const nextTrace = cursor == null
          ? normalizeRankBorderTraceTimeline(incoming)
          : appendTrace(entry.trace, incoming)
        patchComparison(id, {
          trace: nextTrace,
          current: detail.current ?? entry.current,
          loading: false,
          error: nextTrace.length === 0,
        })
      }
    } catch {
      if (!incremental) {
        patchComparison(id, { loading: false, error: true })
      }
    }
  }

  function patchComparison(id: string, patch: Partial<DetailPageComparison>) {
    comparisons.value = comparisons.value.map((item) =>
      item.id === id ? { ...item, ...patch } : item,
    )
  }

  async function refresh(silent = true) {
    await loadTarget({ silent })
    for (const entry of comparisons.value) {
      void loadComparison(entry.id, silent && entry.trace.length > 0)
    }
    void loadOverview(true)
  }

  // Comparison traces belong to the scope: a scope change reloads them fully.
  watch(scope, () => {
    for (const entry of comparisons.value) {
      void loadComparison(entry.id, false)
    }
  })

  // --- Realtime ----------------------------------------------------------------

  function resetRealtime() {
    const value = params.value
    if (!value || !userStore.hasActiveSession) {
      stopRealtime()
      return
    }

    const key = `${trackerEndpoint.value}:${value.region}:${value.eventId}`
    if (realtimeSubscription && realtimeKey === key) {
      return
    }

    stopRealtime()
    realtimeKey = key
    void subscribeRankBorderRealtime({
      endpoint: trackerEndpoint.value,
      region: value.region,
      eventId: value.eventId,
    }, (event) => {
      if (event.type !== "updated" || event.server !== value.region || event.eventId !== value.eventId) {
        return
      }

      // The push carries the tracker's capture timestamp: only pull when it is
      // actually ahead of what this page already holds.
      const known = latestKnownTimestamp.value
      if (event.timestamp != null && known != null && event.timestamp <= known) {
        return
      }
      void refresh(true)
    })
      .then((subscription) => {
        if (realtimeKey !== key) {
          subscription.unsubscribe()
          return
        }
        realtimeSubscription = subscription
      })
      .catch(() => {})
  }

  function stopRealtime() {
    realtimeSubscription?.unsubscribe()
    realtimeSubscription = null
    realtimeKey = ""
  }

  return {
    loading,
    error,
    current,
    previous,
    next,
    playerTrace,
    borderTrace,
    hasPlayerTrace,
    hasBorderTrace,
    activeTrace,
    traceSource,
    setTraceSource,
    overview,
    comparisons,
    isSelfComparison,
    addComparisonTarget,
    addComparisonPlayer,
    removeComparison,
    refresh,
  }
}
