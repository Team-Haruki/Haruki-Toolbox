interface AuthorizationKeySource {
  clientId: string
  consentRequestId?: string
}

/**
 * v-for key for an authorized-app row. Every consent session is its own row and
 * one client can hold several of them, so the consent request id is the key.
 * The backend omits an empty id, which falls back to the client id plus the
 * row position.
 */
export function oauthAuthorizationKey(authorization: AuthorizationKeySource, index: number): string {
  const consentRequestId = authorization.consentRequestId?.trim() ?? ""
  return consentRequestId || `${authorization.clientId}#${index}`
}
