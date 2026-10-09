/** Decided by the backend: 当前赞助 / 曾经赞助. */
export type AdminSponsorCategory = "current" | "former"

export interface AdminSponsorProfile {
  id: string
  name: string
  avatar: string
  planName: string
  message: string
  source: string
  category: AdminSponsorCategory
  isActive: boolean
  afdianSyncDisabled: boolean
  totalAmount: number | null
  month: number | null
  paidAt: string
  /** Effective expiry: the Afdian time, then the manual entries. */
  planExpiresAt: string
  /** End of the Afdian time alone. */
  afdianExpiresAt: string
  afdianMonths: number
  /** The legacy single expiry has not been split yet; manual entries are refused until it is. */
  durationMigrationPending: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminSponsorListResponse {
  generatedAt: string
  total: number
  items: AdminSponsorProfile[]
}

/** isActive and the expiry are derived by the backend and cannot be edited. */
export interface AdminSponsorUpdatePayload {
  name?: string
  avatar?: string
  planName?: string
  message?: string
  source?: string
  afdianSyncDisabled?: boolean
  paidAt?: string
}

export interface AdminSponsorCreatePayload {
  name: string
  avatar?: string
  planName?: string
  message?: string
}

/** no_time: a paid order that grants no time (a sale plan). */
export type AdminAfdianOrderKind = "duration" | "no_time" | "ignored"

export interface AdminAfdianOrder {
  outTradeNo: string
  planId: string
  planTitle: string
  productType: number
  month: number
  kind: AdminAfdianOrderKind
  totalAmount: number | null
  showAmount: number | null
  remark: string
  paidAt: string
}

export type AdminManualDurationUnit = "day" | "month"

export interface AdminManualDuration {
  id: number
  amount: number
  unit: AdminManualDurationUnit
  startsAt: string
  note: string
  origin: "admin" | "migration"
  createdBy: string
  createdAt: string
  updatedBy: string
  updatedAt: string
}

export interface AdminSponsorDetail {
  sponsor: AdminSponsorProfile
  afdian: {
    expiresAt: string
    months: number
    reportedExpiresAt: string
    orders: AdminAfdianOrder[]
  }
  manualDurations: AdminManualDuration[]
  effectiveExpiresAt: string
}

export interface AdminManualDurationPayload {
  amount: number
  unit: AdminManualDurationUnit
  startsAt?: string
  note: string
}
