import type { AdminSponsorCategory, AdminSponsorProfile } from "@/types/admin"

/**
 * The figures behind the sponsor page's stat panel. Everything here is
 * computed from the sponsor list the backend returns in one piece
 * (`GET /api/admin/sponsors` is not paged), so each number covers every
 * sponsor, not a page of them.
 */

const DAY_MS = 86_400_000

export type SponsorOverview = {
  total: number
  current: number
  former: number
  /** Sponsors whose Afdian account is linked to a Toolbox user. */
  bound: number
  /** Profiles the Afdian sync leaves alone. */
  manualProfile: number
  /** Rows that still carry the legacy single expiry. */
  migrationPending: number
  /** Sum of the recorded amounts; sponsors without one are left out. */
  amountTotal: number
  /** How many sponsors carry an amount. */
  amountCount: number
}

export function summarizeSponsors(sponsors: readonly AdminSponsorProfile[]): SponsorOverview {
  const overview: SponsorOverview = {
    total: sponsors.length,
    current: 0,
    former: 0,
    bound: 0,
    manualProfile: 0,
    migrationPending: 0,
    amountTotal: 0,
    amountCount: 0,
  }
  for (const sponsor of sponsors) {
    if (sponsor.category === "current") {
      overview.current += 1
    } else {
      overview.former += 1
    }
    if (sponsor.toolboxBound) overview.bound += 1
    if (sponsor.afdianSyncDisabled) overview.manualProfile += 1
    if (sponsor.durationMigrationPending) overview.migrationPending += 1
    if (sponsor.totalAmount !== null && Number.isFinite(sponsor.totalAmount)) {
      overview.amountTotal += sponsor.totalAmount
      overview.amountCount += 1
    }
  }
  // Cents add up to float noise (0.1 + 0.2); the amounts have two decimals at most.
  overview.amountTotal = Math.round(overview.amountTotal * 100) / 100
  return overview
}

export type SponsorCount = {
  /** The raw value; empty for sponsors without one. */
  key: string
  count: number
}

function countBy(sponsors: readonly AdminSponsorProfile[], read: (sponsor: AdminSponsorProfile) => string): SponsorCount[] {
  const counts = new Map<string, number>()
  for (const sponsor of sponsors) {
    const key = read(sponsor).trim()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    // Largest first; ties in a stable alphabetical order, the unnamed bucket last.
    .sort((a, b) => b.count - a.count || Number(a.key === "") - Number(b.key === "") || a.key.localeCompare(b.key))
}

/** Sponsors per `source` (afdian, manual, legacy, imported), largest first. */
export function countSponsorsBySource(sponsors: readonly AdminSponsorProfile[]): SponsorCount[] {
  return countBy(sponsors, (sponsor) => sponsor.source.toLowerCase())
}

export type SponsorPlanBreakdown = {
  /** The `limit` most common plan names, largest first. */
  top: SponsorCount[]
  /** Sponsors on every other plan, folded into one figure. */
  otherCount: number
  /** How many plans that figure covers. */
  otherPlans: number
}

/** Sponsors per plan name; the long tail beyond `limit` is folded together. */
export function countSponsorsByPlan(sponsors: readonly AdminSponsorProfile[], limit = 5): SponsorPlanBreakdown {
  const all = countBy(sponsors, (sponsor) => sponsor.planName)
  const top = all.slice(0, Math.max(0, limit))
  const rest = all.slice(top.length)
  return {
    top,
    otherCount: rest.reduce((sum, entry) => sum + entry.count, 0),
    otherPlans: rest.length,
  }
}

export type SponsorExpiryBucket = "within7" | "within30" | "within90" | "later" | "none"

export const SPONSOR_EXPIRY_BUCKETS: readonly SponsorExpiryBucket[] = ["within7", "within30", "within90", "later", "none"]

/**
 * When the current sponsors run out, by their effective expiry: within a
 * week, a month, a quarter, later, or without an expiry at all. An expiry
 * that already passed (the backend still calls the sponsor current) counts
 * as within a week. Former sponsors are not counted.
 */
export function bucketSponsorExpiries(
  sponsors: readonly AdminSponsorProfile[],
  now: number,
): Record<SponsorExpiryBucket, number> {
  const buckets: Record<SponsorExpiryBucket, number> = { within7: 0, within30: 0, within90: 0, later: 0, none: 0 }
  for (const sponsor of sponsors) {
    if (sponsor.category !== "current") continue
    const expiresAt = sponsor.planExpiresAt ? new Date(sponsor.planExpiresAt).valueOf() : Number.NaN
    if (!Number.isFinite(expiresAt)) {
      buckets.none += 1
      continue
    }
    const days = (expiresAt - now) / DAY_MS
    if (days <= 7) buckets.within7 += 1
    else if (days <= 30) buckets.within30 += 1
    else if (days <= 90) buckets.within90 += 1
    else buckets.later += 1
  }
  return buckets
}

/**
 * Sponsor records created in each of the last `months` calendar months (UTC),
 * oldest first, the month of `now` last. Rows without a creation time are
 * left out.
 */
export function monthlyNewSponsors(sponsors: readonly AdminSponsorProfile[], now: number, months = 12): number[] {
  const span = Math.max(1, Math.trunc(months))
  const counts = new Array<number>(span).fill(0)
  const anchor = new Date(now)
  if (Number.isNaN(anchor.valueOf())) return counts
  const anchorIndex = anchor.getUTCFullYear() * 12 + anchor.getUTCMonth()
  for (const sponsor of sponsors) {
    const created = sponsor.createdAt ? new Date(sponsor.createdAt) : null
    if (!created || Number.isNaN(created.valueOf())) continue
    const offset = anchorIndex - (created.getUTCFullYear() * 12 + created.getUTCMonth())
    if (offset >= 0 && offset < span) {
      counts[span - 1 - offset]! += 1
    }
  }
  return counts
}

export type SponsorListFilter = {
  /** Matched against the name, id, plan and source, ignoring case. */
  query: string
  category: AdminSponsorCategory | "all"
}

/** The sponsors a search box and a category filter leave, in the backend's order. */
export function filterSponsors(sponsors: readonly AdminSponsorProfile[], filter: SponsorListFilter): AdminSponsorProfile[] {
  const needle = filter.query.trim().toLowerCase()
  return sponsors.filter((sponsor) => {
    if (filter.category !== "all" && sponsor.category !== filter.category) return false
    if (!needle) return true
    return [sponsor.name, sponsor.id, sponsor.planName, sponsor.source]
      .some((value) => value.toLowerCase().includes(needle))
  })
}

/** How many pages `total` rows take; at least one, so an empty list still has a page 1. */
export function pageCount(total: number, pageSize: number): number {
  if (!Number.isFinite(total) || !Number.isFinite(pageSize) || pageSize <= 0) return 1
  return Math.max(1, Math.ceil(total / pageSize))
}

/** The rows of `page` (1-based), with the page clamped into range. */
export function pageSlice<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const pages = pageCount(items.length, pageSize)
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages)
  return items.slice((current - 1) * pageSize, current * pageSize)
}

/** A recorded amount as money: grouped, two decimals at most, none for whole yuan. */
export function formatSponsorAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(amount)
}
