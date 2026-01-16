import {defineStore} from "pinia"
import {ref, computed} from "vue"

import type {
    EmailInfo,
    GameAccountBinding,
    SocialPlatformInfo,
    AuthorizeSocialPlatformInfo,
} from "@/types/store";

export const useUserStore = defineStore("user", () => {
    const name = ref<string>("未登录")
    const userId = ref<string | null>(null)
    const avatarPath = ref<string>("")
    const allowCNMysekai = ref<boolean | null>(null)
    const emailInfo = ref<EmailInfo | null>(null)
    const socialPlatformInfo = ref<SocialPlatformInfo | null>(null)
    const authorizeSocialPlatformInfo = ref<AuthorizeSocialPlatformInfo[] | null>(null)
    const gameAccountBindings = ref<GameAccountBinding[] | null>(null)
    const sessionToken = ref<string | null>(null)
    const tokenExpiration = ref<number | null>(null)

    const isLoggedIn = computed(() => !!sessionToken.value)

    function setUser(payload: {
        name?: string
        userId?: string
        avatarPath?: string
        allowCNMysekai?: boolean
        emailInfo?: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        sessionToken?: string
    }) {
        if (payload.name !== undefined) name.value = payload.name
        if (payload.userId !== undefined) userId.value = payload.userId
        if (payload.avatarPath !== undefined) avatarPath.value = payload.avatarPath
        if (payload.allowCNMysekai !== undefined) allowCNMysekai.value = payload.allowCNMysekai
        if (payload.emailInfo !== undefined) emailInfo.value = payload.emailInfo
        if (payload.socialPlatformInfo !== undefined) socialPlatformInfo.value = payload.socialPlatformInfo
        if (payload.authorizeSocialPlatformInfo !== undefined) authorizeSocialPlatformInfo.value = payload.authorizeSocialPlatformInfo
        if (payload.gameAccountBindings !== undefined) gameAccountBindings.value = payload.gameAccountBindings
        
        if (payload.sessionToken !== undefined) {
            sessionToken.value = payload.sessionToken
            // Set expiration to 7 days from now
            tokenExpiration.value = payload.sessionToken ? Date.now() / 1000 + 7 * 24 * 60 * 60 : null
        }
    }

    function updateUser(partial: Partial<{
        name: string
        userId: string
        avatarPath: string
        allowCNMysekai: boolean
        emailInfo: EmailInfo
        socialPlatformInfo: SocialPlatformInfo | null
        authorizeSocialPlatformInfo: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings: GameAccountBinding[] | null
        sessionToken: string
    }>) {
        if (partial.name !== undefined) name.value = partial.name
        if (partial.userId !== undefined) userId.value = partial.userId
        if (partial.avatarPath !== undefined) avatarPath.value = partial.avatarPath
        if (partial.allowCNMysekai !== undefined) allowCNMysekai.value = partial.allowCNMysekai
        if (partial.emailInfo !== undefined) emailInfo.value = partial.emailInfo
        if (partial.socialPlatformInfo !== undefined) socialPlatformInfo.value = partial.socialPlatformInfo
        if (partial.authorizeSocialPlatformInfo !== undefined) authorizeSocialPlatformInfo.value = partial.authorizeSocialPlatformInfo
        if (partial.gameAccountBindings !== undefined) gameAccountBindings.value = partial.gameAccountBindings
        
        if (partial.sessionToken !== undefined) {
            sessionToken.value = partial.sessionToken
            // Preserve existing expiration if just updating token (rare) or reset? 
            // The original logic was: "Preserve existing exp or update if sessionToken changes".
            // Since we are setting a new token, we should probably reset expiration or keep it.
            // Original logic: "if (partial.sessionToken) updated.exp = Date.now() ... "
            tokenExpiration.value = Date.now() / 1000 + 7 * 24 * 60 * 60
        }
    }

    function clearUser() {
        name.value = "未登录"
        userId.value = null
        avatarPath.value = ""
        allowCNMysekai.value = null
        emailInfo.value = null
        socialPlatformInfo.value = null
        authorizeSocialPlatformInfo.value = null
        gameAccountBindings.value = null
        sessionToken.value = null
        tokenExpiration.value = null
    }

    function checkExpiration() {
        if (tokenExpiration.value && Date.now() / 1000 > tokenExpiration.value) {
            clearUser()
        }
    }

    return {
        name,
        userId,
        avatarPath,
        emailInfo,
        allowCNMysekai,
        socialPlatformInfo,
        authorizeSocialPlatformInfo,
        gameAccountBindings,
        sessionToken,
        tokenExpiration,
        isLoggedIn,
        setUser,
        clearUser,
        updateUser,
        checkExpiration
    }
}, {
    persist: true
})
