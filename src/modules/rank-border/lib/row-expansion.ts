/**
 * Identity of the expanded leaderboard row. A T100 seat is remembered by the
 * player holding it, so the quick view stays with that player while ranks
 * shuffle (and closes once they leave the T100); empty seats and border lines
 * are remembered by rank.
 */
export type RowExpansionKey = `user:${string}` | `rank:${number}`

type SeatRow = { rank: number; detail: { userId?: string | null } | null }

export function resolveRowExpansionKey(rank: number, rows: readonly SeatRow[]): RowExpansionKey {
  const userId = rows.find((row) => row.rank === rank)?.detail?.userId?.trim()
  return userId ? `user:${userId}` : `rank:${rank}`
}

export function resolveExpandedRank(key: RowExpansionKey | null, rows: readonly SeatRow[]): number | null {
  if (!key) {
    return null
  }
  if (key.startsWith("user:")) {
    const userId = key.slice("user:".length)
    return rows.find((row) => row.detail?.userId?.trim() === userId)?.rank ?? null
  }
  const rank = Number(key.slice("rank:".length))
  return Number.isInteger(rank) && rank > 0 ? rank : null
}
