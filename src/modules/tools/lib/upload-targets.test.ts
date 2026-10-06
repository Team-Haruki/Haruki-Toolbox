import { describe, expect, test } from "bun:test"
import {
  buildFallbackUploadTargetAccounts,
  buildUploadTargetAccounts,
  pickUploadTargetKey,
  pickWritableDataType,
} from "./upload-targets"
import type { AccessibleGameAccount } from "@/shared/sekai/user-snapshot/accessible-accounts"

function account(overrides: Partial<AccessibleGameAccount>): AccessibleGameAccount {
  return {
    server: "jp",
    gameUserId: "1",
    ownership: "own",
    verified: true,
    isDefault: false,
    capabilities: {},
    writeCapabilities: {},
    owner: null,
    ...overrides,
  }
}

describe("buildUploadTargetAccounts", () => {
  test("derives writability from writeCapabilities only", () => {
    const targets = buildUploadTargetAccounts([
      account({ gameUserId: "111", isDefault: true, writeCapabilities: { suite: { expiresAt: null }, mysekai: { expiresAt: null } } }),
      // Unverified own binding: listed, but nothing is writable.
      account({ server: "en", gameUserId: "222", verified: false }),
      // Write grant on suite only; owner is null in the write listing.
      account({ gameUserId: "987654321987654321", ownership: "granted", writeCapabilities: { suite: { expiresAt: "2026-11-01T00:00:00Z" } } }),
      // Unknown capability names (profile/recommend) never make an account uploadable.
      account({ server: "kr", gameUserId: "333", ownership: "granted", writeCapabilities: { profile: { expiresAt: null } } }),
    ])

    expect(targets.map((target) => target.key)).toEqual(["jp:111", "en:222", "grant:jp:987654321987654321", "grant:kr:333"])
    expect(targets[0]).toMatchObject({ canUpload: true, isDefault: true, ownership: "own" })
    expect([...targets[0]!.writable]).toEqual(["suite", "mysekai"])
    expect(targets[1]).toMatchObject({ canUpload: false, verified: false })
    expect(targets[2]).toMatchObject({ canUpload: true, ownership: "granted", uid: "987654321987654321" })
    expect([...targets[2]!.writable]).toEqual(["suite"])
    expect(targets[3]?.canUpload).toBe(false)
  })

  test("fallback marks only verified own bindings uploadable", () => {
    const targets = buildFallbackUploadTargetAccounts([
      { server: "jp", userId: 111, verified: true, isDefault: true },
      { server: "en", userId: 222, verified: false },
    ])
    expect(targets[0]).toMatchObject({ key: "jp:111", canUpload: true, uid: "111" })
    expect([...targets[0]!.writable]).toEqual(["suite", "mysekai"])
    expect(targets[1]).toMatchObject({ key: "en:222", canUpload: false })
  })
})

describe("pickUploadTargetKey", () => {
  const targets = buildUploadTargetAccounts([
    account({ gameUserId: "111", isDefault: true, writeCapabilities: { suite: { expiresAt: null } } }),
    account({ gameUserId: "222", writeCapabilities: { suite: { expiresAt: null } } }),
    account({ gameUserId: "333", ownership: "granted", writeCapabilities: { mysekai: { expiresAt: null } } }),
  ])

  test("keeps a valid current selection", () => {
    expect(pickUploadTargetKey(targets, "grant:jp:333")).toBe("grant:jp:333")
  })

  test("falls back to own default, then first uploadable", () => {
    expect(pickUploadTargetKey(targets, null)).toBe("jp:111")
    expect(pickUploadTargetKey(targets, "jp:999")).toBe("jp:111")
    expect(pickUploadTargetKey(targets.slice(2), "jp:111")).toBe("grant:jp:333")
    expect(pickUploadTargetKey(buildUploadTargetAccounts([account({ verified: false })]), null)).toBeNull()
  })
})

describe("pickWritableDataType", () => {
  const suiteOnly = buildUploadTargetAccounts([account({ writeCapabilities: { suite: { expiresAt: null } } })])[0]!
  const both = buildUploadTargetAccounts([account({ writeCapabilities: { suite: { expiresAt: null }, mysekai: { expiresAt: null } } })])[0]!

  test("keeps the preferred type when writable and allowed", () => {
    expect(pickWritableDataType(both, "mysekai", () => true)).toBe("mysekai")
  })

  test("switches away from a type the account cannot receive", () => {
    expect(pickWritableDataType(suiteOnly, "mysekai", () => true)).toBe("suite")
    expect(pickWritableDataType(both, "mysekai", (type) => type !== "mysekai")).toBe("suite")
    expect(pickWritableDataType(suiteOnly, "suite", () => false)).toBeNull()
    expect(pickWritableDataType(null, "suite", () => true)).toBeNull()
  })
})
