import { computed, ref } from "vue"
import {
  fetchRankBorderOverview,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
  type RankBorderTrackerScope,
} from "../api/rank-border"
import type {
  RankBorderGrowth,
  RankBorderLatest,
  RankBorderLine,
  RankBorderStatus,
  RankBorderTopPlayerGrowth,
} from "../lib/rank-border"

export type RankBorderRefreshInput = RankBorderTrackerScope & {
  intervalSeconds: number
  userId?: string | null
  rank?: string | null
}

export function useRankBorderTracker() {
  const lines = ref<RankBorderLine[]>([])
  const growths = ref<RankBorderGrowth[]>([])
  const growthIntervalSeconds = ref<number | null>(null)
  const status = ref<RankBorderStatus | null>(null)
  const topRankings = ref<RankBorderLatest[]>([])
  const topPlayerGrowths = ref<RankBorderTopPlayerGrowth[]>([])
  const topRankGrowths = ref<RankBorderGrowth[]>([])
  const userResult = ref<RankBorderLatest | null>(null)
  const rankResult = ref<RankBorderLatest | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userError = ref<string | null>(null)
  const rankError = ref<string | null>(null)
  const refreshedAt = ref<number | null>(null)

  const growthByRank = computed(() =>
    new Map(growths.value.map((growth) => [growth.rank, growth])),
  )

  async function refresh(input: RankBorderRefreshInput) {
    loading.value = true
    error.value = null
    userError.value = null
    rankError.value = null

    try {
      const baseScope = {
        endpoint: input.endpoint,
        region: input.region,
        eventId: input.eventId,
        mode: input.mode,
        worldBloomCharacterId: input.worldBloomCharacterId,
        cacheBust: input.cacheBust,
        playbackAt: input.playbackAt,
        useWebSocket: input.useWebSocket,
      }
      const overview = await fetchRankBorderOverview({
        ...baseScope,
        intervalSeconds: input.intervalSeconds,
      })

      if (overview.borderLines.length > 0 || lines.value.length === 0) {
        lines.value = overview.borderLines
      }
      growths.value = overview.borderGrowths
      growthIntervalSeconds.value = input.intervalSeconds
      status.value = overview.status
      topRankings.value = overview.topRankings
      topPlayerGrowths.value = overview.topPlayerGrowths
      topRankGrowths.value = overview.topRankGrowths

      await Promise.all([
        refreshUser(baseScope, input.userId),
        refreshRank(baseScope, input.rank),
      ])
      refreshedAt.value = Date.now()
    } catch (refreshError) {
      error.value = refreshError instanceof Error ? refreshError.message : String(refreshError)
    } finally {
      loading.value = false
    }
  }

  async function refreshUser(scope: RankBorderTrackerScope, userId: string | null | undefined) {
    const normalizedUserId = String(userId ?? "").trim()
    if (!normalizedUserId) {
      userResult.value = null
      userError.value = null
      return
    }

    try {
      const detail = await fetchRankBorderWebUserDetailV2({
        ...scope,
        userId: normalizedUserId,
      })
      userResult.value = detail.current
      userError.value = userResult.value ? null : "not found"
    } catch (refreshError) {
      userResult.value = null
      userError.value = refreshError instanceof Error ? refreshError.message : String(refreshError)
    }
  }

  async function refreshRank(scope: RankBorderTrackerScope, rank: string | null | undefined) {
    const normalizedRank = String(rank ?? "").trim()
    if (!normalizedRank) {
      rankResult.value = null
      rankError.value = null
      return
    }

    try {
      const rank = Number(normalizedRank)
      const detail = Number.isInteger(rank) && rank > 0
        ? await fetchRankBorderWebRankDetailV2({
            ...scope,
            rank,
          })
        : null
      rankResult.value = detail?.current ?? null
      rankError.value = rankResult.value ? null : "not found"
    } catch (refreshError) {
      rankResult.value = null
      rankError.value = refreshError instanceof Error ? refreshError.message : String(refreshError)
    }
  }

  return {
    lines,
    growths,
    growthIntervalSeconds,
    growthByRank,
    status,
    topRankings,
    topPlayerGrowths,
    topRankGrowths,
    userResult,
    rankResult,
    loading,
    error,
    userError,
    rankError,
    refreshedAt,
    refresh,
  }
}
