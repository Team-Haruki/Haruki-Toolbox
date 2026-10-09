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
    expect(readSponsorCategory("former", { isActive: true })).toBe("former")
    expect(readSponsorCategory("current", { isActive: false })).toBe("current")
  })

  it("falls back to the backend isActive flag for anything else", () => {
    expect(readSponsorCategory(undefined, { isActive: true })).toBe("current")
    expect(readSponsorCategory("bogus", { isActive: false })).toBe("former")
    // An older backend's one-time sponsor is a former supporter.
    expect(readSponsorCategory("one_time", { isActive: false })).toBe("former")
  })

  it("groups supporters without reordering them", () => {
    const groups = groupSponsorsByCategory([
      supporter("a", "current"),
      supporter("b", "former"),
      supporter("c", "current"),
    ])
    expect(groups.current.map((s) => s.id)).toEqual(["a", "c"])
    expect(groups.former.map((s) => s.id)).toEqual(["b"])
    expect(Object.keys(groups)).toEqual(["current", "former"])
  })

  it("derives the status line from category and effective expiry", () => {
    expect(sponsorStatus(supporter("a", "current", "2027-01-01T00:00:00Z"))).toEqual({ key: "activeUntil", date: "2027-01-01T00:00:00Z" })
    expect(sponsorStatus(supporter("b", "former", "2026-01-01T00:00:00Z"))).toEqual({ key: "expiredAt", date: "2026-01-01T00:00:00Z" })
    expect(sponsorStatus(supporter("c", "former"))).toEqual({ key: "pastPlan" })
    expect(sponsorStatus(supporter("e", "current"))).toEqual({ key: "active" })
  })
})
