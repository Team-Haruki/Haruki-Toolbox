import { useUserStore } from "@/shared/stores/user"
import {
  fetchRankBorderPrivateWebUserDetailV2,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
} from "../api/rank-border"
import {
  isSameRankBorderTraceTimeline,
  resolveRankBorderDetailTraceKey,
  shouldCacheRankBorderDetailTraceByRank,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import {
  PERSONAL_COLLECTION_LIMIT,
  TRACE_PAGE_LIMIT,
} from "../lib/rank-border-constants"
import type { DetailState } from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Detail trace loading and caching: resolves the trace key for the active
 * detail, reads/writes the per-key and per-rank trace caches, and fetches the
 * full trace from the right endpoint (private player / public player / rank).
 * Owns the active trace key so switching targets resets the heatmap window.
 */
export function useRankBorderDetailTrace(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
) {
  const {
    detail,
    top100TraceByRank,
    segmentTraceByRank,
    top100GrowthByRank,
    canRefresh,
    refreshTop100GrowthsFromCachedTraces,
    normalizeTextValue,
  } = deps
  const {
    detailTrace,
    detailTraceLoading,
    detailTraceByKey,
    selectedHeatmapWindow,
    detailScope,
    normalizeTraceForPlayback,
  } = state

  const userStore = useUserStore()

  let activeDetailTraceKey = ""

  function resetDetailTraceState() {
    activeDetailTraceKey = ""
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
          fetchAllTrace: true,
          limit: TRACE_PAGE_LIMIT,
        }).catch(() => null)
        return detail?.playerTrace ?? []
      }
      return await fetchRankBorderPrivateWebUserDetailV2({
        ...detailScope.value,
        userId: value.query,
        ownerId: userStore.kratosIdentityId,
        includeTrace: true,
      }).then((detail) => detail.playerTrace).catch(() => [])
    }

    if (value.source === "rank") {
      const traceUserId = resolveDetailTraceUserId(value)
      const detail = await fetchRankBorderWebRankDetailV2({
        ...detailScope.value,
        rank: value.result.rank,
        includeTrace: !traceUserId,
        includePlayerTrace: traceUserId != null,
        fetchAllTrace: true,
        limit: TRACE_PAGE_LIMIT,
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
      fetchAllTrace: true,
      limit: TRACE_PAGE_LIMIT,
    }).catch(() => null)
    return detail?.rankTrace ?? []
  }

  return {
    resetDetailTraceState,
    refreshDetailTrace,
  }
}
