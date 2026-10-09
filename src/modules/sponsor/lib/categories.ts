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
