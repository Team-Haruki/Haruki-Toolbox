export interface OAuthClient {
  clientId: string
  clientSecret?: string
  name?: string
  clientType?: "public" | "confidential"
  scopes?: string[]
  redirectUri?: string
  redirectUris?: string[]
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
