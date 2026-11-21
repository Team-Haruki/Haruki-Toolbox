import { fetchKratosSessionState, type KratosSessionState } from "@/modules/auth/lib/kratos"
import { resolveSafeReturnPath } from "@/modules/auth/lib/return-to"

/**
 * The second factor (Kratos AAL2) that the admin area needs.
 *
 * Kratos owns the level of a session; this module only reads it and decides
 * where the browser goes next:
 *
 *   - `aal2`: carry on.
 *   - the account has a second factor that this session has not passed: the
 *     sign-in page with `?aal=aal2`, which starts a Kratos login flow for the
 *     second factor and comes back to the page that asked.
 *   - the account has no second factor: the two-step settings page, which
 *     says why it opened and returns once one is set up.
 *
 * Nothing here retries a request the backend refused: the person lands on
 * the page again and repeats the action themselves.
 */

/** `?aal=aal2` on the sign-in page: ask for the second factor of the current session. */
export const SECOND_FACTOR_AAL_QUERY = "aal"
export const SECOND_FACTOR_AAL = "aal2"

/**
 * Added to the target a second-factor sign-in returns to. Arriving with it
 * and still without `aal2` means the round trip did not help, so the guard
 * stops instead of sending the browser round again.
 */
export const SECOND_FACTOR_RETURN_PARAM = "_aal2"

/** On the two-step settings page: the page that needs a second factor, to return to. */
export const SECOND_FACTOR_REDIRECT_QUERY = "aal2_redirect"

export function isSecondFactorAalQuery(value: unknown): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === SECOND_FACTOR_AAL
}

/**
 * - `pass`: the session reached `aal2`.
 * - `verify`: a second factor exists and this session has not passed it.
 * - `enroll`: Kratos accepts the session at `aal1`. Under `required_aal:
 *   highest_available` that means no second factor is set up; the settings
 *   page checks its own nodes and offers the verification instead when one is.
 * - `unknown`: Kratos did not say (unreachable, or no session at all). The
 *   backend still refuses what needs `aal2`, so the page is not held back.
 */
export type SecondFactorGate = "pass" | "verify" | "enroll" | "unknown"

export function resolveSecondFactorGate(state: KratosSessionState | null): SecondFactorGate {
  if (!state || state.status === "none") {
    return "unknown"
  }
  if (state.status === "second-factor-required") {
    return "verify"
  }
  return state.aal === SECOND_FACTOR_AAL ? "pass" : "enroll"
}

/**
 * The level a login flow started from the sign-in page asks for: the second
 * factor when the page was opened for it (`?aal=aal2`) or when the session
 * already passed its first factor. Kratos answers a plain login flow on such
 * a session with "already signed in" and sends the browser straight back.
 */
export function resolveLoginFlowAal(queryAal: unknown, state: KratosSessionState | null): "aal2" | undefined {
  return isSecondFactorAalQuery(queryAal) || state?.status === "second-factor-required" ? SECOND_FACTOR_AAL : undefined
}

export interface SecondFactorLocation {
  name: "user.login" | "user.identityMfaSettings"
  query: Record<string, string>
}

/**
 * The sign-in page asking for the second factor, returning to `redirect` (a
 * safe in-app path) afterwards. The reason is what the page says above the
 * form (see `login-reason.ts`).
 */
export function buildSecondFactorLoginLocation(redirect: unknown): SecondFactorLocation {
  const path = resolveSafeReturnPath(redirect)
  return {
    name: "user.login",
    query: {
      [SECOND_FACTOR_AAL_QUERY]: SECOND_FACTOR_AAL,
      ...(path ? { redirect: path } : {}),
      reason: "second-factor-required",
    },
  }
}

/** The two-step settings page, opened because `redirect` needs a second factor. */
export function buildSecondFactorEnrollLocation(redirect: unknown): SecondFactorLocation {
  const path = resolveSafeReturnPath(redirect)
  return {
    name: "user.identityMfaSettings",
    query: path ? { [SECOND_FACTOR_REDIRECT_QUERY]: path } : {},
  }
}

export type SecondFactorDecision =
  /** Nothing to do. */
  | { kind: "continue" }
  /** Came back with the return marker and may stay: drop the marker from the address. */
  | { kind: "strip-marker" }
  /** Came back from the second factor still without it: stop, do not go round again. */
  | { kind: "failed" }
  | { kind: "redirect"; location: SecondFactorLocation }

/**
 * What a page that needs `aal2` does with the session it found. `target` is
 * the page's own path without the return marker; `returned` says the marker
 * was on the address.
 */
export function decideSecondFactor(input: {
  gate: SecondFactorGate
  returned: boolean
  target: string
}): SecondFactorDecision {
  const { gate, returned, target } = input
  if (gate === "pass" || gate === "unknown") {
    return returned ? { kind: "strip-marker" } : { kind: "continue" }
  }
  if (returned) {
    return { kind: "failed" }
  }
  return {
    kind: "redirect",
    location: gate === "verify" ? buildSecondFactorLoginLocation(target) : buildSecondFactorEnrollLocation(target),
  }
}

/** `query` without the return marker; the same object when the marker is absent. */
export function withoutSecondFactorReturnMarker<T extends Record<string, unknown>>(query: T): T {
  if (!(SECOND_FACTOR_RETURN_PARAM in query)) {
    return query
  }
  const next = { ...query }
  delete next[SECOND_FACTOR_RETURN_PARAM]
  return next
}

/**
 * The safe in-app path a settings flow returns to after a second factor was
 * set up for it: the page's own `?aal2_redirect`, or the one kept in the
 * loaded flow's `return_to` (Kratos comes back with only `?flow=`).
 */
export function resolveSecondFactorRedirect(queryValue: unknown, flowReturnTo = "", currentOrigin = ""): string | null {
  const direct = resolveSafeReturnPath(queryValue)
  if (direct) {
    return direct
  }

  const trimmed = flowReturnTo.trim()
  if (!trimmed || !currentOrigin) {
    return null
  }

  try {
    const url = new URL(trimmed, currentOrigin)
    if (url.origin !== new URL(currentOrigin).origin) {
      return null
    }
    return resolveSafeReturnPath(url.searchParams.get(SECOND_FACTOR_REDIRECT_QUERY))
  } catch {
    return null
  }
}

// The level only changes through Kratos, which the browser leaves the app
// for (sign-in, second factor, settings), so one answer per document is
// current until something here says otherwise: signing out in place, or the
// backend refusing an admin request.
let cachedState: Promise<KratosSessionState | null> | null = null

/** The session state, asked once per document; null when Kratos did not answer (asked again next time). */
export function loadKratosSessionState(
  fetchState: () => Promise<KratosSessionState> = fetchKratosSessionState
): Promise<KratosSessionState | null> {
  if (!cachedState) {
    const request = fetchState().catch(() => null)
    cachedState = request
    void request.then((state) => {
      if (state === null && cachedState === request) {
        cachedState = null
      }
    })
  }
  return cachedState
}

/** Seeds the per-document answer with what the session bootstrap already learned. */
export function rememberKratosSessionState(state: KratosSessionState) {
  cachedState = Promise.resolve(state)
}

export function forgetKratosSessionState() {
  cachedState = null
}
