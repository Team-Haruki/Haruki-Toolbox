import { useI18n } from "vue-i18n"
import { useUserStore } from "@/shared/stores/user"
import {
  fetchRankBorderPrivateWebUserDetailV2,
  fetchRankBorderPublicUserProfile,
  isRankBorderTrackerUnauthorizedError,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
} from "../api/rank-border"
import type {
  RankBorderLatest,
  RankBorderLine,
  RankBorderUserProfile,
} from "../lib/rank-border"
import { PERSONAL_COLLECTION_LIMIT } from "../lib/rank-border-constants"
import type { LineDetailState } from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Result-resolution helpers behind the detail loaders: fetch the latest state
 * for a rank / user (with optional profile enrichment), resolve neighbors and
 * comparable border-line points, and classify lookup errors. Pure lookups —
 * none of these touch the loader request token.
 */
export function useRankBorderDetailSources(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
) {
  const {
    publicProfileByUserId,
    trackerEndpoint,
    tracker,
    top100Details,
    selectedTrackerGrowthByRank,
    normalizeTextValue,
    mergeLatestWithProfile,
    hasProfileFields,
    isLocalMockTrackerEndpoint,
  } = deps
  const { detailScope } = state

  const { t } = useI18n()
  const userStore = useUserStore()

  async function fetchPrivateLatestByUser(userId: string) {
    if (!userStore.isLoggedIn) {
      throw new Error(t("rankBorder.result.privateLookupLoginRequired"))
    }

    const detail = await fetchRankBorderPrivateWebUserDetailV2({
      ...detailScope.value,
      userId,
      ownerId: userStore.kratosIdentityId,
      includeProfile: true,
    })
    return mergeLatestWithProfile(detail.current ?? null, detail.profile)
  }

  async function fetchLatestPublicRank(
    rank: number,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    const cached = top100Details.value.get(rank)
    if (cached) {
      return await maybeEnrichLatestProfile(cached, options)
    }

    const rankDetail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
    }).catch(() => null)
    const latest = rankDetail?.current ?? null
    return await maybeEnrichLatestProfile(latest, options)
  }

  async function maybeEnrichLatestProfile(
    latest: RankBorderLatest | null,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    if (!latest || !options.enrichProfile || !shouldEnrichDetailProfile(latest)) {
      return latest
    }

    return mergeLatestWithProfile(latest, await fetchPublicProfile(latest.userId).catch(() => null))
  }

  async function fetchLatestPublicUser(
    userId: string,
    options: { enrichProfile?: boolean } = {},
  ): Promise<RankBorderLatest | null> {
    const cached = findTop100DetailByUserId(userId)
    if (cached) {
      if (!options.enrichProfile || !shouldEnrichDetailProfile(cached)) {
        return cached
      }

      return mergeLatestWithProfile(cached, await fetchPublicProfile(cached.userId).catch(() => null))
    }

    const detail = await fetchRankBorderWebUserDetailV2({
      ...detailScope.value,
      userId,
      includeProfile: options.enrichProfile,
    }).catch(() => null)
    const latest = mergeLatestWithProfile(detail?.current ?? null, detail?.profile)
    if (!latest) {
      return null
    }

    if (!options.enrichProfile || !shouldEnrichDetailProfile(latest)) {
      return latest
    }

    return mergeLatestWithProfile(latest, await fetchPublicProfile(latest.userId).catch(() => null))
  }

  async function resolveDetailNeighbors(
    rank: number,
    previous: RankBorderLatest | null = null,
    next: RankBorderLatest | null = null,
  ): Promise<[RankBorderLatest | null, RankBorderLatest | null]> {
    if (rank > PERSONAL_COLLECTION_LIMIT) {
      return [previous, next]
    }

    const previousResult = previous ?? (rank > 1 ? await fetchLatestPublicRank(rank - 1).catch(() => null) : null)
    const nextResult = next ?? (rank === PERSONAL_COLLECTION_LIMIT
      ? await fetchLineBoundaryResult(200)
      : await fetchLatestPublicRank(rank + 1).catch(() => null))
    return [previousResult, nextResult]
  }

  async function fetchLineBoundaryResult(rank: number): Promise<RankBorderLatest | null> {
    const cached = resolveLineDetail(rank)
    if (cached) {
      return cached.result
    }

    const fallback = await fetchFallbackLineDetail(rank).catch(() => null)
    return fallback?.result ?? null
  }

  function resolveTrackedPlayerId(result: RankBorderLatest | null | undefined) {
    return normalizeTextValue(result?.userId)
  }

  function findTop100DetailByUserId(userId: string | null | undefined): RankBorderLatest | null {
    const normalizedUserId = normalizeTextValue(userId)
    if (!normalizedUserId) {
      return null
    }

    for (const detail of top100Details.value.values()) {
      if (normalizeTextValue(detail.userId) === normalizedUserId) {
        return detail
      }
    }

    return null
  }

  async function fetchFallbackLineDetail(rank: number): Promise<LineDetailState | null> {
    const rankDetail = await fetchRankBorderWebRankDetailV2({
      ...detailScope.value,
      rank,
    }).catch(() => null)
    const latest = rankDetail?.current ?? null
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

  function shouldEnrichDetailProfile(latest: RankBorderLatest) {
    return !!latest.userId && !hasProfileFields(latest) && !publicProfileByUserId.value.has(latest.userId)
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

  function resolveDetailErrorMessage(error: unknown, privateLookup = false) {
    if (privateLookup && isRankBorderTrackerUnauthorizedError(error)) {
      return t("rankBorder.result.privateLookupLoginRequired")
    }

    return error instanceof Error ? error.message : String(error)
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
    for (const detail of top100Details.value.values()) {
      linesByRank.set(detail.rank, {
        rank: detail.rank,
        score: detail.score,
        timestamp: detail.timestamp,
      })
    }

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

  function isPublicUniqueId(value: string) {
    return /^[a-f0-9]{64}$/i.test(value.trim())
  }

  return {
    fetchPrivateLatestByUser,
    fetchLatestPublicRank,
    maybeEnrichLatestProfile,
    fetchLatestPublicUser,
    resolveDetailNeighbors,
    resolveTrackedPlayerId,
    fetchFallbackLineDetail,
    shouldRejectMismatchedAccountLookup,
    resolveDetailErrorMessage,
    resolveLineDetail,
  }
}
