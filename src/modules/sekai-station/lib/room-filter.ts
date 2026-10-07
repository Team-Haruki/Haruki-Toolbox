// Display list and keyword matching, extracted from Sekai Station's rooms
// store and room card (MIT © middlered).
import type { StationDisplayEntry, StationFilterMode, StationRoom } from "@/modules/sekai-station/lib/station-types"

export interface PinnedStationRoom {
  room: StationRoom
  /** ms; the most recently pinned room is shown first */
  pinnedAt: number
}

export interface DisplayListInput {
  /** Stable display order of the stream: newest first, never re-sorted */
  order: readonly string[]
  rooms: ReadonlyMap<string, StationRoom>
  pins: Readonly<Record<string, PinnedStationRoom>>
  /** Room number → time (ms) the temporary block ends */
  blocks: Readonly<Record<string, number>>
  terms: readonly string[]
  mode: StationFilterMode
  /** False until the first replayed burst has been merged; pins show before that */
  ready: boolean
}

/** Trimmed, non-empty, lower-cased and de-duplicated filter terms */
export function normalizeTerms(terms: readonly string[]): string[] {
  return [...new Set(terms.map((term) => term.trim().toLowerCase()).filter(Boolean))]
}

/** Whether a room's text contains any of the (normalized) terms */
export function matchesTerms(room: Pick<StationRoom, "msg" | "name">, normalizedTerms: readonly string[]): boolean {
  const text = `${room.msg} ${room.name}`.toLowerCase()
  return normalizedTerms.some((term) => text.includes(term))
}

/**
 * What the list shows: pinned rooms first (most recently pinned on top), then
 * the stream in its stable order. Pins ignore the keyword filter; temporarily
 * blocked room numbers are hidden everywhere.
 */
export function buildDisplayList(input: DisplayListInput): StationDisplayEntry[] {
  const pinned = Object.entries(input.pins)
    .filter(([, entry]) => !(entry.room.id in input.blocks))
    .sort((a, b) => b[1].pinnedAt - a[1].pinnedAt)
    .map(([key, entry]): StationDisplayEntry => ({ key, room: entry.room }))
  if (!input.ready) {
    return pinned
  }

  const terms = normalizeTerms(input.terms)
  const blacklist = input.mode === "blacklist"
  const rest: StationDisplayEntry[] = []
  for (const key of input.order) {
    const room = input.rooms.get(key)
    if (!room || key in input.pins || room.id in input.blocks) {
      continue
    }
    if (terms.length > 0 && matchesTerms(room, terms) === blacklist) {
      continue
    }
    rest.push({ key, room })
  }
  return [...pinned, ...rest]
}

export interface TextSegment {
  text: string
  hit: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Splits a message so that whitelist matches can be highlighted */
export function highlightSegments(text: string, terms: readonly string[]): TextSegment[] {
  const cleaned = [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
  if (cleaned.length === 0 || text === "") {
    return [{ text, hit: false }]
  }
  // Longest first, so "dragon" wins over "drag" when both are terms
  const pattern = cleaned.sort((a, b) => b.length - a.length).map(escapeRegExp).join("|")
  const lowered = new Set(cleaned.map((term) => term.toLowerCase()))
  return text
    .split(new RegExp(`(${pattern})`, "gi"))
    .filter((part) => part !== "")
    .map((part) => ({ text: part, hit: lowered.has(part.toLowerCase()) }))
}
