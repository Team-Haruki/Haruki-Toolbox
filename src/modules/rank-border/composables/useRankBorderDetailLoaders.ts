import { nextTick } from "vue"
import type { AcceptableValue } from "reka-ui"
import { useI18n } from "vue-i18n"
import {
  isRankBorderTrackerUnauthorizedError,
  fetchRankBorderWebRankDetailV2,
  fetchRankBorderWebUserDetailV2,
} from "../api/rank-border"
import { parseRankBorderRankQuery } from "../lib/rank-border"
import type { PlayerDetailState } from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"
import { useRankBorderDetailSources } from "./useRankBorderDetailSources"
import { useRankBorderDetailTrace } from "./useRankBorderDetailTrace"

/**
 * Load flows for the detail subsystem: the rank / line / user detail loaders,
 * the locate flow, the dialog-tab switch, the mobile expand helpers, and the
 * score-flash triggers. Owns the request token that guards stale responses;
 * result resolution lives in `useRankBorderDetailSources` and trace handling
 * in `useRankBorderDetailTrace`.
 */
export function useRankBorderDetailLoaders(
  deps: UseRankBorderDetailDeps,
  state: RankBorderDetailSharedState,
) {
  const {
    detail,
    publicProfileByUserId,
    detailScoreChanged,
    profileAssetsLoading,
    selectedRegion,
    selectedIntervalSeconds,
    selectedAccount,
    switchRegion,
    top100Details,
    canRefresh,
    scheduleNumberFlashReset,
    normalizeTextValue,
  } = deps
  const {
    detailTrace,
    detailDialogOpen,
    detailDialogTab,
    selectedHeatmapWindow,
    mobileExpandedDetail,
    mobileLocateOpen,
    detailLoading,
    detailError,
    detailTraceByKey,
    detailScope,
  } = state

  const { t } = useI18n()
  const {
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
  } = useRankBorderDetailSources(deps, state)
  const { resetDetailTraceState, refreshDetailTrace } = useRankBorderDetailTrace(deps, state)

  let detailRequestToken = 0

  function resetDetailData() {
    detailRequestToken += 1
    resetDetailTraceState()
    detail.value = null
    detailTrace.value = []
    selectedHeatmapWindow.value = null
    detailLoading.value = false
    detailError.value = null
    mobileExpandedDetail.value = null
    mobileLocateOpen.value = false
    detailTraceByKey.value = new Map()
    publicProfileByUserId.value = new Map()
    profileAssetsLoading.value = false
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
      detailDialogTab.value = "player"
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
        trackedUserId: resolveTrackedPlayerId(cachedDetail),
        result: cachedDetail,
        previous: rank > 1 ? top100Details.value.get(rank - 1) ?? null : null,
        next: top100Details.value.get(rank + 1) ?? null,
      }
      detail.value = nextDetail
      detailDialogTab.value = "player"
      detailError.value = null
      detailLoading.value = false
      refreshDetailTrace(nextDetail)
      markDetailScoreChange(previousScore, cachedDetail.score)
      void loadRankDetail(rank, true, requestToken, { trackedUserId: nextDetail.trackedUserId })
      return
    }

    await loadRankDetail(rank, false, requestToken)
  }

  async function loadRankDetail(
    rank: number,
    silent: boolean,
    requestToken = detailRequestToken,
    options: { trackedUserId?: string | null } = {},
  ) {
    if (!rank || !canRefresh.value) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    if (!silent) {
      detailLoading.value = true
    }
    detailError.value = null
    try {
      const trackedUserId = normalizeTextValue(options.trackedUserId)
      const rankDetail = trackedUserId
        ? null
        : await fetchRankBorderWebRankDetailV2({
            ...detailScope.value,
            rank,
            intervalSeconds: selectedIntervalSeconds.value,
          }).catch(() => null)
      const result = rankDetail?.current
        ? await maybeEnrichLatestProfile(rankDetail.current, { enrichProfile: true })
        : trackedUserId
          ? await fetchLatestPublicUser(trackedUserId, { enrichProfile: true })
          : await fetchLatestPublicRank(rank, { enrichProfile: true })
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!result) {
        throw new Error(t("rankBorder.result.rankNotFound"))
      }

      const [previous, next] = await resolveDetailNeighbors(result.rank, rankDetail?.previous ?? null, rankDetail?.next ?? null)
      if (requestToken !== detailRequestToken) {
        return
      }

      detail.value = {
        source: "rank",
        query: String(rank),
        trackedUserId: trackedUserId ?? resolveTrackedPlayerId(result),
        result,
        previous,
        next,
      }
      detailDialogTab.value = "player"
      refreshDetailTrace(detail.value)
      markDetailScoreChange(previousScore, result.score)
    } catch (error) {
      if (requestToken !== detailRequestToken) {
        return
      }
      if (!silent) {
        detail.value = null
        detailError.value = error instanceof Error ? error.message : String(error)
      }
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
      detailDialogTab.value = "border"
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

  async function updateDetailDialogTab(value: AcceptableValue) {
    if (value !== "player" && value !== "border") {
      return
    }
    if (detailDialogTab.value === value) {
      return
    }

    const activeDetail = detail.value
    if (!activeDetail) {
      detailDialogTab.value = value
      return
    }

    detailDialogTab.value = value
    const rank = activeDetail.result.rank
    if (value === "border") {
      await loadLineDetail(rank, false, ++detailRequestToken)
      detailDialogTab.value = "border"
      return
    }

    await loadRankDetail(rank, false, ++detailRequestToken, {
      trackedUserId: activeDetail.source === "line" ? null : activeDetail.trackedUserId,
    })
    detailDialogTab.value = "player"
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
      const webDetail = options.privateLookup
        ? null
        : await fetchRankBorderWebUserDetailV2({
            ...detailScope.value,
            userId,
            includeProfile: true,
          })
      const result = options.privateLookup
        ? await fetchPrivateLatestByUser(userId)
        : webDetail?.current ?? null
      if (!result) {
        throw new Error(t("rankBorder.result.accountOutOfRange"))
      }
      if (!options.privateLookup && shouldRejectMismatchedAccountLookup(userId, result)) {
        throw new Error(t("rankBorder.result.accountOutOfRange"))
      }

      const [previous, next] = await resolveDetailNeighbors(result.rank, webDetail?.previous ?? null, webDetail?.next ?? null)
      if (requestToken !== detailRequestToken) {
        return
      }
      detail.value = {
        source: "user",
        query: userId,
        trackedUserId: normalizeTextValue(result.userId),
        result,
        previous,
        next,
      }
      detailDialogTab.value = "player"
      refreshDetailTrace(detail.value)
      markDetailScoreChange(previousScore, result.score)
    } catch (error) {
      if (requestToken !== detailRequestToken) {
        return
      }
      if (silent && options.privateLookup && isRankBorderTrackerUnauthorizedError(error)) {
        await refreshUserDetailFromPublicFallback(userId, requestToken)
        return
      }
      if (!silent) {
        detail.value = null
      }
      detailError.value = resolveDetailErrorMessage(error, options.privateLookup)
    } finally {
      if (!silent && requestToken === detailRequestToken) {
        detailLoading.value = false
      }
    }
  }

  async function refreshUserDetailFromPublicFallback(userId: string, requestToken: number) {
    const fallbackUserId = normalizeTextValue(detail.value?.trackedUserId) ?? normalizeTextValue(detail.value?.result.userId) ?? userId
    const result = await fetchLatestPublicUser(fallbackUserId, { enrichProfile: true }).catch(() => null)
    if (requestToken !== detailRequestToken || !result) {
      return
    }

    const [previous, next] = await resolveDetailNeighbors(result.rank)
    if (requestToken !== detailRequestToken) {
      return
    }

    const previousScore = detail.value?.result.score ?? null
    detail.value = {
      source: "user",
      query: userId,
      trackedUserId: normalizeTextValue(result.userId) ?? fallbackUserId,
      result,
      previous,
      next,
    }
    detailError.value = null
    refreshDetailTrace(detail.value)
    markDetailScoreChange(previousScore, result.score)
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

    await loadRankDetail(
      parseRankBorderRankQuery(activeDetail.query) ?? activeDetail.result.rank,
      true,
      detailRequestToken,
      { trackedUserId: activeDetail.trackedUserId ?? resolveTrackedPlayerId(activeDetail.result) },
    )
  }

  function markDetailScoreChange(previousScore: number | null, nextScore: number) {
    if (previousScore == null || previousScore !== nextScore) {
      restartDetailScoreFlash()
    }
  }

  function restartDetailScoreFlash() {
    detailScoreChanged.value = false
    requestAnimationFrame(() => {
      detailScoreChanged.value = true
      scheduleNumberFlashReset()
    })
  }

  return {
    resetDetailData,
    locateSelectedAccount,
    isMobileDetailExpanded,
    isMobileExpandedTarget,
    openMobileRankDetail,
    openMobileLineDetail,
    openDetailFromMobileFact,
    openRankDetail,
    loadRankDetail,
    openLineDetail,
    loadLineDetail,
    openUserDetail,
    updateDetailDialogTab,
    loadUserDetail,
    refreshActiveDetail,
    refreshDetailTrace,
    markDetailScoreChange,
    restartDetailScoreFlash,
  }
}
