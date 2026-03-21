import type { EntityId } from "@/types/common"

export interface DashboardData {
  generatedAt: string
  users: {
    total: number
    banned: number
    admin: number
    superAdmin: number
  }
  bindings: {
    total: number
    verified: number
    byServer: Array<{ server: string; count: number }>
  }
  uploads: {
    windowHours: number
    windowStart: string
    windowEnd: string
    totalAllTime: number
    total: number
    success: number
    failed: number
    byMethod: Array<{ method: string; count: number }>
    byDataType: Array<{ dataType: string; count: number }>
    byMethodAndDataType: Array<{ method: string; dataType: string; count: number }>
  }
}

export interface TimeseriesPoint {
  time: string
  registrations: number
  uploads: number
  uploadSuccesses: number
  uploadFailures: number
}

export interface TimeseriesResponse {
  generatedAt: string
  from: string
  to: string
  bucket: string
  points: TimeseriesPoint[]
}

export interface UploadLog {
  id: string
  userId: string
  userName?: string
  server?: string
  gameUserId?: string
  uploadMethod?: string
  dataType?: string
  success?: boolean
  errorMessage?: string
  uploadTime: string
}

export interface UploadLogsSummary {
  success: number
  failed: number
  byMethod: Array<{ key: string; count: number }>
  byDataType: Array<{ key: string; count: number }>
}

export interface UploadLogsResponse {
  from: string
  to: string
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasMore: boolean
  filters?: Record<string, unknown>
  summary: UploadLogsSummary
  items: UploadLog[]
}

export interface SystemLog {
  id: EntityId
  eventTime: string
  action: string
  result: "success" | "failure"
  actorUserId?: string
  actorRole?: string
  method?: string
  path?: string
  ip?: string
  userAgent?: string
  detail?: string
}

export interface SystemLogSummary {
  total: number
  success: number
  failure: number
}
