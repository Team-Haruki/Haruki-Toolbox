import type { SponsorCategory, SponsorSupporter } from "@/modules/sponsor/types"

export const SPONSOR_CATEGORIES: readonly SponsorCategory[] = ["current", "former"]

function isSponsorCategory(value: unknown): value is SponsorCategory {
  return typeof value === "string" && (SPONSOR_CATEGORIES as readonly string[]).includes(value)
}

/**
 * The backend decides the category (当前赞助 / 曾经赞助) and sends it as
 * `category`; the page only reads it. Anything else (a missing field, or a
 * value from an older backend) falls back to the backend's own `isActive`.
 */
export function readSponsorCategory(value: unknown, fallback: { isActive: boolean }): SponsorCategory {
  if (isSponsorCategory(value)) {
    return value
  }
  return fallback.isActive ? "current" : "former"
}

/** Splits supporters by category, keeping the backend's order (tier, then expiry). */
export function groupSponsorsByCategory(supporters: readonly SponsorSupporter[]): Record<SponsorCategory, SponsorSupporter[]> {
  const groups: Record<SponsorCategory, SponsorSupporter[]> = { current: [], former: [] }
  for (const supporter of supporters) {
    groups[supporter.category].push(supporter)
  }
  return groups
}

export type SponsorStatus =
  | { key: "activeUntil" | "expiredAt", date: string }
  | { key: "active" | "pastPlan" }

/**
 * The status line under a supporter, from the category and the effective
 * expiry. A former supporter without any expiry supported once without time.
 */
export function sponsorStatus(sponsor: SponsorSupporter): SponsorStatus {
  if (sponsor.category === "current") {
    return sponsor.planExpiresAt ? { key: "activeUntil", date: sponsor.planExpiresAt } : { key: "active" }
  }
  return sponsor.planExpiresAt ? { key: "expiredAt", date: sponsor.planExpiresAt } : { key: "pastPlan" }
}

export type SponsorPlanGroup = {
  /** The plan's name; empty for supporters whose plan the backend did not name. */
  planName: string
  supporters: SponsorSupporter[]
}

/**
 * Supporters gathered into runs of the same plan. The backend's order (tier,
 * then expiry) is kept exactly: a plan whose supporters are not adjacent, as
 * with custom amounts that rank between two fixed tiers, shows up as more
 * than one group rather than being pulled together and reordered.
 */
export function groupSponsorsByPlan(supporters: readonly SponsorSupporter[]): SponsorPlanGroup[] {
  const groups: SponsorPlanGroup[] = []
  for (const supporter of supporters) {
    const last = groups[groups.length - 1]
    if (last && last.planName === supporter.planName) {
      last.supporters.push(supporter)
    } else {
      groups.push({ planName: supporter.planName, supporters: [supporter] })
    }
  }
  return groups
}
