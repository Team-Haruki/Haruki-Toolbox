export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const DEFAULT_MIN_PASSWORD_LENGTH = 8

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function hasMinPasswordLength(value: string, min = DEFAULT_MIN_PASSWORD_LENGTH): boolean {
  return value.length >= min
}
