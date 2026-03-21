export interface AdminSession {
  sessionTokenId: string
  ttlSeconds: number
  expiresAt: string
  current?: boolean
}
