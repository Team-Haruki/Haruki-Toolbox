import { describe, expect, it } from "bun:test"
import { isSoftDeletedUser, visibleBanReason, withSoftDeleteFlag } from "./soft-delete"

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

  it("shows a ban reason without the soft-delete marker", () => {
    expect(visibleBanReason({ banned: true, banReason: "spam" })).toBe("spam")
    expect(visibleBanReason({ banned: true, banReason: "[soft_deleted] left the project" })).toBe("left the project")
  })

  it("has no reason to show for a bare marker, an empty reason or an unbanned user", () => {
    expect(visibleBanReason({ banned: true, banReason: "[soft_deleted]" })).toBeNull()
    expect(visibleBanReason({ banned: true, banReason: "  " })).toBeNull()
    expect(visibleBanReason({ banned: true })).toBeNull()
    expect(visibleBanReason({ banned: false, banReason: "spam" })).toBeNull()
  })
})
