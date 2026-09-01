import type { SekaiRegion } from "@/types"
import type {
  RankBorderGrowth,
  RankBorderLatest,
  RankBorderMode,
} from "./rank-border"

export type PersistedState = {
  endpoint?: string
  region?: SekaiRegion
  eventId?: string | null
  mode?: RankBorderMode
  worldBloomCharacterId?: string | null
  intervalSeconds?: string
  accountKey?: string
  hideProfileAssets?: boolean
}

export type AccountOption = {
  key: string
  label: string
  server: SekaiRegion
  userId: string
  verified?: boolean
  isDefault?: boolean
}

export type RankBorderLineRow = {
  key: string
  rank: number
  score: number | null
  timestamp: number | null
  growth: RankBorderGrowth | null
  rankGrowth: RankBorderGrowth | null
  displayGrowth: number | null
  displayRankGrowth: number | null
  displayGrowthChanged: boolean
  displayRankGrowthChanged: boolean
  detail: RankBorderLatest | null
  scoreChanged: boolean
  growthChanged: boolean
  top100: boolean
}

export type RankBorderSegmentRow = {
  rank: number
  score: number
  timestamp: number | null
  growth: RankBorderGrowth | null
  scoreChanged: boolean
  growthChanged: boolean
}

/** Inline quick-view card data, derived entirely from already-loaded overview data. */
export type RankBorderQuickFacts = {
  kind: "rank" | "line"
  rank: number
  scoreLabel: string
  timestamp: number | null
  playerGrowthLabel: string | null
  playerGrowthPositive: boolean
  rankGrowthLabel: string | null
  rankGrowthPositive: boolean
  hourlySpeedLabel: string | null
  prevGapLabel: string | null
  prevLabel: string
  nextGapLabel: string | null
  nextLabel: string
}

export type RankBorderChartMetric = "score" | "rank" | "speed"

export type RankBorderChartReferenceLine = {
  value: number
  y: number
  label: string
}

export type RankBorderHeatmapCell = {
  key: string
  label: string
  start: number
  end: number
  hourLabel: string
  value: number
  roundCount: number
  sampleCount: number
  displayLabel: string
  intensity: number
  color: string
  textColor: string
  status: "active" | "before" | "future"
  selectable: boolean
  selected: boolean
}

export type RankBorderHeatmapDay = {
  key: string
  label: string
  /** True for filler rows past the tracked range (wide-layout row floor). */
  padded: boolean
  cells: RankBorderHeatmapCell[]
}

export type RankBorderHeatmapWindow = {
  start: number
  end: number
  label: string
  anchorTimestamp: number | null
}

export type RankBorderJumpTarget = {
  rank: number
  label: string
  value: string
  progress: string
  position: string
  progressRatio: number
}

export type RankBorderChartPoint = {
  key: string
  x: number
  y: number
  label: string
}

export type RankBorderChartTimeTick = {
  key: string
  left: string
  label: string
  /** Quarter-position ticks: shown on wide charts, hidden when the card is narrow. */
  minor?: boolean
  /** Label anchoring: the edge ticks hug inward instead of centering past the border. */
  align: "start" | "center" | "end"
}

export type RankBorderChartTimeDomain = {
  start: number
  end: number
}

export type RankBorderScoreOverlayLine = {
  key: string
  value: number
  y: number
  label: string
  tone: "target" | "planned"
}

export type RankBorderUpdateRecord = {
  key: string
  time: string
  rank: string
  score: string
  growth: string
}

export type RankBorderHonorView = {
  key: string
  label: string
  type: "normal" | "bonds"
  groupType: string | null
  honorId: number | null
  baseUrl: string | null
  rankUrl: string | null
  rankPlacement: "event" | "full" | "rank_match"
  frameUrl: string | null
  framePlacement: "full" | "low"
  scrollUrl: string | null
  levelIconUrl: string | null
  level6IconUrl: string | null
  fcApCount: string | null
  bondsLeftBgUrl: string | null
  bondsRightBgUrl: string | null
  bondsLeftIconUrl: string | null
  bondsRightIconUrl: string | null
  level: number | null
}

export type RankBorderHonorLevelStar = {
  key: string
  url: string
  slot: number
  layer: number
}

export type RichNameSegment = {
  key: string
  text: string
  color: string | null
}

export type RecoverableImageTarget = HTMLImageElement | SVGImageElement

export type RankBorderTooltipState = {
  visible: boolean
  x: number
  y: number
  label: string
}
