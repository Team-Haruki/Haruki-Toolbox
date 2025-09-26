import { defineStore } from "pinia"
import { ref, computed } from "vue"
import {
    EmailInfo,
    GameAccountBinding,
    SocialPlatformInfo,
    AuthorizeSocialPlatformInfo,
} from "@/components/users/data/types/store";

export const useUserStore = defineStore("user", () => {
    const name = ref<string>("未登录")
    const avatarPath = ref<string>("")
    const emailInfo = ref<EmailInfo | null>(null)
    const socialPlatformInfo = ref<SocialPlatformInfo | null>(null)
    const authorizeSocialPlatformInfo = ref<AuthorizeSocialPlatformInfo[] | null>(null)
    const gameAccountBindings = ref<GameAccountBinding[] | null>(null)
    const sessionToken = ref<string | null>(null)
    const isLoggedIn = computed(() => !!sessionToken.value)

    function setUser(payload: {
        name: string
        avatarPath: string
        emailInfo: EmailInfo
        socialPlatformInfo?: SocialPlatformInfo | null
        authorizeSocialPlatformInfo?: AuthorizeSocialPlatformInfo[] | null
        gameAccountBindings?: GameAccountBinding[] | null
        sessionToken: string
    }) {
        name.value = payload.name
        avatarPath.value = payload.avatarPath
        emailInfo.value = payload.emailInfo
        socialPlatformInfo.value = payload.socialPlatformInfo ?? null
        authorizeSocialPlatformInfo.value = payload.authorizeSocialPlatformInfo ?? null
        gameAccountBindings.value = payload.gameAccountBindings ?? null
        sessionToken.value = payload.sessionToken
        localStorage.setItem("user", JSON.stringify(payload))
    }

    function clearUser() {
        name.value = "未登录"
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
        avatarPath,
        emailInfo,
        socialPlatformInfo,
        authorizeSocialPlatformInfo,
        gameAccountBindings,
        sessionToken,
        isLoggedIn,
        setUser,
        clearUser,
        restoreUser,
    }
})