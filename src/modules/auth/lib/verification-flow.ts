import { resolveRedirectFromFlowReturnTo } from "@/modules/auth/lib/return-to"

/** Kratos state of a verification flow whose code was accepted. */
export const VERIFICATION_PASSED_STATE = "passed_challenge"

/** Id of the link node Kratos adds to a passed verification flow. */
export const VERIFICATION_CONTINUE_NODE_ID = "continue"

export interface VerificationContinueSource {
  /** The flow's `state`. */
  state: string
  /** The flow's `return_to`. */
  returnTo: string
  /** Link nodes of the flow, as `{ id, href }`. */
  anchors: ReadonlyArray<{ id: string, href: string }>
}

/**
 * Where the Continue link of a passed verification flow leads, as an in-app
 * path, or null while the flow has not passed.
 *
 * Kratos copies the registration flow's `return_to` into the verification flow
 * it starts after sign-up (the `show_verification_ui` hook), so this is how a
 * new account gets back to where the sign-in was heading (an OAuth login
 * challenge, `/device?user_code=…`). Once the code is accepted the flow carries
 * no form to submit, only a `continue` link.
 *
 * Order: the flow's `return_to`, then Kratos' own `continue` link, each only
 * when it is a path on the current origin, else the app root. Off-origin
 * targets (the API origin is an allowed Kratos return URL, for instance) are
 * never followed.
 */
export function resolveVerificationContinuePath(
  source: VerificationContinueSource,
  currentOrigin: string
): string | null {
  const continueHref = source.anchors.find((anchor) => anchor.id === VERIFICATION_CONTINUE_NODE_ID)?.href ?? ""
  if (source.state !== VERIFICATION_PASSED_STATE && !continueHref) {
    return null
  }

  return resolveRedirectFromFlowReturnTo(source.returnTo, currentOrigin)
    ?? resolveRedirectFromFlowReturnTo(continueHref, currentOrigin)
    ?? "/"
}
