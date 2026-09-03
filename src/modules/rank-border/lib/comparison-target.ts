import type { RankBorderDetailTargetInput } from "./detail-link"

export type ComparisonTargetKind = "rank" | "line" | "user"

/**
 * What the detail page itself is showing, reduced to the two keys a comparison
 * target can collide on: the rank currently held (seats and border lines are
 * both addressed by rank) and the player id.
 */
export type ComparisonSelfIdentity = {
  rank: number | null
  userId: string | null
}

export function resolveComparisonSelfIdentity(
  target: RankBorderDetailTargetInput | null | undefined,
  current: { rank: number; userId: string | null } | null | undefined,
): ComparisonSelfIdentity {
  if (!target) {
    return { rank: null, userId: null }
  }
  if (target.kind === "line") {
    return { rank: target.rank, userId: null }
  }
  if (target.kind === "rank") {
    return { rank: target.rank, userId: current?.userId ?? null }
  }
  return { rank: current?.rank ?? null, userId: target.userId }
}

/**
 * A comparison against the page's own target would overlay the trace on
 * itself: the same seat / line by rank, or the same player by id.
 */
export function isSelfComparisonTarget(
  self: ComparisonSelfIdentity,
  kind: ComparisonTargetKind,
  query: string,
): boolean {
  const normalized = query.trim()
  if (!normalized) {
    return false
  }
  if (kind === "user") {
    return self.userId != null && normalized === self.userId
  }
  return self.rank != null && Number(normalized) === self.rank
}
