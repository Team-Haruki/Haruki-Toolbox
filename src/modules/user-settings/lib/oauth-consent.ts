// Helpers of the Hydra consent page (/oauth2/consent).

/** The identifiers of the signed-in person a Hydra subject may carry. */
export interface ConsentLocalIdentity {
  userId: string | null | undefined
  kratosIdentityId: string | null | undefined
}

/**
 * Whether a consent challenge was issued for someone other than the person
 * signed in now. The backend binds the Hydra subject to the Kratos identity id
 * when the account has one and to the toolbox user id otherwise, so the local
 * identity matches when either id equals the subject.
 *
 * Without a known Kratos identity id the answer is "no": the subject is then
 * most likely that unknown identity id, and a false mismatch would block a
 * legitimate authorization. The backend checks the subject again on accept.
 */
export function isConsentSubjectMismatch(subject: string | null | undefined, identity: ConsentLocalIdentity): boolean {
  const normalizedSubject = subject?.trim() ?? ""
  const kratosIdentityId = identity.kratosIdentityId?.trim() ?? ""
  const userId = identity.userId?.trim() ?? ""
  if (!normalizedSubject || !kratosIdentityId) {
    return false
  }
  return normalizedSubject !== kratosIdentityId && normalizedSubject !== userId
}

/**
 * The authorize URL that restarts the flow for another account: the
 * challenge's `request_url` (the client's original /oauth2/auth request, so
 * state and PKCE stay the client's) with `prompt=login`, which makes Hydra
 * issue a fresh login challenge instead of reusing its remembered session.
 * Returns null when the challenge carries no usable http(s) request URL.
 */
export function buildSwitchAccountAuthorizeUrl(requestUrl: string | null | undefined): string | null {
  const raw = requestUrl?.trim() ?? ""
  if (!raw) {
    return null
  }
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null
  }
  const prompts = (url.searchParams.get("prompt") ?? "")
    .split(/\s+/)
    .filter((value) => value !== "" && value !== "none")
  if (!prompts.includes("login")) {
    prompts.push("login")
  }
  url.searchParams.set("prompt", prompts.join(" "))
  return url.toString()
}
