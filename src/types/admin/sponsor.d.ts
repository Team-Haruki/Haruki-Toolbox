export interface AdminSponsorProfile {
  id: string
  name: string
  avatar: string
  planName: string
  message: string
  source: string
  isActive: boolean
  afdianSyncDisabled: boolean
  totalAmount: number | null
  month: number | null
  paidAt: string
  planExpiresAt: string
  createdAt: string
  updatedAt: string
}

export interface AdminSponsorListResponse {
  generatedAt: string
  total: number
  items: AdminSponsorProfile[]
}

export interface AdminSponsorUpdatePayload {
  name?: string
  avatar?: string
  planName?: string
  message?: string
  source?: string
  isActive?: boolean
  afdianSyncDisabled?: boolean
  paidAt?: string
  planExpiresAt?: string
}
