// ========== 通用分页（匹配后端实际返回） ==========

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

// ========== 用户管理 ==========

export interface AdminUser {
    userId: string
    name: string
    avatarPath?: string
    email?: string
    role: 'user' | 'admin' | 'super_admin'
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
        role: 'user' | 'admin' | 'super_admin'
        avatarPath?: string
        allowCNMysekai?: boolean
        emailInfo?: {
            email: string
            verified: boolean
        }
        authorizeSocialPlatformInfo?: AuthorizedSocialPlatform | null
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
    id: number | string
    eventTime: string
    action: string
    result?: 'success' | 'failure'
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
    id: string
    platform: string
    userId: string
    comment?: string
}

export interface AdminGameAccountBinding {
    server: 'jp' | 'en' | 'tw' | 'kr' | 'cn'
    gameUserId: string
    suite?: unknown
    mysekai?: unknown
}

// ========== 批量操作 ==========

export interface BatchOperationRequest {
    userIds: string[]
    reason?: string
}

export interface ResetPasswordRequest {
    newPassword?: string
    forceLogout?: boolean
}

// ========== OAuth Client ==========

export interface OAuthClient {
    clientId: string
    clientSecret?: string
    name?: string
    clientType?: 'public' | 'confidential'
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

// ========== 统计与日志 ==========

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
    id: number | string
    eventTime: string
    action: string
    result: 'success' | 'failure'
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

// ========== 内容运营 ==========

export interface AdminFriendLink {
    id: string
    name: string
    description: string
    avatar: string
    url: string
    tags?: string[]
}

export interface AdminFriendGroup {
    id: number | string
    group: string
    groupList?: AdminFriendGroupItem[]
}

export interface AdminFriendGroupItem {
    id: number | string
    name: string
    avatar: string
    bg: string
    groupInfo?: string
    detail?: string
}

// ========== 系统配置 ==========

export interface PublicApiKeys {
    [key: string]: string
}

export interface RuntimeConfig {
    [key: string]: unknown
}

// ========== 管理员会话 ==========

export interface AdminSession {
    sessionTokenId: string
    ttlSeconds: number
    expiresAt: string
    current?: boolean
}

// ========== 风控 ==========

export interface RiskEvent {
    id: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    source: string
    targetUserId?: string
    userName?: string
    action: string
    reason: string
    status: 'open' | 'resolved'
    metadata?: Record<string, unknown>
    createdAt: string
    resolvedAt?: string
    resolvedBy?: string
}

export interface CreateRiskEventRequest {
    severity: string
    source: string
    targetUserId?: string
    action: string
    reason: string
    metadata?: Record<string, unknown>
}

export interface RiskRule {
    id: string
    name: string
    description: string
    enabled: boolean
    config?: Record<string, unknown>
}
