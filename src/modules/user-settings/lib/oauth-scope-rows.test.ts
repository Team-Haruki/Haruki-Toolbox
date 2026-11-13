import { describe, expect, it } from "bun:test"
import { buildConsentScopeRows, buildDeviceScopeRows } from "./oauth-scope-rows"

describe("consent scope rows", () => {
  it("lists every requested scope in the read, write, other order", () => {
    const rows = buildConsentScopeRows(["offline_access", "game-data:write", "openid", "x:y", "user:read"])

    expect(rows.map((row) => row.scope)).toEqual(["openid", "user:read", "game-data:write", "offline_access", "x:y"])
  })

  it("marks write scopes and offline access, and nothing else", () => {
    const rows = buildConsentScopeRows(["openid", "game-data:read", "game-data:write", "station:room:write", "offline_access", "x:y"])

    expect(rows.map((row) => [row.scope, row.attention])).toEqual([
      ["openid", null],
      ["game-data:read", null],
      ["game-data:write", "write"],
      ["station:room:write", "write"],
      ["offline_access", "offline"],
      ["x:y", null],
    ])
  })

  it("tells known scopes from unknown ones and never marks an unknown scope as write", () => {
    const rows = buildConsentScopeRows(["user:read", "evil:write"])

    expect(rows).toEqual([
      { key: "0:user:read", scope: "user:read", known: true, attention: null },
      { key: "1:evil:write", scope: "evil:write", known: false, attention: null },
    ])
  })

  it("keeps a scope that was requested twice as two rows with distinct keys", () => {
    const rows = buildConsentScopeRows(["user:read", "user:read"])

    expect(rows.map((row) => row.scope)).toEqual(["user:read", "user:read"])
    expect(new Set(rows.map((row) => row.key)).size).toBe(2)
  })

  it("is empty when nothing was requested", () => {
    expect(buildConsentScopeRows([])).toEqual([])
  })
})

describe("device scope rows", () => {
  it("keeps the backend's order and marks by the backend's risk", () => {
    const rows = buildDeviceScopeRows([
      { scope: "station:room:write", risk: "write" },
      { scope: "openid", risk: "identity" },
      { scope: "offline_access", risk: "offline" },
      { scope: "user:read", risk: "read" },
    ])

    expect(rows).toEqual([
      { key: "0:station:room:write", scope: "station:room:write", known: true, attention: "write", risk: "write" },
      { key: "1:openid", scope: "openid", known: true, attention: null, risk: "identity" },
      { key: "2:offline_access", scope: "offline_access", known: true, attention: "offline", risk: "offline" },
      { key: "3:user:read", scope: "user:read", known: true, attention: null, risk: "read" },
    ])
  })

  it("follows the backend's risk even for a scope the toolbox does not know", () => {
    const rows = buildDeviceScopeRows([{ scope: "future:thing", risk: "write" }, { scope: "future:other", risk: "read" }])

    expect(rows.map((row) => [row.known, row.attention])).toEqual([[false, "write"], [false, null]])
  })
})
