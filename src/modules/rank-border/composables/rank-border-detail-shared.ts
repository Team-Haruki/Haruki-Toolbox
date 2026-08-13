import type { ComputedRef, Ref } from "vue"
import type { SekaiRegion } from "@/types"
import type { RankBorderTrackerScope } from "../api/rank-border"
import type {
  RankBorderGrowth,
  RankBorderLatest,
  RankBorderLine,
  RankBorderMode,
  RankBorderTracePoint,
  RankBorderUserProfile,
} from "../lib/rank-border"
import type {
  AccountOption,
  DetailState,
  RankBorderHeatmapWindow,
  RichNameSegment,
} from "../lib/rank-border-types"

/**
 * Dependencies injected by the view into the detail subsystem. The central
 * `detail` ref stays declared in the view (the live engine reads it too) and is
 * passed in as a dep; the live engine reaches this subsystem via the
 * `refreshActiveDetail` / `resetDetailData` callbacks it receives through a
 * late-bound bridge.
 */
export interface UseRankBorderDetailDeps {
  detail: Ref<DetailState | null>
  playbackAt: Ref<number | null>
  publicProfileByUserId: Ref<Map<string, RankBorderUserProfile>>
  detailScoreChanged: Ref<boolean>
  profileAssetsLoading: Ref<boolean>
  trackerEndpoint: Ref<string>
  selectedRegion: Ref<SekaiRegion>
  selectedEventId: Ref<string | null>
  mode: Ref<RankBorderMode>
  selectedWorldBloomCharacterId: Ref<string | null>
  selectedEventIdNumber: ComputedRef<number>
  selectedWorldBloomCharacterIdNumber: ComputedRef<number>
  selectedIntervalSeconds: ComputedRef<number>
  intervalSeconds: Ref<string>
  intervalOptions: ComputedRef<Array<{ value: string; label: string }>>
  selectedActivityStartAt: ComputedRef<number | null>
  selectedAccount: ComputedRef<AccountOption | null>
  switchRegion: (region: SekaiRegion) => void
  tracker: { lines: Ref<RankBorderLine[]> }
  currentUnixSecond: Ref<number>
  top100Details: Ref<Map<number, RankBorderLatest>>
  top100GrowthByRank: Ref<Map<number, RankBorderGrowth>>
  top100RankGrowthByRank: Ref<Map<number, RankBorderGrowth>>
  top100GrowthIntervalSeconds: Ref<number | null>
  top100TraceByRank: Ref<Map<number, RankBorderTracePoint[]>>
  segmentTraceByRank: Ref<Map<number, RankBorderTracePoint[]>>
  canRefresh: ComputedRef<boolean>
  selectedTrackerGrowthByRank: ComputedRef<Map<number, RankBorderGrowth>>
  latestTrackerTimestamp: ComputedRef<number | null>
  refreshTop100GrowthsFromCachedTraces: (previousGrowths: Map<number, RankBorderGrowth>) => void
  scheduleNumberFlashReset: () => void
  normalizeTextValue: (value: unknown) => string | null
  mergeLatestWithProfile: (
    latest: RankBorderLatest,
    profile: RankBorderUserProfile | null,
  ) => RankBorderLatest
  hasProfileFields: (latest: RankBorderLatest) => boolean
  isLocalMockTrackerEndpoint: (endpoint: string) => boolean
  formatRank: (value: number | null | undefined) => string
  formatPt: (value: number | null | undefined) => string
  formatGrowth: (value: number | null | undefined) => string
  formatTargetRank: (value: number | null | undefined) => string
  formatPerHour: (value: number | null | undefined) => string
  formatLoopCount: (value: number | null | undefined) => string
  formatHeatmapRoundCount: (value: number) => string
  formatUserLabel: (result: { name: string | null } | null) => string
  parseRichNameSegments: (value: string) => RichNameSegment[]
  clampNumber: (value: number | null | undefined, min: number, max: number) => number
}

/**
 * Refs and derivations created once by `useRankBorderDetail` and shared across
 * the focused sub-composables (comparison / stats / charts / heatmap / loaders).
 * Internal to the detail subsystem — the view only sees the merged return.
 */
export interface RankBorderDetailSharedState {
  detailTrace: Ref<RankBorderTracePoint[]>
  detailTraceLoading: Ref<boolean>
  detailDialogOpen: Ref<boolean>
  detailDialogTab: Ref<"player" | "border">
  selectedHeatmapWindow: Ref<RankBorderHeatmapWindow | null>
  mobileExpandedDetail: Ref<{ source: "rank" | "line", rank: number } | null>
  mobileLocateOpen: Ref<boolean>
  detailLoading: Ref<boolean>
  detailError: Ref<string | null>
  detailTraceByKey: Ref<Map<string, RankBorderTracePoint[]>>
  comparisonRankInput: Ref<string>
  comparisonRank: Ref<number | null>
  comparisonTrace: Ref<RankBorderTracePoint[]>
  comparisonTraceLoading: Ref<boolean>
  comparisonTraceByKey: Ref<Map<string, RankBorderTracePoint[]>>
  detailScope: ComputedRef<RankBorderTrackerScope>
  /** Normalize a raw trace and cut it at the playback cursor when replaying. */
  normalizeTraceForPlayback: (records: RankBorderTracePoint[]) => RankBorderTracePoint[]
  /** Detail trace narrowed to the selected heatmap window (stats/table scope). */
  scopedDetailTrace: ComputedRef<RankBorderTracePoint[]>
  /** Detail trace narrowed to the selected heatmap window (chart scope). */
  chartDetailTrace: ComputedRef<RankBorderTracePoint[]>
}
