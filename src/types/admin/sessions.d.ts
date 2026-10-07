export interface AdminSession {
  sessionTokenId: string
  ttlSeconds: number
  expiresAt: string
  current?: boolean
}

/** Body of POST /api/admin/me/reauth on success. */
export interface AdminReauthResult {
  reauthenticatedAt: string
}
