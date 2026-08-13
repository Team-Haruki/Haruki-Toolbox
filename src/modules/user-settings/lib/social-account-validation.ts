/**
 * SHA-256 hex digest length. QQ official-bot open-ids are hash-derived and
 * always longer than this, so anything not exceeding it is a mistyped or
 * truncated account id (e.g. a plain QQ number pasted into the wrong field).
 */
export const SHA256_HEX_LENGTH = 64

export type SocialAccountValidationError = "qq-not-numeric" | "qqbot-too-short"

/**
 * Platform-specific sanity checks for social account ids.
 * - `qq`: the account is a QQ number and must be pure digits.
 * - `qqbot`: the account is an open-id and must be longer than a sha256 hex.
 * Other platforms are not validated here.
 */
export function validateSocialAccountId(
  platform: string,
  accountId: string,
): SocialAccountValidationError | null {
  if (platform === "qq" && !/^\d+$/.test(accountId)) {
    return "qq-not-numeric"
  }

  if (platform === "qqbot" && accountId.length <= SHA256_HEX_LENGTH) {
    return "qqbot-too-short"
  }

  return null
}
