import {defineStore} from "pinia"
import {ref, computed} from "vue"
import type {
    EmailInfo,
    GameAccountBinding,
    SocialPlatformInfo,
    AuthorizeSocialPlatformInfo,
} from "@/components/users/data/types/store";

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
        if (payload.sessionToken !== undefined) sessionToken.value = payload.sessionToken

        localStorage.setItem("user", JSON.stringify({
            name: name.value,
            userId: userId.value,
            avatarPath: avatarPath.value,
            emailInfo: emailInfo.value,
            socialPlatformInfo: socialPlatformInfo.value,
            authorizeSocialPlatformInfo: authorizeSocialPlatformInfo.value,
            gameAccountBindings: gameAccountBindings.value,
            sessionToken: sessionToken.value,
        }))
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
        if (partial.avatarPath !== undefined) avatarPath.value = partial.avatarPath
        if (partial.allowCNMysekai !== undefined) allowCNMysekai.value = partial.allowCNMysekai
        if (partial.emailInfo !== undefined) emailInfo.value = partial.emailInfo
        if (partial.socialPlatformInfo !== undefined) socialPlatformInfo.value = partial.socialPlatformInfo
        if (partial.authorizeSocialPlatformInfo !== undefined) authorizeSocialPlatformInfo.value = partial.authorizeSocialPlatformInfo
        if (partial.gameAccountBindings !== undefined) gameAccountBindings.value = partial.gameAccountBindings
        if (partial.sessionToken !== undefined) sessionToken.value = partial.sessionToken

        const stored = localStorage.getItem("user")
        const current = stored ? JSON.parse(stored) : {}
        const updated = {...current, ...partial}
        localStorage.setItem("user", JSON.stringify(updated))
    }

    function clearUser() {
        name.value = "未登录"
        userId.value = null
        avatarPath.value = ""
        emailInfo.value = null
        socialPlatformInfo.value = null
        authorizeSocialPlatformInfo.value = null
        gameAccountBindings.value = null
        sessionToken.value = null
        localStorage.removeItem("user")
    }

    function restoreUser() {
        const stored = localStorage.getItem("user")
        if (stored) {
            const parsed = JSON.parse(stored)
            setUser(parsed)
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
        isLoggedIn,
        setUser,
        clearUser,
        updateUser,
        restoreUser,
    }
})