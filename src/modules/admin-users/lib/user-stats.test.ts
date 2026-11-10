import { describe, expect, it } from "bun:test"
import {
  buildDirectoryStats,
  buildRegistrationTrend,
  countSharingSwitches,
  describeListedActivity,
  formatSharePercent,
  mergeUserDetailCounts,
  readDirectoryCounts,
  readUserActivityWindow,
  readUserDetailCounts,
  resolveOAuthAuthorizationState,
  summarizeOAuthAuthorizations,
  summarizeUserPage,
} from "./user-stats"

describe("readDirectoryCounts", () => {
  it("reads the four user counters of the dashboard payload", () => {
    expect(readDirectoryCounts({ users: { total: 51234, banned: 12, admin: 3, superAdmin: 1 }, uploads: {} }))
      .toEqual({ total: 51234, banned: 12, admin: 3, superAdmin: 1 })
  })

  it("rejects a payload that misses a counter or carries a bad one", () => {
    expect(readDirectoryCounts(null)).toBeNull()
    expect(readDirectoryCounts({ users: { total: 5, banned: 1, admin: 1 } })).toBeNull()
    expect(readDirectoryCounts({ users: { total: "5", banned: 1, admin: 1, superAdmin: 0 } })).toBeNull()
    expect(readDirectoryCounts({ users: { total: -1, banned: 1, admin: 1, superAdmin: 0 } })).toBeNull()
  })
})

describe("buildDirectoryStats", () => {
  it("derives the staff, regular users and banned share", () => {
    expect(buildDirectoryStats({ total: 200, banned: 5, admin: 3, superAdmin: 1 })).toEqual({
      total: 200,
      banned: 5,
      admin: 3,
      superAdmin: 1,
      staff: 4,
      regular: 196,
      bannedPercent: 2.5,
    })
  })

  it("never reports negative regular users or a share of nothing", () => {
    const stats = buildDirectoryStats({ total: 0, banned: 0, admin: 1, superAdmin: 1 })
    expect(stats.regular).toBe(0)
    expect(stats.bannedPercent).toBe(0)
  })
})

describe("buildRegistrationTrend", () => {
  it("keeps the order of the points and sums them", () => {
    expect(buildRegistrationTrend([{ registrations: 4 }, { registrations: 0 }, { registrations: 11 }]))
      .toEqual({ series: [4, 0, 11], total: 15 })
  })

  it("counts unusable points as zero and tolerates a missing list", () => {
    expect(buildRegistrationTrend([{ registrations: -2 }, {}, null, { registrations: 3 }]))
      .toEqual({ series: [0, 0, 0, 3], total: 3 })
    expect(buildRegistrationTrend(undefined)).toEqual({ series: [], total: 0 })
  })
})

describe("summarizeUserPage", () => {
  it("counts staff, banned and CN-allowed rows of the page", () => {
    expect(summarizeUserPage([
      { role: "user", banned: false, allowCNMysekai: true },
      { role: "admin", banned: false },
      { role: "super_admin", banned: true, allowCNMysekai: true },
      { role: "user", banned: true, allowCNMysekai: false },
    ])).toEqual({ count: 4, staff: 2, banned: 2, allowCN: 2 })
  })

  it("is all zeros for an empty page", () => {
    expect(summarizeUserPage([])).toEqual({ count: 0, staff: 0, banned: 0, allowCN: 0 })
  })
})

describe("formatSharePercent", () => {
  it("keeps one decimal and drops it at the ends", () => {
    expect(formatSharePercent(12.34, "en-US")).toBe("12.3%")
    expect(formatSharePercent(50, "en-US")).toBe("50%")
    expect(formatSharePercent(0)).toBe("0%")
    expect(formatSharePercent(100)).toBe("100%")
    expect(formatSharePercent(140)).toBe("100%")
  })

  it("does not round a small non-zero share down to zero", () => {
    expect(formatSharePercent(0.023)).toBe("<0.1%")
  })

  it("treats an invalid share as nothing", () => {
    expect(formatSharePercent(Number.NaN)).toBe("0%")
    expect(formatSharePercent(-3)).toBe("0%")
  })
})

describe("readUserDetailCounts", () => {
  it("counts what the detail payload lists", () => {
    expect(readUserDetailCounts({
      userData: {
        gameAccountBindings: [{ verified: true }, { verified: false }, { verified: true }],
        authorizeSocialPlatformInfo: [{ platformId: 1 }],
        socialPlatformInfo: { platform: "qq", userId: "1", verified: true },
      },
    })).toEqual({ gameBindings: 3, verifiedGameBindings: 2, authorizedSocials: 1, socialPlatform: "qq" })
  })

  it("says nothing about lists the payload omits", () => {
    expect(readUserDetailCounts({ userData: { userId: "1" } }))
      .toEqual({ gameBindings: null, verifiedGameBindings: null, authorizedSocials: null, socialPlatform: null })
    expect(readUserDetailCounts(null).gameBindings).toBeNull()
  })
})

describe("mergeUserDetailCounts", () => {
  const detail = { gameBindings: 3, verifiedGameBindings: 2, authorizedSocials: 1, socialPlatform: "qq" }

  it("keeps the detail payload's counts until a section has loaded", () => {
    expect(mergeUserDetailCounts(detail, { gameBindings: null, authorizedSocials: null, socialPlatform: undefined }))
      .toEqual(detail)
  })

  it("counts the loaded lists instead", () => {
    expect(mergeUserDetailCounts(detail, {
      gameBindings: [{ verified: true }, { verified: false }, { verified: true }, { verified: true }],
      authorizedSocials: [],
      socialPlatform: null,
    })).toEqual({ gameBindings: 4, verifiedGameBindings: 3, authorizedSocials: 0, socialPlatform: null })
  })

  it("does not guess the verified count when the list does not carry the flag", () => {
    const merged = mergeUserDetailCounts(detail, {
      gameBindings: [{ verified: true }, {}],
      authorizedSocials: null,
      socialPlatform: { platform: "discord" },
    })
    expect(merged.gameBindings).toBe(2)
    expect(merged.verifiedGameBindings).toBeNull()
    expect(merged.socialPlatform).toBe("discord")
  })
})

describe("readUserActivityWindow", () => {
  it("reads the window and derives the upload success share", () => {
    expect(readUserActivityWindow({
      activitySummary: {
        windowHours: 24,
        systemLogTotal: 7,
        uploadLogTotal: 8,
        uploadSuccess: 6,
        uploadFailure: 2,
        lastSystemLog: "2026-11-09T10:00:00Z",
      },
    })).toEqual({
      windowHours: 24,
      systemLogTotal: 7,
      uploadLogTotal: 8,
      uploadSuccess: 6,
      uploadFailure: 2,
      uploadSuccessPercent: 75,
      lastSystemLog: "2026-11-09T10:00:00Z",
      lastUploadLog: null,
    })
  })

  it("has no success share without uploads", () => {
    const summary = readUserActivityWindow({
      activitySummary: { windowHours: 24, systemLogTotal: 0, uploadLogTotal: 0, uploadSuccess: 0, uploadFailure: 0 },
    })
    expect(summary?.uploadSuccessPercent).toBeNull()
  })

  it("is null when the block is missing or incomplete", () => {
    expect(readUserActivityWindow({ userData: {} })).toBeNull()
    expect(readUserActivityWindow({ activitySummary: { windowHours: 24, systemLogTotal: 1 } })).toBeNull()
    expect(readUserActivityWindow({
      activitySummary: { windowHours: 0, systemLogTotal: 0, uploadLogTotal: 0, uploadSuccess: 0, uploadFailure: 0 },
    })).toBeNull()
  })
})

describe("countSharingSwitches", () => {
  it("counts the switches that are on", () => {
    expect(countSharingSwitches({ allowPublicApi: false, allowSakura: true, allow8823: true })).toEqual({ on: 2, total: 3 })
  })

  it("is null without settings", () => {
    expect(countSharingSwitches(null)).toBeNull()
    expect(countSharingSwitches(undefined)).toBeNull()
  })
})

describe("OAuth authorization state", () => {
  it("puts revoked before a disabled client", () => {
    expect(resolveOAuthAuthorizationState({ revoked: true, clientActive: false })).toBe("revoked")
    expect(resolveOAuthAuthorizationState({ clientActive: false })).toBe("clientDisabled")
    expect(resolveOAuthAuthorizationState({})).toBe("active")
  })

  it("counts the list per state", () => {
    expect(summarizeOAuthAuthorizations([{}, { revoked: true }, { clientActive: false }, { clientActive: true }]))
      .toEqual({ active: 2, revoked: 1, clientDisabled: 1 })
  })
})

describe("describeListedActivity", () => {
  it("flags a list shorter than the window total", () => {
    expect(describeListedActivity(50, 180)).toEqual({ listed: 50, total: 180, truncated: true })
    expect(describeListedActivity(7, 7)).toEqual({ listed: 7, total: 7, truncated: false })
  })

  it("falls back to the listed rows without a usable total", () => {
    expect(describeListedActivity(3, undefined)).toEqual({ listed: 3, total: 3, truncated: false })
    expect(describeListedActivity(3, 1)).toEqual({ listed: 3, total: 3, truncated: false })
  })
})
