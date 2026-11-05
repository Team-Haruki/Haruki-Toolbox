import { isAxiosError } from "axios"

/**
 * Why the Afdian OAuth callback did not bind, in the terms the result page
 * explains them: `conflict` cannot be fixed by retrying (the Afdian account
 * belongs to another toolbox user), `expired` needs a fresh authorization
 * (state/code rejected, session changed), `failed` is a transient server or
 * network problem and `invalid` means the page was opened without a code
 * (reload, bookmark).
 */
export type AfdianCallbackFailure = "conflict" | "expired" | "failed" | "invalid"

export function classifyAfdianCallbackStatus(status: number | undefined): AfdianCallbackFailure {
  if (status === 409) {
    return "conflict"
  }
  if (status !== undefined && status >= 400 && status < 500) {
    return "expired"
  }
  return "failed"
}

export function classifyAfdianCallbackError(error: unknown): AfdianCallbackFailure {
  return classifyAfdianCallbackStatus(isAxiosError(error) ? error.response?.status : undefined)
}
