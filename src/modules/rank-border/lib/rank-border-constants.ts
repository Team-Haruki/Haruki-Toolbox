import { normalizeTrackerEndpoint } from "./rank-border"

export const STORAGE_KEY = "haruki:rank-border:state"
export const DEFAULT_TRACKER_ENDPOINT = normalizeTrackerEndpoint(import.meta.env.VITE_HARUKI_EVENT_TRACKER_URL) || "/event-tracker"
export const LEGACY_DIRECT_TRACKER_ENDPOINTS = new Set([
  "http://100.111.213.59:8777",
  "http://127.0.0.1:8777",
  "http://127.0.0.1:18777",
  "http://localhost:8777",
  "http://localhost:18777",
])
export const DEFAULT_INTERVAL_SECONDS = "3600"
export const PERSONAL_COLLECTION_LIMIT = 100
export const FULL_TRACE_LIMIT = 5_000
export const NUMBER_FLASH_MS = 1200
export const FC_AP_HONOR_IDS = new Set([3009, 3010, 3011, 3012, 3013, 3014, 4700, 4701])
export const TRACKER_UPDATE_INTERVAL_SECONDS = 10
export const MIN_LIVE_REFRESH_MS = 2_000
export const MAX_LIVE_REFRESH_MS = 30_000
export const DETAIL_CHART_WIDTH = 260
export const DETAIL_CHART_HEIGHT = 84
export const DETAIL_CHART_X_PADDING = 10
export const DETAIL_CHART_Y_PADDING = 14
export const DETAIL_CHART_Y_BOTTOM_PADDING = 32
export const ROW_SPARKLINE_MAX_POINTS = 48
export const DETAIL_CHART_MAX_POINTS = 96
export const DETAIL_HEATMAP_HOURS_PER_DAY = 24
export const DETAIL_RECENT_POINT_COUNT = 10
export const DETAIL_UPDATE_RECORD_LIMIT = 8
export const DETAIL_CSB_WINDOW_SECONDS = 20 * 60 * 3
export const TOP_100_DETAIL_CACHE_TTL_MS = 2 * 60 * 1000
export const TOP_100_DETAIL_CACHE_PREFIX = "haruki:rank-border:top100:v2:"
export const IMAGE_RETRY_LIMIT = 6
export const IMAGE_RETRY_DELAY_MS = 260
export const IMAGE_RETRY_BACKOFF_LIMIT = 8
export const IMAGE_RETRY_MAX_DELAY_MS = 30_000
export const IMAGE_PRELOAD_CACHE_LIMIT = 600
export const IMAGE_RETRY_PARAM = "hrk_image_retry"
export const IMAGE_RETRY_ORIGINAL_ATTRIBUTE = "data-rank-border-original-src"
export const IMAGE_RETRY_COUNT_ATTRIBUTE = "data-rank-border-retry-count"
export const HONOR_BONDS_MASK_URL = "/rank-border/honor/mask_degree_sub.png"
export const HEATMAP_MYSEKAI_ROUND_THRESHOLD = 37
export const HEATMAP_ACTIVE_ROUND_BASELINE = 15
export const HEATMAP_ACTIVE_ROUND_SPAN = 15
export const DEFAULT_REPLAY_WINDOW_SECONDS = 7 * 24 * 60 * 60
export const TOP_100_RANKS = Array.from({ length: PERSONAL_COLLECTION_LIMIT }, (_, index) => index + 1)
