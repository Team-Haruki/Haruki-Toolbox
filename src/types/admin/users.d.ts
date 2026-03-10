import type { MysekaiDataPrivacySettings, SekaiRegion, SuiteDataPrivacySettings } from "@/types/store"
import type { EntityId, UserRole } from "@/types/common"
import type { UploadLog } from "./statistics"

export interface AdminUser {
  userId: string
  name: string
  avatarPath?: string
  email?: string
  role: UserRole
  banned: boolean
  banReason?: string
  createdAt?: string
  lastLoginAt?: string
  deleted?: boolean
  allowCNMysekai?: boolean
}

export interface AdminUserDetail {
  userData: {
    userId: string
    name: string
    role: UserRole
    avatarPath?: string
    allowCNMysekai?: boolean
    emailInfo?: {
      email: string
      verified: boolean
    }
    authorizeSocialPlatformInfo?: AuthorizedSocialPlatform[] | null
    gameAccountBindings?: AdminGameAccountBinding[] | null
    iosUploadCode?: string | null
  }
  banned: boolean
  activitySummary?: {
    windowHours: number
    from: string
    to: string
    systemLogTotal: number
    uploadLogTotal: number
    uploadSuccess: number
    uploadFailure: number
    lastSystemLog?: string
  }
}

export interface UserActivity {
  id: EntityId
  eventTime: string
  action: string
  result?: "success" | "failure"
  actorUserId?: string
  actorRole?: string
  actorType?: string
  targetType?: string
  targetId?: string
  userAgent?: string
  method?: string
  path?: string
  metadata?: Record<string, unknown>
}

export interface UserActivityResponse {
  generatedAt: string
  userId: string
  from: string
  to: string
  systemLogLimit: number
  uploadLogLimit: number
  summary: {
    systemLogTotal: number
    uploadLogTotal: number
    uploadSuccess: number
    uploadFailure: number
  }
  systemLogs: UserActivity[]
  uploadLogs: UploadLog[]
}

export interface UserSocialPlatform {
  platform: string
  userId: string
  verified: boolean
}

export interface AuthorizedSocialPlatform {
  id: EntityId
  platform: string
  userId: string
  comment?: string
}

export interface AdminGameAccountBinding {
  server: SekaiRegion
  gameUserId: string
  suite?: SuiteDataPrivacySettings | null
  mysekai?: MysekaiDataPrivacySettings | null
}
