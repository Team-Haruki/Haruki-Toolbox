const ACCOUNT_BANNED_MESSAGE_RE = /封禁|\bban(?:ned)?\b/i

export function isAccountBannedMessage(message: string | null | undefined): boolean {
  if (!message) return false
  return ACCOUNT_BANNED_MESSAGE_RE.test(message)
}
