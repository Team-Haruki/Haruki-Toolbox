import { describe, expect, it } from "bun:test"
import { getScopeGroup, groupScopes, isKnownScope } from "./oauth-scopes"

describe("oauth2 scope helpers", () => {
  it("knows the toolbox scopes and nothing else", () => {
    expect(isKnownScope("game-data:read")).toBe(true)
    expect(isKnownScope("offline_access")).toBe(true)
    expect(isKnownScope("unknown:thing")).toBe(false)
    expect(isKnownScope("constructor")).toBe(false)
  })

  it("groups write scopes apart from read ones", () => {
    expect(getScopeGroup("game-data:write")).toBe("write")
    expect(getScopeGroup("station:room:write")).toBe("write")
    expect(getScopeGroup("game-data:read")).toBe("read")
    expect(getScopeGroup("openid")).toBe("read")
    expect(getScopeGroup("offline_access")).toBe("other")
    expect(getScopeGroup("unknown:thing")).toBe("other")
  })

  it("keeps the read/write/other order and skips empty groups", () => {
    expect(groupScopes(["offline_access", "game-data:write", "openid", "x:y"])).toEqual([
      { group: "read", scopes: ["openid"] },
      { group: "write", scopes: ["game-data:write"] },
      { group: "other", scopes: ["offline_access", "x:y"] },
    ])
    expect(groupScopes([])).toEqual([])
  })
})
