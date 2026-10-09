import { describe, expect, it } from "bun:test"
import { groupSponsorsByCategory, readSponsorCategory, sponsorStatus } from "./categories"
import type { SponsorCategory, SponsorSupporter } from "@/modules/sponsor/types"

function supporter(id: string, category: SponsorCategory, planExpiresAt = ""): SponsorSupporter {
  return {
    id,
    name: id,
    avatar: "",
    planName: "",
    planPrice: null,
    planRank: null,
    planPayMonths: null,
    planExpiresAt,
    source: "afdian",
    category,
    isActive: category === "current",
    totalAmount: null,
    month: null,
    paidAt: "",
    message: "",
  }
}

describe("sponsor categories", () => {
  it("uses the backend category as is", () => {
    expect(readSponsorCategory("former", { isActive: true, planExpiresAt: "" })).toBe("former")
    expect(readSponsorCategory("one_time", { isActive: false, planExpiresAt: "2026-01-01T00:00:00Z" })).toBe("one_time")
  })

  it("falls back to the backend isActive flag when category is missing", () => {
    expect(readSponsorCategory(undefined, { isActive: true, planExpiresAt: "" })).toBe("current")
    expect(readSponsorCategory("bogus", { isActive: false, planExpiresAt: "2026-01-01T00:00:00Z" })).toBe("former")
    expect(readSponsorCategory(null, { isActive: false, planExpiresAt: "" })).toBe("one_time")
  })

  it("groups supporters without reordering them", () => {
    const groups = groupSponsorsByCategory([
      supporter("a", "current"),
      supporter("b", "former"),
      supporter("c", "current"),
      supporter("d", "one_time"),
    ])
    expect(groups.current.map((s) => s.id)).toEqual(["a", "c"])
    expect(groups.former.map((s) => s.id)).toEqual(["b"])
    expect(groups.one_time.map((s) => s.id)).toEqual(["d"])
  })

  it("never lists an expired duration sponsor as one-time", () => {
    // A lapsed plan used to arrive with the plan name 一次性赞助.
    const lapsed = { ...supporter("lapsed", "former", "2026-01-01T00:00:00Z"), planName: "一次性赞助" }
    const groups = groupSponsorsByCategory([lapsed])
    expect(groups.one_time).toHaveLength(0)
    expect(groups.former).toHaveLength(1)
  })

  it("derives the status line from category and effective expiry", () => {
    expect(sponsorStatus(supporter("a", "current", "2027-01-01T00:00:00Z"))).toEqual({ key: "activeUntil", date: "2027-01-01T00:00:00Z" })
    expect(sponsorStatus(supporter("b", "former", "2026-01-01T00:00:00Z"))).toEqual({ key: "expiredAt", date: "2026-01-01T00:00:00Z" })
    expect(sponsorStatus(supporter("c", "former"))).toEqual({ key: "expired" })
    expect(sponsorStatus(supporter("d", "one_time", "2026-01-01T00:00:00Z"))).toEqual({ key: "oneTime" })
    expect(sponsorStatus(supporter("e", "current"))).toEqual({ key: "active" })
  })
})
