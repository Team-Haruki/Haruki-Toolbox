/**
 * The tracker's compact trace encoding (`traceFormat=columns`): each column
 * of a trace stored once as a delta list, a constant or a run list. Decoding
 * yields exactly the row array the tracker would otherwise send, so the rest
 * of the app keeps working on rows. Older servers ignore the parameter and
 * answer with rows, so callers branch on the shape, never on the version.
 */
export type RankBorderTraceRow = {
  timestamp: number
  userId: string
  score: number
  rank: number
  characterId?: number
}

export type RankBorderTraceColumns = {
  format: "columns"
  n: number
  t0: number
  dt: number[]
  s0: number
  ds: number[]
  rank?: number
  r0?: number
  dr?: number[]
  users: string[]
  u: [number, number][]
  characterId?: number
  cid?: (number | null)[]
}

export function isRankBorderTraceColumns(value: unknown): value is RankBorderTraceColumns {
  return typeof value === "object" && value !== null && !Array.isArray(value) && (value as { format?: unknown }).format === "columns"
}

/**
 * Expands a columns object into rows. Throws on a malformed object (wrong
 * lengths, unknown user index, no rank) so a broken payload never turns into
 * a half-decoded trace.
 */
export function decodeRankBorderTraceColumns(trace: RankBorderTraceColumns): RankBorderTraceRow[] {
  const n = trace.n
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`columns trace: invalid row count ${String(n)}`)
  }
  const dt = requireDeltas(trace.dt, n, "dt")
  const ds = requireDeltas(trace.ds, n, "ds")
  const dr = trace.dr == null ? null : requireDeltas(trace.dr, n, "dr")
  if (typeof trace.t0 !== "number" || typeof trace.s0 !== "number") {
    throw new Error("columns trace: t0/s0 must be numbers")
  }
  const hasConstantRank = typeof trace.rank === "number"
  const hasMovingRank = typeof trace.r0 === "number" && dr != null
  if (hasConstantRank === hasMovingRank) {
    throw new Error("columns trace: exactly one of rank or r0+dr is required")
  }
  const users = trace.users
  const runs = trace.u
  if (!Array.isArray(users) || !Array.isArray(runs) || runs.length === 0 || runs[0]?.[0] !== 0) {
    throw new Error("columns trace: users/u runs are missing or do not start at row 0")
  }
  if (trace.cid != null && trace.characterId != null) {
    throw new Error("columns trace: characterId and cid are exclusive")
  }
  if (trace.cid != null && (!Array.isArray(trace.cid) || trace.cid.length !== n)) {
    throw new Error("columns trace: cid must have one entry per row")
  }

  const rows: RankBorderTraceRow[] = new Array(n)
  let timestamp = trace.t0
  let score = trace.s0
  let rank = hasConstantRank ? (trace.rank as number) : (trace.r0 as number)
  let run = 0
  for (let index = 0; index < n; index += 1) {
    if (index > 0) {
      timestamp += dt[index - 1] as number
      score += ds[index - 1] as number
      if (dr) {
        rank += dr[index - 1] as number
      }
    }
    while (run + 1 < runs.length && (runs[run + 1] as [number, number])[0] <= index) {
      run += 1
    }
    const userIndex = (runs[run] as [number, number])[1]
    const userId = users[userIndex]
    if (typeof userId !== "string") {
      throw new Error(`columns trace: run ${run} points at unknown user ${String(userIndex)}`)
    }
    const row: RankBorderTraceRow = { timestamp, userId, score, rank }
    const characterId = trace.cid ? trace.cid[index] : trace.characterId
    if (characterId != null) {
      row.characterId = characterId
    }
    rows[index] = row
  }
  return rows
}

/**
 * The inverse of {@link decodeRankBorderTraceColumns}: mirrors the tracker's
 * encoder so tests can round-trip generated traces. Rows must be non-empty.
 */
export function encodeRankBorderTraceColumns(rows: readonly RankBorderTraceRow[]): RankBorderTraceColumns {
  const first = rows[0]
  if (!first) {
    throw new Error("columns trace: cannot encode an empty trace")
  }
  const users: string[] = []
  const userIndexes = new Map<string, number>()
  const runs: [number, number][] = []
  const dt: number[] = []
  const ds: number[] = []
  const dr: number[] = []
  const cid: (number | null)[] = []
  let rankMoves = false
  let lastUserIndex = -1
  rows.forEach((row, index) => {
    let userIndex = userIndexes.get(row.userId)
    if (userIndex == null) {
      userIndex = users.length
      users.push(row.userId)
      userIndexes.set(row.userId, userIndex)
    }
    if (userIndex !== lastUserIndex) {
      runs.push([index, userIndex])
      lastUserIndex = userIndex
    }
    if (index > 0) {
      const previous = rows[index - 1] as RankBorderTraceRow
      dt.push(row.timestamp - previous.timestamp)
      ds.push(row.score - previous.score)
      dr.push(row.rank - previous.rank)
      rankMoves ||= row.rank !== previous.rank
    }
    cid.push(row.characterId ?? null)
  })
  const columns: RankBorderTraceColumns = {
    format: "columns",
    n: rows.length,
    t0: first.timestamp,
    dt,
    s0: first.score,
    ds,
    users,
    u: runs,
  }
  if (rankMoves) {
    columns.r0 = first.rank
    columns.dr = dr
  } else {
    columns.rank = first.rank
  }
  const characterIds = new Set(cid)
  if (characterIds.size === 1 && first.characterId != null) {
    columns.characterId = first.characterId
  } else if (characterIds.size > 1) {
    columns.cid = cid
  }
  return columns
}

function requireDeltas(value: unknown, n: number, name: string): number[] {
  if (!Array.isArray(value) || value.length !== n - 1 || value.some((delta) => typeof delta !== "number")) {
    throw new Error(`columns trace: ${name} must hold ${n - 1} numbers`)
  }
  return value as number[]
}
