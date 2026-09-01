import type { ComputedRef, InjectionKey, Ref } from "vue"
import { inject } from "vue"
import type { RichNameSegment } from "../lib/rank-border-types"
import type { RankBorderDetailTargetInput } from "../lib/detail-link"
import type { useRankBorderQuery } from "./useRankBorderQuery"
import type { useRankBorderLive } from "./useRankBorderLive"
import type { useRankBorderHonors } from "./useRankBorderHonors"

/**
 * View-local state and helpers shared with the child components split out of
 * the leaderboard view. Everything here lives in the view's <script setup> and
 * is provided so children reuse the single composable instances (they own the
 * WebSocket/timers) instead of re-declaring them.
 */
export interface RankBorderUiContext {
  /** True while the viewport is in the mobile breakpoint (<=767px). */
  isMobileViewport: Ref<boolean>
  /** Shared low-frequency clock (unix seconds); leaf components subscribe to it. */
  nowSecond: Readonly<Ref<number>>
  /** True when profile assets (leader card / honors) should render. */
  shouldRenderProfileAssets: ComputedRef<boolean>
  /** Rank whose inline quick-view card is currently expanded (null = none). */
  expandedRank: Readonly<Ref<number | null>>
  /** Toggle the inline quick-view card under a leaderboard row. */
  toggleRowExpansion: (rank: number) => void
  /** Navigate to the standalone detail page for a target (shareable URL). */
  openDetailPage: (target: RankBorderDetailTargetInput) => void
  /** Report the leaderboard row closest to the viewport center (jump-rail sync). */
  reportVisibleRank: (rank: number | null) => void
  /** Leaderboard row currently closest to the viewport center. */
  visibleRank: Readonly<Ref<number | null>>
  /** Expand a rank's quick view and scroll its row into view (jump-rail commit). */
  jumpToRank: (rank: number) => void
  /** Format a rank as `#N` (view-local number formatting). */
  formatRank: (value: number | null | undefined) => string
  /** Format a target rank as `TN` (segment-line number formatting). */
  formatTargetRank: (value: number | null | undefined) => string
  /** Format a score as `N pt`. */
  formatPt: (value: number | null | undefined) => string
  /** Format a signed growth delta. */
  formatGrowth: (value: number | null | undefined) => string
  /** Format a signed per-hour growth (`N pt/h`). */
  formatPerHour: (value: number | null | undefined) => string
  /** Format a unix-second timestamp for display. */
  formatTimestamp: (timestamp: number | null | undefined) => string
  /** Format an elapsed-seconds value as a localized "… ago" label. */
  formatElapsed: (seconds: number | null | undefined) => string
  /** Seconds elapsed between now (low-frequency clock) and the timestamp. */
  elapsedSince: (timestamp: number | null | undefined) => number | null
  /** Resolve a player display label (falls back to "unknown player"). */
  formatUserLabel: (result: { name: string | null } | null) => string
  /** Parse a (possibly color-tagged) player name into rich segments. */
  richUserLabelSegments: (result: { name: string | null } | null, fallback?: string) => RichNameSegment[]
  /** Inline style for a rich name segment (applies its color, if any). */
  richNameSegmentStyle: (segment: RichNameSegment) => { color: string } | undefined
  /** Show the shared hover tooltip at the pointer, with the given label. */
  showRankBorderTooltip: (event: MouseEvent, label: string) => void
  /** Reposition the shared hover tooltip to follow the pointer. */
  moveRankBorderTooltip: (event: MouseEvent) => void
  /** Hide the shared hover tooltip. */
  hideRankBorderTooltip: () => void
  /** True when the activity replay rail should render (enough tracked span). */
  activityReplayReady: ComputedRef<boolean>
  /** Localized status label for the current playback position (live / at time). */
  playbackStatusLabel: ComputedRef<string>
  /** True while playback is following the live edge. */
  isPlaybackLive: ComputedRef<boolean>
  /** In-flight scrubbed playback timestamp (null when not scrubbing). */
  playbackDraftAt: Ref<number | null>
  /** Reset playback back to the live edge. */
  resetPlaybackLive: () => void
  /** Available replay window as unix-second start/end bounds. */
  replayBounds: ComputedRef<{ start: number, end: number }>
  /** Clamped timestamp currently shown on the replay slider. */
  playbackDisplayAt: ComputedRef<number>
  /** Format a replay tick timestamp for the slider endpoints. */
  formatReplayTick: (timestamp: number | null | undefined) => string
  /** Update the draft playback position while scrubbing the slider. */
  updatePlaybackDraft: (value: Event) => void
  /** Commit the scrubbed playback position (or snap back to live). */
  commitPlaybackDraft: (value?: Event) => void
}

export interface RankBorderContext {
  query: ReturnType<typeof useRankBorderQuery>
  live: ReturnType<typeof useRankBorderLive>
  honors: ReturnType<typeof useRankBorderHonors>
  ui: RankBorderUiContext
}

export const RANK_BORDER_CONTEXT_KEY: InjectionKey<RankBorderContext> = Symbol("rank-border-context")

export function useRankBorderContext(): RankBorderContext {
  const ctx = inject(RANK_BORDER_CONTEXT_KEY)
  if (!ctx) {
    throw new Error("useRankBorderContext must be used within RankBorder")
  }
  return ctx
}
