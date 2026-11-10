/**
 * The numbers behind the user list's stat panel and the user detail's stat
 * tiles. Pure, so every figure the pages show has a unit test; the pages only
 * format and label them. Each helper says which response it reads, because
 * the labels on screen promise a scope (whole site, current filter, this
 * page) and the code must keep that promise.
 */
import { asRecord } from "@/lib/record-utils"
import { sharePercent } from "@/modules/admin/lib/stat-visuals"

function readCount(record: Record<string, unknown> | null, key: string): number | null {
  const value = record?.[key]
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
}

function readText(record: Record<string, unknown> | null, key: string): string | null {
  const value = record?.[key]
  return typeof value === "string" && value.trim() !== "" ? value : null
}

// --- User list --------------------------------------------------------------

export type DirectoryCounts = {
  total: number
  banned: number
  admin: number
  superAdmin: number
}

/**
 * The `users` block of GET /api/admin/statistics/dashboard (every account on
 * the site), or null when the payload does not carry all four counters.
 */
export function readDirectoryCounts(payload: unknown): DirectoryCounts | null {
  const users = asRecord(asRecord(payload)?.users)
  const total = readCount(users, "total")
  const banned = readCount(users, "banned")
  const admin = readCount(users, "admin")
  const superAdmin = readCount(users, "superAdmin")
  if (total == null || banned == null || admin == null || superAdmin == null) {
    return null
  }
  return { total, banned, admin, superAdmin }
}

export type DirectoryStats = DirectoryCounts & {
  /** Admins and super admins together. */
  staff: number
  /** Accounts with the plain `user` role. */
  regular: number
  /** Banned accounts as a share of all accounts, 0–100. */
  bannedPercent: number
}

export function buildDirectoryStats(counts: DirectoryCounts): DirectoryStats {
  const staff = counts.admin + counts.superAdmin
  return {
    ...counts,
    staff,
    regular: Math.max(0, counts.total - staff),
    bannedPercent: sharePercent(counts.banned, counts.total),
  }
}

export type RegistrationTrend = {
  /** New accounts per bucket, oldest first. */
  series: number[]
  /** New accounts over the whole range. */
  total: number
}

/**
 * The `registrations` of GET /api/admin/statistics/timeseries `points`.
 * Anything that is not a non-negative number counts as zero; a payload
 * without points yields an empty trend.
 */
export function buildRegistrationTrend(points: unknown): RegistrationTrend {
  if (!Array.isArray(points)) {
    return { series: [], total: 0 }
  }
  const series = points.map((point) => readCount(asRecord(point), "registrations") ?? 0)
  return { series, total: series.reduce((sum, value) => sum + value, 0) }
}

export type UserPageSummary = {
  /** Rows on the page. */
  count: number
  /** Admins and super admins among them. */
  staff: number
  /** Banned rows, soft-deleted (legacy) ones included. */
  banned: number
  /** Rows allowed to use CN MySekai. */
  allowCN: number
}

/** Counts over the rows of the page on screen only; never a total. */
export function summarizeUserPage(
  users: ReadonlyArray<{ role: string; banned: boolean; allowCNMysekai?: boolean }>,
): UserPageSummary {
  const summary: UserPageSummary = { count: users.length, staff: 0, banned: 0, allowCN: 0 }
  for (const user of users) {
    if (user.role === "admin" || user.role === "super_admin") summary.staff += 1
    if (user.banned) summary.banned += 1
    if (user.allowCNMysekai === true) summary.allowCN += 1
  }
  return summary
}

/**
 * A share as text: one decimal, "<0.1%" for a non-zero share that would
 * round to zero (12 banned of 51,234 is not "0.0%"), "0%" and "100%" bare.
 */
export function formatSharePercent(percent: number, locale?: string): string {
  if (!Number.isFinite(percent) || percent <= 0) return "0%"
  if (percent >= 100) return "100%"
  if (percent < 0.1) return "<0.1%"
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(percent)}%`
}

// --- User detail ------------------------------------------------------------

export type UserDetailCounts = {
  /** Bound game accounts; null when the detail payload does not list them. */
  gameBindings: number | null
  verifiedGameBindings: number | null
  /** Authorized social accounts; null when the payload does not list them. */
  authorizedSocials: number | null
  /** The platform of the main social binding, or null when there is none. */
  socialPlatform: string | null
}

/** Counts from `userData` of GET /api/admin/users/:id/detail. */
export function readUserDetailCounts(detail: unknown): UserDetailCounts {
  const userData = asRecord(asRecord(detail)?.userData)
  const bindings = userData?.gameAccountBindings
  const socials = userData?.authorizeSocialPlatformInfo
  return {
    gameBindings: Array.isArray(bindings) ? bindings.length : null,
    verifiedGameBindings: Array.isArray(bindings)
      ? bindings.filter((binding) => asRecord(binding)?.verified === true).length
      : null,
    authorizedSocials: Array.isArray(socials) ? socials.length : null,
    socialPlatform: readText(asRecord(userData?.socialPlatformInfo), "platform"),
  }
}

/** What the page's own section lists say, once their endpoints have answered. */
export type LoadedUserSections = {
  /** Null until GET …/game-account-bindings has answered. */
  gameBindings: ReadonlyArray<{ verified?: boolean }> | null
  /** Null until GET …/authorized-social-platforms has answered. */
  authorizedSocials: ReadonlyArray<unknown> | null
  /** Undefined until GET …/social-platform has answered; null means "no main binding". */
  socialPlatform: { platform: string } | null | undefined
}

/**
 * The counts to show: a loaded section wins over the copy in the detail
 * payload, because the section is what the admin edits on this page.
 */
export function mergeUserDetailCounts(detail: UserDetailCounts, sections: LoadedUserSections): UserDetailCounts {
  const bindings = sections.gameBindings
  // A list that never says whether a binding is verified cannot count the verified ones.
  const knowsVerified = bindings != null && bindings.every((binding) => typeof binding.verified === "boolean")
  return {
    gameBindings: bindings ? bindings.length : detail.gameBindings,
    verifiedGameBindings: bindings
      ? (knowsVerified ? bindings.filter((binding) => binding.verified === true).length : null)
      : detail.verifiedGameBindings,
    authorizedSocials: sections.authorizedSocials ? sections.authorizedSocials.length : detail.authorizedSocials,
    socialPlatform: sections.socialPlatform === undefined
      ? detail.socialPlatform
      : (sections.socialPlatform?.platform || null),
  }
}

export type UserActivityWindow = {
  /** Length of the window the counters cover. */
  windowHours: number
  systemLogTotal: number
  uploadLogTotal: number
  uploadSuccess: number
  uploadFailure: number
  /** Successful uploads as 0–100, or null without any upload in the window. */
  uploadSuccessPercent: number | null
  lastSystemLog: string | null
  lastUploadLog: string | null
}

/**
 * `activitySummary` of the detail payload: what the user did in the last
 * `windowHours` hours. Null when the block is missing or incomplete.
 */
export function readUserActivityWindow(detail: unknown): UserActivityWindow | null {
  const summary = asRecord(asRecord(detail)?.activitySummary)
  const windowHours = readCount(summary, "windowHours")
  const systemLogTotal = readCount(summary, "systemLogTotal")
  const uploadLogTotal = readCount(summary, "uploadLogTotal")
  const uploadSuccess = readCount(summary, "uploadSuccess")
  const uploadFailure = readCount(summary, "uploadFailure")
  if (
    windowHours == null || windowHours === 0 || systemLogTotal == null
    || uploadLogTotal == null || uploadSuccess == null || uploadFailure == null
  ) {
    return null
  }
  return {
    windowHours,
    systemLogTotal,
    uploadLogTotal,
    uploadSuccess,
    uploadFailure,
    uploadSuccessPercent: uploadLogTotal > 0 ? sharePercent(uploadSuccess, uploadLogTotal) : null,
    lastSystemLog: readText(summary, "lastSystemLog"),
    lastUploadLog: readText(summary, "lastUploadLog"),
  }
}

/**
 * How many of a binding's sharing switches are on. Null when the binding
 * carries no settings for that upload.
 */
export function countSharingSwitches(settings: object | null | undefined): { on: number; total: number } | null {
  if (settings == null) return null
  const values = Object.values(settings)
  return { on: values.filter((value) => value === true).length, total: values.length }
}

export type OAuthAuthorizationState = "active" | "revoked" | "clientDisabled"

/** Revoked wins over a disabled client: the grant is gone either way. */
export function resolveOAuthAuthorizationState(item: { revoked?: boolean; clientActive?: boolean }): OAuthAuthorizationState {
  if (item.revoked) return "revoked"
  if (item.clientActive === false) return "clientDisabled"
  return "active"
}

/** Authorizations per state, over the list as loaded. */
export function summarizeOAuthAuthorizations(
  items: ReadonlyArray<{ revoked?: boolean; clientActive?: boolean }>,
): Record<OAuthAuthorizationState, number> {
  const summary: Record<OAuthAuthorizationState, number> = { active: 0, revoked: 0, clientDisabled: 0 }
  for (const item of items) {
    summary[resolveOAuthAuthorizationState(item)] += 1
  }
  return summary
}

export type ListedActivity = {
  /** Rows the activity response returned. */
  listed: number
  /** Rows in the whole window, per the response's summary. */
  total: number
  /** True when the window holds more rows than the response returned. */
  truncated: boolean
}

/** How much of the window a capped log list shows. */
export function describeListedActivity(listed: number, total: number | null | undefined): ListedActivity {
  const safeListed = Math.max(0, listed)
  const safeTotal = typeof total === "number" && Number.isFinite(total) ? Math.max(total, safeListed) : safeListed
  return { listed: safeListed, total: safeTotal, truncated: safeTotal > safeListed }
}
