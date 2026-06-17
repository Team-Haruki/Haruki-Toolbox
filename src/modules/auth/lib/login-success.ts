export const LOGIN_SUCCESS_STORAGE_KEY = "haruki-toolbox-login-success"

type LoginSuccessStorage = Pick<Storage, "getItem" | "removeItem" | "setItem">

function resolveSessionStorage(): LoginSuccessStorage | null {
  if (typeof window === "undefined") {
    return null
  }

  return window.sessionStorage
}

export function markLoginSuccessPending(storage = resolveSessionStorage()) {
  if (!storage) {
    return
  }

  try {
    storage.setItem(LOGIN_SUCCESS_STORAGE_KEY, "1")
  } catch {
  }
}

export function consumeLoginSuccessPendingFlag(
  hasLoginSuccessQuery: boolean,
  storage = resolveSessionStorage(),
) {
  if (!hasLoginSuccessQuery || !storage) {
    return false
  }

  try {
    const enabled = storage.getItem(LOGIN_SUCCESS_STORAGE_KEY) === "1"
    storage.removeItem(LOGIN_SUCCESS_STORAGE_KEY)
    return enabled
  } catch {
    return false
  }
}
