import { describe, expect, it } from "bun:test"
import { isSoftDeletedUser, withSoftDeleteFlag } from "./soft-delete"

describe("admin user soft delete", () => {
  it("treats a ban with the soft-delete reason as deleted", () => {
    expect(isSoftDeletedUser({ banned: true, banReason: "[soft_deleted]" })).toBe(true)
    expect(isSoftDeletedUser({ banned: true, banReason: "[soft_deleted] spam" })).toBe(true)
  })

  it("does not treat other bans or unbanned users as deleted", () => {
    expect(isSoftDeletedUser({ banned: true, banReason: "spam" })).toBe(false)
    expect(isSoftDeletedUser({ banned: true })).toBe(false)
    expect(isSoftDeletedUser({ banned: false, banReason: "[soft_deleted]" })).toBe(false)
  })

  it("adds the flag without dropping fields", () => {
    expect(withSoftDeleteFlag({ userId: "1", banned: true, banReason: "[soft_deleted]" }))
      .toEqual({ userId: "1", banned: true, banReason: "[soft_deleted]", deleted: true })
  })
})
