import { computed, ref } from "vue"
import type { RankBorderTrackerScope } from "../api/rank-border"
import {
  normalizeRankBorderTraceTimeline,
  type RankBorderTracePoint,
} from "../lib/rank-border"
import { traceRecordsForWindow } from "../lib/rank-border-chart"
import type { RankBorderHeatmapWindow } from "../lib/rank-border-types"
import type { RankBorderDetailSharedState, UseRankBorderDetailDeps } from "./rank-border-detail-shared"
import { useRankBorderDetailCharts } from "./useRankBorderDetailCharts"
import { useRankBorderDetailComparison } from "./useRankBorderDetailComparison"
import { useRankBorderDetailHeatmap } from "./useRankBorderDetailHeatmap"
import { useRankBorderDetailLoaders } from "./useRankBorderDetailLoaders"
import { useRankBorderDetailPresenters } from "./useRankBorderDetailPresenters"
import { useRankBorderDetailStats } from "./useRankBorderDetailStats"

export type { UseRankBorderDetailDeps } from "./rank-border-detail-shared"

/**
 * DETAIL SUBSYSTEM for the rank-border view.
 *
 * Owns the `detail` spine (loaders, traces, caches), the comparison target,
 * the heatmap-window selection, the detail charts/stats, the planner overlay,
 * and the detail-only formatters. The central `detail` ref stays declared in
 * the view (the live engine reads it too) and is passed in as a dep; the live
 * engine reaches this subsystem via the `refreshActiveDetail` / `resetDetailData`
 * callbacks it receives through a late-bound bridge. Everything returned keeps
 * the original declaration names so the view's <template> references them
 * unchanged.
 *
 * This function only owns the shared refs/derivations and composes the focused
 * sub-composables (comparison / stats / charts / heatmap / loaders /
 * presenters); the concern-specific logic lives in their files.
 */
export function useRankBorderDetail(deps: UseRankBorderDetailDeps) {
  const {
    detail,
    playbackAt,
    trackerEndpoint,
    selectedRegion,
    mode,
    selectedEventIdNumber,
    selectedWorldBloomCharacterIdNumber,
    intervalSeconds,
    intervalOptions,
  } = deps

  const detailTrace = ref<RankBorderTracePoint[]>([])
  const detailTraceLoading = ref(false)
  const detailDialogOpen = ref(false)
  const detailDialogTab = ref<"player" | "border">("player")
  const selectedHeatmapWindow = ref<RankBorderHeatmapWindow | null>(null)
  const mobileExpandedDetail = ref<{ source: "rank" | "line", rank: number } | null>(null)
  const mobileLocateOpen = ref(false)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)
  const detailTraceByKey = ref<Map<string, RankBorderTracePoint[]>>(new Map())
  const comparisonRankInput = ref("")
  const comparisonRank = ref<number | null>(null)
  const comparisonTrace = ref<RankBorderTracePoint[]>([])
  const comparisonTraceLoading = ref(false)
  const comparisonTraceByKey = ref<Map<string, RankBorderTracePoint[]>>(new Map())

  function normalizeTraceForPlayback(records: RankBorderTracePoint[]): RankBorderTracePoint[] {
    const timeline = normalizeRankBorderTraceTimeline(records)
    const cutoff = playbackAt.value
    return cutoff == null
      ? timeline
      : timeline.filter((record) => record.timestamp <= cutoff)
  }

  const detailScope = computed<RankBorderTrackerScope>(() => ({
    endpoint: trackerEndpoint.value,
    region: selectedRegion.value,
    eventId: selectedEventIdNumber.value,
    mode: mode.value,
    worldBloomCharacterId: selectedWorldBloomCharacterIdNumber.value || null,
    cacheBust: true,
    playbackAt: playbackAt.value,
    useWebSocket: false,
  }))

  const scopedDetailTrace = computed(() =>
    selectedHeatmapWindow.value
      ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
      : detailTrace.value,
  )

  const chartDetailTrace = computed(() =>
    selectedHeatmapWindow.value
      ? traceRecordsForWindow(detailTrace.value, selectedHeatmapWindow.value.start, selectedHeatmapWindow.value.end, true)
      : detailTrace.value,
  )

  const detailTraceScopeLabel = computed(() =>
    selectedHeatmapWindow.value?.label
    ?? intervalOptions.value.find((option) => option.value === intervalSeconds.value)?.label
    ?? "-",
  )

  const state: RankBorderDetailSharedState = {
    detailTrace,
    detailTraceLoading,
    detailDialogOpen,
    detailDialogTab,
    selectedHeatmapWindow,
    mobileExpandedDetail,
    mobileLocateOpen,
    detailLoading,
    detailError,
    detailTraceByKey,
    comparisonRankInput,
    comparisonRank,
    comparisonTrace,
    comparisonTraceLoading,
    comparisonTraceByKey,
    detailScope,
    normalizeTraceForPlayback,
    scopedDetailTrace,
    chartDetailTrace,
  }

  const comparison = useRankBorderDetailComparison(deps, state)
  const stats = useRankBorderDetailStats(deps, state, {
    comparisonChartTrace: comparison.comparisonChartTrace,
  })
  const charts = useRankBorderDetailCharts(deps, state, {
    comparisonChartTrace: comparison.comparisonChartTrace,
  })
  const heatmap = useRankBorderDetailHeatmap(deps, state)
  const loaders = useRankBorderDetailLoaders(deps, state)
  const presenters = useRankBorderDetailPresenters(deps, {
    detailTraceStats: stats.detailTraceStats,
  })

  return {
    detail,
    detailTrace,
    detailTraceLoading,
    detailDialogOpen,
    detailDialogTab,
    selectedHeatmapWindow,
    mobileExpandedDetail,
    mobileLocateOpen,
    detailLoading,
    detailError,
    detailTraceByKey,
    comparisonRankInput,
    comparisonRank,
    comparisonTrace,
    comparisonTraceLoading,
    comparisonTraceByKey,
    normalizeTraceForPlayback,
    detailScope,
    scopedDetailTrace,
    chartDetailTrace,
    detailTraceScopeLabel,
    ...comparison,
    ...stats,
    ...charts,
    ...heatmap,
    ...loaders,
    ...presenters,
  }
}
