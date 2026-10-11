/**
 * Base URL of the Sekai Station v2 API (no trailing slash), e.g. a Haruki
 * relay of `/station/api/v2`; empty when the build has none. Read on use so
 * unit tests can set it.
 */
export function getStationApiBase(): string {
  return (import.meta.env.VITE_SEKAI_STATION_API_URL ?? "").trim().replace(/\/+$/, "")
}

/** The server alternates heartbeat and statistic every 15 s, so a heartbeat comes every 30 s */
export const HEARTBEAT_TIMEOUT_MS = 45_000
/** Rooms replayed right after the stream opens are collected this long, then merged at once */
export const BURST_WINDOW_MS = 800
export const SWEEP_INTERVAL_MS = 30_000
/** Mounted cards expire themselves with an animation; the sweep only collects what they left behind */
export const SWEEP_GRACE_SECONDS = 5
export const ORPHAN_EXTRA_TTL_MS = 60_000

/** Reconnect after 1 s, 2 s, 4 s … up to 30 s, each with ±25 % jitter */
export const RETRY_BASE_MS = 1_000
export const RETRY_MAX_MS = 30_000
export const RETRY_JITTER = 0.25

/** Holding a room number this long hides that number */
export const BLOCK_DURATION_MS = 10 * 60_000
export const HOLD_TO_BLOCK_MS = 1_000
/** A press longer than this is not treated as a click (no copy on release) */
export const CLICK_MAX_MS = 400
export const COPIED_FEEDBACK_MS = 1_500
/** Rooms that arrive live (not replayed) flash if they are at most this old */
export const LIVE_FLASH_MAX_AGE_SECONDS = 5

/** Preset filter chips for the CN feed (CN-server QQ Multi Live rooms) */
export const PRESET_TAGS: readonly string[] = ["🦐", "🐉", "🍕", "虾", "龙", "Sage", "清火"]

export const EXPIRE_SECONDS = { min: 10, max: 600, default: 300 } as const
export const FONT_SIZE = { min: 12, max: 20, default: 14 } as const
export const LINE_HEIGHT = { min: 1.2, max: 2, default: 1.5 } as const
export const EXPIRE_OPTIONS_SECONDS: readonly number[] = [60, 180, 300, 600]

export const PINS_STORAGE_KEY = "haruki:sekai-station:pins"
export const BLOCKS_STORAGE_KEY = "haruki:sekai-station:blocks"

/** Sekai Station itself, linked from the page header */
export const SEKAI_STATION_SITE_URL = "https://pjsk-zh.mid.red"
