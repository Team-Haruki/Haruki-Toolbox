import { describe, expect, it } from "bun:test"
import {
  normalizeRankBorderBatchTrace,
  normalizeRankBorderLatest,
  normalizeRankBorderLines,
  normalizeRankBorderStatus,
  normalizeRankBorderTrace,
  normalizeRankBorderTraceTimeline,
  normalizeRankBorderUserProfiles,
  normalizeRankBorderWebRankings,
  normalizeTrackerEndpoint,
  parseRankBorderRankQuery,
  resolveRankBorderDetailTraceKey,
  resolveRankBorderTraceGrowth,
  shouldCacheRankBorderDetailTraceByRank,
  isSameRankBorderTraceTimeline,
} from "./rank-border"

describe("rank border helpers", () => {
  it("normalizes and sorts ranking line payloads", () => {
    expect(normalizeRankBorderLines([
      { rank: 100, score: 1234567, timestamp: 1710000000 },
      { rank: "10", score: "7654321", timestamp: "1710000060" },
      { rank: 0, score: 1 },
      { score: 2 },
    ])).toEqual([
      { rank: 10, score: 7654321, timestamp: 1710000060 },
      { rank: 100, score: 1234567, timestamp: 1710000000 },
    ])
  })

  it("normalizes latest user ranking responses", () => {
    expect(normalizeRankBorderLatest({
      rankData: {
        userId: "123456789",
        rank: 42,
        score: 9876543,
        timestamp: 1710000000,
        characterId: 1,
      },
      userData: {
        userId: "123456789",
        name: "Haruki",
        cheerfulTeamId: 2,
        cardId: 1404,
        cardLevel: 60,
        cardMasterRank: 5,
        cardSpecialTrainingStatus: "done",
        cardDefaultImage: "special_training",
        profileWord: "hello",
        profileHonors: [
          { seq: 2, honorId: 20, honorLevel: 3 },
          { seq: 3, honorId2: 30, honorLevel: 5 },
          { seq: 1, honorId: 10, honorLevel: 1, profileHonorType: "normal" },
        ],
        userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
      },
    })).toEqual({
      rank: 42,
      score: 9876543,
      timestamp: 1710000000,
      userId: "123456789",
      name: "Haruki",
      cheerfulTeamId: 2,
      characterId: 1,
      cardId: 1404,
      cardLevel: 60,
      cardMasterRank: 5,
      cardSpecialTrainingStatus: "done",
      cardDefaultImage: "special_training",
      profileWord: "hello",
      profileHonors: [
        {
          seq: 1,
          profileHonorType: "normal",
          honorId: 10,
          honorId2: null,
          honorLevel: 1,
          bondsHonorViewType: null,
          bondsHonorWordId: null,
        },
        {
          seq: 2,
          profileHonorType: null,
          honorId: 20,
          honorId2: null,
          honorLevel: 3,
          bondsHonorViewType: null,
          bondsHonorWordId: null,
        },
        {
          seq: 3,
          profileHonorType: null,
          honorId: null,
          honorId2: 30,
          honorLevel: 5,
          bondsHonorViewType: null,
          bondsHonorWordId: null,
        },
      ],
      userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
    })
  })

  it("normalizes latest ranking tuple responses without requiring public user IDs", () => {
    expect(normalizeRankBorderLatest([
      { rank: 7, score: 7654321, timestamp: 1710000001 },
      { name: "Hidden UID" },
    ])).toEqual({
      rank: 7,
      score: 7654321,
      timestamp: 1710000001,
      userId: null,
      name: "Hidden UID",
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
    })
  })

  it("normalizes public web user profile search responses", () => {
    expect(normalizeRankBorderUserProfiles({
      items: [
        {
          userId: "public-user-id",
          name: "Codex T001",
          cardId: "1404",
          profileHonors: [
            { seq: 3, honorId: 8104, honorLevel: 1 },
            { seq: 1, honorId: 8071, honorLevel: 1 },
          ],
          userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
        },
        { name: "Missing public id" },
      ],
    })).toEqual([
      {
        userId: "public-user-id",
        name: "Codex T001",
        cheerfulTeamId: null,
        cardId: 1404,
        cardLevel: null,
        cardMasterRank: null,
        cardSpecialTrainingStatus: null,
        cardDefaultImage: null,
        profileWord: null,
        profileHonors: [
          {
            seq: 1,
            profileHonorType: null,
            honorId: 8071,
            honorId2: null,
            honorLevel: 1,
            bondsHonorViewType: null,
            bondsHonorWordId: null,
          },
          {
            seq: 3,
            profileHonorType: null,
            honorId: 8104,
            honorId2: null,
            honorLevel: 1,
            bondsHonorViewType: null,
            bondsHonorWordId: null,
          },
        ],
        userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
      },
    ])
  })

  it("normalizes public web ranking pages", () => {
    expect(normalizeRankBorderWebRankings({
      items: [
        { rank: 2, score: 2000, timestamp: 1710000060, userId: "public-2" },
        { rank: 1, score: 3000, timestamp: 1710000060, userId: "public-1" },
        { rank: 0, score: 1 },
      ],
      nextCursor: "1710000060:2:3",
    })).toEqual({
      items: [
        {
          rank: 1,
          score: 3000,
          timestamp: 1710000060,
          userId: "public-1",
          name: null,
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
        },
        {
          rank: 2,
          score: 2000,
          timestamp: 1710000060,
          userId: "public-2",
          name: null,
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
        },
      ],
      nextCursor: "1710000060:2:3",
    })
  })

  it("keeps user payloads on public web ranking pages", () => {
    expect(normalizeRankBorderWebRankings({
      items: [
        {
          rankData: {
            rank: 1,
            score: 3000,
            timestamp: 1710000060,
            userId: "public-1",
          },
          userData: {
            userId: "public-1",
            name: "Haruki",
            cardId: 1404,
            cardLevel: 60,
          },
        },
      ],
    }).items[0]).toMatchObject({
      rank: 1,
      score: 3000,
      timestamp: 1710000060,
      userId: "public-1",
      name: "Haruki",
      cardId: 1404,
      cardLevel: 60,
    })
  })

  it("keeps flat public web ranking user payloads", () => {
    expect(normalizeRankBorderWebRankings({
      items: [
        {
          rank: 1,
          score: 3000,
          timestamp: 1710000060,
          userId: "public-1",
          userData: {
            userId: "public-1",
            name: "Haruki",
            cardId: 1404,
            cardLevel: 60,
          },
        },
      ],
    }).items[0]).toMatchObject({
      rank: 1,
      score: 3000,
      timestamp: 1710000060,
      userId: "public-1",
      name: "Haruki",
      cardId: 1404,
      cardLevel: 60,
    })
  })

  it("keeps top-level public web ranking profile fields", () => {
    expect(normalizeRankBorderWebRankings({
      items: [
        {
          rankData: {
            rank: 1,
            score: 3000,
            timestamp: 1710000060,
            userId: "public-1",
          },
          userId: "public-1",
          name: "Haruki",
          cardId: 1404,
          cardLevel: 60,
          profileHonors: [
            { seq: 2, honorId: 8104, honorLevel: 1 },
            { seq: 1, honorId: 8071, honorLevel: 1 },
          ],
          userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
        },
      ],
    }).items[0]).toMatchObject({
      rank: 1,
      score: 3000,
      timestamp: 1710000060,
      userId: "public-1",
      name: "Haruki",
      cardId: 1404,
      cardLevel: 60,
      profileHonors: [
        {
          seq: 1,
          honorId: 8071,
          honorLevel: 1,
        },
        {
          seq: 2,
          honorId: 8104,
          honorLevel: 1,
        },
      ],
      userPlayerFrames: [{ playerFrameId: 10050, playerFrameAttachStatus: "first" }],
    })
  })

  it("normalizes trace ranking responses and resolves interval growth", () => {
    const records = normalizeRankBorderTrace({
      rankData: [
        { rank: 3, score: 200, timestamp: 1710000120, userId: "2" },
        { rank: 3, score: 100, timestamp: 1710000000, userId: "1" },
        { rank: 0, score: 100, timestamp: 1710000000 },
      ],
    })

    expect(records).toEqual([
      { rank: 3, score: 100, timestamp: 1710000000, userId: "1", characterId: null },
      { rank: 3, score: 200, timestamp: 1710000120, userId: "2", characterId: null },
    ])
    expect(resolveRankBorderTraceGrowth(records, 1710000060)).toEqual({
      rank: 3,
      scoreLatest: 200,
      scoreEarlier: 100,
      timestampLatest: 1710000120,
      timestampEarlier: 1710000000,
      timeDiff: 120,
      growth: 100,
    })
    expect(resolveRankBorderTraceGrowth(records, 1710000000)).toEqual({
      rank: 3,
      scoreLatest: 200,
      scoreEarlier: 100,
      timestampLatest: 1710000120,
      timestampEarlier: 1710000000,
      timeDiff: 120,
      growth: 100,
    })
  })

  it("deduplicates trace timeline points by timestamp", () => {
    expect(normalizeRankBorderTraceTimeline([
      { rank: 1, score: 100, timestamp: 1710000000, userId: "u1", characterId: null },
      { rank: 1, score: 120, timestamp: 1710000000, userId: "u1", characterId: null },
      { rank: 1, score: 180, timestamp: 1710000060, userId: "u1", characterId: null },
    ])).toEqual([
      { rank: 1, score: 120, timestamp: 1710000000, userId: "u1", characterId: null },
      { rank: 1, score: 180, timestamp: 1710000060, userId: "u1", characterId: null },
    ])
  })

  it("keys detail traces by player identity when available", () => {
    const latest = normalizeRankBorderLatest({
      rankData: { rank: 42, score: 1234, timestamp: 1710000000, userId: "public-user" },
      userData: { userId: "public-user", name: "Haruki" },
    })
    expect(latest).not.toBeNull()

    expect(resolveRankBorderDetailTraceKey({
      source: "rank",
      query: "42",
      result: latest!,
    })).toBe("rank:user:public-user:42")
    expect(shouldCacheRankBorderDetailTraceByRank({
      source: "rank",
      query: "42",
      result: latest!,
    })).toBe(false)
  })

  it("keeps line and anonymous rank traces cacheable by rank", () => {
    const line = { rank: 1000, score: 9876543, timestamp: 1710000000 }
    const anonymousLatest = normalizeRankBorderLatest({
      rankData: { rank: 42, score: 1234, timestamp: 1710000000 },
    })
    expect(anonymousLatest).not.toBeNull()

    expect(resolveRankBorderDetailTraceKey({
      source: "line",
      query: "1000",
      result: line,
    })).toBe("line:rank:1000:1000")
    expect(shouldCacheRankBorderDetailTraceByRank({
      source: "line",
      query: "1000",
      result: line,
    })).toBe(true)
    expect(resolveRankBorderDetailTraceKey({
      source: "rank",
      query: "42",
      result: anonymousLatest!,
    })).toBe("rank:rank:42:42")
    expect(shouldCacheRankBorderDetailTraceByRank({
      source: "rank",
      query: "42",
      result: anonymousLatest!,
    })).toBe(true)
  })

  it("compares trace timelines by rendered chart fields", () => {
    const records = [
      { rank: 1, score: 100, timestamp: 1710000000, userId: "u1", characterId: null },
      { rank: 1, score: 120, timestamp: 1710000060, userId: "u1", characterId: null },
    ]
    expect(isSameRankBorderTraceTimeline(records, records.map((record) => ({ ...record })))).toBe(true)
    expect(isSameRankBorderTraceTimeline(records, [
      records[0],
      { ...records[1], score: 121 },
    ])).toBe(false)
  })

  it("uses the latest trace point before the interval as growth baseline", () => {
    const records = normalizeRankBorderTrace({
      rankData: [
        { rank: 3, score: 100, timestamp: 1710000000 },
        { rank: 3, score: 150, timestamp: 1710000030 },
        { rank: 3, score: 280, timestamp: 1710000090 },
        { rank: 3, score: 400, timestamp: 1710000120 },
      ],
    })

    expect(resolveRankBorderTraceGrowth(records, 1710000060)).toEqual({
      rank: 3,
      scoreLatest: 400,
      scoreEarlier: 150,
      timestampLatest: 1710000120,
      timestampEarlier: 1710000030,
      timeDiff: 90,
      growth: 250,
    })
    expect(resolveRankBorderTraceGrowth(records, 1710000120)).toBeNull()
  })

  it("falls back to the earliest available trace point when interval history is incomplete", () => {
    const records = normalizeRankBorderTrace({
      rankData: [
        { rank: 8, score: 1200, timestamp: 1710003600 },
        { rank: 8, score: 1800, timestamp: 1710007200 },
      ],
    })

    expect(resolveRankBorderTraceGrowth(records, 1709917200)).toEqual({
      rank: 8,
      scoreLatest: 1800,
      scoreEarlier: 1200,
      timestampLatest: 1710007200,
      timestampEarlier: 1710003600,
      timeDiff: 3600,
      growth: 600,
    })
  })

  it("normalizes batch trace ranking responses", () => {
    const records = normalizeRankBorderBatchTrace({
      items: [
        {
          rank: 1,
          rankData: [
            { rank: 1, score: 100, timestamp: 1710000000 },
            { rank: 1, score: 200, timestamp: 1710000060 },
          ],
        },
        { rank: 2, rankData: [] },
      ],
    })

    expect(records.get(1)).toEqual([
      { rank: 1, score: 100, timestamp: 1710000000, userId: null, characterId: null },
      { rank: 1, score: 200, timestamp: 1710000060, userId: null, characterId: null },
    ])
    expect(records.has(2)).toBe(false)
  })

  it("returns null when latest ranking data is incomplete", () => {
    expect(normalizeRankBorderLatest({ userData: { userId: "1" } })).toBeNull()
    expect(normalizeRankBorderLatest({ rankData: { rank: 1 } })).toBeNull()
  })

  it("normalizes tracker status and endpoint values", () => {
    expect(normalizeRankBorderStatus({
      timestamp: "1710000000",
      status: "0",
      statusDesc: "OK",
      timeAgo: "15",
    })).toEqual({
      timestamp: 1710000000,
      status: 0,
      statusDesc: "OK",
      timeAgo: 15,
    })
    expect(normalizeTrackerEndpoint(" http://127.0.0.1:8080/// ")).toBe("http://127.0.0.1:8080")
  })

  it("parses bot-style rank queries", () => {
    expect(parseRankBorderRankQuery("T100")).toBe(100)
    expect(parseRankBorderRankQuery("t 1,000")).toBe(1000)
    expect(parseRankBorderRankQuery("#2000")).toBe(2000)
    expect(parseRankBorderRankQuery("3000")).toBe(3000)
    expect(parseRankBorderRankQuery("uid")).toBeNull()
  })
})
