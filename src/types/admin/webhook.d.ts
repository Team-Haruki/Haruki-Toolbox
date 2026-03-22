export interface AdminWebhookSettings {
  enabled: boolean
  jwtSecretConfigured: boolean
}

export interface AdminWebhookEndpoint {
  id: string
  credential: string
  callbackUrl: string
  bearer: string
  enabled: boolean
  subscriptionCount: number
  createdAt: string
}

export interface AdminWebhookListResponse {
  generatedAt: string
  total: number
  items: AdminWebhookEndpoint[]
}

export interface AdminWebhookCreatePayload {
  id?: string
  credential?: string
  callbackUrl: string
  bearer?: string
  enabled?: boolean
}

export interface AdminWebhookUpdatePayload {
  callbackUrl?: string
  credential?: string
  bearer?: string
  enabled?: boolean
  clearBearer?: boolean
}

export interface AdminWebhookMutationResponse {
  webhook: AdminWebhookEndpoint
  token: string
  tokenHeaderName: string
}

export interface AdminWebhookSubscriber {
  userId: string
  server: string
  dataType: string
  createdAt: string
}

export interface AdminWebhookSubscriberListResponse {
  generatedAt: string
  webhookId: string
  total: number
  items: AdminWebhookSubscriber[]
}
