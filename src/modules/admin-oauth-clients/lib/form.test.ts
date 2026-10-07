import { describe, expect, test } from "bun:test"
import {
  AVAILABLE_SCOPE_IDS,
  WRITE_SCOPE_IDS,
  diffGrantFields,
  normalizeRedirectUris,
  resolveDevicePolicy,
  toggleGrantTypeSelection,
  toggleScopeSelection,
  validateClientPayload,
} from "./form"
import {
  DEFAULT_DEVICE_POLICY,
  DEFAULT_GRANT_TYPES,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_DEVICE_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
} from "./grant-types"

type Params = Parameters<typeof validateClientPayload>[0]

// An authorization code client that passes every rule; tests override one thing.
function params(overrides: Partial<Params> = {}): Params {
  return {
    clientId: "web-client",
    name: "Web Client",
    clientType: "confidential",
    scopes: ["user:read"],
    grantTypes: [...DEFAULT_GRANT_TYPES],
    redirectUris: ["https://a.com/callback"],
    devicePolicy: { ...DEFAULT_DEVICE_POLICY },
    ...overrides,
  }
}

// A public device-only client that passes every rule.
function deviceParams(overrides: Partial<Params> = {}): Params {
  return params({
    clientId: "haruki-client",
    name: "Haruki Client",
    clientType: "public",
    scopes: ["user:read", "offline_access", "station:room:write"],
    grantTypes: [GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_REFRESH_TOKEN],
    redirectUris: [""],
    postLogoutRedirectUris: [""],
    ...overrides,
  })
}

function errorCodeOf(result: ReturnType<typeof validateClientPayload>) {
  return "errorCode" in result ? result.errorCode : null
}

describe("admin oauth form helpers", () => {
  test("toggleScopeSelection adds and removes scope ids", () => {
    const scopes = ["user:read"]
    const appended = toggleScopeSelection(scopes, "bindings:read", true)
    expect(appended).toEqual(["user:read", "bindings:read"])

    const removed = toggleScopeSelection(appended, "user:read", false)
    expect(removed).toEqual(["bindings:read"])
  })

  test("toggleGrantTypeSelection adds and removes grant types", () => {
    const added = toggleGrantTypeSelection([GRANT_TYPE_AUTHORIZATION_CODE], GRANT_TYPE_DEVICE_CODE, true)
    expect(added).toEqual([GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_DEVICE_CODE])
    expect(toggleGrantTypeSelection(added, GRANT_TYPE_DEVICE_CODE, true)).toBe(added)
    expect(toggleGrantTypeSelection(added, GRANT_TYPE_AUTHORIZATION_CODE, false)).toEqual([GRANT_TYPE_DEVICE_CODE])
  })

  test("normalizeRedirectUris trims and removes empty values", () => {
    expect(normalizeRedirectUris(["  https://a.com/cb  ", "", "   "])).toEqual(["https://a.com/cb"])
  })

  test("validateClientPayload validates required fields", () => {
    expect(errorCodeOf(validateClientPayload(params({ clientId: "", name: "", scopes: [], redirectUris: [] }))))
      .toBe("clientIdAndNameRequired")
    expect(errorCodeOf(validateClientPayload(params({ clientId: undefined, name: " " })))).toBe("nameRequired")
    expect(errorCodeOf(validateClientPayload(params({ scopes: [] })))).toBe("scopeRequired")

    const valid = validateClientPayload(params({
      redirectUris: [" https://a.com/callback "],
      postLogoutRedirectUris: [" https://a.com/logged-out ", ""],
    }))
    expect("normalizedUris" in valid).toBe(true)
    if ("normalizedUris" in valid) {
      expect(valid.normalizedUris).toEqual(["https://a.com/callback"])
      expect(valid.normalizedPostLogoutUris).toEqual(["https://a.com/logged-out"])
      expect(valid.grantTypes).toEqual([GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN])
      expect(valid.devicePolicy).toEqual(DEFAULT_DEVICE_POLICY)
    }
  })

  test("rejects profile/email scopes without openid", () => {
    expect(errorCodeOf(validateClientPayload(params({ scopes: ["profile", "email"] })))).toBe("oidcScopeRequiresOpenid")
    expect(errorCodeOf(validateClientPayload(params({ scopes: ["openid", "profile", "email"] })))).toBeNull()
  })

  test("available scopes include offline access, oidc scopes and station:room:write", () => {
    expect(AVAILABLE_SCOPE_IDS).toContain("offline_access")
    expect(AVAILABLE_SCOPE_IDS).toContain("openid")
    expect(AVAILABLE_SCOPE_IDS).toContain("profile")
    expect(AVAILABLE_SCOPE_IDS).toContain("email")
    expect(AVAILABLE_SCOPE_IDS).toContain("station:room:write")
  })

  test("station:room:write is a write scope like game-data:write", () => {
    expect(WRITE_SCOPE_IDS.has("game-data:write")).toBe(true)
    expect(WRITE_SCOPE_IDS.has("station:room:write")).toBe(true)
    expect(WRITE_SCOPE_IDS.has("game-data:read")).toBe(false)
  })
})

describe("grant type rules", () => {
  test("grantTypeRequired: authorization code or device code must be selected", () => {
    expect(errorCodeOf(validateClientPayload(params({ grantTypes: [] })))).toBe("grantTypeRequired")
    expect(errorCodeOf(validateClientPayload(params({ grantTypes: [GRANT_TYPE_REFRESH_TOKEN] })))).toBe("grantTypeRequired")
    // Grant types the form does not manage do not count.
    expect(errorCodeOf(validateClientPayload(params({ grantTypes: ["client_credentials"] })))).toBe("grantTypeRequired")
  })

  test("redirectUriRequired only with the authorization code grant", () => {
    expect(errorCodeOf(validateClientPayload(params({ redirectUris: ["", "  "] })))).toBe("redirectUriRequired")
    expect(errorCodeOf(validateClientPayload(params({
      grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_DEVICE_CODE],
      redirectUris: [],
    })))).toBe("redirectUriRequired")
  })

  test("a device-only client needs no redirect URI", () => {
    const valid = validateClientPayload(deviceParams())
    expect(errorCodeOf(valid)).toBeNull()
    if ("normalizedUris" in valid) {
      expect(valid.normalizedUris).toEqual([])
      expect(valid.normalizedPostLogoutUris).toEqual([])
      expect(valid.grantTypes).toEqual([GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_REFRESH_TOKEN])
    }
  })

  test("grant types are sent in a fixed order", () => {
    const valid = validateClientPayload(params({
      grantTypes: [GRANT_TYPE_REFRESH_TOKEN, GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_AUTHORIZATION_CODE],
    }))
    expect("grantTypes" in valid && valid.grantTypes).toEqual([
      GRANT_TYPE_AUTHORIZATION_CODE,
      GRANT_TYPE_DEVICE_CODE,
      GRANT_TYPE_REFRESH_TOKEN,
    ])
  })

  test("postLogoutRequiresRedirectUris: no post-logout URIs without redirect URIs", () => {
    expect(errorCodeOf(validateClientPayload(deviceParams({ postLogoutRedirectUris: ["https://a.com/bye"] }))))
      .toBe("postLogoutRequiresRedirectUris")
  })

  test("offlineAccessRequiresRefreshToken", () => {
    expect(errorCodeOf(validateClientPayload(params({
      scopes: ["user:read", "offline_access"],
      grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE],
    })))).toBe("offlineAccessRequiresRefreshToken")
    expect(errorCodeOf(validateClientPayload(deviceParams({ grantTypes: [GRANT_TYPE_DEVICE_CODE] }))))
      .toBe("offlineAccessRequiresRefreshToken")
    expect(errorCodeOf(validateClientPayload(params({ scopes: ["user:read", "offline_access"] })))).toBeNull()
  })

  test("deviceRequiresUserRead", () => {
    expect(errorCodeOf(validateClientPayload(deviceParams({ scopes: ["station:room:write"] }))))
      .toBe("deviceRequiresUserRead")
    // Without the device grant user:read is optional.
    expect(errorCodeOf(validateClientPayload(params({ scopes: ["game-data:read"] })))).toBeNull()
  })
})

describe("device policy rules", () => {
  const writeScopes = ["user:read", "game-data:write"]

  test("deviceWriteRequiresPublicClient", () => {
    const allowWrite = { ...DEFAULT_DEVICE_POLICY, allowWrite: true }
    expect(errorCodeOf(validateClientPayload(deviceParams({ scopes: writeScopes, devicePolicy: allowWrite })))).toBeNull()
    // Confidential client.
    expect(errorCodeOf(validateClientPayload(deviceParams({
      clientType: "confidential",
      scopes: writeScopes,
      devicePolicy: allowWrite,
    })))).toBe("deviceWriteRequiresPublicClient")
    // No game-data:write scope.
    expect(errorCodeOf(validateClientPayload(deviceParams({ scopes: ["user:read"], devicePolicy: allowWrite }))))
      .toBe("deviceWriteRequiresPublicClient")
  })

  test("invalidDevicePolicy: maxCodesPer10m is an integer from 1 to 600", () => {
    for (const maxCodesPer10m of [0, 601, -1, 1.5, Number.NaN]) {
      expect(errorCodeOf(validateClientPayload(deviceParams({ devicePolicy: { ...DEFAULT_DEVICE_POLICY, maxCodesPer10m } }))))
        .toBe("invalidDevicePolicy")
    }
    for (const maxCodesPer10m of [1, 60, 600]) {
      expect(errorCodeOf(validateClientPayload(deviceParams({ devicePolicy: { ...DEFAULT_DEVICE_POLICY, maxCodesPer10m } }))))
        .toBeNull()
    }
  })

  test("the hidden policy of a client without the device grant never blocks a save", () => {
    // Edits made while the device grant was selected, then deselected.
    const result = validateClientPayload(params({
      devicePolicy: { firstParty: true, allowWrite: true, maxCodesPer10m: 0 },
      initialDevicePolicy: { firstParty: true, allowWrite: true, maxCodesPer10m: 30 },
    }))
    expect(errorCodeOf(result)).toBeNull()
    // The saved policy goes back with allowWrite cleared, which the backend requires.
    expect("devicePolicy" in result && result.devicePolicy).toEqual({ firstParty: true, allowWrite: false, maxCodesPer10m: 30 })
  })
})

describe("resolveDevicePolicy", () => {
  test("firstParty is sent for confidential clients only", () => {
    const policy = { firstParty: true, allowWrite: false, maxCodesPer10m: 60 }
    const grantTypes = [GRANT_TYPE_DEVICE_CODE]
    expect(resolveDevicePolicy({ clientType: "confidential", grantTypes, devicePolicy: policy }).firstParty).toBe(true)
    expect(resolveDevicePolicy({ clientType: "public", grantTypes, devicePolicy: policy }).firstParty).toBe(false)
  })

  test("without the device grant it is the initial policy, or the defaults on create", () => {
    expect(resolveDevicePolicy({
      clientType: "public",
      grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE],
      devicePolicy: { firstParty: false, allowWrite: true, maxCodesPer10m: 5 },
    })).toEqual(DEFAULT_DEVICE_POLICY)
  })
})

describe("diffGrantFields", () => {
  const initial = { grantTypes: [GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_REFRESH_TOKEN], devicePolicy: { ...DEFAULT_DEVICE_POLICY } }

  test("an untouched edit sends neither member", () => {
    expect(diffGrantFields({ grantTypes: [GRANT_TYPE_REFRESH_TOKEN, GRANT_TYPE_DEVICE_CODE], devicePolicy: { ...DEFAULT_DEVICE_POLICY } }, initial))
      .toEqual({})
  })

  test("sends only what changed", () => {
    expect(diffGrantFields({ grantTypes: [GRANT_TYPE_DEVICE_CODE], devicePolicy: { ...DEFAULT_DEVICE_POLICY } }, initial))
      .toEqual({ grantTypes: [GRANT_TYPE_DEVICE_CODE] })
    expect(diffGrantFields({ grantTypes: initial.grantTypes, devicePolicy: { ...DEFAULT_DEVICE_POLICY, maxCodesPer10m: 10 } }, initial))
      .toEqual({ devicePolicy: { ...DEFAULT_DEVICE_POLICY, maxCodesPer10m: 10 } })
  })

  test("grant types the form does not manage are not a change", () => {
    expect(diffGrantFields(
      { grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE], devicePolicy: { ...DEFAULT_DEVICE_POLICY } },
      { grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE, "client_credentials"], devicePolicy: { ...DEFAULT_DEVICE_POLICY } },
    )).toEqual({})
  })
})
