import type { ComputedRef } from "vue"
import { useI18n } from "vue-i18n"
import type { RankBorderGrowth } from "../lib/rank-border"
import { PERSONAL_COLLECTION_LIMIT } from "../lib/rank-border-constants"
import type { DetailState, RichNameSegment } from "../lib/rank-border-types"
import type { UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * Detail-only presentation helpers: title/badge/rank labels, growth pickers
 * that prefer the live top-100 growth maps over the trace-derived stats, and
 * the rich (color-tagged) title segments.
 */
export function useRankBorderDetailPresenters(
  deps: UseRankBorderDetailDeps,
  shared: { detailTraceStats: ComputedRef<{ growth: RankBorderGrowth | null }> },
) {
  const {
    selectedIntervalSeconds,
    selectedTrackerGrowthByRank,
    top100GrowthByRank,
    top100RankGrowthByRank,
    top100GrowthIntervalSeconds,
    formatRank,
    formatTargetRank,
    formatUserLabel,
    parseRichNameSegments,
  } = deps
  const { detailTraceStats } = shared

  const { t } = useI18n()

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
      ?? detailTraceStats.value.growth?.growth
      ?? null
  }

  function detailRankGrowth(value: DetailState) {
    if (value.source === "line") {
      return selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth ?? value.growth?.growth ?? null
    }

    if (value.source === "user") {
      return null
    }

    const localGrowth = top100GrowthIntervalSeconds.value === selectedIntervalSeconds.value
      ? top100RankGrowthByRank.value.get(value.result.rank)?.growth
      : null
    return localGrowth
      ?? selectedTrackerGrowthByRank.value.get(value.result.rank)?.growth
      ?? null
  }

  function previousDetailLabel(value: DetailState) {
    return value.source === "line" ? t("rankBorder.result.previousLine") : t("rankBorder.result.previousRank")
  }

  function nextDetailLabel(value: DetailState) {
    return value.source === "line" ? t("rankBorder.result.nextLine") : t("rankBorder.result.nextRank")
  }

  function richDetailTitleSegments(value: DetailState): RichNameSegment[] {
    return parseRichNameSegments(formatDetailTitle(value))
  }

  return {
    formatDetailTitle,
    formatDetailRank,
    formatDetailBadge,
    detailBadgeClass,
    detailGrowth,
    detailRankGrowth,
    previousDetailLabel,
    nextDetailLabel,
    richDetailTitleSegments,
  }
}
