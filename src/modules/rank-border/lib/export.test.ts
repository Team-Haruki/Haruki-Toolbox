import { describe, expect, it } from "bun:test"
import {
  buildRankBorderStandingsCsv,
  buildRankBorderTraceCsv,
  rankBorderStandingsFileName,
  rankBorderTraceFileName,
} from "./export"
import type { RankBorderLatest, RankBorderTracePoint } from "./rank-border"
import type { RankBorderLineRow, RankBorderSegmentRow } from "./rank-border-types"

const headers = {
  rank: "Rank",
  score: "Score",
  player: "Player",
  userId: "Player ID",
  time: "Time",
  timestamp: "Timestamp",
  holderGrowth: "Player growth",
  seatGrowth: "Seat growth",
}

const local = (hour: number, minute: number) => new Date(2026, 10, 13, hour, minute, 0).getTime() / 1000

function latest(rank: number, score: number, name: string | null, userId: string | null): RankBorderLatest {
  return {
    rank,
    score,
    timestamp: local(18, 0),
    userId,
    name,
    cheerfulTeamId: null,
    characterId: null,
    cardId: null,
    cardLevel: null,
    cardMasterRank: null,
    cardSpecialTrainingStatus: null,
    cardDefaultImage: null,
    profileWord: null,
    profileHonors: [],
    userPlayerFrames: [],
  }
}

function seat(rank: number, detail: RankBorderLatest | null, growth: number | null, rankGrowth: number | null): RankBorderLineRow {
  return {
    key: `rank:${rank}`,
    rank,
    score: detail?.score ?? null,
    timestamp: detail?.timestamp ?? null,
    growth: null,
    rankGrowth: null,
    displayGrowth: growth,
    displayRankGrowth: rankGrowth,
    displayGrowthChanged: false,
    displayRankGrowthChanged: false,
    detail,
    scoreChanged: false,
    growthChanged: false,
    top100: true,
  }
}

function line(rank: number, score: number, growth: number | null): RankBorderSegmentRow {
  return {
    rank,
    score,
    timestamp: local(18, 1),
    growth: growth == null
      ? null
      : { rank, scoreLatest: score, scoreEarlier: score - growth, timestampLatest: null, timestampEarlier: null, timeDiff: 3600, growth },
    scoreChanged: false,
    growthChanged: false,
  }
}

const lines = (csv: string | null) => (csv ?? "").replace("﻿", "").trimEnd().split("\r\n")

describe("buildRankBorderStandingsCsv", () => {
  it("lists the seats with their players, then the lines below them", () => {
    const csv = buildRankBorderStandingsCsv({
      headers,
      top100Rows: [
        seat(1, latest(1, 9000, "<#ff0000>Red</color> one", "u1"), 300, -50),
        seat(2, null, null, null),
        seat(3, latest(3, 7000, null, null), null, 120),
      ],
      segmentRows: [line(200, 5000, 80), line(300, 4000, null)],
    })

    expect(lines(csv)).toEqual([
      "Rank,Score,Player,Player ID,Time,Timestamp,Player growth,Seat growth",
      `1,9000,Red one,u1,2026-11-13 18:00:00,${local(18, 0)},300,-50`,
      `3,7000,,,2026-11-13 18:00:00,${local(18, 0)},,120`,
      `200,5000,,,2026-11-13 18:01:00,${local(18, 1)},,80`,
      `300,4000,,,2026-11-13 18:01:00,${local(18, 1)},,`,
    ])
  })

  it("writes a name that reads as a formula as text", () => {
    const csv = buildRankBorderStandingsCsv({
      headers,
      top100Rows: [seat(1, latest(1, 1, "=1+1", "u1"), null, null)],
      segmentRows: [],
    })
    expect(lines(csv)[1]).toStartWith("1,1,'=1+1,u1,")
  })

  it("leaves the time empty for a line with none", () => {
    const csv = buildRankBorderStandingsCsv({
      headers,
      top100Rows: [],
      segmentRows: [{ ...line(500, 100, null), timestamp: null }],
    })
    expect(lines(csv)[1]).toBe("500,100,,,,,,")
  })

  it("is null when nothing has a score", () => {
    expect(buildRankBorderStandingsCsv({ headers, top100Rows: [seat(1, null, null, null)], segmentRows: [] })).toBeNull()
  })
})

describe("buildRankBorderTraceCsv", () => {
  const point = (minute: number, rank: number, score: number, userId: string | null = null): RankBorderTracePoint => ({
    rank,
    score,
    timestamp: local(18, minute),
    userId,
    characterId: null,
  })

  it("lists the samples oldest first", () => {
    const csv = buildRankBorderTraceCsv({ headers, trace: [point(2, 5, 300), point(0, 7, 100), point(1, 6, 200)] })
    expect(lines(csv)).toEqual([
      "Time,Timestamp,Rank,Score",
      `2026-11-13 18:00:00,${local(18, 0)},7,100`,
      `2026-11-13 18:01:00,${local(18, 1)},6,200`,
      `2026-11-13 18:02:00,${local(18, 2)},5,300`,
    ])
  })

  it("adds who held the seat when the trace says so", () => {
    const csv = buildRankBorderTraceCsv({ headers, trace: [point(0, 2, 100, "u1"), point(1, 2, 200)] })
    expect(lines(csv)).toEqual([
      "Time,Timestamp,Rank,Score,Player ID",
      `2026-11-13 18:00:00,${local(18, 0)},2,100,u1`,
      `2026-11-13 18:01:00,${local(18, 1)},2,200,`,
    ])
  })

  it("is null for an empty trace", () => {
    expect(buildRankBorderTraceCsv({ headers, trace: [] })).toBeNull()
  })
})

describe("file names", () => {
  const scope = { region: "jp" as const, eventId: 225, mode: "normal" as const, worldBloomCharacterId: null }
  const chapter = { ...scope, mode: "world_bloom" as const, worldBloomCharacterId: 21 }
  const at = local(18, 27)

  it("names the standings by leaderboard and time", () => {
    expect(rankBorderStandingsFileName(scope, at)).toBe("rank-border-jp-event225-20261113-182700.csv")
    expect(rankBorderStandingsFileName(chapter, at)).toBe("rank-border-jp-event225-wl21-20261113-182700.csv")
    expect(rankBorderStandingsFileName({ ...scope, worldBloomCharacterId: 21 }, at)).toBe(
      "rank-border-jp-event225-20261113-182700.csv",
    )
  })

  it("names a trace by what it follows", () => {
    const name = (target: Parameters<typeof rankBorderTraceFileName>[1], seat: boolean) =>
      rankBorderTraceFileName(scope, target, seat, at)
    expect(name({ kind: "line", rank: 500 }, true)).toBe("rank-border-jp-event225-line500-20261113-182700.csv")
    expect(name({ kind: "rank", rank: 2 }, true)).toBe("rank-border-jp-event225-rank2-20261113-182700.csv")
    expect(name({ kind: "rank", rank: 2 }, false)).toBe("rank-border-jp-event225-rank2-player-20261113-182700.csv")
    expect(name({ kind: "user", userId: "123" }, false)).toBe("rank-border-jp-event225-user123-20261113-182700.csv")
    expect(name({ kind: "user", userId: "123" }, true)).toBe("rank-border-jp-event225-user123-seat-20261113-182700.csv")
  })

  it("keeps a player id from the address bar to what a file name can hold", () => {
    expect(rankBorderTraceFileName(scope, { kind: "user", userId: "../a b/1" }, false, at)).toBe(
      "rank-border-jp-event225-userab1-20261113-182700.csv",
    )
  })
})
