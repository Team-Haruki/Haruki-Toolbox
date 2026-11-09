/**
 * Passkey sign-in for Kratos refresh (re-authentication) flows.
 *
 * Kratos' own webauthn.js pins the request to the account's passkeys through
 * `allowCredentials`. Some platform authenticators (Xiaomi HyperOS, seen in
 * production on 2026-11-08) then return an assertion without `userHandle`,
 * which the WebAuthn spec allows for a non-discoverable request. Kratos
 * v26 (`selfservice/strategy/passkey/passkey_login.go`) looks the account up
 * by that user handle alone, so the refresh fails with text id 4000015
 * ("This account does not exist or has no security key set up") although the
 * fingerprint was accepted.
 *
 * The same authenticator returns the handle for a discoverable request,
 * which is what the normal sign-in page sends. This module therefore repeats
 * what webauthn.js does, minus `allowCredentials`. Kratos still verifies the
 * returned credential against the allow list it stored in the flow, so the
 * server-side check is unchanged.
 */

export interface PasskeyAssertionLike {
  id: string
  rawId: ArrayBuffer
  type: string
  response: {
    authenticatorData: ArrayBuffer
    clientDataJSON: ArrayBuffer
    signature: ArrayBuffer
    userHandle: ArrayBuffer | null
  }
}

export type DiscoverablePasskeyLoginResult = "submitted" | "unsupported" | "invalid-challenge" | "missing-field"

function toBytes(value: ArrayBuffer | ArrayBufferView | null | undefined): Uint8Array {
  if (!value) {
    return new Uint8Array(0)
  }
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }
  return new Uint8Array(value)
}

/** base64url without padding, as Kratos' `__oryWebAuthnBufferEncode` emits. */
export function encodeBase64Url(value: ArrayBuffer | ArrayBufferView | null | undefined): string {
  const bytes = toBytes(value)
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

/** Accepts base64url or base64, padded or not. */
export function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

interface RawPublicKeyRequest {
  challenge?: unknown
  allowCredentials?: unknown
  [key: string]: unknown
}

/**
 * The `navigator.credentials.get` options for the flow's `passkey_challenge`
 * node, with `allowCredentials` dropped so the request is discoverable.
 * Null when the node value is not a Kratos challenge.
 */
export function buildDiscoverablePasskeyRequest(challengeValue: string): PublicKeyCredentialRequestOptions | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(challengeValue)
  } catch {
    return null
  }

  const publicKey = (parsed as { publicKey?: RawPublicKeyRequest } | null)?.publicKey
  if (!publicKey || typeof publicKey !== "object" || typeof publicKey.challenge !== "string") {
    return null
  }

  const rest: RawPublicKeyRequest = { ...publicKey }
  delete rest.challenge
  delete rest.allowCredentials
  let challengeBytes: Uint8Array<ArrayBuffer>
  try {
    challengeBytes = decodeBase64Url(publicKey.challenge)
  } catch {
    return null
  }

  return {
    ...(rest as Omit<PublicKeyCredentialRequestOptions, "challenge" | "allowCredentials">),
    challenge: challengeBytes,
  }
}

/** The `passkey_login` field value, in the shape Kratos' webauthn.js posts. */
export function serializePasskeyAssertion(credential: PasskeyAssertionLike): string {
  return JSON.stringify({
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: encodeBase64Url(credential.response.authenticatorData),
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      signature: encodeBase64Url(credential.response.signature),
      userHandle: encodeBase64Url(credential.response.userHandle),
    },
  })
}

interface ConditionalUiWindow {
  PublicKeyCredential?: unknown
  abortPasskeyConditionalUI?: AbortController
}

/**
 * Runs a discoverable passkey assertion for the flow and posts it the way
 * Kratos' script would: the result lands in the form's hidden `passkey_login`
 * input and the form is submitted natively. Authenticator errors
 * (cancelled, timed out) propagate to the caller as DOMExceptions.
 */
export async function runDiscoverablePasskeyLogin(
  challengeValue: string,
  form: HTMLFormElement
): Promise<DiscoverablePasskeyLoginResult> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "unsupported"
  }
  const conditionalWindow = window as unknown as ConditionalUiWindow
  if (!conditionalWindow.PublicKeyCredential || typeof navigator.credentials?.get !== "function") {
    return "unsupported"
  }

  const publicKey = buildDiscoverablePasskeyRequest(challengeValue)
  if (!publicKey) {
    return "invalid-challenge"
  }

  const input = form.elements.namedItem("passkey_login")
  if (!(input instanceof HTMLInputElement)) {
    return "missing-field"
  }

  // A pending conditional-UI request from webauthn.js would make this call
  // fail with "a request is already pending".
  conditionalWindow.abortPasskeyConditionalUI?.abort("Replaced by the refresh passkey sign-in.")
  conditionalWindow.abortPasskeyConditionalUI = undefined

  const credential = (await navigator.credentials.get({ publicKey })) as PasskeyAssertionLike | null
  if (!credential) {
    throw new DOMException("No credential returned.", "NotAllowedError")
  }

  input.value = serializePasskeyAssertion(credential)
  form.submit()
  return "submitted"
}
