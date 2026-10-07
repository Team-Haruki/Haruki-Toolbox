/**
 * Per-client device grant policy, stored by the backend in the Hydra client's
 * `metadata.haruki.device`. Unsaved members read as their defaults.
 */
export interface OAuthClientDevicePolicy {
  /** "Official" badge on the device approval card; shown for confidential clients only. */
  firstParty: boolean
  /** Lets a public device client request `game-data:write`. */
  allowWrite: boolean
  /** Device codes the client may obtain per 10 minutes (1-600, default 60). */
  maxCodesPer10m: number
}

export interface OAuthClient {
  clientId: string
  clientSecret?: string
  name?: string
  clientType?: "public" | "confidential"
  scopes?: string[]
  redirectUri?: string
  redirectUris?: string[]
  /** OIDC RP-initiated logout return targets; exact-match like redirectUris. */
  postLogoutRedirectUris?: string[]
  /** Hydra grant types: authorization_code, refresh_token and/or the device code grant. */
  grantTypes?: string[]
  /** Whether grantTypes include the device code grant. */
  deviceEnabled?: boolean
  devicePolicy?: OAuthClientDevicePolicy
  active: boolean
  createdAt: string
  updatedAt?: string
  deleted?: boolean
}

export interface OAuthClientStatistics {
  totalAuthorizations: number
  activeAuthorizations: number
  last30DaysAuthorizations: number
}

export interface OAuthClientAuthorization {
  userId: string
  userName: string
  authorizedAt: string
  scopes?: string[]
}

export interface OAuthAuditLog {
  id: string
  action: string
  actorId: string
  actorName?: string
  detail?: string
  createdAt: string
}

export interface OAuthClientWebhook {
  id: string
  clientId: string
  callbackUrl: string
  bearerSet: boolean
  enabled: boolean
  createdAt: string
  updatedAt?: string
}

export interface OAuthClientWebhookListResponse {
  generatedAt: string
  clientId: string
  total: number
  items: OAuthClientWebhook[]
}

export interface OAuthClientWebhookMutationResponse {
  generatedAt: string
  clientId: string
  webhook: OAuthClientWebhook
}

export interface OAuthClientWebhookCreatePayload {
  callbackUrl: string
  bearer?: string
  enabled?: boolean
}

export interface OAuthClientWebhookUpdatePayload {
  callbackUrl?: string
  bearer?: string
  enabled?: boolean
  clearBearer?: boolean
}
