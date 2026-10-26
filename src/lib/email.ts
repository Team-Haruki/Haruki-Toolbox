// Client-side shape check for an email address, used before a request is sent
// so a typo is reported inline instead of as a backend error. It is lenient on
// purpose: the backend (and the mail provider) remain the source of truth.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_PATTERN.test(trimmed)
}
