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
