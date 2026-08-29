import { defineStore } from "pinia"
import { ref, computed } from "vue"

import type { UserRole } from "@/types/common"
import type {
    EmailInfo,
    GameAccountBinding,
    SocialPlatformInfo,
    AuthorizeSocialPlatformInfo,
} from "@/types/store";

export type UserSettingsSyncState = "idle" | "loading" | "synced" | "failed"

function normalizeTokenExpiration(value: string | number | null | undefined): number | null {
    if (value == null) {
        return null
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        return Math.floor(value > 1_000_000_000_000 ? value / 1000 : value)
    }

    if (typeof value === "string" && value.trim()) {
        const date = new Date(value)
        if (!Number.isNaN(date.getTime())) {
            return Math.floor(date.getTime() / 1000)
        }
    }

    return null
}

function setRefIfDefined<T>(target: { value: T }, value: T | undefined): void {
    if (value !== undefined) {
        target.value = value
    }
}

export const useUserStore = defineStore("user", () => {
    const name = ref<string>("")
    const userId = ref<string | null>(null)
    const kratosIdentityId = ref<string | null>(null)
    const avatarPath = ref<string>("")
    const allowCNMysekai = ref<boolean | null>(null)
    const role = ref<UserRole>('user')
    const emailInfo = ref<EmailInfo | null>(null)
    const socialPlatformInfo = ref<SocialPlatformInfo | null>(null)
    const authorizeSocialPlatformInfo = ref<AuthorizeSocialPlatformInfo[] | null>(null)
    const gameAccountBindings = ref<GameAccountBinding[] | null>(null)
    const iosUploadCode = ref<string | null>(null)
    const sessionToken = ref<string | null>(null)
    const tokenExpiration = ref<number | null>(null)
    const hasActiveSession = ref(false)
    const settingsSyncState = ref<UserSettingsSyncState>("idle")
    const isLoggedIn = computed(() => hasActiveSession.value || !!sessionToken.value)
    const isAdmin = computed(() => role.value === 'admin' || role.value === 'super_admin')
    const isSuperAdmin = computed(() => role.value === 'super_admin')

    function setUser(payload: {
        name?: string
        userId?: string
        kratosIdentityId?: string | null
        avatarPath?: string
        allowCNMysekai?: boolean
        role?: UserRole
        emailInfo?: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        iosUploadCode?: string | null
        sessionToken?: string
        sessionExpiresAt?: string | number | null
    }, options: { resetExpiration?: boolean } = { resetExpiration: true }) {
        setRefIfDefined(name, payload.name)
        setRefIfDefined(userId, payload.userId)
        setRefIfDefined(kratosIdentityId, payload.kratosIdentityId)
        setRefIfDefined(avatarPath, payload.avatarPath)
        setRefIfDefined(allowCNMysekai, payload.allowCNMysekai)
        setRefIfDefined(role, payload.role)
        setRefIfDefined(emailInfo, payload.emailInfo)
        setRefIfDefined(socialPlatformInfo, payload.socialPlatformInfo)
        setRefIfDefined(authorizeSocialPlatformInfo, payload.authorizeSocialPlatformInfo)
        setRefIfDefined(gameAccountBindings, payload.gameAccountBindings)
        setRefIfDefined(iosUploadCode, payload.iosUploadCode)

        if (payload.sessionToken !== undefined) {
            sessionToken.value = payload.sessionToken
        }

        const sessionChanged = payload.sessionToken !== undefined || payload.sessionExpiresAt !== undefined
        if (options.resetExpiration && sessionChanged) {
            tokenExpiration.value = sessionToken.value
                ? normalizeTokenExpiration(payload.sessionExpiresAt)
                : null
        }
    }

    function setSettingsSyncState(state: UserSettingsSyncState) {
        settingsSyncState.value = state
    }

    function setSessionActive(active: boolean) {
        hasActiveSession.value = active
    }

    function clearUser() {
        name.value = ""
        userId.value = null
        kratosIdentityId.value = null
        avatarPath.value = ""
        allowCNMysekai.value = null
        role.value = 'user'
        emailInfo.value = null
        socialPlatformInfo.value = null
        authorizeSocialPlatformInfo.value = null
        gameAccountBindings.value = null
        iosUploadCode.value = null
        sessionToken.value = null
        tokenExpiration.value = null
        hasActiveSession.value = false
        settingsSyncState.value = "idle"
    }

    function setIOSUploadCode(code: string | null) {
        iosUploadCode.value = code
    }

    function checkExpiration() {
        if (tokenExpiration.value && Math.floor(Date.now() / 1000) > tokenExpiration.value) {
            clearUser()
        }
    }

    return {
        name,
        userId,
        kratosIdentityId,
        avatarPath,
        emailInfo,
        allowCNMysekai,
        role,
        socialPlatformInfo,
        authorizeSocialPlatformInfo,
        gameAccountBindings,
        iosUploadCode,
        sessionToken,
        tokenExpiration,
        hasActiveSession,
        settingsSyncState,
        isLoggedIn,
        isAdmin,
        isSuperAdmin,
        setUser,
        setSessionActive,
        setSettingsSyncState,
        setIOSUploadCode,
        clearUser,
        checkExpiration
    }
}, {
    persist: {
        beforeHydrate: ({ store }) => {
            try {
                localStorage.removeItem(store.$id)
            } catch {
            }
        },
        storage: sessionStorage,
        pick: [
            'name',
            'userId',
            'avatarPath',
            'allowCNMysekai',
            'role',
            'emailInfo',
            'socialPlatformInfo',
            'authorizeSocialPlatformInfo',
            'gameAccountBindings',
            'iosUploadCode',
            'sessionToken',
            'tokenExpiration'
        ]
    }
})
