// Ported from Sekai Station (MIT © middlered), frontend src/utils/parse.ts.
// Payloads come from another backend, so every field is checked before use.
import type { PinnedStationRoom } from "@/modules/sekai-station/lib/room-filter"
import { BLOCK_DURATION_MS } from "@/modules/sekai-station/lib/sekai-station-constants"
import type {
  StationRoom,
  StationRoomExtra,
  StationRoomInfo,
  StationStatistic,
} from "@/modules/sekai-station/lib/station-types"

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function str(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

/** Links end up in href and window.open, so only web addresses are kept */
export function webUrl(value: unknown): string {
  const url = str(value).trim()
  return /^https?:\/\//i.test(url) ? url : ""
}

function parseInfo(raw: unknown): StationRoomInfo {
  if (!isObject(raw)) {
    return { handle: "", url: "", avatar: null }
  }
  return {
    handle: str(raw.handle).trim(),
    url: webUrl(raw.url),
    avatar: webUrl(raw.avatar) || null,
  }
}

/** A room from /recent or a `room` event; null when the payload is not a room */
export function parseRoom(raw: unknown): StationRoom | null {
  if (!isObject(raw) || typeof raw.id !== "string" || num(raw.time) === null) {
    return null
  }
  return {
    time: raw.time as number,
    id: raw.id,
    msg: str(raw.msg),
    name: str(raw.name),
    source: str(raw.source).trim(),
    info: parseInfo(raw.info),
  }
}

export function parseStatistic(raw: unknown): StationStatistic | null {
  if (!isObject(raw)) {
    return null
  }
  const online = num(raw.online)
  const past15m = num(raw.past15m)
  return online === null || past15m === null ? null : { online, past15m }
}

/** Server time of a heartbeat, in unix milliseconds */
export function parseHeartbeat(raw: unknown): number | null {
  return isObject(raw) ? num(raw.time) : null
}

export function parseRoomExtra(raw: unknown): StationRoomExtra | null {
  if (!isObject(raw) || typeof raw.id !== "string" || !Array.isArray(raw.data)) {
    return null
  }
  return {
    id: raw.id,
    time: num(raw.time) ?? 0,
    data: raw.data.filter((value): value is number => num(value) !== null),
  }
}

/** JSON.parse that returns undefined instead of throwing on malformed input */
export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** Keeps only well-formed pins (storage may hold an older shape or hand edits) */
export function sanitizePins(raw: unknown): Record<string, PinnedStationRoom> {
  if (!isObject(raw)) {
    return {}
  }
  const clean: Record<string, PinnedStationRoom> = {}
  for (const [key, entry] of Object.entries(raw)) {
    const room = isObject(entry) ? parseRoom(entry.room) : null
    const pinnedAt = isObject(entry) ? num(entry.pinnedAt) : null
    if (room && pinnedAt !== null) {
      clean[key] = { room, pinnedAt }
    }
  }
  return clean
}

/**
 * Keeps only finite block end times (ms), none later than a fresh block would
 * end: a clock that was far ahead would otherwise hide a number for days
 */
export function sanitizeBlocks(raw: unknown, nowMs: number): Record<string, number> {
  if (!isObject(raw)) {
    return {}
  }
  const clean: Record<string, number> = {}
  for (const [id, until] of Object.entries(raw)) {
    const end = num(until)
    if (end !== null) {
      clean[id] = Math.min(end, nowMs + BLOCK_DURATION_MS)
    }
  }
  return clean
}
