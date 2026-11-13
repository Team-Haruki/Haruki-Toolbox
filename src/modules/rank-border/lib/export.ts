import { formatCsvDateTime, formatFileTimestamp, toCsv, type CsvCell } from "@/lib/csv"
import type { SekaiRegion } from "@/types"
import type { RankBorderDetailTargetInput } from "./detail-link"
import type { RankBorderMode, RankBorderTracePoint } from "./rank-border"
import type { RankBorderLineRow, RankBorderSegmentRow } from "./rank-border-types"
import { plainNameText } from "./rich-name"

/** The leaderboard a file is about. */
export type RankBorderExportScope = {
  region: SekaiRegion
  eventId: number
  mode: RankBorderMode
  worldBloomCharacterId: number | null
}

/** Column titles, in the viewer's language. */
export type RankBorderStandingsHeaders = {
  rank: string
  score: string
  player: string
  userId: string
  time: string
  timestamp: string
  holderGrowth: string
  seatGrowth: string
}

export type RankBorderTraceHeaders = Pick<
  RankBorderStandingsHeaders,
  "time" | "timestamp" | "rank" | "score" | "userId"
>

function secondsToCsvTime(seconds: number | null): string {
  return seconds == null ? "" : formatCsvDateTime(seconds * 1000)
}

/**
 * The standings on screen as a CSV: the top 100 with who holds each seat,
 * then the border lines below them. Seats and lines with no score yet are
 * left out; `null` when nothing is left.
 */
export function buildRankBorderStandingsCsv(input: {
  headers: RankBorderStandingsHeaders
  top100Rows: readonly RankBorderLineRow[]
  segmentRows: readonly RankBorderSegmentRow[]
}): string | null {
  const { headers } = input
  const rows: CsvCell[][] = []
  for (const row of input.top100Rows) {
    if (row.score == null) {
      continue
    }
    rows.push([
      row.rank,
      row.score,
      row.detail?.name == null ? "" : plainNameText(row.detail.name),
      row.detail?.userId ?? "",
      secondsToCsvTime(row.timestamp),
      row.timestamp,
      row.displayGrowth,
      row.displayRankGrowth,
    ])
  }
  for (const row of input.segmentRows) {
    rows.push([
      row.rank,
      row.score,
      "",
      "",
      secondsToCsvTime(row.timestamp),
      row.timestamp,
      null,
      row.growth?.growth ?? null,
    ])
  }
  if (rows.length === 0) {
    return null
  }
  return toCsv([
    [
      headers.rank,
      headers.score,
      headers.player,
      headers.userId,
      headers.time,
      headers.timestamp,
      headers.holderGrowth,
      headers.seatGrowth,
    ],
    ...rows,
  ])
}

/**
 * Every sample of a trace as a CSV, oldest first. The player column is there
 * only when the trace says who it was (a seat or a line changes hands); `null`
 * for an empty trace.
 */
export function buildRankBorderTraceCsv(input: {
  headers: RankBorderTraceHeaders
  trace: readonly RankBorderTracePoint[]
}): string | null {
  const { headers, trace } = input
  if (trace.length === 0) {
    return null
  }
  const withPlayer = trace.some((point) => point.userId != null)
  const head = [headers.time, headers.timestamp, headers.rank, headers.score]
  const rows = [...trace]
    .sort((left, right) => left.timestamp - right.timestamp)
    .map((point): CsvCell[] => {
      const row: CsvCell[] = [secondsToCsvTime(point.timestamp), point.timestamp, point.rank, point.score]
      return withPlayer ? [...row, point.userId ?? ""] : row
    })
  return toCsv([withPlayer ? [...head, headers.userId] : head, ...rows])
}

function scopeSlug(scope: RankBorderExportScope): string {
  const chapter = scope.mode === "world_bloom" && scope.worldBloomCharacterId
    ? `-wl${scope.worldBloomCharacterId}`
    : ""
  return `rank-border-${scope.region}-event${scope.eventId}${chapter}`
}

/** `rank-border-jp-event225-20261113-182713.csv`; the time is what the standings are as of. */
export function rankBorderStandingsFileName(scope: RankBorderExportScope, asOfSeconds: number): string {
  return `${scopeSlug(scope)}-${formatFileTimestamp(asOfSeconds * 1000)}.csv`
}

/**
 * `rank-border-jp-event225-rank2-20261113-182713.csv`. A seat and a player
 * each have a trace: `seat` says which one the file holds, and the name marks
 * the one the target does not imply (`user123-seat`, `rank2-player`).
 */
export function rankBorderTraceFileName(
  scope: RankBorderExportScope,
  target: RankBorderDetailTargetInput,
  seat: boolean,
  asOfSeconds: number,
): string {
  return `${scopeSlug(scope)}-${traceSubjectSlug(target, seat)}-${formatFileTimestamp(asOfSeconds * 1000)}.csv`
}

function traceSubjectSlug(target: RankBorderDetailTargetInput, seat: boolean): string {
  if (target.kind === "user") {
    // A player id comes from the address bar: keep what a file name can hold.
    return `user${target.userId.replaceAll(/[^\w-]/g, "")}${seat ? "-seat" : ""}`
  }
  if (target.kind === "rank") {
    return `rank${target.rank}${seat ? "" : "-player"}`
  }
  return `line${target.rank}`
}
