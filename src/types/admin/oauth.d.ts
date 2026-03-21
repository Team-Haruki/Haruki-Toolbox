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
