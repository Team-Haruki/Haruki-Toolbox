import { isAxiosError } from "axios"
import { asRecord, readBoolean, readString, readStringArray } from "@/lib/record-utils"
import { extractErrorMessage } from "@/lib/error-utils"
import type { OAuthClient } from "@/types/admin"

type TranslateFn = (key: string, params?: Record<string, unknown>, plural?: number) => string

/** `updatedData.code` of the 400 that rotate-secret returns for a public client. */
export const PUBLIC_CLIENT_HAS_NO_SECRET = "public_client_has_no_secret"

/** Backend error codes (`updatedData.code`) this module explains in the admin's language. */
const API_ERROR_MESSAGE_KEYS: ReadonlyMap<string, string> = new Map([
  [PUBLIC_CLIENT_HAS_NO_SECRET, "adminOAuthClients.toast.apiErrors.publicClientHasNoSecret"],
])

/**
 * Public clients authenticate with `none`, so there is no secret to rotate and
 * the backend answers 400 `public_client_has_no_secret`.
 */
export function canRotateClientSecret(client: Pick<OAuthClient, "clientType">): boolean {
  return client.clientType !== "public"
}

/**
 * The one-time secret an update returns when it switched a public client to
 * confidential, or "" when the response carries none.
 */
export function readIssuedClientSecret(updatedData: unknown): string {
  const record = asRecord(updatedData)
  return record ? readString(record, ["clientSecret", "client_secret"]).trim() : ""
}

export type RevocationOutcome = {
  /** False when the backend reported that some grants of the client were not revoked. */
  complete: boolean
  /** Failed subjects the backend lists for this admin; can be 0 while `complete` is false. */
  failedSubjectCount: number
}

/**
 * Reads the revocation result of disabling a client or revoking all of its
 * authorizations. A response without the fields (enable, or a backend that
 * predates per-subject revocation) reads as complete.
 */
export function readRevocationOutcome(updatedData: unknown): RevocationOutcome {
  const record = asRecord(updatedData)
  if (!record) {
    return { complete: true, failedSubjectCount: 0 }
  }
  const failedSubjectCount = readStringArray(record, ["failedSubjects", "failed_subjects"]).length
  const reportedComplete = readBoolean(record, ["revocationComplete", "revocation_complete"], true)
  return {
    complete: reportedComplete && failedSubjectCount === 0,
    failedSubjectCount,
  }
}

/** The warning text for an incomplete revocation, or null when it completed. */
export function describeIncompleteRevocation(outcome: RevocationOutcome, t: TranslateFn): string | null {
  if (outcome.complete) {
    return null
  }
  if (outcome.failedSubjectCount > 0) {
    return t(
      "adminOAuthClients.toast.revocationFailedSubjects",
      { count: outcome.failedSubjectCount },
      outcome.failedSubjectCount
    )
  }
  return t("adminOAuthClients.toast.revocationIncomplete")
}

/** `updatedData.code` of a failed API call, or "" when it has none. */
export function readApiErrorCode(error: unknown): string {
  if (!isAxiosError(error)) {
    return ""
  }
  const body = asRecord(error.response?.data)
  const updatedData = body ? asRecord(body.updatedData) : null
  return updatedData ? readString(updatedData, ["code"]).trim() : ""
}

/**
 * The toast description for a failed client action: a localized message for
 * the backend codes listed above, otherwise the API message as before.
 */
export function describeOAuthClientActionError(error: unknown, t: TranslateFn, fallback: string): string {
  const messageKey = API_ERROR_MESSAGE_KEYS.get(readApiErrorCode(error))
  return messageKey ? t(messageKey) : extractErrorMessage(error, fallback)
}
