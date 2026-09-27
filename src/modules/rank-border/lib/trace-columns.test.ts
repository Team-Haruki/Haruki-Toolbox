import { describe, expect, it } from "bun:test"
import {
  decodeRankBorderTraceColumns,
  encodeRankBorderTraceColumns,
  isRankBorderTraceColumns,
  type RankBorderTraceColumns,
  type RankBorderTraceRow,
} from "./trace-columns"

// The example from WEB_API_CAPABILITIES.md, "Compact trace encoding".
const DOC_COLUMNS: RankBorderTraceColumns = {
  format: "columns",
  n: 6,
  t0: 1700000000,
  dt: [2, 1, 7, 1, 1],
  s0: 100,
  ds: [30, 1, 69, 1, 49],
  rank: 7,
  users: ["a", "b", "c"],
  u: [[0, 0], [2, 1], [4, 0], [5, 2]],
}
const DOC_ROWS: RankBorderTraceRow[] = [
  { timestamp: 1700000000, userId: "a", score: 100, rank: 7 },
  { timestamp: 1700000002, userId: "a", score: 130, rank: 7 },
  { timestamp: 1700000003, userId: "b", score: 131, rank: 7 },
  { timestamp: 1700000010, userId: "b", score: 200, rank: 7 },
  { timestamp: 1700000011, userId: "a", score: 201, rank: 7 },
  { timestamp: 1700000012, userId: "c", score: 250, rank: 7 },
]

/** Deterministic pseudo-random rows: seat changes, optional rank moves, optional per-row character. */
function generateRows(count: number, options: { rankMoves?: boolean; characters?: "none" | "constant" | "mixed" } = {}): RankBorderTraceRow[] {
  let seed = count * 7919 + 17
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed
  }
  const rows: RankBorderTraceRow[] = []
  let timestamp = 1_720_000_000
  let score = 0
  let rank = 100
  for (let index = 0; index < count; index += 1) {
    if (index > 0) {
      timestamp += 1 + (next() % 600)
      score += next() % 5000
      if (options.rankMoves && next() % 4 === 0) {
        rank = Math.max(1, rank + (next() % 7) - 3)
      }
    }
    const row: RankBorderTraceRow = { timestamp, userId: `user-${next() % 4}`, score, rank }
    if (options.characters === "constant") {
      row.characterId = 21
    } else if (options.characters === "mixed" && next() % 3 !== 0) {
      row.characterId = 1 + (next() % 26)
    }
    rows.push(row)
  }
  return rows
}

describe("compact trace columns", () => {
  it("decodes the documented example into its rows", () => {
    expect(decodeRankBorderTraceColumns(DOC_COLUMNS)).toEqual(DOC_ROWS)
    expect(encodeRankBorderTraceColumns(DOC_ROWS)).toEqual(DOC_COLUMNS)
  })

  it("recognises only the columns object", () => {
    expect(isRankBorderTraceColumns(DOC_COLUMNS)).toBe(true)
    expect(isRankBorderTraceColumns(DOC_ROWS)).toBe(false)
    expect(isRankBorderTraceColumns({ format: "rows" })).toBe(false)
    expect(isRankBorderTraceColumns(null)).toBe(false)
  })

  for (const [name, rows] of [
    ["a single row", [{ timestamp: 1, userId: "solo", score: 0, rank: 1 }]],
    ["a single World Bloom row", [{ timestamp: 1, userId: "solo", score: 0, rank: 1, characterId: 5 }]],
    ["seat changes at a fixed rank", generateRows(500)],
    ["rank moves", generateRows(500, { rankMoves: true })],
    ["a constant World Bloom character", generateRows(300, { characters: "constant" })],
    ["mixed per-row characters", generateRows(300, { rankMoves: true, characters: "mixed" })],
  ] as const) {
    it(`round-trips ${name}`, () => {
      const columns = encodeRankBorderTraceColumns(rows)
      expect(columns.dt).toHaveLength(rows.length - 1)
      expect("rank" in columns).not.toBe("r0" in columns)
      expect("characterId" in columns && "cid" in columns).toBe(false)
      expect(decodeRankBorderTraceColumns(columns)).toEqual([...rows])
      expect(decodeRankBorderTraceColumns(JSON.parse(JSON.stringify(columns)))).toEqual([...rows])
    })
  }

  it("uses a per-row character list only when characters vary", () => {
    const mixed = encodeRankBorderTraceColumns(generateRows(50, { characters: "mixed" }))
    expect(mixed.cid).toHaveLength(50)
    expect(mixed.characterId).toBeUndefined()
    const constant = encodeRankBorderTraceColumns(generateRows(50, { characters: "constant" }))
    expect(constant.characterId).toBe(21)
    expect(constant.cid).toBeUndefined()
  })

  it("rejects malformed objects instead of decoding them halfway", () => {
    expect(() => encodeRankBorderTraceColumns([])).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, n: 0 })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, dt: [2, 1] })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, rank: undefined })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, r0: 3, dr: [0, 0, 0, 0, 0] })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, u: [[1, 0]] })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, u: [[0, 9]] })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, characterId: 1, cid: [1, 1, 1, 1, 1, 1] })).toThrow()
    expect(() => decodeRankBorderTraceColumns({ ...DOC_COLUMNS, cid: [1] })).toThrow()
  })
})
