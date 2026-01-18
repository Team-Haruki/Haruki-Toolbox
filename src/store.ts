import { defineStore } from "pinia"
import { ref, computed } from "vue"

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
    const iosUploadCode = ref<string | null>(null)
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
        iosUploadCode?: string | null
        sessionToken?: string
    }, options: { resetExpiration?: boolean } = { resetExpiration: true }) {
        if (payload.name !== undefined) name.value = payload.name
        if (payload.userId !== undefined) userId.value = payload.userId
        if (payload.avatarPath !== undefined) avatarPath.value = payload.avatarPath
        if (payload.allowCNMysekai !== undefined) allowCNMysekai.value = payload.allowCNMysekai
        if (payload.emailInfo !== undefined) emailInfo.value = payload.emailInfo
        if (payload.socialPlatformInfo !== undefined) socialPlatformInfo.value = payload.socialPlatformInfo
        if (payload.authorizeSocialPlatformInfo !== undefined) authorizeSocialPlatformInfo.value = payload.authorizeSocialPlatformInfo
        if (payload.gameAccountBindings !== undefined) gameAccountBindings.value = payload.gameAccountBindings
        if (payload.iosUploadCode !== undefined) iosUploadCode.value = payload.iosUploadCode

        if (payload.sessionToken !== undefined) {
            sessionToken.value = payload.sessionToken
            if (options.resetExpiration) {
                tokenExpiration.value = payload.sessionToken ? Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 : null
            }
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
        iosUploadCode.value = null
        sessionToken.value = null
        tokenExpiration.value = null
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
        avatarPath,
        emailInfo,
        allowCNMysekai,
        socialPlatformInfo,
        authorizeSocialPlatformInfo,
        gameAccountBindings,
        iosUploadCode,
        sessionToken,
        tokenExpiration,
        isLoggedIn,
        setUser,
        setIOSUploadCode,
        clearUser,
        checkExpiration
    }
}, {
    persist: true
})
