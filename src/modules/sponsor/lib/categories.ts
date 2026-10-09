import type { SponsorCategory, SponsorSupporter } from "@/modules/sponsor/types"

export const SPONSOR_CATEGORIES: readonly SponsorCategory[] = ["current", "former", "one_time"]

function isSponsorCategory(value: unknown): value is SponsorCategory {
  return typeof value === "string" && (SPONSOR_CATEGORIES as readonly string[]).includes(value)
}

/**
 * The backend decides the category (当前 / 曾经 / 一次性赞助) and sends it as
 * `category`; the page only reads it. The fallback exists for a backend that
 * predates the field and uses nothing but the backend's own `isActive`.
 */
export function readSponsorCategory(
  value: unknown,
  fallback: { isActive: boolean, planExpiresAt: string },
): SponsorCategory {
  if (isSponsorCategory(value)) {
    return value
  }
  if (fallback.isActive) {
    return "current"
  }
  return fallback.planExpiresAt ? "former" : "one_time"
}

/** Splits supporters by category, keeping the backend's order (tier, then expiry). */
export function groupSponsorsByCategory(supporters: readonly SponsorSupporter[]): Record<SponsorCategory, SponsorSupporter[]> {
  const groups: Record<SponsorCategory, SponsorSupporter[]> = { current: [], former: [], one_time: [] }
  for (const supporter of supporters) {
    groups[supporter.category].push(supporter)
  }
  return groups
}

export type SponsorStatus =
  | { key: "activeUntil" | "expiredAt", date: string }
  | { key: "active" | "expired" | "oneTime" }

/** The status line under a supporter, from the category and the effective expiry. */
export function sponsorStatus(sponsor: SponsorSupporter): SponsorStatus {
  switch (sponsor.category) {
    case "current":
      return sponsor.planExpiresAt ? { key: "activeUntil", date: sponsor.planExpiresAt } : { key: "active" }
    case "former":
      return sponsor.planExpiresAt ? { key: "expiredAt", date: sponsor.planExpiresAt } : { key: "expired" }
    default:
      return { key: "oneTime" }
  }
}
