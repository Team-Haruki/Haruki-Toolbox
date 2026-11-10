import { describe, expect, it } from "bun:test"
import {
  OAUTH_CLIENT_AUDIT_ACTION_KEYS,
  countClientsByGrantType,
  countClientsByScope,
  integerAxisTicks,
  normalizeOAuthClientAuditSummary,
  pickTickIndexes,
  ratePercent,
  summarizeOAuthClientTrend,
  summarizeOAuthClients,
} from "./client-stats"

const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code"

const CLIENTS = [
  { active: true, clientType: "confidential" as const, scopes: ["user:read", "openid"], grantTypes: ["authorization_code", "refresh_token"], deviceEnabled: false },
  { active: true, clientType: "public" as const, scopes: ["user:read", "user:read"], grantTypes: [DEVICE_GRANT, "refresh_token"], deviceEnabled: true },
  { active: false, clientType: "confidential" as const, scopes: [], grantTypes: ["authorization_code"], deviceEnabled: false },
  { active: false, deleted: true, clientType: "public" as const, scopes: ["openid"], grantTypes: ["authorization_code"], deviceEnabled: false },
]

describe("summarizeOAuthClients", () => {
  it("counts status, type and device clients", () => {
    expect(summarizeOAuthClients(CLIENTS)).toEqual({
      loaded: 4,
      enabled: 2,
      disabled: 1,
      deleted: 1,
      confidential: 2,
      public: 2,
      device: 1,
    })
  })

  it("is all zeros for an empty list and reads a client without a type as confidential", () => {
    expect(summarizeOAuthClients([])).toEqual({ loaded: 0, enabled: 0, disabled: 0, deleted: 0, confidential: 0, public: 0, device: 0 })
    expect(summarizeOAuthClients([{ active: true }]).confidential).toBe(1)
  })
})

describe("countClientsByScope / countClientsByGrantType", () => {
  it("counts each client once per scope, most used first, ties by name", () => {
    expect(countClientsByScope(CLIENTS)).toEqual([
      { key: "openid", count: 2 },
      { key: "user:read", count: 2 },
    ])
  })

  it("counts grant types the same way", () => {
    expect(countClientsByGrantType(CLIENTS)).toEqual([
      { key: "authorization_code", count: 3 },
      { key: "refresh_token", count: 2 },
      { key: DEVICE_GRANT, count: 1 },
    ])
  })

  it("is empty when nothing is registered", () => {
    expect(countClientsByScope([{ active: true }])).toEqual([])
  })
})

describe("summarizeOAuthClientTrend", () => {
  it("sums the buckets and finds the busiest one", () => {
    const summary = summarizeOAuthClientTrend([
      { bucketStart: "2026-11-01T00:00:00Z", authorizationCreated: 0, tokenIssued: 0 },
      { bucketStart: "2026-11-01T01:00:00Z", authorizationCreated: 3, tokenIssued: 1 },
      { bucketStart: "2026-11-01T02:00:00Z", authorizationCreated: 1, tokenIssued: 0 },
    ])
    expect(summary.authorizations).toEqual([0, 3, 1])
    expect(summary.tokens).toEqual([0, 1, 0])
    expect(summary.authorizationSum).toBe(4)
    expect(summary.tokenSum).toBe(1)
    expect(summary.activeBuckets).toBe(2)
    expect(summary.peak).toEqual({ index: 1, bucketStart: "2026-11-01T01:00:00Z", authorizations: 3, tokens: 1 })
  })

  it("has no peak when every bucket is zero and keeps the first of equal peaks", () => {
    expect(summarizeOAuthClientTrend([{ bucketStart: "a", authorizationCreated: 0, tokenIssued: 0 }]).peak).toBeNull()
    expect(summarizeOAuthClientTrend([]).peak).toBeNull()
    const tied = summarizeOAuthClientTrend([
      { bucketStart: "a", authorizationCreated: 2, tokenIssued: 0 },
      { bucketStart: "b", authorizationCreated: 2, tokenIssued: 0 },
    ])
    expect(tied.peak?.bucketStart).toBe("a")
  })

  it("treats negative counts as zero", () => {
    const summary = summarizeOAuthClientTrend([{ bucketStart: "a", authorizationCreated: -2, tokenIssued: 5 }])
    expect(summary.authorizations).toEqual([0])
    expect(summary.tokenSum).toBe(5)
  })
})

describe("pickTickIndexes", () => {
  it("returns every index of a short series", () => {
    expect(pickTickIndexes(3, 6)).toEqual([0, 1, 2])
    expect(pickTickIndexes(1, 6)).toEqual([0])
  })

  it("spreads the ticks and keeps both ends", () => {
    expect(pickTickIndexes(25, 5)).toEqual([0, 6, 12, 18, 24])
    expect(pickTickIndexes(100, 2)).toEqual([0, 99])
  })

  it("never asks for fewer than two ticks and returns nothing for an empty series", () => {
    expect(pickTickIndexes(10, 0)).toEqual([0, 9])
    expect(pickTickIndexes(0, 5)).toEqual([])
    expect(pickTickIndexes(Number.NaN, 5)).toEqual([])
  })
})

describe("integerAxisTicks", () => {
  it("counts by one for small maxima, flat zero included", () => {
    expect(integerAxisTicks(0)).toEqual([0, 1, 2, 3, 4])
    expect(integerAxisTicks(3)).toEqual([0, 1, 2, 3, 4])
    expect(integerAxisTicks(Number.NaN)).toEqual([0, 1, 2, 3, 4])
  })

  it("uses 1-2-5 steps and ends at or above the maximum", () => {
    expect(integerAxisTicks(5)).toEqual([0, 2, 4, 6])
    expect(integerAxisTicks(19)).toEqual([0, 5, 10, 15, 20])
    expect(integerAxisTicks(20)).toEqual([0, 5, 10, 15, 20])
    expect(integerAxisTicks(21)).toEqual([0, 10, 20, 30])
    expect(integerAxisTicks(1234)).toEqual([0, 500, 1000, 1500])
    expect(integerAxisTicks(7.2)).toEqual([0, 2, 4, 6, 8])
  })
})

describe("ratePercent", () => {
  it("is the clamped share of a positive total", () => {
    expect(ratePercent(3, 4)).toBe(75)
    expect(ratePercent(9, 4)).toBe(100)
    expect(ratePercent(-1, 4)).toBe(0)
  })

  it("is null without a total", () => {
    expect(ratePercent(0, 0)).toBeNull()
    expect(ratePercent(1, Number.NaN)).toBeNull()
  })
})

describe("normalizeOAuthClientAuditSummary", () => {
  it("reads the backend summary and sorts the action counts", () => {
    expect(normalizeOAuthClientAuditSummary({
      generatedAt: "2026-11-10T00:00:00Z",
      clientId: "bot",
      from: "2026-11-09T00:00:00Z",
      to: "2026-11-10T00:00:00Z",
      total: 9,
      success: 7,
      failure: 2,
      byAction: [
        { key: "admin.oauth_client.update", count: 2 },
        { key: "admin.oauth_client.statistics.query", count: 6 },
        { key: "", count: 4 },
        { key: "admin.oauth_client.revoke", count: 0 },
        "nonsense",
      ],
    })).toEqual({
      from: "2026-11-09T00:00:00Z",
      to: "2026-11-10T00:00:00Z",
      total: 9,
      success: 7,
      failure: 2,
      byAction: [
        { key: "admin.oauth_client.statistics.query", count: 6 },
        { key: "admin.oauth_client.update", count: 2 },
      ],
    })
  })

  it("reads anything that is not an object as an empty summary", () => {
    expect(normalizeOAuthClientAuditSummary(null)).toEqual({ from: undefined, to: undefined, total: 0, success: 0, failure: 0, byAction: [] })
    expect(normalizeOAuthClientAuditSummary({ total: "9", byAction: {} }).total).toBe(0)
  })
})

describe("OAUTH_CLIENT_AUDIT_ACTION_KEYS", () => {
  it("names the client actions and leaves others to the raw text", () => {
    expect(OAUTH_CLIENT_AUDIT_ACTION_KEYS.get("admin.oauth_client.rotate_secret")).toBe("rotateSecret")
    expect(OAUTH_CLIENT_AUDIT_ACTION_KEYS.get("admin.user.ban")).toBeUndefined()
  })
})
