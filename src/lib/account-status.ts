// The backend reports a ban of the *calling* user with a message that starts
// "Your account has been banned" (usercore/common_helpers.go, userauth/login.go),
// optionally followed by ": <reason>". Admin routes answer a banned admin with
// "banned users cannot access admin routes". Every other 403 that mentions a
// ban is about someone else ("this account is bound by a banned user",
// "grantee user is banned", "account owner is banned: …") and must not be
// treated as a ban of the current session.
const SELF_BAN_PREFIX_RE = /^\s*your account has been banned\b(?:\s*[:：]\s*(.*))?/is
const SELF_BAN_EXACT_MESSAGES = new Set(["banned users cannot access admin routes"])
// Whole-account Chinese ban message, anchored so "…被封禁的用户…" never matches.
const SELF_BAN_ZH_RE = /^\s*(?:您的|你的)?(?:账号|帐号|账户)已被封禁(?:\s*[:：]\s*(.*))?\s*$/s

export function isAccountBannedMessage(message: string | null | undefined): boolean {
  if (!message) return false
  if (SELF_BAN_EXACT_MESSAGES.has(message.trim().toLowerCase())) return true
  return SELF_BAN_PREFIX_RE.test(message) || SELF_BAN_ZH_RE.test(message)
}

/** The reason attached to a self-ban message ("Your account has been banned: <reason>"), or "". */
export function readAccountBanReason(message: string | null | undefined): string {
  if (!message) return ""
  const match = SELF_BAN_PREFIX_RE.exec(message) ?? SELF_BAN_ZH_RE.exec(message)
  return match?.[1]?.trim() ?? ""
}
