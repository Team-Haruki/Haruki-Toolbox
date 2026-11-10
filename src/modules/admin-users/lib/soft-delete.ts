/**
 * The backend soft-deletes a user by banning it with a ban reason that starts
 * with this marker (restoring clears both); it sends no separate flag.
 */
const SOFT_DELETE_BAN_REASON_PREFIX = "[soft_deleted]"

export function isSoftDeletedUser(user: { banned: boolean; banReason?: string | null }): boolean {
  return user.banned && typeof user.banReason === "string" && user.banReason.startsWith(SOFT_DELETE_BAN_REASON_PREFIX)
}

export function withSoftDeleteFlag<T extends { banned: boolean; banReason?: string | null }>(user: T): T & { deleted: boolean } {
  return { ...user, deleted: isSoftDeletedUser(user) }
}

/**
 * The ban reason worth showing: nothing for an account that is not banned or
 * has no reason, and the text after the marker for a soft-deleted one (the
 * marker itself is plumbing, the status chip already says "deleted").
 */
export function visibleBanReason(user: { banned: boolean; banReason?: string | null }): string | null {
  if (!user.banned || typeof user.banReason !== "string") return null
  const reason = user.banReason.startsWith(SOFT_DELETE_BAN_REASON_PREFIX)
    ? user.banReason.slice(SOFT_DELETE_BAN_REASON_PREFIX.length)
    : user.banReason
  return reason.trim() || null
}
