// Pure helpers of the room stream, extracted from Sekai Station's rooms store
// (MIT © middlered) so they can be tested without a browser.
import {
  RETRY_BASE_MS,
  RETRY_JITTER,
  RETRY_MAX_MS,
} from "@/modules/sekai-station/lib/sekai-station-constants"
import { roomKey, type StationRoom } from "@/modules/sekai-station/lib/station-types"

export function nowSeconds(nowMs = Date.now()): number {
  return Math.floor(nowMs / 1000)
}

/** Whether a room is older than the display window (plus a grace period) */
export function isExpired(room: Pick<StationRoom, "time">, expireSeconds: number, now: number, graceSeconds = 0): boolean {
  return now - room.time > expireSeconds + graceSeconds
}

/**
 * Delay before reconnect attempt `attempt` (0-based): 1 s, 2 s, 4 s … capped at
 * 30 s, then ±25 % jitter so clients dropped together do not come back at once.
 * `random` returns a number in [0, 1).
 */
export function nextRetryDelay(attempt: number, random: () => number = Math.random): number {
  const base = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** Math.max(0, attempt))
  return Math.round(base * (1 - RETRY_JITTER + random() * RETRY_JITTER * 2))
}

/**
 * The rooms of a replayed burst that should be added: not already known, not
 * expired, one per key, newest first.
 */
export function collectBurst(
  buffer: readonly StationRoom[],
  isKnown: (key: string) => boolean,
  expireSeconds: number,
  now: number,
): Array<[string, StationRoom]> {
  const fresh = new Map<string, StationRoom>()
  for (const room of buffer) {
    const key = roomKey(room)
    if (!isKnown(key) && !isExpired(room, expireSeconds, now)) {
      fresh.set(key, room)
    }
  }
  return [...fresh.entries()].sort((a, b) => b[1].time - a[1].time)
}

/** Keys of stored rooms that nobody can see any more: expired and not pinned */
export function selectExpiredKeys(
  rooms: Iterable<[string, StationRoom]>,
  isPinned: (key: string) => boolean,
  expireSeconds: number,
  now: number,
  graceSeconds: number,
): string[] {
  const expired: string[] = []
  for (const [key, room] of rooms) {
    if (!isPinned(key) && isExpired(room, expireSeconds, now, graceSeconds)) {
      expired.push(key)
    }
  }
  return expired
}

/** Room numbers whose temporary block has ended, and when the next one ends (null if none) */
export function splitEndedBlocks(blocks: Record<string, number>, nowMs: number): { ended: string[]; nextEndMs: number | null } {
  const ended: string[] = []
  let nextEndMs: number | null = null
  for (const [id, until] of Object.entries(blocks)) {
    if (until <= nowMs) {
      ended.push(id)
    } else if (nextEndMs === null || until < nextEndMs) {
      nextEndMs = until
    }
  }
  return { ended, nextEndMs }
}
