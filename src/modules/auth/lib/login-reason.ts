/**
 * Why the user was sent to the login page. The route guard records it before
 * redirecting; the login page immediately hands the browser to Kratos and
 * comes back on a fresh document (`/user/login?flow=…`), so the reason must
 * survive that round-trip: sessionStorage does, a toast or a query does not.
 * The guard clears it as soon as the user navigates anywhere but login.
 */
export const LOGIN_REASON_STORAGE_KEY = "haruki-toolbox-login-reason"

export const LOGIN_REASONS = ["auth-required", "admin-required", "session-expired"] as const
export type LoginReason = (typeof LOGIN_REASONS)[number]

type ReasonStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">

function resolveSessionStorage(): ReasonStorage | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function isLoginReason(value: unknown): value is LoginReason {
  return typeof value === "string" && (LOGIN_REASONS as readonly string[]).includes(value)
}

export function rememberLoginReason(reason: LoginReason, storage = resolveSessionStorage()) {
  if (!storage) return
  try {
    storage.setItem(LOGIN_REASON_STORAGE_KEY, reason)
  } catch {
    // Storage may be unavailable (private mode, quota); the toast still fires.
  }
}

export function readLoginReason(storage = resolveSessionStorage()): LoginReason | null {
  if (!storage) return null
  try {
    const value = storage.getItem(LOGIN_REASON_STORAGE_KEY)
    return isLoginReason(value) ? value : null
  } catch {
    return null
  }
}

export function clearLoginReason(storage = resolveSessionStorage()) {
  if (!storage) return
  try {
    storage.removeItem(LOGIN_REASON_STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}

/**
 * The reason to show on the login page: the query wins (first arrival), the
 * stored one covers the document that comes back from Kratos.
 */
export function resolveLoginReason(queryReason: unknown, storage = resolveSessionStorage()): LoginReason | null {
  if (isLoginReason(queryReason)) return queryReason
  return readLoginReason(storage)
}
