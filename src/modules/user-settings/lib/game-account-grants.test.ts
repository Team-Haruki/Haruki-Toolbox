import { describe, expect, test } from "bun:test"
import {
  buildGrantPermissions,
  canGrantWrite,
  isFutureIsoDateTime,
  isGrantDataType,
  normalizeGameAccountDataGrant,
  normalizeGrantDataType,
  normalizeGrantPermissions,
  readGameAccountDataGrantMutation,
} from "./game-account-grants"

describe("game account data grant helpers", () => {
  test("validates supported data types", () => {
    expect(isGrantDataType("suite")).toBe(true)
    expect(isGrantDataType("mysekai")).toBe(true)
    expect(isGrantDataType("profile")).toBe(true)
    // recommend is a capability derived from suite, never grantable itself.
    expect(isGrantDataType("recommend")).toBe(false)
    expect(normalizeGrantDataType("profile")).toBe("profile")
    expect(normalizeGrantDataType("recommend")).toBe("suite")
  })

  test("normalizes backend grant fields", () => {
    expect(normalizeGameAccountDataGrant({
      id: 12,
      owner_user_id: "owner",
      grantee_user_id: "grantee",
      server: "en",
      game_user_id: "123456",
      data_type: "mysekai",
      permissions: ["write", "read", "write"],
      expires_at: "2026-07-01T00:00:00Z",
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-02T00:00:00Z",
    })).toEqual({
      id: 12,
      ownerUserId: "owner",
      granteeUserId: "grantee",
      server: "en",
      gameUserId: "123456",
      dataType: "mysekai",
      permissions: ["read", "write"],
      expiresAt: "2026-07-01T00:00:00Z",
      createdAt: "2026-06-01T00:00:00Z",
      updatedAt: "2026-06-02T00:00:00Z",
    })
  })

  test("legacy grants without permissions are read-only", () => {
    expect(normalizeGameAccountDataGrant({ id: 1, server: "jp", gameUserId: "1" }).permissions).toEqual(["read"])
    expect(normalizeGrantPermissions(undefined)).toEqual(["read"])
    expect(normalizeGrantPermissions([])).toEqual(["read"])
    expect(normalizeGrantPermissions(["bogus"])).toEqual(["read"])
    expect(normalizeGrantPermissions(["write"])).toEqual(["write"])
    expect(normalizeGrantPermissions(["write", "read"])).toEqual(["read", "write"])
  })

  test("builds permission arrays in canonical order and blocks profile write", () => {
    expect(buildGrantPermissions(true, false)).toEqual(["read"])
    expect(buildGrantPermissions(false, true)).toEqual(["write"])
    expect(buildGrantPermissions(true, true)).toEqual(["read", "write"])
    expect(buildGrantPermissions(false, false)).toEqual([])
    expect(canGrantWrite("suite")).toBe(true)
    expect(canGrantWrite("mysekai")).toBe(true)
    expect(canGrantWrite("profile")).toBe(false)
  })

  test("reads mutation wrapper", () => {
    expect(readGameAccountDataGrantMutation({
      grant: {
        id: 1,
        ownerUserId: "owner",
        granteeUserId: "grantee",
        server: "jp",
        gameUserId: "123",
        dataType: "suite",
        expiresAt: "2026-07-01T00:00:00Z",
        createdAt: "2026-06-01T00:00:00Z",
        updatedAt: "2026-06-01T00:00:00Z",
      },
    }).granteeUserId).toBe("grantee")
  })

  test("requires future expiry", () => {
    const now = new Date("2026-06-10T00:00:00Z")
    expect(isFutureIsoDateTime("2026-06-11T00:00:00Z", now)).toBe(true)
    expect(isFutureIsoDateTime("2026-06-09T00:00:00Z", now)).toBe(false)
    expect(isFutureIsoDateTime("not-a-date", now)).toBe(false)
  })
})
