import { describe, expect, test } from "bun:test"
import type { OAuthAuthorization } from "@/modules/user-settings/api/oauth2"
import {
  deviceAuthorizationLabel,
  groupOAuthAuthorizations,
  isDeviceAuthorization,
  oauthAuthorizationKey,
  type OAuthAuthorizationGroup,
} from "./oauth-authorizations"

describe("oauthAuthorizationKey", () => {
  test("keys rows by consent request id", () => {
    expect(oauthAuthorizationKey({ clientId: "client-a", consentRequestId: "consent-1" }, 0)).toBe("consent-1")
  })

  test("gives two consents of the same client distinct keys", () => {
    const rows = [
      { clientId: "client-a", consentRequestId: "consent-1" },
      { clientId: "client-a", consentRequestId: "consent-2" },
    ]

    const keys = rows.map((row, index) => oauthAuthorizationKey(row, index))
    expect(keys).toEqual(["consent-1", "consent-2"])
  })

  test("falls back to client id and position when the id is missing or blank", () => {
    const rows = [
      { clientId: "client-a" },
      { clientId: "client-a", consentRequestId: "" },
      { clientId: "client-a", consentRequestId: "   " },
    ]

    const keys = rows.map((row, index) => oauthAuthorizationKey(row, index))
    expect(keys).toEqual(["client-a#0", "client-a#1", "client-a#2"])
    expect(new Set(keys).size).toBe(rows.length)
  })
})

function grant(overrides: Partial<OAuthAuthorization> & { consentRequestId: string }): OAuthAuthorization {
  return {
    clientId: "client-a",
    clientName: "Client A",
    clientType: "public",
    scopes: ["user:read"],
    createdAt: "2026-10-01T00:00:00Z",
    flowType: "browser",
    deviceLabel: "",
    ...overrides,
  }
}

function summary(groups: OAuthAuthorizationGroup[]) {
  return groups.map((group) => ({
    clientId: group.clientId,
    browser: group.browserGrants.map((row) => row.key),
    devices: group.deviceGrants.map((row) => row.key),
  }))
}

describe("groupOAuthAuthorizations", () => {
  test("puts every grant of a client in one group, devices on their own rows", () => {
    const groups = groupOAuthAuthorizations([
      grant({ consentRequestId: "b1" }),
      grant({ consentRequestId: "d1", flowType: "device", deviceLabel: "NAS", createdAt: "2026-10-03T00:00:00Z" }),
      grant({ consentRequestId: "d2", flowType: "device", deviceLabel: "Laptop", createdAt: "2026-10-05T00:00:00Z" }),
    ])

    expect(summary(groups)).toEqual([{ clientId: "client-a", browser: ["b1"], devices: ["d2", "d1"] }])
    expect(groups[0]?.clientName).toBe("Client A")
    expect(groups[0]?.deviceGrants[0]?.authorization.deviceLabel).toBe("Laptop")
  })

  test("orders groups by their newest grant and keeps ties in backend order", () => {
    const groups = groupOAuthAuthorizations([
      grant({ consentRequestId: "a1", createdAt: "2026-10-01T00:00:00Z" }),
      grant({ consentRequestId: "b1", clientId: "client-b", createdAt: "2026-10-02T00:00:00Z" }),
      grant({ consentRequestId: "c1", clientId: "client-c", flowType: "device", createdAt: "2026-10-04T00:00:00Z" }),
      grant({ consentRequestId: "a2", flowType: "device", createdAt: "2026-10-03T00:00:00Z" }),
      grant({ consentRequestId: "d1", clientId: "client-d", createdAt: "2026-10-02T00:00:00Z" }),
    ])

    expect(groups.map((group) => group.clientId)).toEqual(["client-c", "client-a", "client-b", "client-d"])
  })

  test("reads a missing or unknown flowType as a browser grant", () => {
    const groups = groupOAuthAuthorizations([
      grant({ consentRequestId: "b1", flowType: undefined }),
      grant({ consentRequestId: "b2", flowType: "something-new" }),
      grant({ consentRequestId: "d1", flowType: "device" }),
    ])

    expect(summary(groups)).toEqual([{ clientId: "client-a", browser: ["b1", "b2"], devices: ["d1"] }])
    expect(isDeviceAuthorization({ flowType: "device" })).toBe(true)
    expect(isDeviceAuthorization({})).toBe(false)
  })

  test("keys rows by the backend's list position, not the grouped order", () => {
    const groups = groupOAuthAuthorizations([
      grant({ consentRequestId: "", flowType: "device", createdAt: "2026-10-01T00:00:00Z" }),
      grant({ consentRequestId: "", flowType: "device", createdAt: "2026-10-02T00:00:00Z" }),
    ])

    expect(summary(groups)).toEqual([{ clientId: "client-a", browser: [], devices: ["client-a#1", "client-a#0"] }])
  })

  test("puts grants without a date last and falls back to the client id for the name", () => {
    const groups = groupOAuthAuthorizations([
      grant({ consentRequestId: "x1", clientId: "client-x", clientName: "  ", createdAt: "" }),
      grant({ consentRequestId: "y1", clientId: "client-y", createdAt: "2026-10-01T00:00:00Z" }),
      grant({ consentRequestId: "y2", clientId: "client-y", createdAt: "" }),
    ])

    expect(summary(groups)).toEqual([
      { clientId: "client-y", browser: ["y1", "y2"], devices: [] },
      { clientId: "client-x", browser: ["x1"], devices: [] },
    ])
    expect(groups[1]?.clientName).toBe("client-x")
  })

  test("returns no groups for an empty list", () => {
    expect(groupOAuthAuthorizations([])).toEqual([])
  })
})

describe("deviceAuthorizationLabel", () => {
  test("trims the label and reads a missing one as unnamed", () => {
    expect(deviceAuthorizationLabel({ deviceLabel: "  NAS  " })).toBe("NAS")
    expect(deviceAuthorizationLabel({ deviceLabel: "" })).toBe("")
    expect(deviceAuthorizationLabel({})).toBe("")
  })
})
