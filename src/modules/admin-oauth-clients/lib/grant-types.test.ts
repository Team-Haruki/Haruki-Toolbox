import { describe, expect, test } from "bun:test"
import {
  DEFAULT_DEVICE_POLICY,
  GRANT_TYPE_AUTHORIZATION_CODE,
  GRANT_TYPE_DEVICE_CODE,
  GRANT_TYPE_REFRESH_TOKEN,
  canAllowDeviceWrite,
  isFirstPartyApplicable,
  isValidMaxCodesPer10m,
  readOAuthClientDeviceFields,
  toManagedGrantTypes,
} from "./grant-types"

describe("readOAuthClientDeviceFields", () => {
  test("reads the fields of a device client", () => {
    expect(readOAuthClientDeviceFields({
      clientId: "haruki-client",
      grantTypes: [GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_REFRESH_TOKEN],
      deviceEnabled: true,
      devicePolicy: { firstParty: false, allowWrite: true, maxCodesPer10m: 120 },
    })).toEqual({
      grantTypes: [GRANT_TYPE_DEVICE_CODE, GRANT_TYPE_REFRESH_TOKEN],
      deviceEnabled: true,
      devicePolicy: { firstParty: false, allowWrite: true, maxCodesPer10m: 120 },
    })
  })

  test("a record without grantTypes is an authorization code client", () => {
    // A backend that predates the device grant echoes none of the fields.
    expect(readOAuthClientDeviceFields({ clientId: "web", redirectUris: ["https://a.com/cb"] })).toEqual({
      grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN],
      deviceEnabled: false,
      devicePolicy: DEFAULT_DEVICE_POLICY,
    })
    expect(readOAuthClientDeviceFields({ grantTypes: [] }).grantTypes).toEqual([GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN])
    expect(readOAuthClientDeviceFields({ grantTypes: null }).grantTypes).toEqual([GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN])
    expect(readOAuthClientDeviceFields(undefined).deviceEnabled).toBe(false)
  })

  test("deviceEnabled falls back to the grant types", () => {
    expect(readOAuthClientDeviceFields({ grant_types: [GRANT_TYPE_DEVICE_CODE] }).deviceEnabled).toBe(true)
    expect(readOAuthClientDeviceFields({ grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE] }).deviceEnabled).toBe(false)
  })

  test("missing or malformed policy members read as defaults", () => {
    expect(readOAuthClientDeviceFields({ devicePolicy: { firstParty: true } }).devicePolicy)
      .toEqual({ firstParty: true, allowWrite: false, maxCodesPer10m: 60 })
    expect(readOAuthClientDeviceFields({ devicePolicy: { maxCodesPer10m: 0 } }).devicePolicy.maxCodesPer10m).toBe(60)
    expect(readOAuthClientDeviceFields({ devicePolicy: { maxCodesPer10m: "30" } }).devicePolicy.maxCodesPer10m).toBe(60)
    expect(readOAuthClientDeviceFields({ devicePolicy: "nope" }).devicePolicy).toEqual(DEFAULT_DEVICE_POLICY)
  })
})

describe("grant helpers", () => {
  test("toManagedGrantTypes keeps managed grants in form order", () => {
    expect(toManagedGrantTypes(["client_credentials", GRANT_TYPE_REFRESH_TOKEN, GRANT_TYPE_AUTHORIZATION_CODE]))
      .toEqual([GRANT_TYPE_AUTHORIZATION_CODE, GRANT_TYPE_REFRESH_TOKEN])
  })

  test("canAllowDeviceWrite needs a public device client with game-data:write", () => {
    const eligible = { clientType: "public" as const, grantTypes: [GRANT_TYPE_DEVICE_CODE], scopes: ["user:read", "game-data:write"] }
    expect(canAllowDeviceWrite(eligible)).toBe(true)
    expect(canAllowDeviceWrite({ ...eligible, clientType: "confidential" })).toBe(false)
    expect(canAllowDeviceWrite({ ...eligible, grantTypes: [GRANT_TYPE_AUTHORIZATION_CODE] })).toBe(false)
    // station:room:write is a write scope too, but allowWrite only governs game-data:write.
    expect(canAllowDeviceWrite({ ...eligible, scopes: ["user:read", "station:room:write"] })).toBe(false)
  })

  test("firstParty applies to confidential clients", () => {
    expect(isFirstPartyApplicable("confidential")).toBe(true)
    expect(isFirstPartyApplicable("public")).toBe(false)
  })

  test("isValidMaxCodesPer10m", () => {
    expect([1, 60, 600].every(isValidMaxCodesPer10m)).toBe(true)
    expect([0, 601, 2.5, Number.NaN].some(isValidMaxCodesPer10m)).toBe(false)
  })
})
