import type { LocationQueryRaw, LocationQuery } from "vue-router"
import type { SekaiRegion } from "@/types"
import type { RankBorderMode } from "./rank-border"

/**
 * Shareable URL scheme for the standalone detail page:
 * /rank-border/detail?region=cn&event=222&mode=total&interval=3600&target=rank:2
 * target kinds: `rank:<n>` (a T100 seat), `user:<id>` (a player, `own=1` for
 * the private own-account lookup), `line:<n>` (a segment border line).
 */
export type RankBorderDetailTargetInput =
  | { kind: "rank"; rank: number }
  | { kind: "line"; rank: number }
  | { kind: "user"; userId: string; own?: boolean }

export type RankBorderDetailScopeInput = {
  region: SekaiRegion
  eventId: number
  mode: RankBorderMode
  worldBloomCharacterId: number | null
  intervalSeconds: number
}

export type RankBorderDetailParams = RankBorderDetailScopeInput & {
  target: RankBorderDetailTargetInput
}

const SEKAI_REGIONS = new Set(["jp", "en", "tw", "cn", "kr"])

/**
 * Detail target for the quick-facts "full details" button. A T100 seat pins
 * the player who holds it right now (the public per-user detail), so the page
 * keeps showing that player while ranks shuffle; only an empty seat falls back
 * to following the rank. Border lines always follow the line.
 */
export function resolveQuickFactsDetailTarget(facts: {
  kind: "rank" | "line"
  rank: number
  userId?: string | null
}): RankBorderDetailTargetInput {
  if (facts.kind === "line") {
    return { kind: "line", rank: facts.rank }
  }
  const userId = facts.userId?.trim()
  return userId ? { kind: "user", userId } : { kind: "rank", rank: facts.rank }
}

export function buildRankBorderDetailQuery(
  scope: RankBorderDetailScopeInput,
  target: RankBorderDetailTargetInput,
): LocationQueryRaw {
  const query: LocationQueryRaw = {
    region: scope.region,
    event: String(scope.eventId),
    interval: String(scope.intervalSeconds),
    target: target.kind === "user" ? `user:${target.userId}` : `${target.kind}:${target.rank}`,
  }
  if (scope.mode === "world_bloom" && scope.worldBloomCharacterId) {
    query.mode = "world_bloom"
    query.wl = String(scope.worldBloomCharacterId)
  }
  if (target.kind === "user" && target.own) {
    query.own = "1"
  }
  return query
}

export function parseRankBorderDetailQuery(query: LocationQuery): RankBorderDetailParams | null {
  const region = firstQueryValue(query.region)
  const eventId = parsePositiveInt(firstQueryValue(query.event))
  if (!region || !SEKAI_REGIONS.has(region) || !eventId) {
    return null
  }

  const mode: RankBorderMode = firstQueryValue(query.mode) === "world_bloom" ? "world_bloom" : "normal"
  const worldBloomCharacterId = parsePositiveInt(firstQueryValue(query.wl))
  if (mode === "world_bloom" && !worldBloomCharacterId) {
    return null
  }

  const interval = parsePositiveInt(firstQueryValue(query.interval)) ?? 3600
  const target = parseTarget(firstQueryValue(query.target), firstQueryValue(query.own) === "1")
  if (!target) {
    return null
  }

  return {
    region: region as SekaiRegion,
    eventId,
    mode,
    worldBloomCharacterId: mode === "world_bloom" ? worldBloomCharacterId : null,
    intervalSeconds: interval,
    target,
  }
}

function parseTarget(raw: string | null, own: boolean): RankBorderDetailTargetInput | null {
  if (!raw) {
    return null
  }

  const separator = raw.indexOf(":")
  if (separator <= 0) {
    return null
  }

  const kind = raw.slice(0, separator)
  const value = raw.slice(separator + 1).trim()
  if (kind === "user") {
    return value ? { kind: "user", userId: value, own } : null
  }

  const rank = parsePositiveInt(value)
  if (!rank) {
    return null
  }
  if (kind === "rank" || kind === "line") {
    return { kind, rank }
  }
  return null
}

function firstQueryValue(value: LocationQuery[string] | undefined): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : null
  }
  return typeof value === "string" ? value : null
}

function parsePositiveInt(value: string | null): number | null {
  if (value == null) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
