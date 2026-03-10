export interface PaginatedResponse<T> {
  generatedAt?: string
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
  sort?: string
  filters?: Record<string, unknown>
  items: T[]
}

export interface BatchOperationRequest {
  userIds: string[]
  reason?: string
}

export interface ResetPasswordRequest {
  newPassword?: string
  forceLogout?: boolean
}
